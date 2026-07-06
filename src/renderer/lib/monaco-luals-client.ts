/**
 * LuaLS client using MonacoLanguageClient.
 *
 * Connects to the LuaLS WebSocket bridge (ws://localhost:8089) spawned by
 * the electron main process (ipcmain_luals.ts). MonacoLanguageClient
 * auto-registers all LSP providers: completion, hover, signature help,
 * diagnostics, semantic tokens, etc.
 *
 * Annotation library (grid-api.lua) is bundled via ?raw import and injected
 * via textDocument/didOpen after the client starts — no filesystem access needed.
 */
import { MonacoLanguageClient } from "monaco-languageclient";
import {
  toSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from "vscode-ws-jsonrpc";
import { CloseAction, ErrorAction } from "vscode-languageclient/browser.js";
import { Uri, editor as monacoEditorAPI } from "monaco-editor";
import {
  registerFileSystemOverlay,
  FileSystemProviderCapabilities,
  FileType,
} from "@codingame/monaco-vscode-files-service-override";
import gridApiLua from "../../../build-assets/lua-annotations/grid-api.lua?raw";

// initFile for this URI is called in monaco-workers.ts, which runs before
// initialize() from @codingame/monaco-vscode-api marks services as initialized.
const ANNOTATIONS_URI = Uri.parse("file:///grid-annotations/grid-api.lua");

// Serve file:///grid-editor/ URIs from Monaco's model registry so the peek
// definition widget can read the current editor content without hitting disk.
// Priority -1 = fallback behind the default in-memory FS (priority 0).
registerFileSystemOverlay(-1, {
  capabilities:
    FileSystemProviderCapabilities.FileReadWrite |
    FileSystemProviderCapabilities.Readonly,
  onDidChangeCapabilities: () => ({ dispose: () => {} }),
  onDidChangeFile: () => ({ dispose: () => {} }),
  watch: () => ({ dispose: () => {} }),
  stat: async (uri) => {
    const model = monacoEditorAPI
      .getModels()
      .find((m) => m.uri.toString() === uri.toString());
    if (!model) throw new Error(`No model for ${uri}`);
    return { type: FileType.File, ctime: 0, mtime: Date.now(), size: 0 };
  },
  readFile: async (uri) => {
    const model = monacoEditorAPI
      .getModels()
      .find((m) => m.uri.toString() === uri.toString());
    if (!model) throw new Error(`No model for ${uri}`);
    return new TextEncoder().encode(model.getValue());
  },
  writeFile: async () => {
    throw new Error("read only");
  },
  mkdir: async () => {},
  readdir: async () => [],
  delete: async () => {},
  rename: async () => {},
});

const LUALS_WS_URL = "ws://localhost:8089";

// URI path segment marking editor models that hold a single Lua *expression*
// fragment (e.g. the right-hand side of a `VariableManager` assignment, or an
// `if`/`elseif` condition) rather than a full statement/chunk. A bare
// expression is not a valid standalone Lua statement, so LuaLS's parser
// always reports `EXP_IN_ACTION` ("Unexpected <exp> .") for these documents —
// that diagnostic is a false positive here and is filtered out below, while
// every other diagnostic (e.g. real syntax errors, undefined globals) is
// still surfaced.
export const EXPRESSION_FRAGMENT_URI_MARKER = "/expr-fragment-";

const UNEXPECTED_EXPRESSION_STATEMENT_MESSAGE = "Unexpected <exp>";

function isExpressionFragmentUri(uri: { toString(): string }): boolean {
  return uri.toString().includes(EXPRESSION_FRAGMENT_URI_MARKER);
}

const elementTypeToLuaClass: Record<string, string> = {
  button: "ButtonElement",
  encoder: "EncoderElement",
  potmeter: "PotmeterElement",
  fader: "FaderElement",
  endless: "EndlessElement",
  lcd: "LCDElement",
  system: "SystemElement",
};

let contextCounter = 0;

const luaConfig = {
  runtime: { version: "Lua 5.4" },
  diagnostics: {
    globals: ["self", "element"],
    // Temporary until editors can share the full controller symbol graph.
    disable: ["undefined-global"],
    severity: { "undefined-global": "Warning" },
  },
  completion: { callSnippet: "Replace" },
};

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
                await next(params, token);
                return (params.items ?? []).map(() => luaConfig);
              },
            },
            // Only allow definitions that point to our registered virtual
            // annotation file (file:///grid-annotations/...). Everything else
            // — LuaLS meta files, per-editor context stubs — is not registered
            // in the in-memory filesystem and would throw FileOperationError
            // when the peek widget tries to open them.
            provideDefinition: async (model, position, token, next) => {
              const result = await next(model, position, token);
              if (!result) return result;
              const locations = Array.isArray(result) ? result : [result];
              const filtered = locations.filter((loc: any) => {
                const uri =
                  loc.uri?.toString() ?? loc.targetUri?.toString() ?? "";
                return uri.startsWith("file:///grid-annotations/");
              });
              return filtered.length > 0 ? filtered : null;
            },
            // Drop the "Unexpected <exp>" syntax error for expression-only
            // fragment documents (see EXPRESSION_FRAGMENT_URI_MARKER above).
            handleDiagnostics: (uri, diagnostics, next) => {
              if (!isExpressionFragmentUri(uri)) {
                next(uri, diagnostics);
                return;
              }
              next(
                uri,
                diagnostics.filter(
                  (d) =>
                    !d.message?.includes(
                      UNEXPECTED_EXPRESSION_STATEMENT_MESSAGE,
                    ),
                ),
              );
            },
          },
        },
        messageTransports: { reader, writer },
      });

      try {
        await client.start();
        await client.sendNotification("workspace/didChangeConfiguration", {
          settings: { Lua: luaConfig },
        });
        await client.sendNotification("textDocument/didOpen", {
          textDocument: {
            uri: ANNOTATIONS_URI.toString(),
            languageId: "lua",
            version: 1,
            text: gridApiLua,
          },
        });
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
 * Open a per-editor context document that types `self`, `element`, and `ele`
 * as the specific element subclass for this editor instance.
 * Returns the URI of the context document, to be passed to closeEditorContext on destroy.
 */
export async function openEditorContext(
  elementType: string,
): Promise<string | null> {
  if (!client) return null;
  const className = elementTypeToLuaClass[elementType] ?? "Element";
  const contextId = ++contextCounter;
  const uriString = `file:///grid-context/editor-${contextId}.lua`;
  const selfClassName = `Element Self ${contextId}`;
  const text = `---@class ${selfClassName} : ${className}\n---@field [string] any\n---@type ${selfClassName}\nself = {}\n---@type ${className}[]\nelement = {}\n---@type ${className}[]\nele = {}\n`;
  await client.sendNotification("textDocument/didOpen", {
    textDocument: { uri: uriString, languageId: "lua", version: 1, text },
  });
  return uriString;
}

/**
 * Close the per-editor context document when the editor is destroyed.
 */
export async function closeEditorContext(uri: string): Promise<void> {
  if (!client) return;
  await client.sendNotification("textDocument/didClose", {
    textDocument: { uri },
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
