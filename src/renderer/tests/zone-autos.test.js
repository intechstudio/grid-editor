import { initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll, vi } from "vitest";
import { createZonaVM, DOWN, UP } from "./zona-vm";
import {
  gmsModeArg,
  zoneContext,
  zoneGetterSuggestions,
  zoneMidiAutos,
  zoneP1Label,
} from "../config-blocks/touch/zone-autos";
import { parseZone } from "../config-blocks/touch/zone-parse";
import { assignsGlobal, globalClashes } from "../libraries/library-script";
import { companionElement } from "../main/panels/configuration/components/ActionPickerFilter";
import { touchUtilityInformation } from "../config-blocks/touch/zone-block-info";

// library-device.ts imports the app through these; hasPageFolder needs neither.
vi.mock("../main/panels/FileManager/FileManager", () => ({}));
vi.mock("../runtime/runtime.store", () => ({ logger: { set() {} } }));
const { hasPageFolder } = await import("../libraries/library-device");

beforeAll(async () => {
  await initLuaFormatter();
});

const MIDI = "function(self) self:gms(-1,-1,-1,-1) end";

// Zone lines of a Setup, and the Lua that defines them with default MIDI
// bodies (as the editor writes a zone: line + MIDI block + end).
function layout(lines) {
  return {
    zones: lines.map(parseZone),
    lua:
      lines.map((l) => `${l}self:gms(-1,-1,-1,-1) end)`).join(" ") +
      " Z.start(self)",
  };
}

// The gms calls one touch of zone `i` produces, at raw position (x, y).
async function sent(env, lua, x, y) {
  const vm = await createZonaVM(env);
  vm.setup(lua);
  vm.clear();
  vm.touch([0, DOWN, x, y], [0, UP, x, y]);
  return vm.midi();
}

describe("zone MIDI autos match zona.lua", () => {
  const POS = { gmx: 1, gmy: 2, gpc: 1 }; // ch (2*4+1)%16 = 9
  const pos = { dx: 1, dy: 2, page: 1 };

  test("fader, button, xy, and a slot after the xy", async () => {
    const { zones, lua } = layout([
      `Z.fader("f1",0,0,1,9,{},function(self)`,
      `Z.button("b1",1,0,2,2,{},function(self)`,
      `Z.xy("p1",3,0,4,4,{},function(self)`,
      `Z.fader("f2",8,0,1,9,{},function(self)`,
    ]);
    const autos = zones.map((_, i) => zoneMidiAutos(zones, i, pos));

    // fader f1 at the top: value 127, the first slot
    expect(await sent(POS, lua, 50, 0)).toEqual([
      [autos[0].ch, autos[0].cmd, autos[0].p1[0], 127],
    ]);
    // button b1: note on, then off
    expect(await sent(POS, lua, 200, 100)).toEqual([
      [autos[1].ch, 144, autos[1].p1[0], 127],
      [autos[1].ch, 144, autos[1].p1[0], 0],
    ]);
    expect(autos[1].cmd).toBe(144);
    // xy p1: x and y on two neighbouring CCs
    const xy = await sent(POS, lua, 790, 10);
    expect(xy.map((m) => m[2])).toEqual(autos[2].p1);
    expect(autos[2].p1).toEqual([32 + 16 + 2, 32 + 16 + 3]);
    expect(zoneP1Label(autos[2])).toBe("50/51");
    // f2 after the xy: slot 4 (the xy takes 2)
    expect((await sent(POS, lua, 960, 0))[0].slice(0, 3)).toEqual([
      9,
      176,
      autos[3].p1[0],
    ]);
    expect(autos[3].p1).toEqual([32 + 16 + 4]);
    expect(autos.map((a) => a.ch)).toEqual([9, 9, 9, 9]);
  });

  test("14-bit: res above 7, MSB on p1 % 32 and LSB on +32", async () => {
    const { zones, lua } = layout([
      `Z.fader("f1",0,0,1,9,{},function(self)`,
      `Z.fader("f2",1,0,1,9,{res=14},function(self)`,
    ]);
    const autos = zoneMidiAutos(zones, 1, { dx: 0, dy: 0, page: 0 });
    expect(autos).toEqual({ ch: 0, cmd: 176, p1: [1], mode: 1 });
    expect(zoneP1Label(autos)).toBe("1/33");
    const msgs = await sent({}, lua, 150, 0);
    expect(msgs.map((m) => m[2])).toEqual([1, 33]);
  });

  test("an explicit mode wins over the zone's auto mode", () => {
    const zones = [parseZone(`Z.fader("f",0,0,1,9,{res=14},function(self)`)];
    expect(zoneMidiAutos(zones, 0, { dx: 0, dy: 0, page: 0 }, 0).mode).toBe(0);
    expect(zoneMidiAutos(zones, 0, { dx: 0, dy: 0, page: 0 }, -1).mode).toBe(1);
    expect(zoneMidiAutos(zones, 0, { dx: 0, dy: 0, page: 0 }, 0).p1).toEqual([
      32,
    ]);
  });

  test("the channel wraps like the library", () => {
    const zones = [parseZone(`Z.fader("f",0,0,1,9,{},function(self)`)];
    expect(zoneMidiAutos(zones, 0, { dx: 7, dy: 3, page: 5 }).ch).toBe(1);
    expect(zoneMidiAutos(zones, 0, { dx: 7, dy: 3, page: 5 }).p1).toEqual([
      (32 + 7 * 16) % 128,
    ]);
  });
});

// Actions as the editor holds them: script plus the block type.
const act = (script, type = "single") => ({ script, information: { type } });
const ZONE = (name, x = 0) =>
  act(`Z.fader("${name}",${x},0,1,9,{},function(self)`, "composite_open");
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
    act("Z.start(self)"),
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
    ["knob", ["self:v()", "self:g()", "self:d()"]],
    ["xy", ["self:x()", "self:y()", "self:g()", "self:d()"]],
    ["button", ["self:v()", "self:step()", "self:g()"]],
  ])("%s", (kind, expected) => {
    expect(values(kind)).toEqual(expected);
  });

  test("each has a description", () => {
    for (const kind of ["fader", "button", "xy", "knob"]) {
      for (const e of zoneGetterSuggestions(kind)) {
        expect(e.info.length).toBeGreaterThan(5);
      }
    }
  });
});

describe("the gms mode argument", () => {
  test.each([
    ["self:gms(-1,-1,-1,-1)", undefined],
    ["self:gms(-1,176,-1,-1,1)", 1],
    ["self:gms(-1,176,-1,-1,3) self:gmrr(-1,-1,176,-1,{true,true},3)", 3],
    ["self:gms(-1,-1,f(1,2),-1,2)", 2],
    ["self:gms(-1,-1,-1,-1,m)", undefined],
    ["print(1)", undefined],
  ])("%s", (script, mode) => {
    expect(gmsModeArg(script)).toBe(mode);
  });
});

describe("global clashes (Library block)", () => {
  test.each([
    "Z=require('x')",
    "Z = 5",
    "  Z= {}",
    "function Z(x,y) return x end",
    "if a then Z=1 end",
  ])("assigns Z: %s", (script) => {
    expect(assignsGlobal(script, "Z")).toBe(true);
  });

  test.each([
    "local Z = 1",
    "x.Z = 1",
    "self:Z()",
    "if Z==1 then end",
    "ZZ = 1",
    "aZ = 1",
    "Z.fader('f',0,0,1,9,{},function(self)",
    "function x.Z() end",
  ])("doesn't assign Z: %s", (script) => {
    expect(assignsGlobal(script, "Z")).toBe(false);
  });

  test("where, once per place", () => {
    expect(
      globalClashes("Z", [
        { label: "Element 0 (Touch) Timer", script: "Z = 1" },
        { label: "Element 0 (Touch) Timer", script: "function Z() end" },
        { label: "Element 1 (System) Setup", script: "print(Z)" },
        { label: "Element 1 (System) Utility", script: "Z=nil" },
      ]),
    ).toEqual(["Element 0 (Touch) Timer", "Element 1 (System) Utility"]);
  });
});

describe("page folder", () => {
  const root = [
    { name: ".", type: "dir" },
    { name: "02", type: "dir" },
    { name: "03", type: "file" },
  ];

  test.each([
    ["/02/", true],
    ["/00/", false],
    ["/03/", false], // a file, not a folder
  ])("%s", (folder, expected) => {
    expect(hasPageFolder(root, folder)).toBe(expected);
  });
});

describe("Touch Utility brings Touch Tick to the touch element", () => {
  const elements = [
    { type: "touch", name: "zone surface" },
    { type: "system", name: "system" },
  ];

  test("the companion goes to the touch element's Timer", () => {
    expect(touchUtilityInformation.companions).toEqual([
      {
        eventType: "timer",
        short: "ztk",
        script: "Z.tick(self,{})",
        elementType: "touch",
      },
    ]);
    const [{ elementType }] = touchUtilityInformation.companions;
    expect(companionElement(elements, elements[1], elementType)).toBe(
      elements[0],
    );
  });

  test("without an element type, the block's own element", () => {
    expect(companionElement(elements, elements[0], undefined)).toBe(
      elements[0],
    );
    expect(companionElement(elements, elements[1], "button")).toBeUndefined();
  });
});
