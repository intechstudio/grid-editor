import { GridScript } from "@intechstudio/grid-protocol";

// Pure, dependency-free transforms for the file manager's Lua editor. Kept
// separate from FileManager.ts (which pulls in runtime/serialport types) so
// they can be unit-tested without dragging in the app graph.

/**
 * Monaco language id for Grid Lua files. The editor shows the human-readable
 * form; the module only understands the short API names. This is the single
 * source of truth for that id — the transform helpers and the language map
 * both reference it so the two can never drift apart (a past drift between
 * "lua" and "intech_lua" silently disabled the transforms entirely).
 */
export const LUA_LANGUAGE_ID = "intech_lua";

/**
 * Editor content -> content written to the module. For Lua, translate the
 * human-readable Grid API names to the short names the firmware exposes
 * (e.g. `draw_rectangle_filled` -> `ldrf`); other content passes through.
 *
 * Name translation only — no minification — mirroring the action-block code
 * editors' postProcessor (GridScript.shortify). Minify is a send-time size
 * optimization for single-packet execution; files are chunk-written and
 * `require()`d, so keeping formatting and comments intact is preferable.
 */
export function toDeviceContent(content: string, language: string): string {
  return language === LUA_LANGUAGE_ID ? GridScript.shortify(content) : content;
}

/**
 * Inverse of {@link toDeviceContent}: expand short Grid API names back to
 * their human-readable form for display. Mirrors the config editors'
 * preProcessor (GridScript.humanize).
 */
export function toEditorContent(content: string, language: string): string {
  return language === LUA_LANGUAGE_ID ? GridScript.humanize(content) : content;
}
