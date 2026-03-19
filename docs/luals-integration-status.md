# LuaLS + Monaco Integration — Status & Journey

**Date:** 2026-03-19  
**Branch:** `kkerti-luaLS`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Electron Main Process                              │
│                                                     │
│  ipcmain_luals.ts                                   │
│  ┌───────────────────────────────────────────────┐  │
│  │ WebSocket server (port 8089)                  │  │
│  │   └─ per connection:                          │  │
│  │       spawn lua-language-server --stdio        │  │
│  │       bridge WS ↔ stdio (vscode-ws-jsonrpc)   │  │
│  │       inject config via --configpath           │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  .luarc.json (written to /tmp at startup)           │
│  ├─ runtime: Lua 5.4                                │
│  ├─ diagnostics.globals: ["self", "element"]        │
│  ├─ workspace.library: [lua-annotations/]           │
│  └─ completion.callSnippet: "Replace"               │
│                                                     │
│  build-assets/lua-annotations/grid-api.lua          │
│  └─ @meta file with classes, aliases, functions     │
└──────────────────┬──────────────────────────────────┘
                   │ WebSocket (ws://localhost:8089)
                   │ LSP JSON-RPC messages
┌──────────────────▼──────────────────────────────────┐
│  Renderer Process                                   │
│                                                     │
│  monaco-luals-client.ts                             │
│  ┌───────────────────────────────────────────────┐  │
│  │ JsonRpcConnection (raw WebSocket)             │  │
│  │   ├─ initialize / initialized handshake       │  │
│  │   ├─ textDocument/didOpen, didChange, didClose│  │
│  │   ├─ textDocument/completion → Monaco         │  │
│  │   ├─ textDocument/hover → Monaco              │  │
│  │   ├─ textDocument/signatureHelp → Monaco      │  │
│  │   ├─ textDocument/semanticTokens/full → Monaco│  │
│  │   └─ workspace/configuration handler          │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  monaco.ts                                          │
│  ├─ Monarch tokenizer: syntax highlighting          │
│  ├─ Old hand-rolled completion/hover (coexists)     │
│  ├─ Theme + semantic highlighting enabled           │
│  └─ initLuaLSP() called at init (non-blocking)     │
└─────────────────────────────────────────────────────┘
```

### Why the renderer?

LuaLS itself runs as a child process on the **main thread** (spawned by `ipcmain_luals.ts`). The LSP client lives in the **renderer** because that's where Monaco is — Monaco providers must be registered in the same JS context as the editor. The WebSocket bridge is the thinnest possible pipe between the two: it adds no interception or transformation, just shuttles JSON-RPC bytes between the renderer's WS client and LuaLS's stdio.

This is the right split. The renderer doesn't "run" LuaLS; it only talks to it.

---

## What's Working

### 1. Annotation-driven intelligence

The single most impactful piece: `build-assets/lua-annotations/grid-api.lua`.

Once LuaLS reads this `---@meta` file (via `workspace.library` in `.luarc.json`), everything else flows naturally:
- **Completions** — global functions like `spawnEntity()` appear in the suggestion list
- **Snippets** — accepting a function completion inserts `spawnEntity(name, pos)` with tab-stop placeholders (enabled by `completion.callSnippet: "Replace"` in both `.luarc.json` and `workspace/configuration` response)
- **Hover** — full signature + `@param` / `@return` docs rendered as markdown
- **Signature help** — typing `(` or `,` shows the active parameter in the function signature
- **Enum/alias values** — `@alias Color` with `---|` entries produces `"red"`, `"green"`, `"blue"`, `"yellow"` completions when LuaLS knows the expected type
- **Class fields** — `@class SpawnOptions` fields appear when constructing a table for that parameter

The annotation file is the contract. Getting it right is what makes the rest work.

### 2. Completion provider

- Trigger characters: `.` `:` `"` `'` `(` `,`
- Respects server `textEdit.range` (critical for string/enum completions where the replace span includes quotes)
- Full LSP kind mapping (1–25) including `EnumMember` for distinct icons on alias values
- Snippet insertion via `insertTextFormat === 2`
- `resolveCompletionItem` for lazy-loaded docs

### 3. Hover provider

- Delegates to `textDocument/hover`, converts LSP ranges to Monaco ranges
- Returns markdown content arrays

### 4. Signature help provider

- Triggers on `(` and `,`, retriggers on `)` 
- Maps LSP `SignatureInformation` → Monaco format including parameter labels and docs

### 5. Semantic tokens provider

- Declares full capability in `initialize` (token types + modifiers)
- Captures the server's legend from the `initialize` response (not hardcoded)
- Calls `textDocument/semanticTokens/full` and returns `Uint32Array` directly
- Monaco editor created with `"semanticHighlighting.enabled": true`
- **Status:** Tokens are returned from LuaLS but coloring in the editor is inconsistent — the `vs-dark` base theme has limited semantic token color rules and Monaco's built-in mapping doesn't always produce visible color differences. Needs theme-level `semanticTokenColors` rules or custom CSS to fully work. This is a theme/styling problem, not a protocol problem.

### 6. WebSocket bridge

- Clean pipe: no message interception, no rewriting
- LuaLS config injected via `--configpath` pointing to a generated `.luarc.json`
- `workspace/configuration` pulls from the client also return `callSnippet: "Replace"` for runtime config consistency

---

## The Journey — What We Learned

### The hard part: getting LuaLS to see the annotations

The initial attempt tried to resolve annotation files from `@intechstudio/grid-protocol/annotations` — a path that didn't exist. LuaLS needs plain `.lua` files with `---@meta` headers in a folder passed via `Lua.workspace.library`. No special format, no JSON, no build step — just `.lua` files with EmmyLua-style comments.

The breakthrough was creating `build-assets/lua-annotations/grid-api.lua` with `---@meta` at the top and writing normal Lua function stubs with `---@param` / `---@return` annotations. Once this file existed and the path was correct in `.luarc.json`, LuaLS immediately started providing completions, hover, and signature help for all declared functions and types.

### Configuring LuaLS: two paths that must agree

LuaLS pulls configuration from two sources:
1. **`.luarc.json`** via `--configpath` (read at startup)
2. **`workspace/configuration`** request (pulled at runtime from the client)

If these disagree, behavior is unpredictable. For example, `completion.callSnippet: "Replace"` must be in both places — only having it in `.luarc.json` isn't enough because LuaLS may re-pull config at runtime and the client's empty `{}` response would reset it.

### Snippet completions: three things must align

Getting `spawnEntity(name, pos)` instead of just `spawnEntity` required:
1. `.luarc.json`: `completion.callSnippet: "Replace"`
2. `workspace/configuration` handler returns: `{ completion: { callSnippet: "Replace" } }`
3. Client declares `snippetSupport: true` in `initialize` capabilities

Without all three, LuaLS sends plain text completions with no parentheses.

### Enum suggestions require trigger characters + range handling

LuaLS suggests alias values (like `"red"` for `@alias Color`) but only when it knows the context requires that type. Two things were needed:
- `"` and `'` as trigger characters so the completion request fires when the user starts typing a string literal
- Using the server's `textEdit.range` instead of `getWordUntilPosition` — string completions include the surrounding quotes in the replace range

### Semantic tokens: protocol works, styling is the gap

The semantic tokens protocol integration is fully functional — LuaLS returns encoded token data and Monaco receives it. But Monaco's built-in themes (`vs-dark`, `vs`) have minimal semantic token styling out of the box. The tokens are decoded and applied, but many token types end up with the same default color as the Monarch tokenizer already produces. Making this visually useful requires adding explicit `semanticTokenColors` rules to the theme definition, which Monaco's `defineTheme` API doesn't directly support in the same way VS Code's theme JSON does. This is a known limitation of standalone Monaco vs full VS Code.

### Monaco standalone ≠ VS Code

Several things that "just work" in VS Code require manual wiring in standalone Monaco:
- No built-in LSP client — had to write `JsonRpcConnection` from scratch
- No `vscode-languageclient` equivalent that auto-registers providers
- `semanticHighlighting.enabled` must be passed as an editor construction option
- Theme semantic token colors require workarounds
- Document sync is manual (`didOpen`/`didChange`/`didClose`)

The `monaco-languageclient` package exists but we opted for a minimal hand-rolled approach to avoid the heavy `@codingame/monaco-vscode-api` dependency chain.

---

## File Map

| File | Role |
|---|---|
| `src/electron/ipcmain_luals.ts` | Spawns LuaLS, bridges stdio ↔ WS, writes `.luarc.json` |
| `src/electron/main.ts` | Calls `startLuaLSServer()` / `stopLuaLSServer()` |
| `src/renderer/lib/monaco-luals-client.ts` | LSP client: JSON-RPC, document sync, all providers |
| `src/renderer/lib/monaco.ts` | Monarch tokenizer, theme, editor factory, calls `initLuaLSP()` |
| `build-assets/lua-annotations/grid-api.lua` | `---@meta` annotations for the Grid Lua API |
| `build-assets/lua-language-server-3.17.1-darwin-arm64/` | LuaLS binary (macOS arm64, dev only) |

---

## TODO

### Annotations
- [ ] Add all ~72 global functions to `grid-api.lua` (currently a test subset)
- [ ] Add `Element` class with method annotations (~53 methods)
- [ ] Declare `self` and `element` as `Element` globals
- [ ] Consider auto-generating annotations from `grid.get_luadocs()` or `grid-fw` source

### Semantic tokens / coloring
- [ ] Investigate Monaco theme API for semantic token color overrides
- [ ] Alternatively: use a `TokensProviderFactory` to map LuaLS semantic types to Monarch-compatible scopes
- [ ] Check if `monaco-editor` exposes `semanticTokenColorCustomizations` equivalent

### Build / packaging
- [ ] Bundle LuaLS binary in `extraResources` via `electron-builder-config.js`
- [ ] Handle packaged app paths in `resolveLualsBinary()`
- [ ] Add macOS x64, Linux, Windows binaries
- [ ] Investigate LuaLS WASM as cross-platform alternative

### LSP client improvements
- [ ] Wire `textDocument/publishDiagnostics` to `monaco_editor.setModelMarkers`
- [ ] Debounce `didChange` notifications
- [ ] WebSocket reconnection on drop
- [ ] Multi-document support (multiple virtual URIs)
- [ ] Decide: keep or remove old hand-rolled completion/hover providers from `monaco.ts`

### Monaco full LSP docs
- [ ] Read through Monaco editor LSP integration docs to understand why initial annotation loading required so much trial and error
- [ ] Check if `monaco-languageclient` would simplify future provider registration
