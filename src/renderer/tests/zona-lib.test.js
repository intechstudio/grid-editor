import { initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll } from "vitest";
import { createZonaVM, DEFAULT_COLOR, DOWN, MOVE, UP } from "./zona-vm";
import {
  zoneDefaults,
  zoneGroupDefaults,
  zoneKinds,
  zoneSens,
  zoneTickDefaults,
} from "../config-blocks/touch/zone-model";
import { SettingsButton } from "../config-blocks/SettingsButton";

beforeAll(async () => {
  await initLuaFormatter();
});

const MIDI = "function(self) self:gms(-1,-1,-1,-1) end";

// cells 2-3 x 0-1: raw x 228-455, y 0-227
const button = `Z.button("b",2,0,2,2,{},${MIDI})`;

// The firmware's gms takes exactly 4 integer arguments (grid_lua_api.c).
function wire(vm) {
  for (const call of vm.calls("gms")) {
    expect(call.n).toBe(4);
    expect(call.args.every(Number.isInteger)).toBe(true);
  }
  return vm.midi();
}

async function zones(code) {
  const vm = await createZonaVM();
  vm.setup(`${code} Z.start(self)`);
  vm.clear();
  return vm;
}

describe("Z.start", () => {
  test("sets the full touch range and the touch callback", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.fader("f",0,0,1,9,{},${MIDI}) Z.start(self)`);
    expect(vm.calls("txma").map((e) => e.args)).toEqual([[1023]]);
    expect(vm.calls("tyma").map((e) => e.args)).toEqual([[1023]]);
    expect(vm.run("return el.touch_cb == Z.touch")).toBe(true);
  });

  test("running Setup again starts the zone list over", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.setup(`Z.fader("f",0,0,1,9,{},${MIDI}) Z.start(self)`);
    expect(vm.run("return #Z.zs")).toBe(1);
  });

  test("a Setup with no zones leaves none active", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.setup("Z.start(self)");
    vm.touch([0, DOWN, 50, 0]);
    expect(wire(vm)).toEqual([]);
  });

  test("Z.start releases held zones and forgets contacts", async () => {
    const vm = await zones(button);
    vm.touch([0, DOWN, 300, 100]);
    vm.clear();
    vm.setup(`${button} Z.start(self)`);
    expect(wire(vm)).toEqual([[0, 144, 32, 0]]);
    vm.clear();
    vm.touch([0, MOVE, 310, 100], [0, UP, 310, 100]);
    expect(wire(vm)).toEqual([]);
  });
});

describe("fader", () => {
  test("a 1x9 fader sends CC 0-127, bottom = min", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 0], [0, UP, 50, 0]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 0],
      [0, 176, 32, 127],
    ]);
  });

  test("autos follow module position, page and CC slot", async () => {
    const vm = await createZonaVM({ gmx: 1, gmy: 2, gpc: 1 });
    vm.setup(
      `Z.fader("a",0,0,1,9,{},${MIDI}) Z.fader("b",1,0,1,9,{},${MIDI}) Z.start(self)`,
    );
    vm.clear();
    vm.touch([0, DOWN, 150, 0]);
    // ch (2*4+1)%16, p1 32+1*16+slot 1
    expect(wire(vm)).toEqual([[9, 176, 49, 127]]);
  });

  test("duplicates are dropped per (ch,cmd,p1)", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{},function(self) self:gms(-1,-1,-1,-1) self:gms(-1,144,60,self:g()*127) end)`,
    );
    vm.touch([0, DOWN, 50, 1023]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 0],
      [0, 144, 60, 127],
    ]);
    vm.clear();
    vm.touch([0, MOVE, 50, 0], [0, MOVE, 60, 0]);
    expect(wire(vm)).toEqual([[0, 176, 32, 127]]);
    vm.clear();
    vm.touch([0, UP, 60, 0]);
    expect(wire(vm)).toEqual([[0, 144, 60, 0]]);
  });

  test("the value clamps at the edge the finger left", async () => {
    // 1x3 fader on rows 3-5: raw y 342-682
    const vm = await zones(`Z.fader("f",0,3,1,3,{},${MIDI})`);
    vm.touch([0, DOWN, 50, 512]);
    vm.touch([0, MOVE, 500, 900]); // below and to the right
    vm.touch([0, MOVE, 50, 100]); // above
    vm.touch([0, MOVE, 50, 20]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 64],
      [0, 176, 32, 0],
      [0, 176, 32, 127],
    ]);
  });

  test("dir=h reads left to right", async () => {
    const vm = await zones(`Z.fader("f",0,0,9,1,{dir="h"},${MIDI})`);
    vm.touch([0, DOWN, 1023, 50], [0, MOVE, 0, 50]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 127],
      [0, 176, 32, 0],
    ]);
  });

  test("min and max set the range", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{min=10,max=20},${MIDI})`);
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 0]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 10],
      [0, 176, 32, 20],
    ]);
  });

  test("res=14 spans 0-16383 as a 14-bit CC pair", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{res=14},${MIDI})`);
    expect(vm.run("return Z.zs[1]:get_auto_mode()")).toBe(1);
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 0]);
    expect(vm.run("return Z.zs[1]:v()")).toBe(16383);
    // auto p1 32 % 32 = 0: MSB on CC 0, LSB on CC 32, as the element method
    expect(wire(vm)).toEqual([
      [0, 176, 0, 0],
      [0, 176, 32, 0],
      [0, 176, 0, 127],
      [0, 176, 32, 127],
    ]);
  });

  test("res=10 gives 1024 steps over the full 14-bit range", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{res=10,sens="h"},function(self) _rec("v",1,self:v()) end)`,
    );
    vm.touch([0, DOWN, 50, 1023]);
    for (let y = 1022; y >= 0; y--) {
      vm.touch([0, MOVE, 50, y]);
    }
    const values = vm.calls("v").map((e) => e.args[0]);
    expect(values[0]).toBe(0);
    expect(values.at(-1)).toBe(16383);
    expect(new Set(values).size).toBeLessThanOrEqual(1024);
    expect(values.every(Number.isInteger)).toBe(true);
    // every value sits on one of the 2^10 steps
    expect(values[1]).toBe(16);
    expect(
      values.every(
        (v) =>
          v === Math.round((Math.round((v * 1023) / 16383) * 16383) / 1023),
      ),
    ).toBe(true);
  });

  test("res=8 gives exactly 256 values", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{res=8,sens="h"},function(self) _rec("v",1,self:v()) end)`,
    );
    vm.touch([0, DOWN, 50, 1023]);
    for (let y = 1022; y >= 0; y--) {
      vm.touch([0, MOVE, 50, y]);
    }
    const values = vm.calls("v").map((e) => e.args[0]);
    expect(new Set(values).size).toBe(256);
    expect(values.at(-1)).toBe(16383);
  });

  test("an explicit mode 0 sends 7-bit", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{max=127,res=14},function(self) self:gms(-1,-1,-1,-1,0) end)`,
    );
    expect(vm.run("return Z.zs[1]:get_auto_mode()")).toBe(1);
    vm.touch([0, DOWN, 50, 0]);
    expect(wire(vm)).toEqual([[0, 176, 32, 127]]);
  });
});

describe("xy", () => {
  test("x and y go out on neighbouring CCs", async () => {
    // cells 4-8 x 0-4: raw x 456-1023, y 0-568
    const vm = await zones(`Z.xy("p",4,0,5,5,{},${MIDI})`);
    vm.touch([0, DOWN, 1023, 0], [0, MOVE, 456, 568], [0, UP, 456, 568]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 127],
      [0, 176, 33, 127],
      [0, 176, 32, 0],
      [0, 176, 33, 0],
    ]);
  });
});

describe("CC slots", () => {
  test("an xy pad takes two slots, the next zone gets the third", async () => {
    const vm = await zones(
      `Z.xy("p",4,0,5,5,{},${MIDI}) Z.fader("f",0,0,1,9,{},${MIDI})`,
    );
    vm.touch([0, DOWN, 1023, 0], [1, DOWN, 50, 0]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 127],
      [0, 176, 33, 127],
      [0, 176, 34, 127],
    ]);
    expect(vm.run("return Z.zs[2]:ind()")).toBe(1);
  });
});

describe("button", () => {
  test("note 127 on down, 0 on up", async () => {
    const vm = await zones(button);
    vm.touch([0, DOWN, 300, 100], [0, MOVE, 310, 120], [0, UP, 310, 120]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
    ]);
  });

  test("leaving releases, re-entry does nothing until the next down", async () => {
    const vm = await zones(button);
    vm.touch([0, DOWN, 300, 100], [0, MOVE, 300, 500], [0, MOVE, 300, 100]);
    vm.touch([0, UP, 300, 100]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
    ]);
    vm.clear();
    vm.touch([0, DOWN, 300, 100]);
    expect(wire(vm)).toEqual([[0, 144, 32, 127]]);
  });

  test("a tap is a press and a release", async () => {
    const vm = await zones(button);
    vm.touch([0, 9, 300, 100]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
    ]);
  });

  test.each([3, 7])("evt %i ends the contact", async (evt) => {
    const vm = await zones(button);
    vm.touch([0, DOWN, 300, 100], [0, evt, 300, 100]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
    ]);
  });

  test("a message without an off value goes out on every press", async () => {
    const vm = await zones(
      `Z.button("b",2,0,2,2,{},function(self) if self:g()==1 then self:gms(0,192,5,0) end end)`,
    );
    vm.touch([0, 9, 300, 100], [0, 9, 300, 100], [0, 9, 300, 100]);
    expect(wire(vm)).toEqual([
      [0, 192, 5, 0],
      [0, 192, 5, 0],
      [0, 192, 5, 0],
    ]);
  });

  test("leave=0 keeps the button held outside the zone", async () => {
    const vm = await zones(`Z.button("b",2,0,2,2,{leave=0},${MIDI})`);
    vm.touch([0, DOWN, 300, 100], [0, MOVE, 300, 500]);
    expect(wire(vm)).toEqual([[0, 144, 32, 127]]);
  });
});

describe("contacts", () => {
  test("two contacts in two zones work independently", async () => {
    const vm = await zones(
      `Z.fader("a",0,0,1,9,{},${MIDI}) Z.fader("b",1,0,1,9,{},${MIDI})`,
    );
    vm.touch([0, DOWN, 50, 1023], [1, DOWN, 150, 0]);
    vm.touch([0, MOVE, 50, 0], [1, MOVE, 50, 0]); // b leaves sideways, stays at 127
    vm.touch([1, UP, 150, 0], [0, MOVE, 50, 1023]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 0],
      [0, 176, 33, 127],
      [0, 176, 32, 127],
      [0, 176, 32, 0],
    ]);
  });

  test("two contacts in one zone: press on the first, release on the last", async () => {
    const vm = await zones(button);
    vm.touch([0, DOWN, 300, 100], [1, DOWN, 400, 200]);
    vm.touch([0, UP, 300, 100]);
    expect(wire(vm)).toEqual([[0, 144, 32, 127]]);
    vm.touch([1, UP, 400, 200]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
    ]);
  });

  test("leave=1: one contact leaving keeps the zone held by the other", async () => {
    const vm = await zones(button);
    vm.touch([0, DOWN, 300, 100], [1, DOWN, 400, 200]);
    vm.touch([0, MOVE, 300, 500], [0, MOVE, 300, 100]);
    expect(wire(vm)).toEqual([[0, 144, 32, 127]]);
    vm.touch([1, UP, 400, 200], [0, UP, 300, 100]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
    ]);
  });

  test("a down on a slot still owned releases the old zone first", async () => {
    const vm = await zones(
      `Z.button("a",0,0,1,1,{},${MIDI}) Z.button("b",2,0,2,2,{},${MIDI})`,
    );
    vm.touch([0, DOWN, 50, 50], [0, DOWN, 300, 100]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
      [0, 144, 33, 127],
    ]);
  });

  test("a contact landing on an empty cell is not owned", async () => {
    const vm = await zones(`Z.fader("a",0,0,1,9,{},${MIDI})`);
    vm.touch([2, DOWN, 600, 600], [2, MOVE, 50, 600], [2, UP, 50, 600]);
    expect(wire(vm)).toEqual([]);
  });

  test("the body sees the zone as self, with src and getters", async () => {
    const vm = await zones(
      `Z.fader("a",0,0,1,9,{}) Z.fader("b",1,0,1,9,{},function(self) _rec("body",4,self:src(),self:v(),self:g(),self:ind()) end)`,
    );
    vm.touch([0, DOWN, 150, 0], [0, UP, 150, 0]);
    expect(vm.calls("body").map((e) => e.args)).toEqual([
      ["v", 127, 1, 1],
      ["g", 127, 1, 1],
      ["g", 127, 0, 1],
    ]);
  });

  test("Z.raw sees every touch before routing", async () => {
    const vm = await zones(
      `Z.raw=function(self,id,evt,x,y) _rec("raw",4,id,evt,x,y) end`,
    );
    vm.touch([3, DOWN, 1, 2]);
    expect(vm.calls("raw").map((e) => e.args)).toEqual([[3, DOWN, 1, 2]]);
  });
});

describe("defaults", () => {
  test("the library defaults match zone-model.ts", async () => {
    const vm = await createZonaVM();
    expect(vm.run("return Z.def")).toEqual(zoneDefaults);
    expect(vm.run("return Z.kind")).toEqual(zoneKinds);
    expect(vm.run("return Z.gdef")).toEqual(zoneGroupDefaults);
    expect(vm.run("return Z.sens")).toEqual(zoneSens);
    expect(vm.run("return Z.tdef")).toEqual(zoneTickDefaults);
  });

  test("kind presets apply over the defaults, options over both", async () => {
    const vm = await zones(`Z.button("b",0,0,1,1,{res=8})`);
    // z.o reads through to the kind preset and Z.def
    expect(
      vm.run(
        "local o,r=Z.zs[1].o,{} for k in pairs(Z.def) do r[k]=o[k] end return r",
      ),
    ).toEqual({
      ...zoneDefaults,
      ...zoneKinds.button,
      res: 8,
    });
  });
});

// Records every body run as [src, auto value, d, index].
const REC =
  'function(self) _rec("run",4,self:src(),self:get_auto_value(),self:d(),self:ind()) end';
const runs = (vm) => vm.calls("run").map((e) => e.args);
const values = (vm, src = "v") =>
  runs(vm)
    .filter((e) => e[0] === src)
    .map((e) => e[1]);

describe("modes", () => {
  test("rel: the first touch changes nothing, drags move by speed", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{mode="rel"},${REC})`);
    vm.touch([0, DOWN, 50, 512]);
    expect(values(vm)).toEqual([]);
    vm.touch([0, MOVE, 50, 0], [0, MOVE, 50, 1023]);
    expect(values(vm)).toEqual([64, 0]);
  });

  test("rel: speed scales the drag", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{mode="rel",speed=0.5},${REC})`,
    );
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 0]);
    expect(values(vm)).toEqual([64]);
  });

  test("glide: the value follows the target on each tick", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{mode="glide"},${REC})`);
    vm.touch([0, DOWN, 50, 0]);
    expect(values(vm)).toEqual([]);
    vm.tick();
    expect(values(vm)).toEqual([3]);
    vm.tick(48);
    expect(values(vm).at(-1)).toBeLessThan(127);
    vm.tick();
    expect(values(vm).at(-1)).toBe(127);
    const n = runs(vm).length;
    vm.tick(5);
    expect(runs(vm).length).toBe(n);
  });

  test("glide: ease adds a share of the distance left", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{mode="glide",speed=0,ease=0.5},${REC})`,
    );
    vm.touch([0, DOWN, 50, 0]);
    vm.tick(3);
    expect(values(vm)).toEqual([64, 95, 111]);
  });

  test("glide: the target moves with the finger, also after lift", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{mode="glide"},${REC})`);
    vm.touch([0, DOWN, 50, 0], [0, UP, 50, 0]);
    vm.tick(50);
    expect(values(vm).at(-1)).toBe(127);
    vm.touch([0, DOWN, 50, 1023]);
    vm.tick(50);
    expect(values(vm).at(-1)).toBe(0);
  });

  test("d() is the change since the last run, with the fraction carried", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{max=2},${REC})`);
    vm.touch([0, DOWN, 50, 1023]);
    // positions 0.26, 0.76, 1, 0 of the travel
    vm.touch([0, MOVE, 50, 757], [0, MOVE, 50, 245]);
    vm.touch([0, MOVE, 50, 0], [0, MOVE, 50, 1023]);
    const v = runs(vm).filter((e) => e[0] === "v");
    // value 1 at 0.52 units moved: d 0, the 0.52 carried; value 2 at 1.52:
    // d 1; back at 0: d -1, so the reported total returns to 0
    expect(v.map((e) => [e[1], e[2]])).toEqual([
      [1, 0],
      [2, 1],
      [0, -1],
    ]);
    // gate runs report 0
    expect(runs(vm).find((e) => e[0] === "g")[2]).toBe(0);
  });
});

describe("live capture", () => {
  const live = `Z.fader("a",0,0,1,9,{grab="live"},${MIDI}) Z.fader("b",1,0,1,9,{grab="live"},${MIDI})`;

  test("leaving a live zone releases it, entering another presses it", async () => {
    const vm = await zones(
      `Z.fader("a",0,0,1,9,{grab="live"},${REC}) Z.fader("b",1,0,1,9,{grab="live"},${REC})`,
    );
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 150, 0], [0, UP, 150, 0]);
    expect(runs(vm).map((e) => [e[3], e[0]])).toEqual([
      [0, "g"], // a pressed (value already 0)
      [0, "g"], // a released
      [1, "v"], // b pressed at the entry position
      [1, "g"],
      [1, "g"], // b released
    ]);
  });

  test("a drag across live faders sets each at the entry position", async () => {
    const vm = await zones(live);
    vm.touch([0, DOWN, 50, 0], [0, MOVE, 150, 512], [0, UP, 150, 512]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 127],
      [0, 176, 33, 63],
    ]);
  });

  test("an unowned contact is picked up by a live zone", async () => {
    const vm = await zones(live);
    vm.touch([0, DOWN, 600, 600], [0, MOVE, 50, 0]);
    expect(wire(vm)).toEqual([[0, 176, 32, 127]]);
  });

  test("a focus contact never reaches a live zone", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{},${MIDI}) Z.fader("b",1,0,1,9,{grab="live"},${MIDI})`,
    );
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 150, 0]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 0],
      [0, 176, 32, 127],
    ]);
  });

  test("a focus zone doesn't take a contact moving into it", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.touch([0, DOWN, 600, 600], [0, MOVE, 50, 0]);
    expect(wire(vm)).toEqual([]);
  });

  test("entering a gliding zone reads abs and ends the glide", async () => {
    const vm = await zones(
      `Z.fader("a",0,0,1,9,{grab="live",mode="glide"},${REC})`,
    );
    vm.touch([0, DOWN, 50, 0]);
    vm.tick(5);
    vm.touch([0, MOVE, 600, 1023], [0, MOVE, 50, 1023]);
    expect(values(vm).at(-1)).toBe(0);
    const n = runs(vm).length;
    vm.tick(10);
    expect(runs(vm).length).toBe(n);
  });

  test("entering reads abs, then the zone's mode applies", async () => {
    const vm = await zones(
      `Z.fader("a",0,0,1,9,{grab="live",mode="rel"},${MIDI})`,
    );
    vm.touch([0, DOWN, 600, 0], [0, MOVE, 50, 0], [0, MOVE, 50, 512]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 127],
      [0, 176, 32, 63],
    ]);
  });
});

describe("contact policy", () => {
  const fader = (contact) =>
    zones(`Z.fader("f",0,0,1,9,{contact="${contact}"},${REC})`);

  test("new: each contact acts, the last active one wins", async () => {
    const vm = await fader("new");
    vm.touch([0, DOWN, 50, 1023], [1, DOWN, 50, 0], [0, MOVE, 50, 1000]);
    expect(values(vm)).toEqual([127, 3]);
  });

  test("move: a second contact re-targets through glide", async () => {
    const vm = await fader("move");
    vm.touch([0, DOWN, 50, 1023], [1, DOWN, 50, 0]);
    expect(values(vm)).toEqual([]);
    vm.tick(50);
    expect(values(vm).at(-1)).toBe(127);
  });

  test("move: a later abs reading cancels the glide target", async () => {
    const vm = await fader("move");
    vm.touch([0, DOWN, 50, 512], [1, DOWN, 50, 0]);
    vm.tick(5);
    vm.touch([0, MOVE, 50, 700]);
    expect(values(vm).at(-1)).toBe(40);
    const n = runs(vm).length;
    vm.tick(10);
    expect(runs(vm).length).toBe(n);
  });

  test("grab: a second contact continues from the current value", async () => {
    const vm = await fader("grab");
    vm.touch([0, DOWN, 50, 512], [1, DOWN, 50, 1023]);
    expect(values(vm)).toEqual([63]);
    vm.touch([1, MOVE, 50, 512]);
    expect(values(vm)).toEqual([63, 127]);
  });

  test("the press and release follow the first and last contact", async () => {
    const vm = await fader("grab");
    vm.touch([0, DOWN, 50, 512], [1, DOWN, 50, 1023], [0, UP, 50, 512]);
    expect(runs(vm).filter((e) => e[0] === "g").length).toBe(1);
    vm.touch([1, UP, 50, 1023]);
    expect(runs(vm).filter((e) => e[0] === "g").length).toBe(2);
  });
});

describe("knob", () => {
  // cells 0-4 x 0-4: raw 0-568, centre 284
  const knob = (opt = "") => zones(`Z.knob("k",0,0,5,5,{${opt}},${REC})`);
  const TOP = [284, 34];
  const LEFT = [34, 284];
  const RIGHT = [534, 284];
  const BOTTOM = [284, 534]; // in the gap
  const LOW_RIGHT = [434, 434]; // 315 degrees
  const LOW_LEFT = [134, 434]; // 45 degrees

  test("abs: the angle sets the value, min lower left, max lower right", async () => {
    const vm = await knob();
    vm.touch([0, DOWN, ...LEFT], [0, MOVE, ...TOP], [0, MOVE, ...RIGHT]);
    vm.touch([0, MOVE, ...LOW_RIGHT]);
    expect(values(vm)).toEqual([25, 64, 102, 121]);
  });

  test("abs: the value doesn't jump across the gap", async () => {
    const vm = await knob();
    vm.touch([0, DOWN, ...LOW_RIGHT], [0, MOVE, ...BOTTOM]);
    vm.touch([0, MOVE, ...LOW_LEFT], [0, MOVE, ...LOW_RIGHT]);
    expect(values(vm)).toEqual([121]);
  });

  test("abs: past the gap it holds until the finger returns to the end", async () => {
    const vm = await knob();
    vm.touch([0, DOWN, ...LOW_RIGHT], [0, MOVE, ...BOTTOM]);
    vm.touch([0, MOVE, ...LOW_LEFT], [0, MOVE, ...LEFT], [0, MOVE, ...TOP]);
    vm.touch([0, MOVE, ...RIGHT]);
    expect(values(vm)).toEqual([121]);
    vm.touch([0, MOVE, ...LOW_RIGHT], [0, MOVE, 501, 409]); // 300 degrees
    expect(values(vm)).toEqual([121, 114]);
  });

  test("abs: a press in the gap reads the nearest end", async () => {
    const vm = await knob();
    vm.touch([0, DOWN, 294, 540]); // just right of the bottom
    expect(values(vm)).toEqual([127]);
  });

  test("the centre is ignored", async () => {
    const vm = await knob();
    vm.touch([0, DOWN, 284, 284], [0, MOVE, ...TOP]);
    expect(values(vm)).toEqual([64]);
  });

  test("rel: angular change times speed, also through the gap", async () => {
    const vm = await knob('mode="rel"');
    vm.touch([0, DOWN, ...TOP], [0, MOVE, ...RIGHT]);
    vm.touch([0, MOVE, ...LOW_RIGHT], [0, MOVE, ...LOW_LEFT]);
    // +90, +45, +90 degrees of 300
    expect(values(vm)).toEqual([38, 57, 95]);
  });

  test('drag="v" reads a vertical drag, drag="h" a horizontal one', async () => {
    const v = await knob('drag="v"');
    v.touch([0, DOWN, 284, 0]);
    expect(values(v)).toEqual([127]);
    const h = await knob('drag="h"');
    h.touch([0, DOWN, 568, 284]);
    expect(values(h)).toEqual([127]);
  });

  test("drag is a knob option: a fader ignores it", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{drag="h"},${REC})`);
    vm.touch([0, DOWN, 100, 0]);
    expect(values(vm)).toEqual([127]);
  });
});

describe("steps", () => {
  // the values a series of presses gives, read on each press
  async function presses(opt, n) {
    const vm = await zones(`Z.button("b",2,0,2,2,{${opt}},${REC})`);
    for (let i = 0; i < n; i++) {
      vm.touch([0, 9, 300, 100]);
    }
    return runs(vm)
      .filter((_, i) => i % 2 === 0)
      .map((e) => e[1]);
  }

  test.each([
    [1, 0, 127],
    [2, 0, 127],
    [3, 10, 100],
    [5, 0, 16383],
    [4, 127, 0],
  ])(
    "bmo=%i over %i-%i matches the firmware step values",
    async (bmo, min, max) => {
      const steps = SettingsButton.calculateStepValuesFirmwareStyle(
        bmo + 1,
        min,
        max,
      );
      const got = await presses(`bmo=${bmo},min=${min},max=${max}`, bmo + 2);
      expect(got).toEqual([...steps.slice(1), steps[0], steps[1]]);
    },
  );

  test("toggle: note on, then off on the next press", async () => {
    const vm = await zones(`Z.button("b",2,0,2,2,{bmo=1},${MIDI})`);
    vm.touch([0, 9, 300, 100], [0, 9, 300, 100]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
    ]);
  });

  test("step() and count()", async () => {
    const vm = await zones(`Z.button("b",2,0,2,2,{bmo=2})`);
    expect(vm.run("return Z.zs[1]:step()")).toBe(0);
    expect(vm.run("local c=Z.zs[1]:count() return c")).toBe(3);
    vm.touch([0, 9, 300, 100]);
    expect(vm.run("return Z.zs[1]:step()")).toBe(1);
    expect(
      await zones(`Z.button("b",2,0,2,2,{})`).then((m) =>
        m.run("return Z.zs[1]:count()"),
      ),
    ).toBe(2);
  });
});

describe("groups", () => {
  const three = (opt, group = "") =>
    zones(
      `${group} Z.button("a",0,0,1,1,{${opt}},${MIDI}) Z.button("b",1,0,1,1,{${opt}},${MIDI}) Z.button("c",2,0,1,1,{${opt}},${MIDI})`,
    );
  const A = [0, 9, 50, 50];
  const B = [0, 9, 150, 50];

  test("a press turns the other members off first, then this one on", async () => {
    const vm = await three("bmo=1,group=1");
    vm.touch(A, B);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
      [0, 144, 33, 127],
    ]);
  });

  test("empty=1 (default) lets the last member go off", async () => {
    const vm = await three("bmo=1,group=1");
    vm.touch(A, A);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
    ]);
  });

  test("empty=0 keeps one member on, and its re-press sends nothing", async () => {
    const vm = await three("bmo=1,group=1", "Z.group(1,{empty=0})");
    vm.touch(A, A);
    expect(wire(vm)).toEqual([[0, 144, 32, 127]]);
  });

  test("empty=0 latches momentary members", async () => {
    const vm = await three("group=1", "Z.group(1,{empty=0})");
    vm.touch(A);
    expect(wire(vm)).toEqual([[0, 144, 32, 127]]);
    vm.touch(B);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
      [0, 144, 33, 127],
    ]);
  });

  test("zones in other groups are not affected", async () => {
    const vm = await zones(
      `Z.button("a",0,0,1,1,{bmo=1,group=1},${MIDI}) Z.button("b",1,0,1,1,{bmo=1,group=2},${MIDI})`,
    );
    vm.touch(A, B);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 33, 127],
    ]);
  });
});

describe("Z.tick", () => {
  // gtt is one-shot (grid_ui.c): Z.start kicks the timer, every tick re-arms it
  test("Z.start kicks the timer once", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.fader("f",0,0,1,9,{},${MIDI}) Z.start(self)`);
    expect(vm.calls("gtt").map((e) => e.args)).toEqual([[0, 1]]);
  });

  test("the timer is the element's own", async () => {
    const vm = await createZonaVM();
    vm.run("function el:ind() return 3 end");
    vm.setup("Z.start(self)");
    vm.run("Z.tick(el)");
    expect(vm.calls("gtt").map((e) => e.args)).toEqual([
      [3, 1],
      [3, 20],
    ]);
  });

  test.each([
    ["Z.tick(el)", 20],
    ["Z.tick(el,{})", 20],
    ["Z.tick(el,{led=2,win=500})", 20],
    ["Z.tick(el,{ms=50})", 50],
  ])("%s re-arms the timer with %i ms first", async (code, ms) => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{mode="glide"},${MIDI})`);
    vm.touch([0, DOWN, 50, 0]);
    vm.clear();
    for (let i = 0; i < 3; i++) {
      const from = vm.log.length;
      vm.run(code);
      // gtt comes before the glide's sends and paints
      expect(vm.log[from]).toEqual({ fn: "gtt", n: 2, args: [0, ms] });
      expect(vm.log.length).toBeGreaterThan(from + 1);
    }
    expect(vm.calls("gms").length).toBeGreaterThan(0);
    expect(vm.calls("gtt").length).toBe(3);
  });

  test("a body error during a tick doesn't stop the timer", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{mode="glide"},function(self) if Z.tn>0 then error("boom") end end)`,
    );
    vm.touch([0, DOWN, 50, 0]);
    vm.clear();
    expect(() => vm.run("Z.tick(el)")).toThrow(/boom/);
    expect(vm.calls("gtt").map((e) => e.args)).toEqual([[0, 20]]);
  });

  test("does nothing without glide", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${REC})`);
    vm.touch([0, DOWN, 50, 0]);
    vm.clear();
    vm.tick(10);
    expect(runs(vm)).toEqual([]);
  });
});

// Last phase per cell "x,y" from the glp calls (physical LED mapped back
// through the ZONA's serpentine rows).
function leds(vm) {
  const m = {};
  for (const {
    args: [p, , ph],
  } of vm.calls("glp")) {
    const r = Math.floor(p / 9);
    m[`${r % 2 === 0 ? 8 - (p % 9) : p % 9},${r}`] = ph;
  }
  return m;
}
// Phases of a column of cells, top to bottom.
const column = (m, x, h = 9) =>
  Array.from({ length: h }, (_, y) => m[`${x},${y}`]);

describe("LEDs", () => {
  test("cell (x,y) is LED glag(0, x+y*9): serpentine rows, row 0 on top", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.touch([0, DOWN, 50, 0]);
    vm.clear();
    vm.tick();
    const lit = vm
      .calls("glp")
      .filter((e) => e.args[2] === 255)
      .map((e) => e.args[0]);
    expect(lit).toEqual([8, 9, 26, 27, 44, 45, 62, 63, 80]);
  });

  test("the first paint sets every cell once, uncovered cells in the default colour", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.fader("f",0,0,1,9,{},${MIDI}) Z.start(self)`);
    expect(vm.calls("glp").length).toBe(81);
    expect(vm.calls("glp").every((e) => e.args[2] === 0)).toBe(true);
    const [r, g, b] = DEFAULT_COLOR;
    expect(vm.calls("glx").length).toBe(81);
    expect(vm.calls("glx").at(-1).args).toEqual([72, 1, r, g, b, 1]);
    expect(vm.calls("glx")[0].args).toEqual([8, 1, r, g, b, 1]);
    expect(vm.calls("gld")[0].args).toEqual([8, 1, r >> 1, g >> 1, b >> 1, 1]);
    expect(vm.calls("gln")[0].args).toEqual([
      8,
      1,
      Math.floor(r / 20),
      Math.floor(g / 20),
      Math.floor(b / 20),
      1,
    ]);
  });

  test("every Setup run repaints all cells, then only changed cells are sent", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{sens="h"},${MIDI})`);
    vm.setup(`Z.fader("f",0,0,1,9,{sens="h"},${MIDI}) Z.start(self)`);
    expect(vm.calls("glp").length).toBe(81);
    expect(vm.calls("glx").length).toBe(81);
    vm.touch([0, DOWN, 50, 512]);
    vm.tick();
    vm.clear();
    vm.touch([0, MOVE, 50, 500]);
    vm.tick();
    expect(vm.calls("glp").length).toBe(1);
    expect(vm.calls("glx")).toEqual([]);
  });

  test("a new Setup darkens the cells no zone covers", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.touch([0, DOWN, 50, 0], [0, UP, 50, 0]);
    vm.tick();
    vm.clear();
    vm.setup(`Z.fader("f",1,0,1,9,{},${MIDI}) Z.start(self)`);
    expect(column(leds(vm), 0)).toEqual(Array(9).fill(0));
  });

  test("repaints wait for the divider", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.touch([0, DOWN, 50, 0]);
    vm.run("Z.tick(el,{led=2})");
    expect(vm.calls("glp")).toEqual([]);
    vm.run("Z.tick(el,{led=2})");
    expect(vm.calls("glp").length).toBe(9);
  });

  test("glc and glp in the body set colour and intensity from the start", async () => {
    const vm = await createZonaVM();
    vm.setup(
      `Z.fader("f",0,0,1,9,{},function(self) self:glc(-1,{{255,0,0,1}}) self:glp(-1,100) end) Z.start(self)`,
    );
    vm.touch([0, DOWN, 50, 0], [0, MOVE, 50, 100]);
    vm.tick();
    const red = vm.calls("glx").filter((e) => e.args[2] === 255);
    expect(red.length).toBe(9);
    expect(red[0].args).toEqual([8, 1, 255, 0, 0, 1]);
    expect(vm.calls("gln")[0].args).toEqual([8, 1, 12, 0, 0, 1]);
    expect(column(leds(vm), 0)[8]).toBe(100);
  });

  test("glp intensity is clamped to 0-255", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{res=14},function(self) self:glp(-1,self:v()) end)`,
    );
    vm.touch([0, DOWN, 50, 0]);
    vm.tick();
    expect(Math.max(...vm.calls("glp").map((e) => e.args[2]))).toBe(255);
  });
});

describe("painters", () => {
  // keeps the first paint in the log
  const fresh = async (code) => {
    const vm = await createZonaVM();
    vm.setup(`${code} Z.start(self)`);
    return vm;
  };
  // value 63 of 127: position 0.4995 of the travel
  const mid = async (led, opt = "") => {
    const vm = await fresh(`Z.fader("f",0,0,1,9,{led="${led}"${opt}},${MIDI})`);
    vm.touch([0, DOWN, 50, 512]);
    vm.tick();
    return vm;
  };

  test("fill: from the bottom, the partial cell dimmed", async () => {
    expect(column(leds(await mid("fill")), 0)).toEqual([
      0, 0, 0, 0, 126, 255, 255, 255, 255,
    ]);
  });

  test('fill: horizontal with dir="h"', async () => {
    const vm = await fresh(`Z.fader("f",0,0,9,1,{dir="h"},${MIDI})`);
    vm.touch([0, DOWN, 512, 50]);
    vm.tick();
    const m = leds(vm);
    expect(Array.from({ length: 9 }, (_, x) => m[`${x},0`])).toEqual([
      255, 255, 255, 255, 129, 0, 0, 0, 0,
    ]);
  });

  test("dot: the value cell, shared with its neighbour", async () => {
    expect(column(leds(await mid("dot")), 0)).toEqual([
      0, 0, 0, 0, 254, 1, 0, 0, 0,
    ]);
  });

  test("comet: the trail decays on each tick", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{led="comet"},${MIDI})`);
    vm.touch([0, DOWN, 50, 0]);
    vm.tick();
    vm.touch([0, MOVE, 50, 1023]);
    vm.tick();
    expect(column(leds(vm), 0)[0]).toBe(179);
    expect(column(leds(vm), 0)[8]).toBe(255);
    vm.tick();
    expect(column(leds(vm), 0)[0]).toBe(125);
    vm.tick(10);
    expect(column(leds(vm), 0)[0]).toBe(0);
  });

  test("button fill: lit when on, by step", async () => {
    const vm = await zones(`Z.button("b",0,0,2,2,{bmo=2},${MIDI})`);
    const cells = () => {
      const m = leds(vm);
      return [m["0,0"], m["1,0"], m["0,1"], m["1,1"]];
    };
    vm.touch([0, 9, 50, 50]);
    vm.tick();
    expect(cells()).toEqual([128, 128, 128, 128]);
    vm.touch([0, 9, 50, 50]);
    vm.tick();
    expect(cells()).toEqual([255, 255, 255, 255]);
    vm.touch([0, 9, 50, 50]);
    vm.tick();
    expect(cells()).toEqual([0, 0, 0, 0]);
  });

  // 3x3 at the top left: raw 0-341
  const corner = async (kind, led) => {
    const vm = await fresh(`Z.${kind}("p",0,0,3,3,{${led}},${MIDI})`);
    vm.touch([0, DOWN, 341, 341]);
    vm.tick();
    const m = leds(vm);
    return [0, 1, 2].map((y) => [0, 1, 2].map((x) => m[`${x},${y}`]));
  };

  test("crosshair: the value's row and column, brighter where they meet", async () => {
    expect(await corner("xy", "")).toEqual([
      [0, 0, 128],
      [0, 0, 128],
      [128, 128, 255],
    ]);
  });

  test("target: a dot at the xy value", async () => {
    expect(await corner("xy", 'led="target"')).toEqual([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 255],
    ]);
  });

  test("arc: the outer ring up to the value, the gap and centre dark", async () => {
    // lower right, 315 degrees: everything up to there
    expect(await corner("knob", "")).toEqual([
      [255, 255, 255],
      [255, 0, 255],
      [255, 0, 255],
    ]);
    const vm = await fresh(`Z.knob("k",0,0,3,3,{},${MIDI})`);
    vm.touch([0, DOWN, 171, 20]); // just past the top: half
    vm.tick();
    const m = leds(vm);
    expect([0, 1, 2].map((y) => [0, 1, 2].map((x) => m[`${x},${y}`]))).toEqual([
      [255, 255, 0],
      [255, 0, 0],
      [255, 0, 0],
    ]);
  });

  test('led="n" paints nothing', async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{led="n"},${MIDI})`);
    vm.touch([0, DOWN, 50, 0]);
    vm.tick();
    expect(vm.calls("glp")).toEqual([]);
  });
});

describe("release", () => {
  const swipe = async (release) => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{release="${release}"},${MIDI})`,
    );
    vm.touch([0, DOWN, 50, 0]);
    vm.tick();
    vm.touch([0, UP, 50, 0]);
    return vm;
  };
  const top = (vm) => column(leds(vm), 0)[8];

  test("keep: the value stays lit", async () => {
    const vm = await swipe("keep");
    vm.tick(30);
    expect(top(vm)).toBe(255);
  });

  test("clear: dark on release, and before the first press", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.fader("f",0,0,1,9,{release="clear"},${MIDI}) Z.start(self)`);
    vm.touch([0, DOWN, 50, 0]);
    vm.tick();
    expect(top(vm)).toBe(255);
    vm.touch([0, UP, 50, 0]);
    vm.tick();
    expect(top(vm)).toBe(0);
  });

  test("fade: dims over 20 ticks", async () => {
    const vm = await swipe("fade");
    vm.tick();
    expect(top(vm)).toBe(242);
    vm.tick(18);
    expect(top(vm)).toBeGreaterThan(0);
    vm.tick();
    expect(top(vm)).toBe(0);
  });
});

describe("sensitivity", () => {
  const fader = (opt) => zones(`Z.fader("f",0,0,1,9,{${opt}},${REC})`);

  test("deadband: moves within 2 raw (normal) are dropped", async () => {
    const vm = await fader("");
    vm.touch([0, DOWN, 50, 512], [0, MOVE, 51, 510]);
    expect(values(vm)).toEqual([63]);
    vm.touch([0, MOVE, 50, 509]);
    expect(values(vm)).toEqual([63, 64]);
  });

  test("smoothing keeps a share of the old position", async () => {
    const vm = await fader("db=0,sm=0.5");
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 0], [0, MOVE, 50, 0]);
    expect(values(vm)).toEqual([64, 95]);
  });

  test("smoothing reaches a finger at rest on the ticks", async () => {
    const vm = await fader('sens="l"');
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 600]);
    vm.touch([0, MOVE, 50, 200], [0, MOVE, 50, 0]);
    expect(vm.run("return Z.zs[1]:v()")).toBeLessThan(127);
    vm.tick(20);
    expect(vm.run("return Z.zs[1]:v()")).toBe(127);
    expect(values(vm).at(-1)).toBe(127);
  });

  test.each([
    [7, 127],
    [14, 16383],
  ])(
    "smoothing on a 1x3 fader at res=%i reaches both ends",
    async (res, max) => {
      // rows 3-5: raw y 342-682
      const vm = await zones(`Z.fader("f",0,3,1,3,{sens="l",res=${res}})`);
      const v = () => vm.run("return Z.zs[1]:v()");
      vm.touch([0, DOWN, 50, 682], [0, MOVE, 50, 500], [0, MOVE, 50, 342]);
      vm.tick(40);
      expect(v()).toBe(max);
      vm.touch([0, MOVE, 50, 500], [0, MOVE, 50, 682]);
      vm.tick(40);
      expect(v()).toBe(0);
    },
  );

  test("smoothing only moves the zone's last moving contact", async () => {
    const vm = await fader('sens="l"');
    const v = () => vm.run("return Z.zs[1]:v()");
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 600], [0, MOVE, 50, 0]);
    vm.touch([1, DOWN, 50, 818]);
    const b = v();
    vm.tick(20);
    expect(v()).toBe(b);
  });

  test("Z.start stops the rate limit until the next tick", async () => {
    const vm = await fader("db=0,rt=1");
    vm.tick();
    vm.setup(`Z.fader("f",0,0,1,9,{db=0,rt=1},${REC}) Z.start(self)`);
    vm.clear();
    vm.touch([0, DOWN, 50, 1023]);
    for (let y = 950; y >= 0; y -= 50) {
      vm.touch([0, MOVE, 50, y]);
    }
    expect(values(vm).length).toBe(20);
  });

  test("rate limit: nothing is held before the first tick", async () => {
    const vm = await fader("db=0,rt=1");
    vm.touch([0, DOWN, 50, 1023]);
    for (let y = 950; y >= 0; y -= 50) {
      vm.touch([0, MOVE, 50, y]);
    }
    expect(values(vm).length).toBe(20);
    expect(values(vm).at(-1)).toBe(127);
  });

  test("rate limit: a pending run goes out before the release", async () => {
    const vm = await fader("db=0,rt=1");
    vm.tick();
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 0], [0, MOVE, 50, 512]);
    vm.touch([0, UP, 50, 512]);
    expect(runs(vm).map((e) => [e[0], e[1]])).toEqual([
      ["g", 0],
      ["v", 127],
      ["v", 63],
      ["g", 63],
    ]);
  });

  test("rate limit: runs wait for the tick, with the latest value", async () => {
    const vm = await fader("db=0,rt=1");
    vm.tick();
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 0]);
    vm.touch([0, MOVE, 50, 512], [0, MOVE, 50, 600]);
    expect(values(vm)).toEqual([127]);
    expect(vm.run("return Z.zs[1]:v()")).toBe(53);
    vm.tick();
    expect(values(vm)).toEqual([127, 53]);
  });

  test("sens presets, with raw overrides", async () => {
    const vm = await zones(
      `Z.fader("a",0,0,1,9,{sens="l"}) Z.fader("b",1,0,1,9,{sens="l",sm=0})`,
    );
    const get = (i, k) => vm.run(`return Z.zs[${i}].${k}`);
    expect([get(1, "db"), get(1, "sm"), get(1, "rt")]).toEqual(zoneSens.l);
    expect([get(2, "db"), get(2, "sm"), get(2, "rt")]).toEqual([4, 0, 1]);
  });
});

// A default MIDI block with Receive MIDI (value and LED sync), as Midi.svelte
// writes it.
const RX = (mode = 0) =>
  `function(self) self:gms(-1,-1,-1,-1) self:gmrr(-1,-1,-1,-1,{true,true},${mode}) end`;
const v1 = (vm) => vm.run("return Z.zs[1]:v()");

describe("dry run", () => {
  test("runs each body muted, with dry() true, and registers RX", async () => {
    const vm = await createZonaVM();
    vm.setup(
      `Z.xy("p",0,0,3,3,{},function(self) _rec("dry",2,self:src(),self:dry()) self:gms(-1,-1,-1,-1) ggms(0,1) gks(0,0,4) self:gmrr(-1,-1,-1,-1,{true,true},0) end) Z.start(self)`,
    );
    expect(vm.calls("dry").map((e) => e.args)).toEqual([
      ["x", true],
      ["y", true],
      ["g", true],
    ]);
    expect([
      ...vm.calls("gms"),
      ...vm.calls("ggms"),
      ...vm.calls("gks"),
    ]).toEqual([]);
    expect(vm.run("return el.midirx_cb == Z.rx")).toBe(true);
    vm.clear();
    vm.touch([0, DOWN, 341, 0]);
    expect(vm.calls("dry").map((e) => e.args[1])).toEqual([
      false,
      false,
      false,
    ]);
    expect(vm.calls("ggms").length).toBe(3);
  });

  test("outputs are restored when a body errors", async () => {
    const vm = await createZonaVM();
    vm.setup(
      `Z.fader("f",0,0,1,9,{},function(self) if self:dry() then error("x") end self:gms(-1,-1,-1,-1) end) Z.start(self)`,
    );
    vm.run("ggms(0,5) glp(1,1,9)");
    expect(vm.calls("ggms").length).toBe(1);
    expect(vm.calls("glp").at(-1).args).toEqual([1, 1, 9]);
    vm.touch([0, DOWN, 50, 0]);
    expect(vm.midi()).toEqual([[0, 176, 32, 127]]);
  });

  test("no RX registered: no midirx_cb", async () => {
    await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`).then((vm) =>
      expect(vm.run("return el.midirx_cb == nil")).toBe(true),
    );
  });

  test("a user midirx_cb runs after the library's, chained once", async () => {
    const vm = await createZonaVM();
    const setup = `Z.fader("f",0,0,1,9,{},${RX()}) Z.start(self)`;
    const user = `self.midirx_cb=function(s,h,e) _rec("user",1,Z.zs[1]:v()) end`;
    vm.setup(`${user} ${setup}`);
    vm.setup(`${user} ${setup}`);
    vm.rx(0, 176, 32, 100);
    expect(vm.calls("user").map((e) => e.args)).toEqual([[100]]);
  });

  test("a user midirx_cb no longer set in Setup is dropped", async () => {
    const vm = await createZonaVM();
    const setup = `Z.fader("f",0,0,1,9,{},${RX()}) Z.start(self)`;
    vm.setup(`self.midirx_cb=function() _rec("user",0) end ${setup}`);
    vm.setup(setup);
    vm.rx(0, 176, 32, 100);
    expect(vm.calls("user")).toEqual([]);
  });
});

describe("RX sync", () => {
  test("7-bit CC sets the value and repaints, with no output", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${RX()})`);
    vm.rx(0, 176, 32, 100);
    expect(v1(vm)).toBe(100);
    vm.tick();
    expect(vm.calls("gms")).toEqual([]);
    expect(vm.calls("glp").length).toBeGreaterThan(0);
  });

  test("other messages and MIDI not from the host are ignored", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${RX()})`);
    vm.rx(0, 176, 33, 100);
    vm.rx(1, 176, 32, 100);
    vm.rx(0, 176, 32, 100, 14);
    expect(v1(vm)).toBe(0);
  });

  test("notes: on picks the step, note off is 0", async () => {
    const vm = await zones(`Z.button("b",0,0,1,1,{bmo=1},${RX()})`);
    vm.rx(0, 144, 32, 127);
    expect(vm.run("return Z.zs[1]:step()")).toBe(1);
    vm.rx(0, 128, 32, 64);
    expect(vm.run("return Z.zs[1]:step()")).toBe(0);
  });

  test("an incoming value picks the nearest step", async () => {
    const vm = await zones(`Z.button("b",0,0,1,1,{bmo=2},${RX()})`);
    vm.rx(0, 144, 32, 70);
    expect(vm.run("return Z.zs[1]:step()")).toBe(1);
    expect(v1(vm)).toBe(63);
  });

  test("14-bit CC: the MSB at once, the LSB refines", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{res=14},${RX(1)})`);
    vm.rx(0, 176, 0, 64);
    expect(v1(vm)).toBe(8192);
    vm.rx(0, 176, 32, 5);
    expect(v1(vm)).toBe(8197);
  });

  test("NRPN 14-bit (mode 3) and 7-bit (mode 2)", async () => {
    const vm = await zones(
      `Z.fader("a",0,0,1,9,{res=14},function(self) self:gmrr(-1,0,176,300,{true,true},3) end) Z.fader("b",1,0,1,9,{},function(self) self:gmrr(-1,0,176,301,{true,true},2) end)`,
    );
    vm.rx(0, 176, 99, 2);
    vm.rx(0, 176, 98, 44);
    vm.rx(0, 176, 6, 10);
    expect(v1(vm)).toBe(1280);
    vm.rx(0, 176, 38, 3);
    expect(v1(vm)).toBe(1283);
    vm.rx(0, 176, 98, 45);
    vm.rx(0, 176, 6, 50);
    expect(vm.run("return Z.zs[2]:v()")).toBe(50);
    expect(v1(vm)).toBe(1283);
  });

  test("pitch bend: the MSB", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{},function(self) self:gmrr(-1,-1,224,0,{true,true},0) end)`,
    );
    vm.rx(0, 224, 17, 100);
    expect(v1(vm)).toBe(100);
  });

  test("touch wins", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${RX()})`);
    vm.touch([0, DOWN, 50, 0]);
    vm.rx(0, 176, 32, 10);
    expect(v1(vm)).toBe(127);
    vm.touch([0, UP, 50, 0]);
    vm.rx(0, 176, 32, 10);
    expect(v1(vm)).toBe(10);
  });

  test("RX moves the duplicate filter and ends a glide", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{mode="glide"},${RX()})`);
    vm.touch([0, DOWN, 50, 0], [0, UP, 50, 0]);
    vm.tick(5);
    vm.rx(0, 176, 32, 100);
    // key of (ch 0, cmd 176, p1 32)
    expect(vm.run(`return Z.zs[1].l[${(176 * 16384 + 32).toString()}]`)).toBe(
      100,
    );
    vm.tick(10);
    expect(v1(vm)).toBe(100);
  });

  test("an incoming on makes a group member the active one, no output", async () => {
    const vm = await zones(
      `Z.button("a",0,0,1,1,{bmo=1,group=1},${RX()}) Z.button("b",1,0,1,1,{bmo=1,group=1},${RX()})`,
    );
    vm.touch([0, 9, 50, 50]);
    vm.clear();
    vm.rx(0, 144, 33, 127);
    expect(vm.run("return Z.zs[1]:step(), Z.zs[2]:step()")).toBe(0);
    expect(vm.run("return Z.zs[2]:step()")).toBe(1);
    expect(vm.calls("gms")).toEqual([]);
  });

  test("a 14-bit button registers on the CC pair it sends", async () => {
    const vm = await zones(`Z.button("b",0,0,1,1,{res=14,bmo=1},${RX(1)})`);
    vm.touch([0, 9, 50, 50]);
    expect(wire(vm)).toEqual([
      [0, 176, 0, 127],
      [0, 176, 32, 127],
    ]);
    vm.rx(0, 176, 0, 0);
    vm.rx(0, 176, 32, 0);
    expect(vm.run("return Z.zs[1]:step()")).toBe(0);
  });

  test("Z.set yields to a finger", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.touch([0, DOWN, 50, 0]);
    vm.run('Z.set("f",10)');
    expect(v1(vm)).toBe(127);
  });

  test("Z.set uses the same path", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{},${MIDI}) Z.xy("p",1,0,3,3,{},${MIDI})`,
    );
    vm.run('Z.set("f",100) Z.set("p",30,"y")');
    expect(v1(vm)).toBe(100);
    expect(vm.run("return Z.zs[2]:y()")).toBe(30);
    expect(vm.calls("gms")).toEqual([]);
  });
});

describe("mapping mode", () => {
  test("the utility window passes with no touch: next page", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.tick();
    vm.util();
    vm.run("for i=1,15 do Z.tick(el,{ms=20,win=300}) end");
    expect(vm.calls("gpl")).toEqual([]);
    vm.run("Z.tick(el,{ms=20,win=300})");
    expect(vm.calls("gpl").map((e) => e.args)).toEqual([[1]]);
  });

  test("the window follows cfg.ms", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.tick();
    vm.util();
    vm.run("for i=1,3 do Z.tick(el,{ms=100,win=300}) end");
    expect(vm.calls("gpl")).toEqual([]);
    vm.run("Z.tick(el,{ms=100,win=300})");
    expect(vm.calls("gpl").length).toBe(1);
  });

  test("without ticks the utility changes page at once", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.util();
    expect(vm.calls("gpl").map((e) => e.args)).toEqual([[1]]);
    vm.touch([0, 9, 50, 0]);
    expect(vm.run("return Z.mp")).toBe(null);
  });

  test("a touch in the window: mapping on; a second press: off", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.tick();
    vm.util();
    vm.touch([0, 9, 50, 0]);
    vm.tick(100);
    expect(vm.calls("gpl")).toEqual([]);
    expect(vm.run("return Z.mp")).toBe(1);
    vm.util();
    expect(vm.run("return Z.mp")).toBe(null);
    expect(vm.calls("gpl")).toEqual([]);
  });

  const mapping = async (code) => {
    const vm = await zones(code);
    vm.tick();
    vm.util();
    return vm;
  };

  test("held zones release when mapping starts, other contacts are ignored", async () => {
    const vm = await zones(
      `Z.button("a",0,0,1,1,{},${MIDI}) Z.button("b",2,0,2,2,{},${MIDI})`,
    );
    vm.tick();
    vm.touch([1, DOWN, 50, 50]);
    vm.util();
    vm.touch([0, 9, 300, 100]); // enters mapping, maps b
    vm.touch([1, UP, 50, 50]);
    vm.util();
    vm.touch([1, MOVE, 60, 50], [1, UP, 60, 50]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0], // a released as mapping starts
      [0, 144, 33, 127],
      [0, 144, 33, 0],
    ]);
  });

  test("a smoothing fader released at mapping start stops converging", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{sens="l"},${MIDI})`);
    vm.tick();
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 600], [0, MOVE, 50, 0]);
    vm.tick();
    vm.util();
    vm.touch([1, 9, 600, 600]); // enters mapping mode
    const v = v1(vm);
    expect(v).toBeLessThan(127);
    vm.tick(20);
    expect(v1(vm)).toBe(v);
  });

  test("a button press that moves is still a tap", async () => {
    const vm = await mapping(`Z.button("b",2,0,2,2,{leave=0},${MIDI})`);
    vm.touch([0, DOWN, 300, 100], [0, MOVE, 340, 120], [0, UP, 340, 120]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
    ]);
  });

  test("movement picks one source; press and release don't run", async () => {
    const vm = await mapping(`Z.xy("p",0,0,9,9,{},${MIDI})`);
    vm.touch([0, DOWN, 500, 500], [0, MOVE, 510, 505]);
    expect(wire(vm)).toEqual([]);
    vm.touch([0, MOVE, 700, 520], [0, UP, 700, 520]);
    expect(wire(vm)).toEqual([[0, 176, 32, 87]]);
  });

  test("a tap sends only the gate, the value frozen", async () => {
    const vm = await mapping(`Z.button("b",2,0,2,2,{},${MIDI})`);
    vm.touch([0, 9, 300, 100]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
    ]);
    const f = await mapping(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    f.touch([0, 9, 50, 0]);
    expect(v1(f)).toBe(0);
  });

  test("only the first identity goes out, other contacts are ignored", async () => {
    const vm = await mapping(
      `Z.fader("f",0,0,1,9,{},function(self) self:gms(-1,-1,-1,-1) self:gms(-1,144,60,self:g()*127) end) Z.fader("b",1,0,1,9,{},${MIDI})`,
    );
    vm.touch([0, DOWN, 50, 1023], [1, DOWN, 150, 0], [0, MOVE, 50, 0]);
    vm.touch([1, MOVE, 150, 500], [0, UP, 50, 0], [1, UP, 150, 500]);
    expect(wire(vm)).toEqual([[0, 176, 32, 127]]);
  });

  test("a 14-bit pair comes out intact", async () => {
    const vm = await mapping(`Z.fader("f",0,0,1,9,{res=14},${MIDI})`);
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 0]);
    expect(wire(vm)).toEqual([
      [0, 176, 0, 127],
      [0, 176, 32, 127],
    ]);
  });

  test("gamepad, mouse and keyboard are muted until mapping ends", async () => {
    const vm = await mapping(
      `Z.fader("f",0,0,1,9,{},function(self) ggms(0,self:v()) gmms(1,self:d()) gks(0,0,4) self:gms(-1,-1,-1,-1) end)`,
    );
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 0], [0, UP, 50, 0]);
    expect(vm.calls("ggms").length + vm.calls("gmms").length).toBe(0);
    expect(vm.calls("gks")).toEqual([]);
    vm.util();
    vm.touch([0, DOWN, 50, 1023]);
    expect(vm.calls("ggms").length).toBeGreaterThan(0);
  });

  test("a dim frame shows mapping mode", async () => {
    const vm = await mapping(`Z.fader("f",4,0,1,9,{},${MIDI})`);
    vm.touch([0, 9, 50, 500]); // an empty cell enters mapping mode
    vm.tick();
    const m = leds(vm);
    expect([m["0,4"], m["8,8"], m["4,0"], m["4,4"]]).toEqual([
      24,
      24,
      24,
      undefined,
    ]);
    vm.clear();
    vm.util();
    vm.tick();
    expect([leds(vm)["0,4"], leds(vm)["4,0"]]).toEqual([0, 0]);
  });
});
