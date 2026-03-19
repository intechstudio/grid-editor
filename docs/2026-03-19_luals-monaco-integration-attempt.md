# LuaLS + Monaco Editor Integration Attempt

**Date:** 2026-03-19  
**Branch:** `kkerti-luaLS`  
**Status:** Will revert and restart incrementally

---

## Goal

Integrate [LuaLS (Lua Language Server)](https://github.com/LuaLS/lua-language-server) with the Monaco editor in the Grid Editor Electron app to provide rich Lua editing support: completions, hover, signature help, and diagnostics — powered by a real language server instead of hand-rolled Monaco configuration alone.

---

## What Was Done

### 1. LuaLS WebSocket Bridge (Electron main process)

**New file (untracked):** `src/electron/ipcmain_luals.ts`

- Spawns the `lua-language-server` binary as a child process with `--stdio`.
- Bridges LSP JSON-RPC messages over a local WebSocket server (port 8089) using `vscode-ws-jsonrpc`.
- Each WebSocket connection gets its own LuaLS process instance.
- Resolves the LuaLS binary from `build-assets/lua-language-server-*` in dev mode, or `process.resourcesPath` when packaged.
- The macOS arm64 binary is currently copied into the project under `build-assets/lua-language-server-3.17.1-darwin-arm64/` — this works for testing now. Future consideration: check if LuaLS can run in WASM to avoid shipping a native binary.
- Injects LuaLS settings (Lua 5.4 runtime, global diagnostics for `self`/`element`, workspace library paths for annotation files) by patching the `initialize` request in the message forwarding pipeline.

### 2. IPC Wiring (main → preload → renderer)

**Modified files:** `src/electron/main.ts`, `src/electron/preload.ts`

- `main.ts`: Imports and calls `startLuaLSServer()` at window creation, `stopLuaLSServer()` on `before-quit`, and registers an IPC handler `getLuaLSPort` to expose the WebSocket port to the renderer.
- `preload.ts`: Exposes `window.electron.luaLS.getPort()` via `contextBridge`.

**Observation:** This main→preload→renderer IPC port-passing pattern is redundant now that the actual LSP communication uses a direct WebSocket connection from the renderer to `ws://localhost:8089`. The renderer only needs to know the port, and even that could be a build-time constant or a simple query. The heavy IPC plumbing is unnecessary.

### 3. Monaco Editor Rewrite (`src/renderer/lib/monaco.ts`)

The file was significantly rewritten (~1000 lines of diff, 672 lines total) to:

- **Keep the Monarch tokenizer** for syntax highlighting (keywords, brackets, operators, strings, comments, numbers). This remains useful since LuaLS does not provide semantic token highlighting in this setup.
- **Add a raw JSON-RPC client** (`JsonRpcConnection` class) that communicates with LuaLS over WebSocket — no `@codingame/monaco-vscode-api` dependency.
- **Register LSP providers** for:
  - Completion (with snippet support)
  - Hover
  - Signature help
  - Diagnostics (pushed from server via `textDocument/publishDiagnostics`)
- **Implement LSP document sync** (`didOpen`, `didChange`, `didClose`) using full-document sync.
- **Remove old hand-rolled completion/hover providers** that were based on static function lists from `grid-protocol`.
- A helper file `src/renderer/lib/monaco-workers.ts` was also modified to set up Monaco's `MonacoEnvironment.getWorker`.

### 4. New Dependencies

Added to `package.json`:
- `monaco-languageclient@^10.7.0`
- `vscode-languageserver-protocol@^3.17.5`
- `vscode-ws-jsonrpc@^3.5.0`

Note: `monaco-languageclient` is listed as a dependency but the current implementation does **not** actually use it — the code uses a hand-rolled `JsonRpcConnection` instead. It may have been added during exploration and can likely be removed.

### 5. Vite Config Changes (`renderer.vite.config.mjs`)

Modified to handle Monaco editor bundling / worker resolution in the Vite build.

---

## What Worked

- **LuaLS starts successfully** with the macOS arm64 binary in `build-assets/`.
- **WebSocket bridge works** — the renderer connects to the local WS server and performs the LSP handshake.
- **LuaLS provides Lua completions, hover, and diagnostics** in Monaco.
- **Monarch tokenizer** continues to provide syntax highlighting alongside LuaLS.

---

## What Did NOT Work

### Annotation / Meta Files from grid-protocol

The `resolveAnnotationsPath()` function in `ipcmain_luals.ts` tried to resolve `@intechstudio/grid-protocol/annotations` and pass it as `Lua.workspace.library` to LuaLS. This was meant to provide Grid-specific API documentation (function signatures, parameter descriptions) to LuaLS so that it shows info for functions like `midi_send()`.

**Problems:**
- The `annotations` folder does not exist in the `grid-protocol` package.
- The import attempt was based on the idea of auto-generating `---@meta` annotation `.lua` files from grid-protocol's function definitions — this was never completed.
- LuaLS needs plain `.lua` files with `---@meta` / `---@param` / `---@return` EmmyLua-style annotations in a folder added to `Lua.workspace.library` for this to work.

**Solution for next iteration:** Instead of trying to import from grid-protocol, simply create a plain `.lua` annotation file directly in the project. For example, content like:

```lua
---@meta

---Sends a standard MIDI message.
---@param channel integer MIDI channel (0–15)
---@param command integer MIDI status byte — e.g. 176 (CC), 144 (Note On)
---@param parameter1 integer First data byte (0–127)
---@param parameter2 integer Second data byte (0–127)
function midi_send(channel, command, parameter1, parameter2) end
```

This file (and others for the full Grid Lua API pulled from `grid-fw`) can be placed in a known directory and passed to LuaLS as a workspace library.

---

## Open Questions

### What to keep from the Monarch tokenizer?

The Monarch tokenizer (`monarchTokens` in `monaco.ts`) provides:
- **Keyword highlighting** (`and`, `break`, `do`, `else`, `for`, `function`, etc.)
- **String/comment/number tokenization**
- **Bracket/operator matching**

With LuaLS providing semantic intelligence, the tokenizer is still needed for **syntax highlighting** since this LuaLS setup does not use semantic tokens. **Keep the Monarch tokenizer as-is.**

However, the old setup also had:
- Custom completion providers with Grid-specific functions (now replaced by LuaLS + annotations)
- A `forbiddens` list for identifier validation (referenced in `monaco-helper.js` via `$lib/CustomMonaco` — this import is currently broken since `CustomMonaco` was removed/renamed)

### LuaLS in WASM?

Currently shipping a native macOS arm64 binary. Worth investigating if LuaLS can be compiled to WASM for cross-platform use without bundling platform-specific binaries. This is a future consideration — the native binary approach works for now.

---

## Incremental Plan (Post-Revert)

After reverting all Monaco-related changes on this branch, re-apply work incrementally:

1. **Add the Lua annotation file** — Create a `.lua` file with `---@meta` annotations for Grid API functions (sourced from `grid-fw`). Place it in a project directory (e.g., `build-assets/lua-annotations/`).

2. **Integrate LuaLS with Monaco** — Re-add `ipcmain_luals.ts`, the WebSocket bridge, and the renderer-side LSP client. Wire up the annotation file path in the LuaLS `initialize` settings.

3. **Strip unnecessary Monaco config** — Once LuaLS provides completions/hover/diagnostics, remove the old hand-rolled providers. Keep only the Monarch tokenizer for syntax highlighting and any Grid-specific validation (like forbidden identifiers) that LuaLS doesn't cover.

---

## Files Changed (Summary)

| File | Change Type | Notes |
|---|---|---|
| `src/electron/ipcmain_luals.ts` | **New** (untracked) | LuaLS WebSocket bridge |
| `src/electron/main.ts` | Modified (uncommitted) | Import & wire LuaLS lifecycle |
| `src/electron/preload.ts` | Modified (uncommitted) | Expose `luaLS.getPort()` |
| `src/renderer/lib/monaco.ts` | Modified (committed + uncommitted) | Full rewrite with LSP client |
| `src/renderer/lib/monaco-workers.ts` | Modified (uncommitted) | Monaco worker setup |
| `src/renderer/main.js` | Modified (committed) | Monaco init changes |
| `renderer.vite.config.mjs` | Modified (committed) | Vite config for Monaco |
| `package.json` | Modified (uncommitted) | New deps: `vscode-ws-jsonrpc`, `vscode-languageserver-protocol`, `monaco-languageclient` |
| `src/renderer/config-blocks/CodeBlock.svelte` | Modified (uncommitted) | Editor usage changes |
| `src/renderer/main/modals/Monaco.svelte` | Modified (uncommitted) | Modal editor changes |
| `src/renderer/main/user-interface/LineEditor.svelte` | Modified (uncommitted) | Line editor changes |

---

## Key Commits on `kkerti-luaLS`

- `b66e4b577` — Consume generated luadocs in Monaco editor, without actually adding LuaLS; try to have feature parity with previous implementation
- `0ce2f930b` — Format
- `b4ddb8240` — Allow symlinking grid-protocol for local dev
