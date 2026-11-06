import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll } from "vitest";
import { configToLua, parseConfigScript } from "../lib/globalConfig";

const SCRIPT = `dim = 40 --[[slider,0,100]]\nmode = "absolute" --[[select,"absolute","relative"]]`;

describe("parseConfigScript", () => {
  test("reads names, specs and values", () => {
    const c = parseConfigScript(SCRIPT);
    expect(c.entries).toEqual([
      {
        name: "dim",
        spec: { type: "slider", min: 0, max: 100, step: 1 },
        value: 40,
      },
      {
        name: "mode",
        spec: { type: "select", options: ["absolute", "relative"] },
        value: "absolute",
      },
    ]);
  });

  test("toggle and slider step", () => {
    const c = parseConfigScript(
      "a = true --[[toggle]]\nb = 0.5 --[[slider,0,1,0.1]]",
    );
    expect(c.entries.map((e) => e.value)).toEqual([true, 0.5]);
    expect(c.entries[1].spec.step).toBe(0.1);
  });

  test("commas and ]] inside select options and values", () => {
    const c = parseConfigScript(`m = "c]]d" --[[select,"a,b","c]]d"]]`);
    expect(c.entries[0].spec.options).toEqual(["a,b", "c]]d"]);
    expect(c.entries[0].value).toBe("c]]d");
  });

  test("input keeps any expression as text", () => {
    const c = parseConfigScript(
      `a = math.max(1, 2) --[[input]]\nb = true --[[toggle]]`,
    );
    expect(c.entries[0].value).toBe("math.max(1, 2)");
    c.entries[0].value = "";
    expect(configToLua(c)).toBe(`a = nil --[[input]]\nb = true --[[toggle]]`);
  });

  test("input value may contain a string with --", () => {
    const c = parseConfigScript(`a = "x --[[y" --[[input]]`);
    expect(c.entries[0].value).toBe('"x --[[y"');
  });

  test("optional description", () => {
    const script = `dim = 40 --[[slider,0,100]] --[[Dims all the LEDs, it's quick]]\nb = true --[[toggle]]`;
    const c = parseConfigScript(script);
    expect(c.entries[0].description).toBe("Dims all the LEDs, it's quick");
    expect(c.entries[1].description).toBeUndefined();
    c.entries[0].value = 5;
    expect(configToLua(c)).toBe(script.replace("40", "5"));
  });

  test.each([
    "a = 1 --[[slider,0,9]] -- text",
    "a = 1 --[[slider,0,9]] --[[x]] --[[y]]",
    "a = 1 --[[slider,0,9]] text --[[x]]",
  ])("bad description: %s", (script) => {
    expect(parseConfigScript(script)).toBeNull();
  });

  test("blank lines are kept", () => {
    const script = `a = 1 --[[slider,0,5]]\n\nb = true --[[toggle]]\n`;
    expect(configToLua(parseConfigScript(script))).toBe(script);
  });

  test.each([
    "x = 1",
    "x = 1 --[[slider,0,100]] extra",
    "x = abc --[[slider,0,100]]",
    "x = 'a' --[[select,a]]",
    'x = "b" --[[select,"a"]]',
    "x = 1 --[[toggle]]",
    "x = 3 --[[slider,5,1]]",
    "x = 3 --[[bogus]]",
    "x = true --[[toggle]]\nx = false --[[toggle]]",
    "x = 1 --[[slider,0,9]\ny = 2",
    "x = 1 --[[slider,0,9]], y = 2",
    "x --[[toggle]]",
    "print('hi')",
    "",
  ])("not a config: %j", (script) => {
    expect(parseConfigScript(script)).toBeNull();
  });
});

describe("configToLua", () => {
  test("round trips untouched", () => {
    expect(configToLua(parseConfigScript(SCRIPT))).toBe(SCRIPT);
  });

  test("rewrites only values, keeping spacing", () => {
    const c = parseConfigScript(
      `dim  =  40   --[[slider,0,100]]\nmode = "absolute" --[[select,"absolute","relative"]]`,
    );
    c.entries[0].value = 7;
    c.entries[1].value = "relative";
    const out = configToLua(c);
    expect(out).toBe(
      `dim  =  7   --[[slider,0,100]]\nmode = "relative" --[[select,"absolute","relative"]]`,
    );
    expect(parseConfigScript(out).entries[1].value).toBe("relative");
  });
});

// The module stores the script compressed; the block works on the expanded form.
describe("stored (compressed) script", () => {
  beforeAll(async () => {
    await initLuaFormatter();
  });

  const SOURCE = [
    `dim = 40 --[[slider,0,100]] --[[Dims all the LEDs]]`,
    `mode = "absolute" --[[select,"absolute","relative"]] --[[How the value is applied]]`,
    `enabled = true --[[toggle]] --[[Turns the effect on or off]]`,
    `offset = 0 --[[input]] --[[Added to every value]]`,
  ].join("\n");

  test("descriptions survive compress and expand", () => {
    const c = parseConfigScript(
      GridScript.expandScript(GridScript.compressScript(SOURCE)),
    );
    expect(c.entries.map((e) => e.description)).toEqual([
      "Dims all the LEDs",
      "How the value is applied",
      "Turns the effect on or off",
      "Added to every value",
    ]);
  });

  test("compressed form is a single line", () => {
    expect(GridScript.compressScript(SOURCE)).not.toContain("\n");
  });

  test("parses after expanding", () => {
    const stored = GridScript.compressScript(SOURCE);
    const c = parseConfigScript(GridScript.expandScript(stored));
    expect(c.entries.map((e) => [e.name, e.value])).toEqual([
      ["dim", 40],
      ["mode", "absolute"],
      ["enabled", true],
      ["offset", "0"],
    ]);
  });

  test("an edit survives compress and expand", () => {
    const c = parseConfigScript(
      GridScript.expandScript(GridScript.compressScript(SOURCE)),
    );
    c.entries[0].value = 75;
    c.entries[2].value = false;
    const stored = GridScript.compressScript(configToLua(c));
    const again = parseConfigScript(GridScript.expandScript(stored));
    expect(again.entries.map((e) => e.value)).toEqual([
      75,
      "absolute",
      false,
      "0",
    ]);
  });

  test("the default script parses", () => {
    const stored = `dim=40 --[[slider,0,100]]--[[Dims all the LEDs]]mode="absolute" --[[select,"absolute","relative"]]--[[How the value is applied]]enabled=true --[[toggle]]--[[Turns the effect on or off]]offset=0 --[[input]]--[[Added to every value]]`;
    expect(stored).toBe(GridScript.compressScript(SOURCE));
    expect(parseConfigScript(GridScript.expandScript(stored))).not.toBeNull();
  });
});
