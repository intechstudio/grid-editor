# LuaLS + Monaco Integration

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

LuaLS runs as a child process on the **main thread**. The LSP client lives in the **renderer** because Monaco providers must be registered in the same JS context as the editor. The WebSocket bridge is a dumb pipe — no interception, just JSON-RPC bytes between the renderer's WS client and LuaLS's stdio.

---

## What's Working

### Annotation-driven intelligence

The single most impactful piece: `build-assets/lua-annotations/grid-api.lua`.

Once LuaLS reads this `---@meta` file (via `workspace.library` in `.luarc.json`), everything flows naturally:

- **Completions** — global functions appear in the suggestion list
- **Snippets** — accepting a function completion inserts params with tab-stop placeholders
- **Hover** — full signature + `@param` / `@return` docs rendered as markdown
- **Signature help** — typing `(` or `,` shows the active parameter
- **Enum/alias values** — `@alias` with `---|` entries produces string completions when LuaLS knows the expected type
- **Class fields** — `@class` fields appear when constructing a table for that parameter

### Completion provider

- Trigger characters: `.` `:` `"` `'` `(` `,`
- Respects server `textEdit.range` (critical for string/enum completions where the replace span includes quotes)
- Full LSP kind mapping (1–25) including `EnumMember`
- Snippet insertion via `insertTextFormat === 2`
- `resolveCompletionItem` for lazy-loaded docs

### Hover, Signature help, Semantic tokens

- Hover delegates to `textDocument/hover`, converts LSP ranges to Monaco ranges
- Signature help triggers on `(` and `,`, retriggers on `)`
- Semantic tokens: protocol works, but Monaco's built-in themes have limited semantic token color rules — this is a theme/styling gap, not a protocol problem

### WebSocket bridge

- Clean pipe: no message interception, no rewriting
- Config injected via `--configpath` pointing to a generated `.luarc.json`
- `workspace/configuration` responses also return `callSnippet: "Replace"` for runtime consistency

---

## Lessons Learned

### Annotations: just plain `.lua` files

The initial attempt tried to resolve annotation files from `@intechstudio/grid-protocol/annotations` — a path that didn't exist. LuaLS needs plain `.lua` files with `---@meta` headers in a folder passed via `Lua.workspace.library`. No special format, no JSON, no build step.

The breakthrough was creating `build-assets/lua-annotations/grid-api.lua` with `---@meta` at the top and writing normal Lua function stubs with EmmyLua-style annotations.

### LuaLS config: two paths that must agree

1. **`.luarc.json`** via `--configpath` (read at startup)
2. **`workspace/configuration`** request (pulled at runtime)

If these disagree, behavior is unpredictable. For example, `completion.callSnippet: "Replace"` must be in both — LuaLS may re-pull config at runtime and an empty `{}` response would reset it.

### Snippet completions: three things must align

1. `.luarc.json`: `completion.callSnippet: "Replace"`
2. `workspace/configuration` handler returns: `{ completion: { callSnippet: "Replace" } }`
3. Client declares `snippetSupport: true` in `initialize` capabilities

Without all three, LuaLS sends plain text completions with no parentheses.

### Enum suggestions need trigger characters + range handling

- `"` and `'` as trigger characters so completions fire when the user starts typing a string literal
- Use the server's `textEdit.range` instead of `getWordUntilPosition` — string completions include the surrounding quotes in the replace range

### Monaco standalone ≠ VS Code

Several things that "just work" in VS Code require manual wiring in standalone Monaco:

- No built-in LSP client — had to write `JsonRpcConnection` from scratch
- No `vscode-languageclient` equivalent that auto-registers providers
- `semanticHighlighting.enabled` must be passed as an editor construction option
- Theme semantic token colors require workarounds
- Document sync is manual (`didOpen`/`didChange`/`didClose`)

We opted for a minimal hand-rolled approach to avoid the heavy `@codingame/monaco-vscode-api` dependency chain.

---

## File Map

| File                                                 | Role                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| `src/electron/ipcmain_luals.ts`                      | Spawns LuaLS, bridges stdio ↔ WS, writes `.luarc.json`         |
| `src/electron/main.ts`                               | Calls `startLuaLSServer()` / `stopLuaLSServer()`                |
| `src/renderer/lib/monaco-luals-client.ts`            | LSP client: JSON-RPC, document sync, all providers              |
| `src/renderer/lib/monaco.ts`                         | Monarch tokenizer, theme, editor factory, calls `initLuaLSP()`  |
| `build-assets/lua-annotations/grid-api.lua`          | `---@meta` annotations for the Grid Lua API                     |
| `build-scripts/download-luals.js`                    | Downloads platform-specific LuaLS binaries from GitHub releases |
| `build-assets/lua-language-server-<ver>-<platform>/` | LuaLS binary (gitignored, auto-downloaded per platform)         |

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

### Build / packaging

- [x] Bundle LuaLS binary in `extraResources` via `electron-builder-config.js`
- [x] Handle packaged app paths in `resolveLualsBinary()`
- [x] Add macOS x64, Linux, Windows binaries — `download-luals.js` auto-detects platform
- [x] Download script integrated into `postinstall` hook and CI workflow
- [ ] Investigate LuaLS WASM as cross-platform alternative

### LSP client improvements

- [ ] Wire `textDocument/publishDiagnostics` to `monaco_editor.setModelMarkers`
- [ ] Debounce `didChange` notifications
- [ ] WebSocket reconnection on drop
- [ ] Multi-document support (multiple virtual URIs)
- [ ] Decide: keep or remove old hand-rolled completion/hover providers from `monaco.ts`

---

## Progress Log

### 2026-03-19 — Initial integration attempt

First pass at integrating LuaLS with Monaco. Created the WebSocket bridge (`ipcmain_luals.ts`), hand-rolled JSON-RPC client in the renderer, and rewrote `monaco.ts` with LSP providers. The annotation path from `grid-protocol` didn't exist — resolved by creating `build-assets/lua-annotations/grid-api.lua` with `---@meta` stubs. Decided to revert the large diff and re-apply incrementally. Kept the Monarch tokenizer for syntax highlighting alongside LuaLS intelligence.

Key commits: `b66e4b577` (consume luadocs in Monaco), `b4ddb8240` (allow symlinking grid-protocol).

### 2026-03-25 — Cross-platform LuaLS binary packaging

**PR goal:** Verify that the new LuaLS integration brings meaningful improvements to Grid Editor across all platforms.

Changes:

1. **`build-scripts/download-luals.js`** (new) — Downloads platform-specific LuaLS v3.17.1 binaries from GitHub releases. Auto-detects targets per OS. Skips if already exists.

2. **`src/electron/ipcmain_luals.ts`** — Dynamic platform/arch resolution via `getAssetsBase()` + `resolveLualsBinary()`. Handles packaged vs dev paths and `.exe` on Windows.

3. **`electron-builder-config.js`** — `extraResources` dynamically includes all `lua-language-server-*` directories and `lua-annotations/` outside ASAR.

4. **`.github/workflows/build-matrix.yml`** — Added "Download LuaLS binaries" step after `npm ci`.

5. **`package.json`** — Added `download:luals` script, wired into `postinstall`.

CI matrix:

| Runner           | Downloads              | Packaged into    |
| ---------------- | ---------------------- | ---------------- |
| `macos-latest`   | `darwin-arm64` + `x64` | arm64 + x64 DMGs |
| `windows-latest` | `win32-x64`            | NSIS installer   |
| `ubuntu-22.04`   | `linux-x64`            | AppImage         |
