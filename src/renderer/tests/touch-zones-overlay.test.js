import { test, expect, describe } from "vitest";
import {
  overlayZones,
  zoneRect,
} from "../main/grid-layout/grid-modules/overlays/touch-zones";
import {
  zonaCellCenterPct,
  zonaCellEdgePct,
} from "../main/grid-layout/grid-modules/devices/zona-grid";
import { parseZone } from "../config-blocks/touch/zone-parse";

let nextId = 0;
const act = (script, type = "single") => ({
  id: `a${nextId++}`,
  script,
  information: { type },
});
const zone = (line) => act(line, "composite_open");
const END = () => act("end)", "composite_close");
const MIDI = () => act("self:gms(-1,-1,-1,-1)");

const LIB = act(`local p=string.format("/%02X/",gpc())Z=require(p.."zona")`);
const F1 = zone(`Z.fader("f1",0,0,1,9,{},function(self)`);
const F1_MIDI = MIDI();
const B1 = zone(`Z.button("b1",1,0,2,2,{group=1},function(self)`);
const B1_IF = act("if self:g()==1 then", "composite_open");
const B1_MIDI = MIDI();
const P1 = zone(`Z.xy("p1",3,0,4,4,{},function(self)`);
const DUP = zone(`Z.knob("p1",5,5,3,3,{},function(self)`);
const BAD = act(`Z.fader("x",0,0,1,9,{},function(s)`); // not a zone line
const START = act("Z.start(self)");

const SETUP = [
  LIB,
  F1,
  F1_MIDI,
  END(),
  B1,
  B1_IF,
  B1_MIDI,
  act("end", "composite_close"),
  END(),
  P1,
  MIDI(),
  END(),
  DUP,
  MIDI(),
  END(),
  BAD,
  START,
];

describe("grid maths", () => {
  test("cell edges and centres in percent", () => {
    expect(zonaCellEdgePct(0)).toBe(0);
    expect(zonaCellEdgePct(9)).toBe(100);
    expect(zonaCellCenterPct(0)).toBeCloseTo(100 / 18);
  });

  test("a zone's rectangle", () => {
    const r = zoneRect(parseZone(`Z.xy("p",3,0,4,4,{},function(self)`));
    expect(r.left).toBeCloseTo(33.333);
    expect(r.top).toBe(0);
    expect(r.width).toBeCloseTo(44.444);
    expect(r.height).toBeCloseTo(44.444);
  });

  test("cells outside the grid are clipped", () => {
    const r = zoneRect(parseZone(`Z.fader("f",8,0,2,9,{},function(self)`));
    expect(r.left).toBeCloseTo(88.889);
    expect(r.width).toBeCloseTo(11.111);
    expect(r.height).toBe(100);
  });
});

describe("overlay zones", () => {
  test("zone lines in definition order, others skipped", () => {
    expect(overlayZones(SETUP).map((e) => e.zone.name)).toEqual([
      "f1",
      "b1",
      "p1",
      "p1",
    ]);
    expect(overlayZones(SETUP).map((e) => e.actionId)).toEqual([
      F1.id,
      B1.id,
      P1.id,
      DUP.id,
    ]);
  });

  test("group badge only for a group > 0", () => {
    expect(overlayZones(SETUP).map((e) => e.group)).toEqual([
      undefined,
      1,
      undefined,
      undefined,
    ]);
  });

  test("issues: a duplicate name is an error on both zones", () => {
    expect(overlayZones(SETUP).map((e) => e.issue)).toEqual([
      undefined,
      undefined,
      "error",
      "error",
    ]);
  });

  test("a zone problem shows as an error outline too", () => {
    const setup = [
      LIB,
      zone(`Z.fader("f9",8,0,2,9,{},function(self)`),
      END(),
      START,
    ];
    expect(overlayZones(setup)[0].issue).toBe("error");
  });

  test("order warnings name no zone: no outline", () => {
    const setup = [F1, END()]; // no Library, no Touch Start
    expect(overlayZones(setup)[0].issue).toBeUndefined();
  });
});

describe("highlight for a selection", () => {
  const highlighted = (ids) =>
    overlayZones(SETUP, ids)
      .filter((e) => e.highlighted)
      .map((e) => e.zone.name);

  test("the zone block itself", () => {
    expect(highlighted([B1.id])).toEqual(["b1"]);
  });

  test("a block in its body, also inside an If", () => {
    expect(highlighted([F1_MIDI.id])).toEqual(["f1"]);
    expect(highlighted([B1_MIDI.id])).toEqual(["b1"]);
    expect(highlighted([B1_IF.id])).toEqual(["b1"]);
  });

  test("several selected blocks", () => {
    expect(highlighted([F1_MIDI.id, P1.id])).toEqual(["f1", "p1"]);
  });

  test("nothing for blocks outside zones", () => {
    expect(highlighted([LIB.id, START.id])).toEqual([]);
    expect(highlighted([])).toEqual([]);
    expect(highlighted(["not-in-this-event"])).toEqual([]);
  });
});
