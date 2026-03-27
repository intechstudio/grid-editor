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

function resolveLualsBinary(): string {
  const base = getAssetsBase();
  const target = `${process.platform}-${process.arch}`;
  const entries = fs.readdirSync(base);
  const dir = entries.find(
    (e) => e.startsWith("lua-language-server-") && e.endsWith(`-${target}`),
  );
  if (!dir) {
    throw new Error(`LuaLS binary not found for ${target} in ${base}`);
  }
  const bin =
    process.platform === "win32"
      ? "lua-language-server.exe"
      : "lua-language-server";
  return path.join(base, dir, "bin", bin);
}

export function startLuaLSServer() {
  const binary = resolveLualsBinary();
  log.info("[LuaLS] Starting bridge on port", LUALS_PORT);

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
    const serverConnection = createServerProcess("LuaLS", binary, ["--stdio"]);

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
