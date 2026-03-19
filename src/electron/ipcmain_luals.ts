/**
 * LuaLS WebSocket Bridge
 *
 * Spawns lua-language-server (--stdio) with a generated .luarc.json config
 * and bridges LSP JSON-RPC over a local WebSocket server.
 * The bridge is a dumb pipe — no message interception.
 */
import path from "path";
import fs from "fs";
import os from "os";
import log from "electron-log";
import WebSocket from "ws";
import {
  createServerProcess,
  createWebSocketConnection,
  forward,
} from "vscode-ws-jsonrpc/server";
import type { IWebSocket } from "vscode-ws-jsonrpc/socket";

const LUALS_PORT = 8089;

let wss: any;

function resolveLualsBinary(): string {
  const base = path.resolve(
    __dirname,
    "../../build-assets/lua-language-server-3.17.1-darwin-arm64",
  );
  return path.join(base, "bin", "lua-language-server");
}

function resolveAnnotationsPath(): string {
  return path.resolve(__dirname, "../../build-assets/lua-annotations");
}

/**
 * Write a .luarc.json config file so LuaLS picks up our annotation library
 * at startup via --configpath. No runtime config interception needed.
 */
function writeLuaRcConfig(): string {
  const configDir = path.join(os.tmpdir(), "grid-editor-luals");
  fs.mkdirSync(configDir, { recursive: true });
  const configPath = path.join(configDir, ".luarc.json");
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      runtime: { version: "Lua 5.4" },
      diagnostics: { globals: ["self", "element"] },
      workspace: { library: [resolveAnnotationsPath()] },
    }),
  );
  return configPath;
}

export function startLuaLSServer() {
  const binary = resolveLualsBinary();
  const configPath = writeLuaRcConfig();
  log.info("[LuaLS] Starting bridge on port", LUALS_PORT);
  log.info("[LuaLS] Config:", configPath);

  wss = new (WebSocket as any).Server({ port: LUALS_PORT });

  wss!.on("connection", (ws: any) => {
    log.info("[LuaLS] Client connected");

    const socket: IWebSocket = {
      send: (content) =>
        ws.send(content, (err) => {
          if (err) log.error("[LuaLS] Send error:", err);
        }),
      onMessage: (cb) => ws.on("message", (data) => cb(data)),
      onError: (cb) => ws.on("error", cb),
      onClose: (cb) =>
        ws.on("close", (code, reason) => cb(code, reason.toString())),
      dispose: () => ws.close(),
    };

    const wsConnection = createWebSocketConnection(socket);
    const serverConnection = createServerProcess("LuaLS", binary, [
      "--stdio",
      `--configpath=${configPath}`,
    ]);

    if (!serverConnection) {
      log.error("[LuaLS] Failed to spawn lua-language-server");
      ws.close();
      return;
    }

    forward(wsConnection, serverConnection);
    log.info("[LuaLS] Bridge established");
  });

  wss.on("error", (err) => {
    log.error("[LuaLS] WebSocket server error:", err);
  });
}

export function stopLuaLSServer() {
  if (wss) {
    wss.close();
    wss = undefined;
  }
}
