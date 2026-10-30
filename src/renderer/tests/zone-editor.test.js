import { initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, beforeAll } from "vitest";
import { createZonaVM, DOWN, UP } from "./zona-vm";
import {
  parseZone,
  parseZones,
  zonesToLua,
  zoneToLua,
} from "../config-blocks/touch/zone-parse";
import {
  surfaceIssues,
  validateSurface,
  zoneSendProblem,
} from "../config-blocks/touch/zone-validate";
import {
  zoneMidi,
  zoneMidiAt,
  zoneOutputLabel,
} from "../config-blocks/touch/zone-autos";
import {
  defaultZoneScript,
  uniqueZoneScript,
  withZoneType,
  zoneType,
  zoneTypeLabel,
  addedZone,
  placedCopy,
  zoneCssColor,
  zoneFaceSections,
} from "../config-blocks/touch/zone-blocks";
import { overlayZones } from "../main/grid-layout/grid-modules/overlays/touch-zones";

beforeAll(async () => {
  await initLuaFormatter();
});

const LIB = `_Z=gr("zona")`;

test.each([
  `_Z.fader(self,"f1",1,0,1,9,{mode="rel",sensitivity=0.5})`,
  `_Z.button(self,"b1",0,0,1,1,{bmo=3,group=2,col={255,128,0,1},cmd="cc"})`,
  `_Z.fader(self,"p1",0,0,9,9,{dir="xy",fingers=3,ch=3,num=7,rx=1})`,
])("a zone line reads and writes back unchanged: %s", (line) => {
  expect(zoneToLua(parseZone(line))).toBe(line);
});

test("a colour is written like Simple Color, and the old hex text still reads", () => {
  expect(
    parseZone(`_Z.button(self,"b",0,0,1,1,{col={-1,64,255,0.5}})`).opt.col,
  ).toBe("-1,64,255,0.5");
  const old = parseZone(`_Z.button(self,"b",0,0,1,1,{col="ff8000"})`);
  expect(zoneToLua(old)).toBe(
    `_Z.button(self,"b",0,0,1,1,{col={255,128,0,1}})`,
  );
  expect(
    issues([LIB, `_Z.button(self,"b",0,0,1,1,{col={300,0,0,1}})`]).length,
  ).toBe(1);
});

test("an old line with a body is not a zone line", () => {
  expect(parseZone(`_Z.fader("f1",0,0,1,9,{},function(self)`)).toBe(null);
  expect(parseZone("end)")).toBe(null);
});

test("an option the editor doesn't know is kept as written", () => {
  const line = `_Z.fader(self,"f",0,0,1,9,{glow=2,shape={1,2},tag="x"})`;
  expect(zoneToLua(parseZone(line))).toBe(line);
});

test("options at their default are left out of the written line", () => {
  const zone = {
    name: "b",
    kind: "button",
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    opt: {
      bmo: 1,
      msg: "midi",
      cmd: "note",
      ch: -1,
      num: -1,
      rx: 0,
    },
  };
  expect(zoneToLua(zone)).toBe(`_Z.button(self,"b",0,0,1,1,{bmo=1})`);
});

// A touch Setup as [script], with its zones parsed the way the overlay does.
function issues(scripts) {
  const zones = scripts.map(parseZone).filter((e) => e !== null);
  return validateSurface(zones);
}
const fader = (name, x, opt = "") =>
  `_Z.fader(self,"${name}",${x},0,1,9,{${opt}})`;

test("a complete Setup has no issues", () => {
  expect(issues([LIB, fader("a", 0), fader("b", 1)])).toEqual([]);
});

test("two zones with the same name are an error", () => {
  expect(issues([LIB, fader("a", 0), fader("a", 1)])).toEqual([
    { zone: "a", level: "error", message: `Another zone is also named "a"` },
  ]);
});

test("an option out of range is an error on its zone", () => {
  expect(issues([LIB, fader("a", 0, "sensitivity=20")])).toEqual([
    { zone: "a", level: "error", message: "Use 0.01 to 10" },
  ]);
});

test("the CC and channel the editor shows are what the library sends", async () => {
  // module at 1,2 on page 1: channel (2*4+1)%16 = 9, CCs from 32+16
  const lines = [
    `_Z.fader(self,"f1",0,0,1,9,{})`,
    `_Z.button(self,"b1",1,0,2,2,{})`,
    `_Z.fader(self,"p1",3,0,4,4,{dir="xy"})`,
    `_Z.fader(self,"f2",8,0,1,9,{})`,
  ];
  const zones = lines.map(parseZone);
  const vm = await createZonaVM({ gmx: 1, gmy: 2, gpc: 1 });
  vm.setup(lines.join(" "));
  // a touch in each zone, and the first message it sends
  const sent = [
    [50, 0],
    [200, 100],
    [796, 0],
    [960, 0],
  ].map(([x, y]) => {
    vm.clear();
    vm.touch([0, DOWN, x, y], [0, UP, x, y]);
    return vm.midi()[0];
  });
  const shown = zones.map((_, i) =>
    zoneMidi(zones, i, { dx: 1, dy: 2, page: 1 }),
  );
  expect(sent).toEqual(
    shown.map((m) => [m.ch, m.type === "note" ? 144 : 176, m.nums[0], 127]),
  );
  expect(shown.map((m) => m.nums)).toEqual([[48], [49], [50, 51], [52]]);
});

test("the gamepad axes and buttons the editor shows are what the library sends", async () => {
  const lines = [
    `_Z.fader(self,"f1",0,0,1,9,{msg="pad"})`,
    `_Z.button(self,"b1",1,0,2,2,{msg="pad"})`,
    `_Z.fader(self,"p1",3,0,4,4,{dir="xy",msg="pad"})`,
    `_Z.fader(self,"f2",8,0,1,9,{msg="pad"})`,
  ];
  const zones = lines.map(parseZone);
  const vm = await createZonaVM();
  vm.setup(lines.join(" "));
  // a touch in each zone, and the targets it sends
  const sent = [
    [50, 0],
    [200, 100],
    [796, 0],
    [960, 0],
  ].map(([x, y]) => {
    vm.clear();
    vm.touch([0, DOWN, x, y]);
    const press = [...vm.calls("ggms"), ...vm.calls("ggbs")];
    vm.touch([0, UP, x, y]);
    return press.map((e) => e.args[0]);
  });
  const shown = zones.map((_, i) =>
    zoneMidi(zones, i, { dx: 0, dy: 0, page: 0 }),
  );
  expect(sent).toEqual(shown.map((m) => m.nums));
  expect(sent).toEqual([[0], [0], [1, 2], [3]]);
  expect(zones.map((z, i) => zoneOutputLabel(z, shown[i]))).toEqual([
    "Gamepad X",
    "Gamepad button 0",
    "Gamepad Y, Z",
    "Gamepad RX",
  ]);
});

test("zone lines become rectangles on the overlay, in order", () => {
  const setup = [
    LIB,
    `_Z.fader(self,"f1",0,0,1,9,{})`,
    `_Z.fader(self,"p1",3,0,4,4,{dir="xy"})`,
  ].map((script, i) => ({ id: `a${i}`, script }));
  // percent of the surface, rounded
  expect(
    overlayZones(setup).map(({ zone, rect }) => [
      zone.name,
      ...[rect.left, rect.top, rect.width, rect.height].map(Math.round),
    ]),
  ).toEqual([
    ["f1", 0, 0, 11, 100],
    ["p1", 33, 0, 44, 44],
  ]);
});

// The face's option keys of a zone line, in display order.
const fields = (line) =>
  zoneFaceSections(parseZone(line)).flatMap((e) => e.options.map((o) => o.key));

test("a mouse zone's face shows only the fields mouse uses", () => {
  expect(fields(`_Z.fader(self,"p1",0,0,4,4,{dir="xy",msg="mouse"})`)).toEqual([
    "dir",
    "msg",
    "tap",
    "col",
    "sensitivity",
    "grab",
  ]);
  expect(fields(`_Z.button(self,"b1",0,0,2,2,{msg="mouse"})`)).toEqual([
    "msg",
    "num",
    "col",
    "bmo",
    "group",
    "grab",
  ]);
});

test("a gamepad zone's face shows its target and the value behaviour", () => {
  expect(fields(`_Z.fader(self,"f1",0,0,1,9,{msg="pad"})`)).toEqual([
    "dir",
    "msg",
    "num",
    "col",
    "mode",
    "sensitivity",
    "spring",
    "grab",
  ]);
});

test("the header names the mouse output", () => {
  const label = (line) => zoneOutputLabel(parseZone(line), null);
  expect(label(`_Z.fader(self,"p1",0,0,4,4,{dir="xy",msg="mouse"})`)).toBe(
    "Mouse",
  );
  expect(label(`_Z.fader(self,"f1",0,0,1,9,{msg="mouse"})`)).toBe(
    "Mouse wheel",
  );
  expect(label(`_Z.button(self,"b1",0,0,2,2,{msg="mouse"})`)).toBe(
    "Mouse Left",
  );
  expect(label(`_Z.button(self,"b1",0,0,2,2,{msg="mouse",num=2})`)).toBe(
    "Mouse Right",
  );
});

test("an XY pad is a fader with the XY Pad direction", () => {
  const line = `_Z.fader(self,"p1",0,0,4,4,{dir="xy"})`;
  expect(fields(line)).toContain("fingers");
  expect(fields(`_Z.fader(self,"f1",0,0,1,9,{})`)).not.toContain("fingers");
  // an XY pad sends CCs only, 7 or 14 bit
  expect(
    issues([LIB, `_Z.fader(self,"p",0,0,4,4,{dir="xy",cmd="pb"})`]),
  ).toEqual([{ zone: "p", level: "error", message: "Use one of cc, cc14" }]);
});

test("a new Touch Zone is a 5x5 XY pad and a new button is 2x2", () => {
  expect(defaultZoneScript("fader", [])).toBe(
    `_Z.fader(self,"f1",0,0,5,5,{dir="xy"})`,
  );
  expect(defaultZoneScript("button", [])).toBe(
    `_Z.button(self,"b1",0,0,2,2,{})`,
  );
});

test("the Type select turns a fader into a button and back", () => {
  const pad = parseZone(
    `_Z.fader(self,"f1",0,0,5,5,{dir="xy",tap=0,cmd="cc14",ch=2})`,
  );
  expect(zoneType(pad)).toBe("xy");
  expect(zoneTypeLabel(pad)).toBe("XY Pad");
  const button = withZoneType(pad, "button", [
    `_Z.button(self,"b1",0,0,1,1,{})`,
  ]);
  // fader-only options go, the shared ones stay, a default name follows the kind
  expect(zoneToLua(button)).toBe(
    `_Z.button(self,"b2",0,0,5,5,{cmd="cc14",ch=2})`,
  );
  expect(zoneType(button)).toBe("button");
  const back = withZoneType(button, "h", []);
  expect(zoneToLua(back)).toBe(
    `_Z.fader(self,"f1",0,0,5,5,{dir="h",cmd="cc14",ch=2})`,
  );
  // a note a fader can't send is dropped on the way
  const note = parseZone(`_Z.button(self,"b1",0,0,1,1,{cmd="note",bmo=1})`);
  expect(zoneToLua(withZoneType(note, "v", []))).toBe(
    `_Z.fader(self,"f1",0,0,1,1,{})`,
  );
});

const TWO = `_Z.fader(self,"f1",0,0,5,5,{dir="xy"}) _Z.button(self,"b1",5,0,2,2,{})`;

test("one block defines several zones, read and written in order", () => {
  const zones = parseZones(TWO);
  expect(zones.map((e) => [e.name, e.kind])).toEqual([
    ["f1", "fader"],
    ["b1", "button"],
  ]);
  expect(zonesToLua(zones)).toBe(TWO);
  // compressed scripts carry no space between the lines
  expect(parseZones(TWO.replace(") _Z", ")_Z")).length).toBe(2);
  expect(parseZones(`${TWO} end`)).toBe(null);
  expect(parseZones("")).toBe(null);
});

test("zone names are unique across a block and the Setup", () => {
  const dup = `_Z.fader(self,"a",0,0,1,1,{}) _Z.fader(self,"a",1,0,1,1,{})`;
  expect(surfaceIssues([dup]).map((e) => e.message)).toEqual([
    `Another zone is also named "a"`,
  ]);
  expect(zoneSendProblem(dup, [dup])).toBe(`Another zone is also named "a"`);
  expect(zoneSendProblem(TWO, [TWO])).toBeUndefined();
  expect(zoneSendProblem(TWO, [TWO, `_Z.fader(self,"b1",0,0,1,1,{})`])).toBe(
    `Another zone is also named "b1"`,
  );
  // a pasted block renames each zone that collides
  expect(uniqueZoneScript(TWO, [TWO])).toBe(
    `_Z.fader(self,"f2",0,0,5,5,{dir="xy"}) _Z.button(self,"b2",5,0,2,2,{})`,
  );
});

test("the overlay draws every zone of a block and the autos count them", () => {
  const setup = [{ id: "a", script: TWO }];
  expect(
    overlayZones(setup).map((e) => [e.actionId, e.index, e.zone.name]),
  ).toEqual([
    ["a", 0, "f1"],
    ["a", 1, "b1"],
  ]);
  const pos = { dx: 0, dy: 0, page: 0 };
  // an XY pad takes two CC slots, so the button after it is on the third
  expect(zoneMidiAt([TWO], 0, pos, 0).nums).toEqual([32, 33]);
  expect(zoneMidiAt([TWO], 0, pos, 1).type).toBe("note");
  expect(zoneMidiAt([TWO], 0, pos, 1).nums).toEqual([34]);
  expect(zoneMidiAt([TWO], 0, pos, 2)).toBeUndefined();
});

test("a zone's preview colour is its col, with the module's colour for -1", () => {
  const auto = { red: 10, green: 20, blue: 30 };
  expect(zoneCssColor({ opt: { col: "255,128,0,1" } }, auto)).toBe(
    "rgb(255,128,0)",
  );
  expect(zoneCssColor({ opt: { col: "-1,64,255,0.5" } }, auto)).toBe(
    "rgb(10,64,255)",
  );
  expect(zoneCssColor({ opt: {} }, auto)).toBe("rgb(10,20,30)");
  expect(zoneCssColor({ opt: {} })).toBeUndefined();
});

test("Add Zone copies the selected zone to its right, else below, else a 1x1 button", () => {
  const z = (name, x, y, w, h, opt = {}) =>
    parseZone(`_Z.fader(self,"${name}",${x},${y},${w},${h},{dir="xy"})`) ?? {
      name,
      kind: "fader",
      x,
      y,
      w,
      h,
      opt,
    };
  const pad = z("f1", 0, 0, 4, 4);
  const right = addedZone(pad, [pad]);
  expect([right.name, right.x, right.y, right.w, right.h]).toEqual([
    "f2",
    4,
    0,
    4,
    4,
  ]);
  expect(right.opt).toEqual({ dir: "xy" });
  // no room on the right: below
  const wide = z("f1", 0, 0, 6, 4);
  const below = addedZone(wide, [wide]);
  expect([below.x, below.y, below.w, below.h]).toEqual([0, 4, 6, 4]);
  // right taken by another zone: below
  const left = z("f1", 0, 0, 4, 4);
  const blocker = z("g", 4, 0, 1, 1);
  expect(addedZone(left, [left, blocker]).y).toBe(4);
  // no room for a copy: a 1x1 button on the first free cell
  const full = z("f1", 0, 0, 9, 8);
  const button = addedZone(full, [full]);
  expect([button.kind, button.x, button.y, button.w, button.h]).toEqual([
    "button",
    0,
    8,
    1,
    1,
  ]);
  expect(button.name).toBe("b1");
  // nothing free at all
  const all = z("f1", 0, 0, 9, 9);
  expect(addedZone(all, [all])).toBeUndefined();
});

test("a pasted zone goes beside the focused one, with no 1x1 fallback", () => {
  const z = (name, x, y, w, h) =>
    parseZone(`_Z.fader(self,"${name}",${x},${y},${w},${h},{dir="xy"})`);
  const copied = z("f9", 0, 0, 3, 3);
  const anchor = z("f1", 3, 3, 3, 3);
  // the copy keeps its size and options, takes a free name, goes to the right
  const right = placedCopy(copied, anchor, [anchor]);
  expect([right.name, right.x, right.y, right.w, right.h]).toEqual([
    "f2",
    6,
    3,
    3,
    3,
  ]);
  // no room on the right: below
  const wideAnchor = z("f1", 5, 0, 4, 3);
  const below = placedCopy(copied, wideAnchor, [wideAnchor]);
  expect([below.x, below.y]).toEqual([5, 3]);
  // no room beside it: nothing, the editor logs a message
  const tall = z("f1", 0, 0, 9, 9);
  expect(placedCopy(copied, tall, [tall])).toBeUndefined();
});
