import { test, expect, describe } from "vitest";
import {
  zoneNameProblem,
  optionProblem,
  zoneProblems,
  zoneTickProblems,
  validateSurface,
} from "../config-blocks/touch/zone-validate";
import { zoneOptionSchema } from "../config-blocks/touch/zone-model";
import {
  parseZone,
  ZONE_END_SCRIPT,
  ZONE_START_SCRIPT,
} from "../config-blocks/touch/zone-parse";

const LIB = `local p=string.format("/%02X/",gpc())Z=require(p.."zona")`;

function zone(fields = {}) {
  return {
    name: "f",
    kind: "fader",
    x: 0,
    y: 0,
    w: 1,
    h: 9,
    opt: {},
    ...fields,
  };
}

const keys = (problems) => problems.map((e) => e.key);
const schema = (key) => zoneOptionSchema.find((e) => e.key === key);

describe("zone name", () => {
  test.each(["f1", "pad", "_x", "Fader_2", "Z", "zona"])("%s is valid", (n) => {
    expect(zoneNameProblem(n)).toBeUndefined();
  });

  test.each([
    ["", "Enter a zone name"],
    ["1f", "Use letters, digits and _, not starting with a digit"],
    ["my fader", "Use letters, digits and _, not starting with a digit"],
    ["a-b", "Use letters, digits and _, not starting with a digit"],
    ["end", `"end" is a Lua keyword`],
    [
      "led_value",
      `"led_value" is a firmware function name, sent to the module as "glp"`,
    ],
    ["page_current", expect.stringContaining(`"gpc"`)],
    ["glp", `"glp" is a firmware function`],
  ])("%j is rejected", (n, message) => {
    expect(zoneNameProblem(n)).toEqual(message);
  });
});

describe("geometry", () => {
  test.each([
    { x: 0, y: 0, w: 9, h: 9 },
    { x: 8, y: 8, w: 1, h: 1 },
    { x: 4, y: 0, w: 5, h: 5 },
  ])("%j is valid", (cells) => {
    expect(zoneProblems(zone(cells))).toEqual([]);
  });

  test.each([
    [{ x: 0.5 }, ["x"]],
    [{ h: 2.5 }, ["h"]],
    [{ w: 0 }, ["w"]],
    [{ h: -1 }, ["h"]],
    [{ x: -1 }, ["x"]],
    [{ x: 8, w: 2 }, ["x"]],
    [{ y: 1, h: 9 }, ["y"]],
    [{ x: 9, w: 1, y: 9, h: 1 }, ["x", "y"]],
  ])("%j is rejected", (cells, rejected) => {
    expect(keys(zoneProblems(zone(cells)))).toEqual(rejected);
  });
});

describe("options", () => {
  test.each([
    ["res", 7],
    ["res", 14],
    ["mode", "glide"],
    ["led", 0],
    ["speed", 0.5],
    ["ease", 1],
    ["group", 8],
    ["grab", "live"],
    ["min", -500],
  ])("%s=%j is valid", (key, value) => {
    expect(optionProblem(schema(key), value)).toBeUndefined();
  });

  test.each([
    ["res", 6, "Use 7 to 14"],
    ["res", 15, "Use 7 to 14"],
    ["res", 10.5, "Enter a whole number"],
    ["res", "10", "Enter a number"],
    ["speed", 0, "Use 0.01 to 10"],
    ["ease", 1.5, "Use 0 to 1"],
    ["group", 9, "Use 0 to 8"],
    ["led", 2, "Use 0 to 1"],
    ["led", "fill", "Enter a number"],
    ["min", 0.5, "Enter a whole number"],
    ["mode", "fast", "Use one of abs, rel, glide"],
  ])("%s=%j is rejected", (key, value, message) => {
    expect(optionProblem(schema(key), value)).toBe(message);
  });

  test("a zone reports each bad option", () => {
    expect(
      zoneProblems(zone({ opt: { res: 20, mode: "x", speed: 0.5 } })),
    ).toEqual([
      { key: "res", message: "Use 7 to 14" },
      { key: "mode", message: "Use one of abs, rel, glide" },
    ]);
  });
});

describe("MIDI options", () => {
  test.each([
    ["ch", -1],
    ["ch", 15],
    ["num", -1],
    ["num", 127],
    ["rx", 1],
  ])("%s=%j is valid", (key, value) => {
    expect(optionProblem(schema(key), value)).toBeUndefined();
  });

  test.each([
    ["ch", 16, "Use -1 to 15"],
    ["ch", -2, "Use -1 to 15"],
    ["num", 128, "Use -1 to 127"],
    ["rx", 2, "Use 0 to 1"],
  ])("%s=%j is rejected", (key, value, message) => {
    expect(optionProblem(schema(key), value)).toBe(message);
  });

  test.each([
    ["fader", "pb", undefined],
    ["fader", "note", "Use one of cc, pb, none"],
    ["button", "note", undefined],
    ["button", "pb", "Use one of note, cc, none"],
    ["xy", "cc", undefined],
    ["xy", "pb", "Use one of cc, none"],
  ])("msg on a %s: %s", (kind, msg, message) => {
    const problems = zoneProblems(zone({ kind, opt: { msg } }));
    expect(problems.find((e) => e.key === "msg")?.message).toBe(message);
  });
});

describe("ranges and numbers that reach the wire", () => {
  test("pitch bend is 14-bit: max defaults to 16383", () => {
    expect(zoneProblems(zone({ opt: { msg: "pb", min: 200 } }))).toEqual([]);
    expect(zoneProblems(zone({ opt: { min: 200 } }))).toEqual([
      { key: "min", message: "Max (127) must be above min (200)" },
    ]);
  });

  test.each([
    [{ msg: "pb", min: -8192, max: 8191 }, ["min"]],
    [{ min: -1 }, ["min"]],
    [{ res: 14, max: 20000 }, ["max"]],
    [{ msg: "pb", min: -1, max: 16384 }, ["min", "max"]],
  ])("a zone that sends MIDI keeps min and max in 0-16383: %j", (opt, keys) => {
    const problems = zoneProblems(zone({ opt }));
    expect(problems.map((e) => e.key)).toEqual(keys);
    expect(problems[0].message).toBe("Use 0 to 16383 when the zone sends MIDI");
  });

  test("msg none takes a signed range", () => {
    expect(
      zoneProblems(zone({ opt: { msg: "none", min: -8192, max: 8191 } })),
    ).toEqual([]);
  });

  test.each([
    ["fader", { res: 14, num: 31 }, undefined],
    [
      "fader",
      { res: 14, num: 32 },
      "Use -1 (auto) or 0 to 31: a 14-bit CC sends its LSB on num+32",
    ],
    ["xy", { res: 14, num: 30 }, undefined],
    [
      "xy",
      { res: 14, num: 31 },
      "Use -1 (auto) or 0 to 30: a 14-bit CC sends its LSB on num+32, y goes on num+1",
    ],
    ["xy", { num: 126 }, undefined],
    ["xy", { num: 127 }, "Use -1 (auto) or 0 to 126: y goes on num+1"],
    ["fader", { num: 127 }, undefined],
    ["fader", { msg: "pb", res: 14, num: 100 }, undefined], // pb has no number
    ["button", { res: 14, num: 100 }, undefined], // a note is 7-bit
    [
      "button",
      { res: 14, msg: "cc", num: 40 },
      "Use -1 (auto) or 0 to 31: a 14-bit CC sends its LSB on num+32",
    ],
  ])("num on a %s %j", (kind, opt, message) => {
    const problems = zoneProblems(zone({ kind, w: 3, h: 3, opt }));
    expect(problems.find((e) => e.key === "num")?.message).toBe(message);
  });
});

describe("fingers", () => {
  test.each([
    ["xy", 1, undefined],
    ["xy", 5, undefined],
    ["xy", 0, "Use 1 to 5"],
    ["xy", 6, "Use 1 to 5"],
    ["xy", 2.5, "Enter a whole number"],
    ["fader", 2, "Fingers is for XY pads"],
    ["button", 1, "Fingers is for XY pads"],
  ])("fingers on a %s: %j", (kind, fingers, message) => {
    const problems = zoneProblems(zone({ kind, w: 2, h: 2, opt: { fingers } }));
    expect(problems.find((e) => e.key === "fingers")?.message).toBe(message);
  });
});

describe("spring", () => {
  test.each([
    ["fader", 1, undefined],
    ["xy", 0, undefined],
    ["fader", 2, "Use 0 to 1"],
    ["button", 1, "Spring is for faders and XY pads"],
  ])("spring on a %s: %j", (kind, spring, message) => {
    const problems = zoneProblems(zone({ kind, w: 2, h: 2, opt: { spring } }));
    expect(problems.find((e) => e.key === "spring")?.message).toBe(message);
  });
});

describe("min < max", () => {
  test.each([
    {},
    { min: 10, max: 20 },
    { min: 100 }, // max 127
    { res: 8, min: 200 }, // max 16383
    { max: 1 },
    { msg: "none", min: -10, max: -5 }, // no MIDI: any range
  ])("%j is valid", (opt) => {
    expect(zoneProblems(zone({ opt }))).toEqual([]);
  });

  test.each([
    [{ min: 20, max: 10 }, "max", "Max (10) must be above min (20)"],
    [{ min: 10, max: 10 }, "max", "Max (10) must be above min (10)"],
    [{ min: 200 }, "min", "Max (127) must be above min (200)"],
    [{ max: 0 }, "max", "Max (0) must be above min (0)"],
    [{ msg: "none", max: -1 }, "max", "Max (-1) must be above min (0)"],
  ])("%j is rejected", (opt, key, message) => {
    expect(zoneProblems(zone({ opt }))).toEqual([{ key, message }]);
  });

  test("not checked when res, min or max is itself invalid", () => {
    expect(keys(zoneProblems(zone({ opt: { res: 3, min: 200 } })))).toEqual([
      "res",
    ]);
  });
});

describe("Touch Tick", () => {
  test("tick options", () => {
    expect(zoneTickProblems({ opt: { ms: 10 } })).toEqual([]);
    expect(keys(zoneTickProblems({ opt: { ms: 0 } }))).toEqual(["ms"]);
  });
});

// A touch Setup as [script]; zones are parsed from it the way the overlay
// will (RFC 6.3).
function surface(scripts) {
  const actions = scripts.map((script) => ({ script }));
  const zones = scripts.map(parseZone).filter((e) => e !== null);
  return validateSurface(zones, { actions });
}

const fader = (name, x = 0) => [
  `Z.fader("${name}",${x},0,1,9,{},function(self)`,
  "print(1)",
  ZONE_END_SCRIPT,
];

describe("surface", () => {
  test("a complete Setup has no issues", () => {
    expect(
      surface([LIB, ...fader("a"), ...fader("b", 1), ZONE_START_SCRIPT]),
    ).toEqual([]);
  });

  test("a Setup without zones has no issues", () => {
    expect(surface([])).toEqual([]);
    expect(surface(["print(1)"])).toEqual([]);
  });

  test("duplicate names are an error, once per name", () => {
    expect(
      surface([
        LIB,
        ...fader("a"),
        ...fader("a", 1),
        ...fader("a", 2),
        ...fader("b", 3),
        ZONE_START_SCRIPT,
      ]),
    ).toEqual([
      { zone: "a", level: "error", message: `Another zone is also named "a"` },
    ]);
  });

  test("zone problems name the zone", () => {
    expect(
      surface([
        LIB,
        `Z.fader("a",8,0,2,9,{res=6},function(self)`,
        ZONE_END_SCRIPT,
        ZONE_START_SCRIPT,
      ]),
    ).toEqual([
      {
        zone: "a",
        level: "error",
        message: "Keep the zone inside the 9×9 grid",
      },
      { zone: "a", level: "error", message: "Use 7 to 14" },
    ]);
  });

  const noLib = {
    level: "warning",
    message: "Add a Library block that binds Z to zona before the first zone",
  };

  test.each([
    ["no Library block", [...fader("a"), ZONE_START_SCRIPT]],
    [
      "the Library block after the zones",
      [...fader("a"), LIB, ZONE_START_SCRIPT],
    ],
    [
      "Z bound to another file",
      [
        `local p=string.format("/%02X/",gpc())Z=require(p.."layout")`,
        ...fader("a"),
        ZONE_START_SCRIPT,
      ],
    ],
    [
      "Z rebound after zona",
      [
        LIB,
        `local p=string.format("/%02X/",gpc())Z=require(p.."other")`,
        ...fader("a"),
        ZONE_START_SCRIPT,
      ],
    ],
  ])("%s: warning", (_, scripts) => {
    expect(surface(scripts)).toEqual([noLib]);
  });

  test("Z bound in a row next to other globals is fine", () => {
    expect(
      surface([
        `local p=string.format("/%02X/",gpc())L=require(p.."layout")Z=require(p.."zona")`,
        ...fader("a"),
        ZONE_START_SCRIPT,
      ]),
    ).toEqual([]);
  });

  test("Touch Start missing: warning", () => {
    expect(surface([LIB, ...fader("a")])).toEqual([
      {
        level: "warning",
        message: "Add Touch Start as the last block: zones stay inactive",
      },
    ]);
  });

  test("Touch Start not last: warning", () => {
    expect(surface([LIB, ZONE_START_SCRIPT, ...fader("a")])).toEqual([
      { level: "warning", message: "Move Touch Start to the end of Setup" },
    ]);
    expect(
      surface([LIB, ...fader("a"), ZONE_START_SCRIPT, "print(1)"]),
    ).toEqual([
      { level: "warning", message: "Move Touch Start to the end of Setup" },
    ]);
  });
});
