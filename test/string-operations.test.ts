import { grid, ModuleType } from "../src/renderer/protocol/grid-protocol";
import { stringManipulation } from "../src/renderer/main/user-interface/_string-operations";

test("Default configuration compression/expansion", function () {
  const elements = grid.get_module_element_list(ModuleType.BU16);
  elements.forEach((element) => {
    const events = grid.get_element_events(element);
    if (typeof events !== "undefined") {
      events.forEach((event) => {
        const defaultConfig = event.defaultConfig
          .split("<?lua ")[1]
          .split(" ?>")[0];
        const expanded = stringManipulation.expandScript(defaultConfig);
        const compressed = stringManipulation.compressScript(expanded);
        expect(compressed).toMatch(defaultConfig);
      });
    }
  });
});
