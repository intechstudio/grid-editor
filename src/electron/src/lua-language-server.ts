/**
 * lua-language-server.ts
 *
 * Manages the LuaLS (lua-language-server) child process and exposes it to the
 * renderer via a local WebSocket server.
 *
 * Architecture
 * ──────────────────────────────────────────────────────────────────────────
 *   Renderer (Monaco)
 *       │  native WebSocket  (ws://127.0.0.1:<port>)
 *       ▼
 *   WebSocket server  (this file, running in Electron main)
 *       │  JSON-RPC over stdio  (LSP wire format)
 *       ▼
 *   lua-language-server binary
 *
 * Each WebSocket client receives its own dedicated connection to a fresh
 * LuaLS process, which keeps language-server state isolated per editor tab.
 * In practice the editor opens a single connection at start-up.
 *
 * LSP Message Framing
 * ──────────────────────────────────────────────────────────────────────────
 * LuaLS speaks the standard LSP wire format over stdin/stdout:
 *
 *   Content-Length: <byte-length>\r\n
 *   \r\n
 *   <json-payload>
 *
 * We strip/add these headers when bridging to/from the WebSocket where each
 * message is simply the raw JSON string.
 */

import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { app } from "electron";
import log from "electron-log";

// ws is already a production dependency of grid-editor.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const WebSocket = require("ws");

// ── Types ─────────────────────────────────────────────────────────────────────

interface LuaLsOptions {
  /** Absolute path to the directory containing the Grid Lua annotation files. */
  annotationsDir: string;
}

// ── Binary location ───────────────────────────────────────────────────────────

/**
 * Returns the absolute path to the lua-language-server binary.
 *
 * Resolution order:
 *  1. Bundled binary inside `resources/lua-language-server/bin/` (production).
 *  2. Development: `<repo-root>/resources/lua-language-server/bin/`.
 *  3. PATH (fallback for developer environments where LuaLS is installed globally).
 */
export function findLuaLsBinary(): string | null {
  const binaryName =
    process.platform === "win32"
      ? "lua-language-server.exe"
      : "lua-language-server";

  // 1. Production: extraResources places the folder at <app>/resources/
  const resourcesPath = process.resourcesPath
    ? path.join(process.resourcesPath, "lua-language-server", "bin", binaryName)
    : null;

  if (resourcesPath && fs.existsSync(resourcesPath)) {
    return resourcesPath;
  }

  // 2. Development: relative to the project root
  const devPath = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "resources",
    "lua-language-server",
    "bin",
    binaryName,
  );
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  // 3. System PATH (developer convenience)
  try {
    const which = process.platform === "win32" ? "where" : "which";
    const result = require("child_process")
      .execSync(`${which} lua-language-server`, { stdio: "pipe" })
      .toString()
      .trim()
      .split("\n")[0];
    if (result && fs.existsSync(result)) {
      return result;
    }
  } catch {
    // not on PATH
  }

  return null;
}

// ── LSP message framing ───────────────────────────────────────────────────────

const HEADER_RE = /Content-Length:\s*(\d+)\r?\n\r?\n/;

/**
 * Converts raw LSP stdio output (possibly multiple messages) into an array
 * of JSON payload strings, one per message.
 */
class LspStdioParser {
  private buffer = "";

  push(chunk: string): string[] {
    this.buffer += chunk;
    const messages: string[] = [];

    while (true) {
      const headerMatch = HEADER_RE.exec(this.buffer);
      if (!headerMatch) break;

      const headerEnd = headerMatch.index + headerMatch[0].length;
      const length = parseInt(headerMatch[1], 10);

      if (this.buffer.length < headerEnd + length) break; // need more data

      const payload = this.buffer.slice(headerEnd, headerEnd + length);
      this.buffer = this.buffer.slice(headerEnd + length);
      messages.push(payload);
    }

    return messages;
  }
}

/**
 * Wraps a JSON string in the LSP Content-Length header.
 */
function frameLspMessage(json: string): Buffer {
  const body = Buffer.from(json, "utf8");
  const header = `Content-Length: ${body.length}\r\n\r\n`;
  return Buffer.concat([Buffer.from(header, "ascii"), body]);
}

// ── LuaLanguageServer ─────────────────────────────────────────────────────────

export class LuaLanguageServer {
  private wss: InstanceType<typeof WebSocket.Server> | null = null;
  private port = 0;

  /** Start the WebSocket proxy server. Returns the port number. */
  async start(options: LuaLsOptions): Promise<number> {
    const binaryPath = findLuaLsBinary();
    if (!binaryPath) {
      log.warn(
        "[LuaLS] lua-language-server binary not found. " +
          "Run `node build-scripts/download-lua-ls.js` to install it. " +
          "LuaLS features will be unavailable.",
      );
      return 0;
    }

    log.info(`[LuaLS] Using binary: ${binaryPath}`);
    log.info(`[LuaLS] Annotations dir: ${options.annotationsDir}`);

    return new Promise((resolve, reject) => {
      const server = new WebSocket.Server({ host: "127.0.0.1", port: 0 }, () => {
        this.port = (server.address() as { port: number }).port;
        this.wss = server;
        log.info(`[LuaLS] WebSocket proxy listening on port ${this.port}`);
        resolve(this.port);
      });

      server.on("error", reject);

      server.on(
        "connection",
        (ws: InstanceType<typeof WebSocket>) => {
          this.handleConnection(ws, binaryPath, options.annotationsDir);
        },
      );
    });
  }

  /** Stop the WebSocket server. */
  stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      log.info("[LuaLS] WebSocket proxy stopped.");
    }
  }

  // ── Per-connection handler ──────────────────────────────────────────────────

  private handleConnection(
    ws: InstanceType<typeof WebSocket>,
    binaryPath: string,
    annotationsDir: string,
  ) {
    log.info("[LuaLS] Renderer connected, spawning lua-language-server…");

    // Create a temporary workspace directory for this session.
    // LuaLS writes its log and cache files here to avoid polluting the user's
    // project directory.
    const tmpWorkspace = fs.mkdtempSync(
      path.join(os.tmpdir(), "grid-lua-ls-"),
    );

    const luaProcess = this.spawnLuaLs(
      binaryPath,
      annotationsDir,
      tmpWorkspace,
    );

    if (!luaProcess) {
      ws.close();
      return;
    }

    const parser = new LspStdioParser();

    // LuaLS stdout → WebSocket
    luaProcess.stdout!.setEncoding("utf8");
    luaProcess.stdout!.on("data", (data: string) => {
      const messages = parser.push(data);
      for (const msg of messages) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(msg);
        }
      }
    });

    luaProcess.stderr!.setEncoding("utf8");
    luaProcess.stderr!.on("data", (data: string) => {
      // LuaLS writes diagnostic/progress info to stderr — log at debug level
      log.debug("[LuaLS stderr]", data.trim());
    });

    luaProcess.on("exit", (code: number | null) => {
      log.info(`[LuaLS] Process exited with code ${code}`);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      // Clean up temp workspace
      fs.rm(tmpWorkspace, { recursive: true, force: true }, () => {});
    });

    // WebSocket → LuaLS stdin
    ws.on("message", (data: Buffer | string) => {
      const json = typeof data === "string" ? data : data.toString("utf8");
      try {
        luaProcess.stdin!.write(frameLspMessage(json));
      } catch (err) {
        log.warn("[LuaLS] Failed to write to stdin:", err);
      }
    });

    ws.on("close", () => {
      log.info("[LuaLS] Renderer disconnected, killing lua-language-server.");
      luaProcess.kill();
    });

    ws.on("error", (err: Error) => {
      log.warn("[LuaLS] WebSocket error:", err);
      luaProcess.kill();
    });
  }

  // ── Process spawn ───────────────────────────────────────────────────────────

  private spawnLuaLs(
    binaryPath: string,
    annotationsDir: string,
    logDir: string,
  ): ChildProcess | null {
    try {
      const args = [
        "--stdio",
        `--logpath=${logDir}`,
      ];

      const env: NodeJS.ProcessEnv = {
        ...process.env,
        // Suppress the LuaLS telemetry prompt
        LUA_LS_TELEMETRY: "0",
      };

      const child = spawn(binaryPath, args, {
        stdio: ["pipe", "pipe", "pipe"],
        env,
        // Use the annotations directory as the workspace root so LuaLS
        // automatically picks up the annotation files.
        cwd: annotationsDir,
      });

      child.on("error", (err) => {
        log.error("[LuaLS] Failed to start process:", err);
      });

      return child;
    } catch (err) {
      log.error("[LuaLS] spawn failed:", err);
      return null;
    }
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

let _instance: LuaLanguageServer | null = null;

/** Get or create the singleton LuaLanguageServer manager. */
export function getLuaLanguageServer(): LuaLanguageServer {
  if (!_instance) {
    _instance = new LuaLanguageServer();
  }
  return _instance;
}
