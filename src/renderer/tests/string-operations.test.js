import {
  grid,
  ModuleType,
  initLuaFormatter,
} from "@intechstudio/grid-protocol";
import { GridScript } from "@intechstudio/grid-protocol";
import { test, expect, beforeAll } from "vitest";

beforeAll(async () => {
  await initLuaFormatter();
});

test("Default configuration compression/expansion", function () {
  const elements = grid.get_module_element_list(ModuleType.BU16);
  elements.forEach((element) => {
    const events = grid.get_element_events(element);
    if (typeof events !== "undefined") {
      events.forEach((event) => {
        const defaultConfig = event.defaultConfig;
        const expanded = GridScript.expandScript(defaultConfig);
        const compressed = GridScript.compressScript(expanded);
        // Compare compressed versions since minification normalizes whitespace
        const originalCompressed = GridScript.compressScript(defaultConfig);
        expect(compressed).toMatch(originalCompressed);
      });
    }
  });
});

// test minifier single quote handling patch
test("Minifier", function () {
  let luaString = `local str="hello('(d'"`;
  const compressed = GridScript.compressScript(luaString);
  expect(compressed).toMatch(luaString);
});
