import { test, expect, describe } from "vitest";
import { configToLua, parseConfigScript } from "../lib/globalConfig";

const SCRIPT = `dim --[[slider,0,100]], mode --[[select,"absolute","relative"]] = 40, "absolute"`;

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
      "a --[[toggle]], b --[[slider,0,1,0.1]] = true, 0.5",
    );
    expect(c.entries.map((e) => e.value)).toEqual([true, 0.5]);
    expect(c.entries[1].spec.step).toBe(0.1);
  });

  test("commas and ]] inside select options", () => {
    const c = parseConfigScript(`m --[[select,"a,b","c]]d"]] = "c]]d"`);
    expect(c.entries[0].spec.options).toEqual(["a,b", "c]]d"]);
    expect(c.entries[0].value).toBe("c]]d");
  });

  test("formatter moved the comma before the spec", () => {
    const c = parseConfigScript(
      `dim, --[[slider,0,100]]\n  mode --[[select,"absolute","relative"]] = 40, "absolute"`,
    );
    expect(c.entries.map((e) => [e.name, e.value])).toEqual([
      ["dim", 40],
      ["mode", "absolute"],
    ]);
  });

  test("trailing spec before = after a moved comma", () => {
    const c = parseConfigScript("a, --[[toggle]] = true");
    expect(c.entries[0].name).toBe("a");
  });

  test("input keeps any expression as text", () => {
    const c = parseConfigScript(
      `a --[[input]], b --[[toggle]] = math.max(1, 2), true`,
    );
    expect(c.entries[0].value).toBe("math.max(1, 2)");
    c.entries[0].value = "";
    expect(configToLua(c)).toBe(`a --[[input]], b --[[toggle]] = nil, true`);
  });

  test.each([
    "x = 1",
    "x --[[slider,0,100]] = 1, 2",
    "x --[[slider,0,100]] = abc",
    "x --[[select,a]] = 'a'",
    'x --[[select,"a"]] = "b"',
    "x --[[toggle]] = 1",
    "x --[[slider,5,1]] = 3",
    "x --[[bogus]] = 3",
    "x --[[toggle]], x --[[toggle]] = true, true",
    "x --[[toggle]]",
    "print('hi')",
  ])("not a config: %s", (script) => {
    expect(parseConfigScript(script)).toBeNull();
  });
});

describe("configToLua", () => {
  test("round trips untouched", () => {
    expect(configToLua(parseConfigScript(SCRIPT))).toBe(SCRIPT);
  });

  test("rewrites only values", () => {
    const c = parseConfigScript(SCRIPT);
    c.entries[0].value = 7;
    c.entries[1].value = "relative";
    expect(configToLua(c)).toBe(
      `dim --[[slider,0,100]], mode --[[select,"absolute","relative"]] = 7, "relative"`,
    );
    expect(parseConfigScript(configToLua(c)).entries[1].value).toBe("relative");
  });
});
