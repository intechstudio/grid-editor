/**
 * LuaLS client using MonacoLanguageClient.
 *
 * Connects to the LuaLS WebSocket bridge (ws://localhost:8089) spawned by
 * the electron main process (ipcmain_luals.ts). MonacoLanguageClient
 * auto-registers all LSP providers: completion, hover, signature help,
 * diagnostics, semantic tokens, etc.
 *
 * All configuration (annotations, runtime, diagnostics) is handled via
 * --configpath on the electron side. This client just connects the transport.
 */
import { MonacoLanguageClient } from "monaco-languageclient";
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from "vscode-ws-jsonrpc";
import { CloseAction, ErrorAction } from "vscode-languageclient/browser.js";

const LUALS_WS_URL = "ws://localhost:8089";

let client: MonacoLanguageClient | null = null;
let webSocket: WebSocket | null = null;

/**
 * Start the MonacoLanguageClient connected to the LuaLS bridge.
 * Safe to call multiple times — will no-op if already running.
 */
export async function startLuaLSClient(): Promise<void> {
  if (client) return;

  return new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(LUALS_WS_URL);
    webSocket = ws;

    ws.addEventListener("error", (ev) => {
      console.error("[LuaLS] WebSocket error:", ev);
      reject(new Error("WebSocket connection failed"));
    });

    ws.addEventListener("open", async () => {
      const socket = toSocket(ws);
      const reader = new WebSocketMessageReader(socket);
      const writer = new WebSocketMessageWriter(socket);

      client = new MonacoLanguageClient({
        name: "LuaLS",
        id: "lua",
        clientOptions: {
          documentSelector: [{ language: "intech_lua" }],
          errorHandler: {
            error: () => ({ action: ErrorAction.Continue }),
            closed: () => ({ action: CloseAction.DoNotRestart }),
          },
          // Respond to workspace/configuration pulls from LuaLS.
          // callSnippet: "Replace" tells LuaLS to insert function calls as
          // snippets with parameter placeholders.
          middleware: {
            workspace: {
              configuration: async (params, token, next) => {
                const result = await next(params, token);
                // Override each section with our desired settings
                return (params.items ?? []).map(() => ({
                  completion: { callSnippet: "Replace" },
                }));
              },
            },
          },
        },
        messageTransports: { reader, writer },
      });

      try {
        await client.start();
        console.log("[LuaLS] MonacoLanguageClient started");
        resolve();
      } catch (err) {
        console.error("[LuaLS] Client start error:", err);
        client = null;
        reject(err);
      }
    });
  });
}

/**
 * Stop the client and close the WebSocket.
 */
export async function stopLuaLSClient(): Promise<void> {
  if (client) {
    try {
      await client.stop();
    } catch {
      // ignore stop errors
    }
    client = null;
  }
  if (webSocket) {
    webSocket.close();
    webSocket = null;
  }
}

