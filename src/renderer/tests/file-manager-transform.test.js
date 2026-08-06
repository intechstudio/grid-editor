import { test, expect } from "vitest";
import {
  toDeviceContent,
  toEditorContent,
  LUA_LANGUAGE_ID,
} from "../main/panels/FileManager/lua-transform";

// Regression guard: a drift between the language id used to tag .lua files
// ("intech_lua") and the id the transforms checked for ("lua") silently
// disabled shortify/humanize, so human-readable Grid API names were written
// verbatim and failed on device ("attempt to call a nil value").

test("Lua save shortifies human-readable Grid API names", () => {
  const human = "scr:draw_rectangle_filled(0, 0, 10, 10, C_BG)";
  const onDevice = toDeviceContent(human, LUA_LANGUAGE_ID);
  expect(onDevice).toContain(":ldrf(");
  expect(onDevice).not.toContain("draw_rectangle_filled");
});

test("Lua read humanizes short Grid API names", () => {
  const onDevice = "scr:ldrf(0,0,10,10,C_BG)";
  const human = toEditorContent(onDevice, LUA_LANGUAGE_ID);
  expect(human).toContain(":draw_rectangle_filled(");
  expect(human).not.toContain(":ldrf(");
});

test("Lua transforms preserve formatting (no minification)", () => {
  const human = "-- comment\nlocal x = 1\nscr:draw_text('hi', 0, 0, 1, C)\n";
  const onDevice = toDeviceContent(human, LUA_LANGUAGE_ID);
  // names translated, but newlines and the comment survive
  expect(onDevice).toContain("-- comment");
  expect(onDevice.split("\n").length).toBe(human.split("\n").length);
  expect(onDevice).toContain(":ldt(");
});

test("Non-Lua content passes through untouched", () => {
  const toml = "draw_rectangle_filled = 5\n";
  expect(toDeviceContent(toml, "ini")).toBe(toml);
  expect(toEditorContent(toml, "ini")).toBe(toml);
  expect(toDeviceContent(toml, "plaintext")).toBe(toml);
  expect(toEditorContent(toml, "plaintext")).toBe(toml);
});
