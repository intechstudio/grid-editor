# LuaLS + Monaco Integration — Status

**Date:** 2026-03-19

## What's implemented (barebones)

### 1. Annotation file
- `build-assets/lua-annotations/grid-api.lua` — contains only `midi_send` for testing
- LuaLS picks this up via `Lua.workspace.library` setting

### 2. Electron main: LuaLS WebSocket bridge
- `src/electron/ipcmain_luals.ts`
  - Spawns `lua-language-server --stdio` per WebSocket connection
  - Bridges stdio ↔ WS on port 8089 using `vscode-ws-jsonrpc`
  - Patches `initialize` request to inject Lua 5.4 runtime, `self`/`element` globals, and annotation library path
  - Started in `main.ts` → `createWindow()`, stopped on `before-quit`

### 3. Renderer: minimal LSP client
- `src/renderer/lib/monaco-luals-client.ts`
  - Raw JSON-RPC over `WebSocket` to `ws://localhost:8089`
  - LSP `initialize` / `initialized` handshake
  - Document sync: `didOpen` / `didChange` / `didClose` (full-document sync)
  - Completion provider registered on `"intech_lua"` language
  - Hover provider registered on `"intech_lua"` language
  - Called from `monaco.ts` during init (non-blocking, catches failures)

---

## What's missing / TODO

### Annotations
- [ ] Add all ~72 global functions to `grid-api.lua` (currently only `midi_send`)
- [ ] Add `Element` class with all method annotations (~53 methods across button/encoder/potmeter/endless/lcd)
- [ ] Add `self` and `element` global variable declarations typed as `Element`
- [ ] Source: data available in `grid.get_luadocs()` from `@intechstudio/grid-protocol`

### LuaLS bridge
- [ ] Handle packaged app paths (`process.resourcesPath`) — currently hardcoded to dev `build-assets/` path
- [ ] Add LuaLS binary + annotations to `extraResources` in `electron-builder-config.js`
- [ ] Handle multiple platforms (currently only `darwin-arm64` binary exists)
- [ ] Consider WASM alternative to avoid shipping native binaries
- [ ] Graceful reconnection if LuaLS crashes
- [ ] Clean up child processes on unexpected exit

### LSP client (renderer)
- [ ] Convert `textDocument/publishDiagnostics` notifications to Monaco markers (`monaco_editor.setModelMarkers`)
- [ ] Support signature help (`textDocument/signatureHelp`)
- [ ] Multi-document support: each open editor gets its own virtual URI instead of sharing one
- [ ] Reconnection logic if WebSocket drops
- [ ] Debounce `didChange` notifications (currently fires on every completion request)

### Integration
- [ ] Decide whether LuaLS providers should replace or coexist with the existing hand-rolled completion/hover in `monaco.ts`
- [ ] Remove old providers once LuaLS is proven reliable (keep Monarch tokenizer for syntax highlighting)
- [ ] Test with `"lua"` language ID in addition to `"intech_lua"`

### Build / packaging
- [ ] Bundle `lua-language-server` binary in electron-builder `extraResources`
- [ ] Bundle `lua-annotations/` folder in `extraResources`
- [ ] Test on macOS x64, Linux, Windows
