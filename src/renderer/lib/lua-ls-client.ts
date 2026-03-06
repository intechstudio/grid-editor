/**
 * lua-ls-client.ts
 *
 * A lightweight LSP (Language Server Protocol) client that connects to the
 * lua-language-server proxy exposed by the Electron main process over a local
 * WebSocket and wires the server's capabilities into Monaco Editor.
 *
 * What this module does
 * ──────────────────────────────────────────────────────────────────────────
 *  • Opens a WebSocket to ws://127.0.0.1:<port> (the LuaLS proxy in main).
 *  • Performs the LSP initialize / initialized handshake.
 *  • Keeps Monaco's open documents in sync with LuaLS via
 *    textDocument/didOpen, textDocument/didChange, textDocument/didClose.
 *  • Registers Monaco providers for:
 *      – Completions   (textDocument/completion)
 *      – Hover         (textDocument/hover)
 *      – Diagnostics   (textDocument/publishDiagnostics  notification)
 *  • Handles graceful reconnection when the WebSocket drops.
 *
 * Design decisions
 * ──────────────────────────────────────────────────────────────────────────
 *  • No heavy third-party LSP client library.  The LSP protocol over WebSocket
 *    is simple enough to implement here: each WS message is a JSON-RPC object.
 *  • Diagnostics are pushed by the server; completions and hover are pulled on
 *    demand through the Monaco provider API.
 *  • The language ID sent to LuaLS is always "lua" so LuaLS treats the
 *    documents as standard Lua (it doesn't know about "intech_lua").
 */

import {
  editor as monacoEditor,
  languages as monacoLanguages,
  MarkerSeverity,
} from "monaco-editor";

// ── JSON-RPC / LSP types (minimal) ───────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: unknown;
}

interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

type JsonRpcMessage = JsonRpcRequest | JsonRpcNotification | JsonRpcResponse;

// ── LSP position helpers ──────────────────────────────────────────────────────

function toLspPosition(position: monacoEditor.IPosition) {
  return { line: position.lineNumber - 1, character: position.column - 1 };
}

function fromLspRange(range: {
  start: { line: number; character: number };
  end: { line: number; character: number };
}): monacoEditor.IRange {
  return {
    startLineNumber: range.start.line + 1,
    startColumn: range.start.character + 1,
    endLineNumber: range.end.line + 1,
    endColumn: range.end.character + 1,
  };
}

// ── Completion item kind mapping ──────────────────────────────────────────────

const LSP_COMPLETION_KIND_MAP: Record<
  number,
  monacoLanguages.CompletionItemKind
> = {
  1: monacoLanguages.CompletionItemKind.Text,
  2: monacoLanguages.CompletionItemKind.Method,
  3: monacoLanguages.CompletionItemKind.Function,
  4: monacoLanguages.CompletionItemKind.Constructor,
  5: monacoLanguages.CompletionItemKind.Field,
  6: monacoLanguages.CompletionItemKind.Variable,
  7: monacoLanguages.CompletionItemKind.Class,
  8: monacoLanguages.CompletionItemKind.Interface,
  9: monacoLanguages.CompletionItemKind.Module,
  10: monacoLanguages.CompletionItemKind.Property,
  11: monacoLanguages.CompletionItemKind.Unit,
  12: monacoLanguages.CompletionItemKind.Value,
  13: monacoLanguages.CompletionItemKind.Enum,
  14: monacoLanguages.CompletionItemKind.Keyword,
  15: monacoLanguages.CompletionItemKind.Snippet,
  16: monacoLanguages.CompletionItemKind.Color,
  17: monacoLanguages.CompletionItemKind.File,
  18: monacoLanguages.CompletionItemKind.Reference,
  19: monacoLanguages.CompletionItemKind.Folder,
  20: monacoLanguages.CompletionItemKind.EnumMember,
  21: monacoLanguages.CompletionItemKind.Constant,
  22: monacoLanguages.CompletionItemKind.Struct,
  23: monacoLanguages.CompletionItemKind.Event,
  24: monacoLanguages.CompletionItemKind.Operator,
  25: monacoLanguages.CompletionItemKind.TypeParameter,
};

// ── Diagnostic severity mapping ───────────────────────────────────────────────

const LSP_SEVERITY_MAP: Record<number, MarkerSeverity> = {
  1: MarkerSeverity.Error,
  2: MarkerSeverity.Warning,
  3: MarkerSeverity.Info,
  4: MarkerSeverity.Hint,
};

// ── LuaLsClient ───────────────────────────────────────────────────────────────

export class LuaLsClient {
  private ws: WebSocket | null = null;
  private nextId = 1;
  private pendingRequests = new Map<
    number,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();
  private initialized = false;
  private documentVersions = new Map<string, number>();
  private disposables: monacoLanguages.IDisposable[] = [];
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(
    private readonly port: number,
    /** Monaco language IDs to attach the providers to. */
    private readonly languageIds: string[] = ["intech_lua", "lua"],
  ) {}

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  /** Connect to the LuaLS proxy and register Monaco providers. */
  async start(): Promise<void> {
    if (this.port === 0) {
      console.warn(
        "[LuaLsClient] LuaLS port is 0 — server not running. " +
          "LSP features will be unavailable.",
      );
      return;
    }

    await this.connect();
    this.registerMonacoProviders();
    this.attachModelListeners();
  }

  /** Disconnect and clean up all Monaco provider registrations. */
  stop(): void {
    this.stopped = true;
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
    }
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
    this.ws?.close();
    this.ws = null;
  }

  // ── WebSocket connection ────────────────────────────────────────────────────

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `ws://127.0.0.1:${this.port}`;
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = async () => {
        try {
          await this.initialize();
          resolve();
        } catch (err) {
          reject(err);
        }
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg: JsonRpcMessage = JSON.parse(event.data as string);
          this.handleMessage(msg);
        } catch (err) {
          console.warn("[LuaLsClient] Failed to parse message:", err);
        }
      };

      ws.onclose = () => {
        this.initialized = false;
        if (!this.stopped) {
          console.info("[LuaLsClient] WebSocket closed, scheduling reconnect…");
          this.reconnectTimeout = setTimeout(() => this.reconnect(), 3000);
        }
      };

      ws.onerror = (err: Event) => {
        console.warn("[LuaLsClient] WebSocket error:", err);
        if (!this.initialized) reject(new Error("WebSocket connection failed"));
      };
    });
  }

  private async reconnect(): Promise<void> {
    if (this.stopped) return;
    try {
      await this.connect();
      // Re-open all currently loaded documents
      for (const model of monacoEditor.getModels()) {
        if (this.languageIds.includes(model.getLanguageId())) {
          this.openDocument(model);
        }
      }
    } catch (err) {
      console.warn("[LuaLsClient] Reconnect failed:", err);
      this.reconnectTimeout = setTimeout(() => this.reconnect(), 5000);
    }
  }

  // ── LSP handshake ───────────────────────────────────────────────────────────

  private async initialize(): Promise<void> {
    const result = await this.sendRequest("initialize", {
      processId: null,
      clientInfo: { name: "grid-editor", version: "1.0" },
      rootUri: null,
      capabilities: {
        textDocument: {
          synchronization: {
            didSave: false,
            dynamicRegistration: false,
          },
          completion: {
            completionItem: {
              snippetSupport: false,
              documentationFormat: ["markdown", "plaintext"],
            },
          },
          hover: {
            contentFormat: ["markdown", "plaintext"],
          },
          publishDiagnostics: {
            relatedInformation: false,
          },
        },
        workspace: {
          workspaceFolders: false,
        },
      },
      initializationOptions: {
        // Tell LuaLS where to find the Grid annotation files
        addonManager: { enable: false },
        telemetry: { enable: false },
        diagnostics: { enable: true },
        completion: { enable: true, callSnippet: "Disable" },
        hint: { enable: false },
      },
    });

    if (!result) throw new Error("initialize returned null");

    this.sendNotification("initialized", {});
    this.initialized = true;

    // Open all currently existing models
    for (const model of monacoEditor.getModels()) {
      if (this.languageIds.includes(model.getLanguageId())) {
        this.openDocument(model);
      }
    }
  }

  // ── Message dispatch ────────────────────────────────────────────────────────

  private handleMessage(msg: JsonRpcMessage): void {
    if ("id" in msg && "result" in msg) {
      // Response to a request we sent
      const pending = this.pendingRequests.get(msg.id as number);
      if (pending) {
        this.pendingRequests.delete(msg.id as number);
        if (msg.error) {
          pending.reject(new Error(msg.error.message));
        } else {
          pending.resolve(msg.result);
        }
      }
    } else if ("method" in msg && !("id" in msg)) {
      // Server-initiated notification
      this.handleNotification(
        msg as JsonRpcNotification,
      );
    }
    // Ignore server-initiated requests for now (LuaLS rarely sends those)
  }

  private handleNotification(msg: JsonRpcNotification): void {
    if (msg.method === "textDocument/publishDiagnostics") {
      this.applyDiagnostics(msg.params as {
        uri: string;
        diagnostics: Array<{
          range: { start: { line: number; character: number }; end: { line: number; character: number } };
          severity?: number;
          message: string;
        }>;
      });
    }
  }

  // ── Diagnostics ─────────────────────────────────────────────────────────────

  private applyDiagnostics(params: {
    uri: string;
    diagnostics: Array<{
      range: { start: { line: number; character: number }; end: { line: number; character: number } };
      severity?: number;
      message: string;
    }>;
  }): void {
    const model = monacoEditor.getModel(
      { scheme: "file", path: params.uri.replace(/^file:\/\//, "") } as any,
    ) ?? this.findModelByUri(params.uri);

    if (!model) return;

    const markers = params.diagnostics.map((d) => ({
      ...fromLspRange(d.range),
      severity: LSP_SEVERITY_MAP[d.severity ?? 1] ?? MarkerSeverity.Error,
      message: d.message,
      source: "lua-language-server",
    }));

    monacoEditor.setModelMarkers(model, "lua-language-server", markers);
  }

  /** Fallback: find model by comparing URIs as strings. */
  private findModelByUri(uri: string): monacoEditor.ITextModel | null {
    for (const model of monacoEditor.getModels()) {
      if (model.uri.toString() === uri) return model;
    }
    return null;
  }

  // ── Document synchronization ────────────────────────────────────────────────

  private openDocument(model: monacoEditor.ITextModel): void {
    const uri = model.uri.toString();
    this.documentVersions.set(uri, model.getVersionId());
    this.sendNotification("textDocument/didOpen", {
      textDocument: {
        uri,
        languageId: "lua",
        version: model.getVersionId(),
        text: model.getValue(),
      },
    });
  }

  private changeDocument(model: monacoEditor.ITextModel): void {
    const uri = model.uri.toString();
    const version = model.getVersionId();
    this.documentVersions.set(uri, version);
    this.sendNotification("textDocument/didChange", {
      textDocument: { uri, version },
      contentChanges: [{ text: model.getValue() }],
    });
  }

  private closeDocument(model: monacoEditor.ITextModel): void {
    const uri = model.uri.toString();
    this.documentVersions.delete(uri);
    this.sendNotification("textDocument/didClose", {
      textDocument: { uri },
    });
    monacoEditor.setModelMarkers(model, "lua-language-server", []);
  }

  private attachModelListeners(): void {
    // Listen for future model additions
    const onAdd = monacoEditor.onDidCreateModel((model) => {
      if (this.languageIds.includes(model.getLanguageId()) && this.initialized) {
        this.openDocument(model);
      }
    });
    this.disposables.push(onAdd);

    // Track content changes for already-open models
    const onDispose = monacoEditor.onWillDisposeModel((model) => {
      if (this.documentVersions.has(model.uri.toString()) && this.initialized) {
        this.closeDocument(model);
      }
    });
    this.disposables.push(onDispose);

    // Track content changes
    const onChangeLanguage = monacoEditor.onDidChangeModelLanguage((event) => {
      if (this.languageIds.includes(event.newLanguage) && this.initialized) {
        this.openDocument(event.model);
      } else if (this.documentVersions.has(event.model.uri.toString())) {
        this.closeDocument(event.model);
      }
    });
    this.disposables.push(onChangeLanguage);

    // Subscribe to content changes for all relevant models
    const syncContent = () => {
      for (const model of monacoEditor.getModels()) {
        if (this.languageIds.includes(model.getLanguageId())) {
          const sub = model.onDidChangeContent(() => {
            if (this.initialized) this.changeDocument(model);
          });
          this.disposables.push(sub);
        }
      }
    };
    syncContent();
  }

  // ── Monaco provider registration ────────────────────────────────────────────

  private registerMonacoProviders(): void {
    for (const langId of this.languageIds) {
      // Completions
      const completionProvider = monacoLanguages.registerCompletionItemProvider(
        langId,
        {
          triggerCharacters: [".", ":"],
          provideCompletionItems: async (model, position) => {
            if (!this.initialized) return { suggestions: [] };
            try {
              const result = await this.sendRequest(
                "textDocument/completion",
                {
                  textDocument: { uri: model.uri.toString() },
                  position: toLspPosition(position),
                },
              ) as {
                items?: unknown[];
                isIncomplete?: boolean;
              } | unknown[] | null;

              if (!result) return { suggestions: [] };

              const items = Array.isArray(result)
                ? result
                : (result as { items?: unknown[] }).items ?? [];

              const word = model.getWordUntilPosition(position);
              const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
              };

              const suggestions = (items as Array<{
                label: string | { label: string };
                kind?: number;
                detail?: string;
                documentation?: string | { kind: string; value: string };
                insertText?: string;
                textEdit?: { newText: string; range: { start: { line: number; character: number }; end: { line: number; character: number } } };
              }>).map((item) => {
                const label =
                  typeof item.label === "string"
                    ? item.label
                    : item.label.label;
                const insertText =
                  item.textEdit?.newText ??
                  item.insertText ??
                  label;
                const itemRange = item.textEdit
                  ? fromLspRange(item.textEdit.range)
                  : range;

                const docValue =
                  typeof item.documentation === "string"
                    ? item.documentation
                    : item.documentation?.value ?? item.detail ?? "";

                return {
                  label,
                  kind:
                    LSP_COMPLETION_KIND_MAP[item.kind ?? 0] ??
                    monacoLanguages.CompletionItemKind.Text,
                  detail: item.detail,
                  documentation: docValue
                    ? { value: docValue, isTrusted: false }
                    : undefined,
                  insertText,
                  range: itemRange,
                } satisfies monacoLanguages.CompletionItem;
              });

              return { suggestions };
            } catch {
              return { suggestions: [] };
            }
          },
        },
      );
      this.disposables.push(completionProvider);

      // Hover
      const hoverProvider = monacoLanguages.registerHoverProvider(langId, {
        provideHover: async (model, position) => {
          if (!this.initialized) return null;
          try {
            const result = await this.sendRequest("textDocument/hover", {
              textDocument: { uri: model.uri.toString() },
              position: toLspPosition(position),
            }) as {
              contents:
                | string
                | { value: string; kind?: string }
                | Array<string | { value: string; kind?: string }>;
              range?: { start: { line: number; character: number }; end: { line: number; character: number } };
            } | null;

            if (!result || !result.contents) return null;

            const contentsArray = Array.isArray(result.contents)
              ? result.contents
              : [result.contents];

            const contents = contentsArray.map((c) => ({
              value: typeof c === "string" ? c : c.value,
              isTrusted: false,
            }));

            return {
              contents,
              range: result.range ? fromLspRange(result.range) : undefined,
            };
          } catch {
            return null;
          }
        },
      });
      this.disposables.push(hoverProvider);
    }
  }

  // ── JSON-RPC transport ───────────────────────────────────────────────────────

  private sendRequest(method: string, params: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not open"));
        return;
      }

      const id = this.nextId++;
      const msg: JsonRpcRequest = { jsonrpc: "2.0", id, method, params };
      this.pendingRequests.set(id, { resolve, reject });

      // Timeout after 5 s to avoid hanging promises
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 5000);

      this.pendingRequests.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });

      try {
        this.ws.send(JSON.stringify(msg));
      } catch (err) {
        this.pendingRequests.delete(id);
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  private sendNotification(method: string, params: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const msg: JsonRpcNotification = { jsonrpc: "2.0", method, params };
    try {
      this.ws.send(JSON.stringify(msg));
    } catch (err) {
      console.warn(`[LuaLsClient] Failed to send notification ${method}:`, err);
    }
  }
}

// ── Module-level singleton ────────────────────────────────────────────────────

let _client: LuaLsClient | null = null;

/**
 * Initialise and return the module-level LuaLS client.
 *
 * Call this once during application start-up (e.g. inside the MonacoEditor
 * namespace initializer in monaco.ts).  Safe to call multiple times — returns
 * the existing client if already started.
 *
 * @param port  The WebSocket port obtained from `window.electron.luaLanguageServer.getPort()`.
 *              Pass 0 (or omit) when running in a web build where LuaLS is not available.
 */
export async function initLuaLsClient(port: number): Promise<LuaLsClient | null> {
  if (port === 0) return null;
  if (_client) return _client;

  _client = new LuaLsClient(port, ["intech_lua", "lua"]);
  try {
    await _client.start();
    console.info("[LuaLsClient] Connected and initialized.");
  } catch (err) {
    console.warn("[LuaLsClient] Failed to start:", err);
    _client = null;
  }
  return _client;
}
