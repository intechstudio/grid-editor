/**
 * Monaco Editor worker setup for Vite (no plugin required).
 *
 * Uses Vite's built-in `?worker` import to bundle the base editor worker.
 * Only the generic editor worker is needed — Lua/intech_lua use Monarch
 * tokenizers which run on the main thread.
 *
 * When migrating to LuaLS + monaco-languageclient in the future,
 * the language server will communicate via WebSocket/IPC,
 * not through Monaco's built-in worker system.
 */
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  },
};
