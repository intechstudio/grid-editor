import { grid, ModuleType } from "grid-protocol";
import { GridScript } from "grid-protocol";
import { test, expect } from "vitest";

test("Default configuration compression/expansion", function () {
  const elements = grid.get_module_element_list(ModuleType.BU16);
  elements.forEach((element) => {
    const events = grid.get_element_events(element);
    if (typeof events !== "undefined") {
      events.forEach((event) => {
        const defaultConfig = event.defaultConfig
          .split("<?lua ")[1]
          .split(" ?>")[0];
        const expanded = GridScript.expandScript(defaultConfig);
        const compressed = GridScript.compressScript(expanded);
        expect(compressed).toMatch(defaultConfig);
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
