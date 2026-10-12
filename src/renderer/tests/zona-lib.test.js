import { initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll } from "vitest";
import { createZonaVM, DOWN, MOVE, UP } from "./zona-vm";
import { zoneDefaults, zoneKinds } from "../config-blocks/touch/zone-model";

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
      `Z.fader("f",0,0,1,9,{res=10},function(self) _rec("v",1,self:v()) end)`,
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
      `Z.fader("f",0,0,1,9,{res=8},function(self) _rec("v",1,self:v()) end)`,
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
  });

  test("kind presets apply over the defaults, options over both", async () => {
    const vm = await zones(`Z.button("b",0,0,1,1,{res=8})`);
    expect(vm.run("return Z.zs[1].o")).toEqual({
      ...zoneDefaults,
      ...zoneKinds.button,
      res: 8,
    });
  });
});
