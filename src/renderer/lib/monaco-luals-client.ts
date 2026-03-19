/**
 * Minimal LSP client for LuaLS over WebSocket.
 *
 * Connects to ws://localhost:8089, performs the LSP handshake,
 * and registers Monaco completion + hover providers that delegate to the server.
 *
 * LuaLS configuration (annotations, runtime, etc.) is handled via --configpath
 * on the electron side. This client only does document sync + feature requests.
 */
import {
  languages as monaco_languages,
  Range,
  type IDisposable,
} from "monaco-editor";

const LUALS_URI = `ws://localhost:8089`;

// --- JSON-RPC transport ------------------------------------------------------

type PendingRequest = {
  resolve: (result: any) => void;
  reject: (error: any) => void;
};

class JsonRpcConnection {
  private ws: WebSocket | null = null;
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();
  private notificationHandlers = new Map<string, (params: any) => void>();
  private requestHandlers = new Map<string, (params: any) => any>();
  private ready: Promise<void>;
  private readyResolve!: () => void;

  constructor(uri: string) {
    this.ready = new Promise((resolve) => {
      this.readyResolve = resolve;
    });
    this.connect(uri);
  }

  private connect(uri: string) {
    this.ws = new WebSocket(uri);
    this.ws.onopen = () => this.readyResolve();

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string);

      // Response to our request
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        msg.error ? reject(msg.error) : resolve(msg.result);
        return;
      }

      // Server→client request
      if (msg.method && msg.id !== undefined) {
        const handler = this.requestHandlers.get(msg.method);
        this.ws!.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: msg.id,
            result: handler ? handler(msg.params) : null,
          }),
        );
        return;
      }

      // Server→client notification
      if (msg.method) {
        this.notificationHandlers.get(msg.method)?.(msg.params);
      }
    };

    this.ws.onerror = (err) => console.error("[LuaLS] WS error:", err);
    this.ws.onclose = () => console.warn("[LuaLS] WS closed");
  }

  async sendRequest(method: string, params?: any): Promise<any> {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
    });
  }

  async sendNotification(method: string, params?: any) {
    await this.ready;
    this.ws!.send(JSON.stringify({ jsonrpc: "2.0", method, params }));
  }

  onRequest(method: string, handler: (params: any) => any) {
    this.requestHandlers.set(method, handler);
  }

  onNotification(method: string, handler: (params: any) => void) {
    this.notificationHandlers.set(method, handler);
  }

  dispose() {
    this.ws?.close();
    this.ws = null;
  }
}

// --- LSP lifecycle -----------------------------------------------------------

let docVersion = 0;
const DOC_URI = "file:///grid-editor/virtual.lua";
const openDocuments = new Set<string>();

let connection: JsonRpcConnection | null = null;
let disposables: IDisposable[] = [];

export async function initLuaLSP() {
  if (connection) return;

  try {
    connection = new JsonRpcConnection(LUALS_URI);

    // Safety net: respond to any workspace/configuration pulls with empty
    // config — actual config comes from --configpath on the electron side.
    connection.onRequest("workspace/configuration", (params) =>
      (params?.items ?? []).map(() => ({})),
    );

    await connection.sendRequest("initialize", {
      processId: null,
      rootUri: "file:///grid-editor",
      capabilities: {
        textDocument: {
          completion: { completionItem: { snippetSupport: true } },
          hover: {},
          publishDiagnostics: {},
        },
        workspace: { configuration: true },
      },
    });

    await connection.sendNotification("initialized", {});

    connection.onNotification("textDocument/publishDiagnostics", (params) => {
      // TODO: wire to Monaco markers
      console.log("[LuaLS] Diagnostics:", params.diagnostics?.length);
    });

    disposables.push(registerCompletionProvider());
    disposables.push(registerHoverProvider());
    console.log("[LuaLS] Ready");
  } catch (err) {
    console.error("[LuaLS] Init failed:", err);
    connection?.dispose();
    connection = null;
  }
}

// --- Document sync -----------------------------------------------------------

export async function syncDocument(content: string) {
  if (!connection) return;

  if (!openDocuments.has(DOC_URI)) {
    openDocuments.add(DOC_URI);
    await connection.sendNotification("textDocument/didOpen", {
      textDocument: {
        uri: DOC_URI,
        languageId: "lua",
        version: ++docVersion,
        text: content,
      },
    });
  } else {
    await connection.sendNotification("textDocument/didChange", {
      textDocument: { uri: DOC_URI, version: ++docVersion },
      contentChanges: [{ text: content }],
    });
  }
}

export async function closeDocument() {
  if (!connection || !openDocuments.has(DOC_URI)) return;
  openDocuments.delete(DOC_URI);
  await connection.sendNotification("textDocument/didClose", {
    textDocument: { uri: DOC_URI },
  });
}

// --- Completion provider -----------------------------------------------------

function registerCompletionProvider(): IDisposable {
  return monaco_languages.registerCompletionItemProvider("intech_lua", {
    triggerCharacters: [".", ":"],

    provideCompletionItems: async (model, position) => {
      if (!connection) return { suggestions: [] };
      await syncDocument(model.getValue());

      try {
        const result = await connection.sendRequest("textDocument/completion", {
          textDocument: { uri: DOC_URI },
          position: {
            line: position.lineNumber - 1,
            character: position.column - 1,
          },
        });

        const items = Array.isArray(result) ? result : result?.items ?? [];
        const word = model.getWordUntilPosition(position);
        const range = new Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn,
        );

        return {
          suggestions: items.map((item: any) => ({
            label: item.label,
            kind: mapCompletionKind(item.kind),
            insertText: item.textEdit?.newText ?? item.insertText ?? item.label,
            insertTextRules:
              item.insertTextFormat === 2
                ? monaco_languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
            detail: item.detail ?? "",
            documentation: item.documentation?.value ?? item.documentation ?? "",
            range,
            _lspItem: item,
          })),
        };
      } catch (err) {
        console.error("[LuaLS] Completion error:", err);
        return { suggestions: [] };
      }
    },

    resolveCompletionItem: async (item: any) => {
      if (!connection || !item._lspItem) return item;
      try {
        const resolved = await connection.sendRequest(
          "completionItem/resolve",
          item._lspItem,
        );
        if (resolved.detail) item.detail = resolved.detail;
        if (resolved.documentation) {
          item.documentation = {
            value:
              typeof resolved.documentation === "string"
                ? resolved.documentation
                : resolved.documentation?.value ?? "",
            isTrusted: true,
          };
        }
      } catch (err) {
        console.error("[LuaLS] Resolve error:", err);
      }
      return item;
    },
  });
}

// --- Hover provider ----------------------------------------------------------

function registerHoverProvider(): IDisposable {
  return monaco_languages.registerHoverProvider("intech_lua", {
    provideHover: async (model, position) => {
      if (!connection) return null;
      await syncDocument(model.getValue());

      try {
        const result = await connection.sendRequest("textDocument/hover", {
          textDocument: { uri: DOC_URI },
          position: {
            line: position.lineNumber - 1,
            character: position.column - 1,
          },
        });

        if (!result?.contents) return null;

        const contents = Array.isArray(result.contents)
          ? result.contents.map((c: any) => ({
              value: typeof c === "string" ? c : c.value,
            }))
          : [
              {
                value:
                  typeof result.contents === "string"
                    ? result.contents
                    : result.contents.value,
              },
            ];

        return {
          range: result.range
            ? new Range(
                result.range.start.line + 1,
                result.range.start.character + 1,
                result.range.end.line + 1,
                result.range.end.character + 1,
              )
            : undefined,
          contents,
        };
      } catch (err) {
        console.error("[LuaLS] Hover error:", err);
        return null;
      }
    },
  });
}

// --- Helpers -----------------------------------------------------------------

function mapCompletionKind(lspKind?: number): monaco_languages.CompletionItemKind {
  const map: Record<number, monaco_languages.CompletionItemKind> = {
    1: monaco_languages.CompletionItemKind.Text,
    2: monaco_languages.CompletionItemKind.Method,
    3: monaco_languages.CompletionItemKind.Function,
    4: monaco_languages.CompletionItemKind.Constructor,
    5: monaco_languages.CompletionItemKind.Field,
    6: monaco_languages.CompletionItemKind.Variable,
    7: monaco_languages.CompletionItemKind.Class,
    8: monaco_languages.CompletionItemKind.Interface,
    9: monaco_languages.CompletionItemKind.Module,
    10: monaco_languages.CompletionItemKind.Property,
    11: monaco_languages.CompletionItemKind.Unit,
    12: monaco_languages.CompletionItemKind.Value,
    13: monaco_languages.CompletionItemKind.Enum,
    14: monaco_languages.CompletionItemKind.Keyword,
    15: monaco_languages.CompletionItemKind.Snippet,
    16: monaco_languages.CompletionItemKind.Color,
    17: monaco_languages.CompletionItemKind.File,
    21: monaco_languages.CompletionItemKind.Constant,
  };
  return map[lspKind ?? 1] ?? monaco_languages.CompletionItemKind.Text;
}

export function disposeLuaLSP() {
  disposables.forEach((d) => d.dispose());
  disposables = [];
  connection?.dispose();
  connection = null;
  openDocuments.clear();
}
