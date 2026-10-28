import { initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, beforeAll } from "vitest";
import { createZonaVM, DOWN, UP } from "./zona-vm";
import {
  parseZone,
  zoneToLua,
  ZONE_END_SCRIPT,
  ZONE_START_SCRIPT,
} from "../config-blocks/touch/zone-parse";
import { validateSurface } from "../config-blocks/touch/zone-validate";
import { zoneMidi } from "../config-blocks/touch/zone-autos";
import { overlayZones } from "../main/grid-layout/grid-modules/overlays/touch-zones";

beforeAll(async () => {
  await initLuaFormatter();
});

const LIB = `local p=string.format("/%02X/",gpc())local function r(n)local ok,m=pcall(require,p..n)if ok then return m end print(p..n..".lua missing")end _Z=r("zona")`;

test.each([
  `_Z.fader("f1",1,0,1,9,{res=10,mode="glide",speed=0.5,ease=0.25},function(self)`,
  `_Z.button("b1",0,0,1,1,{bmo=3,group=2,col="ff8000",msg="cc"},function(self)`,
  `_Z.xy("p1",0,0,9,9,{fingers=3,ch=3,num=7,rx=1},function(self)`,
])("a zone line reads and writes back unchanged: %s", (line) => {
  expect(zoneToLua(parseZone(line))).toBe(line);
});

test("an option the editor doesn't know is kept as written", () => {
  const line = `_Z.fader("f",0,0,1,9,{res=8,glow=2,shape={1,2},tag="x"},function(self)`;
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
    opt: { res: 7, led: 1, bmo: 1, msg: "note", ch: -1, num: -1, rx: 0 },
  };
  expect(zoneToLua(zone)).toBe(`_Z.button("b",0,0,1,1,{bmo=1},function(self)`);
});

// A touch Setup as [script], with its zones parsed the way the overlay does.
function issues(scripts) {
  const zones = scripts.map(parseZone).filter((e) => e !== null);
  return validateSurface(zones, {
    actions: scripts.map((script) => ({ script })),
  });
}
const fader = (name, x, opt = "") => [
  `_Z.fader("${name}",${x},0,1,9,{${opt}},function(self)`,
  ZONE_END_SCRIPT,
];

test("a complete Setup has no issues", () => {
  expect(
    issues([LIB, ...fader("a", 0), ...fader("b", 1), ZONE_START_SCRIPT]),
  ).toEqual([]);
});

test("two zones with the same name are an error", () => {
  expect(
    issues([LIB, ...fader("a", 0), ...fader("a", 1), ZONE_START_SCRIPT]),
  ).toEqual([
    { zone: "a", level: "error", message: `Another zone is also named "a"` },
  ]);
});

test("an option out of range is an error on its zone", () => {
  expect(issues([LIB, ...fader("a", 0, "res=6"), ZONE_START_SCRIPT])).toEqual([
    { zone: "a", level: "error", message: "Use 7 to 14" },
  ]);
});

test("the CC and channel the editor shows are what the library sends", async () => {
  // module at 1,2 on page 1: channel (2*4+1)%16 = 9, CCs from 32+16
  const lines = [
    `_Z.fader("f1",0,0,1,9,{},function(self)`,
    `_Z.button("b1",1,0,2,2,{},function(self)`,
    `_Z.xy("p1",3,0,4,4,{},function(self)`,
    `_Z.fader("f2",8,0,1,9,{},function(self)`,
  ];
  const zones = lines.map(parseZone);
  const vm = await createZonaVM({ gmx: 1, gmy: 2, gpc: 1 });
  vm.setup(`${lines.map((l) => `${l} end)`).join(" ")} _Z.start(self)`);
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

test("zone lines become rectangles on the overlay, in order", () => {
  const setup = [
    [LIB],
    [`_Z.fader("f1",0,0,1,9,{},function(self)`, "composite_open"],
    ["end)", "composite_close"],
    [`_Z.xy("p1",3,0,4,4,{},function(self)`, "composite_open"],
    ["end)", "composite_close"],
    [ZONE_START_SCRIPT],
  ].map(([script, type = "single"], i) => ({
    id: `a${i}`,
    script,
    information: { type },
  }));
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
