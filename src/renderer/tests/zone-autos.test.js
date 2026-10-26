import { initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll, vi } from "vitest";
import { createZonaVM, DOWN, UP } from "./zona-vm";
import {
  zoneContext,
  zoneGetterSuggestions,
  zoneMidi,
  zoneMidiAt,
  zoneMidiLabel,
} from "../config-blocks/touch/zone-autos";
import { parseZone } from "../config-blocks/touch/zone-parse";
import { companionElement } from "../main/panels/configuration/components/ActionPickerFilter";

beforeAll(async () => {
  await initLuaFormatter();
});

// Zone lines of a Setup, and the Lua that defines them as the editor writes
// a zone: the line and its end, no body.
function layout(lines) {
  return {
    zones: lines.map(parseZone),
    lua: lines.map((l) => `${l} end)`).join(" ") + " _Z.start(self)",
  };
}

// The gms calls one touch at raw position (x, y) produces.
async function sent(env, lua, x, y) {
  const vm = await createZonaVM(env);
  vm.setup(lua);
  vm.clear();
  vm.touch([0, DOWN, x, y], [0, UP, x, y]);
  return vm.midi();
}

// What a ZoneMidi says the wire carries for value v on source s (0, or 1
// for y): the messages zona.lua sends.
function wire(midi, v, s = 0) {
  if (midi.type === "pb") {
    return [[midi.ch, 224, v % 128, v >> 7]];
  }
  const n = midi.nums[s];
  if (midi.type === "cc14") {
    return [
      [midi.ch, 176, n, v >> 7],
      [midi.ch, 176, n + 32, v % 128],
    ];
  }
  return [[midi.ch, midi.type === "note" ? 144 : 176, n, v]];
}

describe("zone MIDI identity matches zona.lua", () => {
  const POS = { gmx: 1, gmy: 2, gpc: 1 }; // ch (2*4+1)%16 = 9
  const pos = { dx: 1, dy: 2, page: 1 };
  const P0 = { dx: 0, dy: 0, page: 0 };

  test("fader, button note, xy, and a slot after the xy", async () => {
    const { zones, lua } = layout([
      `_Z.fader("f1",0,0,1,9,{},function(self)`,
      `_Z.button("b1",1,0,2,2,{},function(self)`,
      `_Z.xy("p1",3,0,4,4,{},function(self)`,
      `_Z.fader("f2",8,0,1,9,{},function(self)`,
    ]);
    const m = zones.map((_, i) => zoneMidi(zones, i, pos));
    expect(await sent(POS, lua, 50, 0)).toEqual(wire(m[0], 127));
    expect(await sent(POS, lua, 200, 100)).toEqual([
      ...wire(m[1], 127),
      ...wire(m[1], 0),
    ]);
    expect(m[1].type).toBe("note");
    expect(await sent(POS, lua, 796, 0)).toEqual([
      ...wire(m[2], 127, 0),
      ...wire(m[2], 127, 1),
    ]);
    expect(m[2].nums).toEqual([32 + 16 + 2, 32 + 16 + 3]);
    expect(await sent(POS, lua, 960, 0)).toEqual(wire(m[3], 127));
    expect(m[3].nums).toEqual([32 + 16 + 4]);
    expect(m.map((e) => e.ch)).toEqual([9, 9, 9, 9]);
    expect(m.map(zoneMidiLabel)).toEqual([
      "CC 48 ch 10",
      "Note 49 ch 10",
      "CC 50, 51 ch 10",
      "CC 52 ch 10",
    ]);
  });

  test("a button as a CC", async () => {
    const { zones, lua } = layout([
      `_Z.button("b",0,0,1,1,{msg="cc"},function(self)`,
    ]);
    const m = zoneMidi(zones, 0, P0);
    expect(await sent({}, lua, 50, 50)).toEqual([
      ...wire(m, 127),
      ...wire(m, 0),
    ]);
    expect(zoneMidiLabel(m)).toBe("CC 32 ch 1");
  });

  test("14-bit fader: MSB on the auto % 32, LSB on +32", async () => {
    const { zones, lua } = layout([
      `_Z.fader("f1",0,0,1,9,{},function(self)`,
      `_Z.fader("f2",1,0,1,9,{res=14},function(self)`,
    ]);
    const m = zoneMidi(zones, 1, P0);
    expect(m).toEqual({ ch: 0, type: "cc14", nums: [1], fingers: 1 });
    expect(zoneMidiLabel(m)).toBe("CC 1/33 ch 1");
    expect(await sent({}, lua, 150, 0)).toEqual(wire(m, 16383));
  });

  test("a high-res button note stays 7-bit", () => {
    const zones = [parseZone(`_Z.button("b",0,0,1,1,{res=14},function(self)`)];
    expect(zoneMidi(zones, 0, P0)).toEqual({
      ch: 0,
      type: "note",
      nums: [32],
      fingers: 1,
    });
  });

  test("pitch bend", async () => {
    const { zones, lua } = layout([
      `_Z.fader("f",0,0,1,9,{msg="pb"},function(self)`,
    ]);
    const m = zoneMidi(zones, 0, P0);
    expect(m).toEqual({ ch: 0, type: "pb", nums: [], fingers: 1 });
    expect(zoneMidiLabel(m)).toBe("PB ch 1");
    expect(await sent({}, lua, 50, 0)).toEqual(wire(m, 16383));
  });

  test("explicit ch and num", async () => {
    const { zones, lua } = layout([
      `_Z.xy("p",0,0,3,3,{ch=4,num=20},function(self)`,
    ]);
    const m = zoneMidi(zones, 0, P0);
    expect(m).toEqual({ ch: 4, type: "cc", nums: [20, 21], fingers: 1 });
    expect(zoneMidiLabel(m)).toBe("CC 20, 21 ch 5");
    expect(await sent({}, lua, 341, 0)).toEqual([
      ...wire(m, 127, 0),
      ...wire(m, 127, 1),
    ]);
  });

  test("msg none sends nothing and keeps its slot", async () => {
    const { zones, lua } = layout([
      `_Z.fader("a",0,0,1,9,{msg="none"},function(self)`,
      `_Z.fader("b",1,0,1,9,{},function(self)`,
    ]);
    expect(zoneMidi(zones, 0, P0)).toBeNull();
    expect(zoneMidiLabel(null)).toBe("no MIDI");
    expect(await sent({}, lua, 50, 0)).toEqual([]);
    const m = zoneMidi(zones, 1, P0);
    expect(m.nums).toEqual([33]);
    expect(await sent({}, lua, 150, 0)).toEqual(wire(m, 127));
  });

  // 15 one-cell faders (slots 0-14) on rows 0-1, then an xy on rows 3-5
  const after15 = (xyOpt) => [
    ...Array.from(
      { length: 15 },
      (_, i) =>
        `_Z.fader("f${i}",${i % 9},${Math.floor(i / 9)},1,1,{},function(self)`,
    ),
    `_Z.xy("p",0,3,3,3,{${xyOpt}},function(self)`,
  ];

  test.each([
    // auto 32+5*16+15 = 127: y wraps to 0
    ["7-bit", { gmx: 5 }, { dx: 5, dy: 0, page: 0 }, "", [127, 0]],
    // auto (32+16+15) % 32 = 31: y wraps to 0, its LSB on 32
    ["14-bit", { gmx: 1 }, { dx: 1, dy: 0, page: 0 }, "res=14", [31, 0]],
  ])("xy y after the last number wraps (%s)", async (_, env, p, opt, nums) => {
    const { zones, lua } = layout(after15(opt));
    const m = zoneMidi(zones, 15, p);
    expect(m.nums).toEqual(nums);
    expect(await sent(env, lua, 341, 342)).toEqual([
      ...wire(m, opt ? 16383 : 127, 0),
      ...wire(m, opt ? 16383 : 127, 1),
    ]);
  });

  test("xy with an explicit num at the limit: x 126, y 127", async () => {
    const { zones, lua } = layout([
      `_Z.xy("p",0,0,3,3,{num=126},function(self)`,
    ]);
    const m = zoneMidi(zones, 0, P0);
    expect(m.nums).toEqual([126, 127]);
    expect(await sent({}, lua, 341, 0)).toEqual([
      ...wire(m, 127, 0),
      ...wire(m, 127, 1),
    ]);
  });

  test("the channel and number wrap like the library", () => {
    const zones = [parseZone(`_Z.fader("f",0,0,1,9,{},function(self)`)];
    const m = zoneMidi(zones, 0, { dx: 7, dy: 3, page: 5 });
    expect(m.ch).toBe(1);
    expect(m.nums).toEqual([(32 + 7 * 16) % 128]);
  });

  test.each([
    [`{fingers=3}`, "CC 32, 33 ch 1–3"],
    [`{fingers=5,ch=13}`, "CC 32, 33 ch 14–16, 1–2"],
    [`{fingers=2,ch=15}`, "CC 32, 33 ch 16, 1"],
    [`{fingers=2,res=14}`, "CC 0/32, 1/33 ch 1–2"],
  ])("an xy with %s: %s", (opt, label) => {
    const zones = [parseZone(`_Z.xy("p",0,0,3,3,${opt},function(self)`)];
    expect(zoneMidiLabel(zoneMidi(zones, 0, P0))).toBe(label);
  });

  test("fingers only count on an xy", () => {
    const zones = [
      parseZone(`_Z.fader("f",0,0,1,9,{fingers=3},function(self)`),
    ];
    expect(zoneMidi(zones, 0, P0).fingers).toBe(1);
  });

  test("the zone line at an event index", () => {
    const scripts = [
      "lib",
      `_Z.xy("p",0,0,3,3,{},function(self)`,
      "end)",
      `_Z.fader("f",3,0,1,9,{},function(self)`,
      "end)",
    ];
    expect(zoneMidiAt(scripts, 3, P0)).toEqual({
      ch: 0,
      type: "cc",
      nums: [34],
      fingers: 1,
    });
    expect(zoneMidiAt(scripts, 2, P0)).toBeUndefined();
  });
});

// Actions as the editor holds them: script plus the block type.
const act = (script, type = "single") => ({ script, information: { type } });
const ZONE = (name, x = 0) =>
  act(`_Z.fader("${name}",${x},0,1,9,{},function(self)`, "composite_open");
const END = act("end)", "composite_close");

describe("the zone around a block", () => {
  const actions = [
    act("lib"),
    ZONE("f1"),
    act("gms"),
    END,
    ZONE("f2", 1),
    act("if true then", "composite_open"),
    act("gms"),
    act("end", "composite_close"),
    END,
    act("_Z.start(self)"),
  ];

  test("inside a body, with the zones in order", () => {
    expect(zoneContext(actions, 2)).toMatchObject({ index: 0 });
    expect(zoneContext(actions, 6)).toMatchObject({ index: 1 });
    expect(zoneContext(actions, 6).zones.map((z) => z.name)).toEqual([
      "f1",
      "f2",
    ]);
  });

  test("outside every body", () => {
    expect(zoneContext(actions, 0)).toBeNull();
    expect(zoneContext(actions, 4)).toBeNull();
    expect(zoneContext(actions, 9)).toBeNull();
  });
});

describe("getter suggestions per kind", () => {
  const values = (kind) => zoneGetterSuggestions(kind).map((e) => e.value);

  test.each([
    ["fader", ["self:v()", "self:g()", "self:d()"]],
    [
      "xy",
      [
        "self:x()",
        "self:y()",
        "self:g()",
        "self:dx()",
        "self:dy()",
        "self:f()",
      ],
    ],
    ["button", ["self:v()", "self:step()", "self:g()"]],
  ])("%s", (kind, expected) => {
    expect(values(kind)).toEqual(expected);
  });

  test("each has a description", () => {
    for (const kind of ["fader", "button", "xy"]) {
      for (const e of zoneGetterSuggestions(kind)) {
        expect(e.info.length).toBeGreaterThan(5);
      }
    }
  });
});

describe("a companion with an element type goes to that element", () => {
  const elements = [
    { type: "touch", name: "zone surface" },
    { type: "system", name: "system" },
  ];

  test("from another element to the touch element", () => {
    expect(companionElement(elements, elements[1], "touch")).toBe(elements[0]);
  });

  test("without an element type, the block's own element", () => {
    expect(companionElement(elements, elements[0], undefined)).toBe(
      elements[0],
    );
    expect(companionElement(elements, elements[1], "button")).toBeUndefined();
  });
});
