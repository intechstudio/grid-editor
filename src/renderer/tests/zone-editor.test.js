import { initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, beforeAll } from "vitest";
import { createZonaVM, DOWN, UP } from "./zona-vm";
import { parseZone, zoneToLua } from "../config-blocks/touch/zone-parse";
import { validateSurface } from "../config-blocks/touch/zone-validate";
import { zoneMidi, zoneOutputLabel } from "../config-blocks/touch/zone-autos";
import { zoneFaceSections } from "../config-blocks/touch/zone-blocks";
import { overlayZones } from "../main/grid-layout/grid-modules/overlays/touch-zones";

beforeAll(async () => {
  await initLuaFormatter();
});

const LIB = `_Z=gr("zona")`;

test.each([
  `_Z.fader(self,"f1",1,0,1,9,{res=10,mode="glide",speed=0.5,ease=0.25})`,
  `_Z.button(self,"b1",0,0,1,1,{bmo=3,group=2,col="ff8000",cmd="cc"})`,
  `_Z.xy(self,"p1",0,0,9,9,{fingers=3,ch=3,num=7,rx=1})`,
])("a zone line reads and writes back unchanged: %s", (line) => {
  expect(zoneToLua(parseZone(line))).toBe(line);
});

test("an old line with a body is not a zone line", () => {
  expect(parseZone(`_Z.fader("f1",0,0,1,9,{},function(self)`)).toBe(null);
  expect(parseZone("end)")).toBe(null);
});

test("an option the editor doesn't know is kept as written", () => {
  const line = `_Z.fader(self,"f",0,0,1,9,{res=8,glow=2,shape={1,2},tag="x"})`;
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
      res: 7,
      led: 1,
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
  expect(issues([LIB, fader("a", 0, "res=6")])).toEqual([
    { zone: "a", level: "error", message: "Use 7 to 14" },
  ]);
});

test("the CC and channel the editor shows are what the library sends", async () => {
  // module at 1,2 on page 1: channel (2*4+1)%16 = 9, CCs from 32+16
  const lines = [
    `_Z.fader(self,"f1",0,0,1,9,{})`,
    `_Z.button(self,"b1",1,0,2,2,{})`,
    `_Z.xy(self,"p1",3,0,4,4,{})`,
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
    `_Z.xy(self,"p1",3,0,4,4,{msg="pad"})`,
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
    `_Z.xy(self,"p1",3,0,4,4,{})`,
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
  expect(fields(`_Z.xy(self,"p1",0,0,4,4,{msg="mouse"})`)).toEqual([
    "msg",
    "tap",
    "led",
    "col",
    "speed",
    "grab",
  ]);
  expect(fields(`_Z.button(self,"b1",0,0,2,2,{msg="mouse"})`)).toEqual([
    "msg",
    "num",
    "led",
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
    "led",
    "col",
    "mode",
    "speed",
    "ease",
    "spring",
    "grab",
  ]);
});

test("the header names the mouse output", () => {
  const label = (line) => zoneOutputLabel(parseZone(line), null);
  expect(label(`_Z.xy(self,"p1",0,0,4,4,{msg="mouse"})`)).toBe("Mouse");
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
