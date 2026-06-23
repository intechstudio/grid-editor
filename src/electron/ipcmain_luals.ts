/**
 * LuaLS WebSocket Bridge
 *
 * Spawns lua-language-server (--stdio) and bridges LSP JSON-RPC over a
 * local WebSocket server. Config and annotations are pushed by the renderer
 * via LSP notifications after connect. The bridge is a dumb pipe.
 */
import path from "path";
import fs from "fs";
import { app } from "electron";
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

function getAssetsBase(): string {
  return app.isPackaged
    ? process.resourcesPath
    : path.resolve(__dirname, "../../build-assets");
}

function resolveLualsBinary(): string | undefined {
  const base = getAssetsBase();
  const target = `${process.platform}-${process.arch}`;
  let entries: string[] = [];

  try {
    entries = fs.readdirSync(base);
  } catch (error) {
    log.warn(`[LuaLS] Could not read assets directory: ${base}`, error);
    return undefined;
  }

  const dir = entries.find(
    (e) => e.startsWith("lua-language-server-") && e.endsWith(`-${target}`),
  );
  if (!dir) {
    log.warn(`[LuaLS] Binary not found for ${target} in ${base}`);
    return undefined;
  }
  const bin =
    process.platform === "win32"
      ? "lua-language-server.exe"
      : "lua-language-server";
  const binaryPath = path.join(base, dir, "bin", bin);

  if (!fs.existsSync(binaryPath)) {
    log.warn(`[LuaLS] Binary path does not exist: ${binaryPath}`);
    return undefined;
  }

  return binaryPath;
}

export function startLuaLSServer() {
  const binary = resolveLualsBinary();
  if (!binary) {
    log.warn("[LuaLS] Bridge disabled. Falling back to basic language features.");
    return;
  }

  log.info("[LuaLS] Starting bridge on port", LUALS_PORT);

  wss = new (WebSocket as any).Server({ port: LUALS_PORT });

  wss!.on("connection", (ws: any) => {
    log.info("[LuaLS] Client connected");

    const socket: IWebSocket = {
      send: (content) =>
        ws.send(content, (err: Error | undefined) => {
          if (err) log.error("[LuaLS] Send error:", err);
        }),
      onMessage: (cb) => ws.on("message", (data: unknown) => cb(data)),
      onError: (cb) => ws.on("error", cb),
      onClose: (cb) =>
        ws.on("close", (code: number, reason: Buffer) =>
          cb(code, reason.toString()),
        ),
      dispose: () => ws.close(),
    };

    const wsConnection = createWebSocketConnection(socket);

    // On Linux AppImages the resources path is a read-only FUSE mount, so we
    // redirect LuaLS log/cache into the existing grid-userdata folder.
    const lualsUserData = path.join(app.getPath("documents"), "grid-userdata", "luals");
    const lualsLogPath = path.join(lualsUserData, "log");
    const lualsDataPath = path.join(lualsUserData, "cache");
    try {
      fs.mkdirSync(lualsLogPath, { recursive: true });
      fs.mkdirSync(lualsDataPath, { recursive: true });
    } catch (mkdirError) {
      log.warn("[LuaLS] Could not create writable dirs:", mkdirError);
    }

    let serverConnection;
    try {
      serverConnection = createServerProcess("LuaLS", binary, [
        "--stdio",
        `--logpath=${lualsLogPath}`,
        `--datapath=${lualsDataPath}`,
      ]);
    } catch (error) {
      log.error("[LuaLS] Failed to start lua-language-server:", error);
      ws.close();
      return;
    }

    if (!serverConnection) {
      log.error("[LuaLS] Failed to spawn lua-language-server");
      ws.close();
      return;
    }

    forward(wsConnection, serverConnection);
    log.info("[LuaLS] Bridge established");
  });

  wss.on("error", (err: unknown) => {
    log.error("[LuaLS] WebSocket server error:", err);
  });
}

export function stopLuaLSServer() {
  if (wss) {
    wss.close();
    wss = undefined;
  }
}
