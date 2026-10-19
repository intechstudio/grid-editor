import { initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll } from "vitest";
import { createZonaVM, DEFAULT_COLOR, DOWN, MOVE, UP } from "./zona-vm";
import {
  zoneDefaults,
  zoneKinds,
  zoneTickDefaults,
} from "../config-blocks/touch/zone-model";
import { SettingsButton } from "../config-blocks/SettingsButton";

beforeAll(async () => {
  await initLuaFormatter();
});

const v1 = (vm) => vm.run("return Z.zs[1]:v()");

// no body: a zone sends its own MIDI
const MIDI = "nil";

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

  test("a value goes out once: a release that changes nothing sends nothing", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.touch([0, DOWN, 50, 1023]);
    expect(wire(vm)).toEqual([[0, 176, 32, 0]]);
    vm.clear();
    vm.touch([0, MOVE, 50, 0], [0, MOVE, 60, 0], [0, UP, 60, 0]);
    expect(wire(vm)).toEqual([[0, 176, 32, 127]]);
  });

  test("a press re-sends the current value", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.touch([0, DOWN, 50, 0], [0, UP, 50, 0], [0, DOWN, 50, 0]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 127],
      [0, 176, 32, 127],
    ]);
  });

  test("the zone's MIDI goes out before the body runs; the global gms works in it", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{},function(self) gms(1,144,60,self:g()*127) end)`,
    );
    vm.touch([0, DOWN, 50, 0]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 127], // the value run: MIDI, then the body
      [1, 144, 60, 127],
      [1, 144, 60, 127], // the press run: value already sent
    ]);
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
    // every value sits on one of the 2^10 steps; the deadband passes every
    // third raw unit: 3 steps
    expect(values[1]).toBe(48);
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
});

describe("zone MIDI", () => {
  test("pitch bend: 14-bit LSB, MSB whatever res says; the centre is 8192", async () => {
    // rows 3-5: raw y 342-682, the middle at 512
    const vm = await zones(`Z.fader("f",0,3,1,3,{msg="pb"},${MIDI})`);
    expect(vm.run("return Z.zs[1].o.res .. ' ' .. Z.zs[1].ma")).toBe(
      "14 16383",
    );
    vm.touch([0, DOWN, 50, 512]);
    expect(v1(vm)).toBe(8192);
    vm.touch([0, MOVE, 50, 342], [0, MOVE, 50, 682]);
    expect(wire(vm)).toEqual([
      [0, 224, 0, 64],
      [0, 224, 127, 127],
      [0, 224, 0, 0],
    ]);
  });

  test("explicit ch and num, a 14-bit LSB on num+32", async () => {
    const vm = await zones(
      `Z.fader("a",0,0,1,9,{ch=5,num=10},${MIDI}) Z.fader("b",1,0,1,9,{res=14,num=7},${MIDI}) Z.button("c",2,0,1,1,{ch=15,num=60},${MIDI})`,
    );
    vm.touch([0, DOWN, 50, 0], [1, DOWN, 150, 0], [2, DOWN, 250, 50]);
    expect(wire(vm)).toEqual([
      [5, 176, 10, 127],
      [0, 176, 7, 127],
      [0, 176, 39, 127],
      [15, 144, 60, 127],
    ]);
  });

  test("xy: x on num, y on num+1; 14-bit: both pairs", async () => {
    const vm = await zones(`Z.xy("p",0,0,3,3,{res=14,num=3},${MIDI})`);
    vm.touch([0, DOWN, 341, 0]);
    expect(wire(vm)).toEqual([
      [0, 176, 3, 127],
      [0, 176, 35, 127],
      [0, 176, 4, 127],
      [0, 176, 36, 127],
    ]);
  });

  test("msg none sends nothing and keeps its slot", async () => {
    const vm = await zones(
      `Z.fader("a",0,0,1,9,{msg="none"},${MIDI}) Z.fader("b",1,0,1,9,{},${MIDI})`,
    );
    vm.touch([0, DOWN, 50, 0], [1, DOWN, 150, 0]);
    expect(wire(vm)).toEqual([[0, 176, 33, 127]]);
  });

  test("a button as a CC: a toggle sends 127, then 0", async () => {
    const vm = await zones(`Z.button("b",2,0,2,2,{msg="cc",bmo=1},${MIDI})`);
    vm.touch([0, 9, 300, 100], [0, 9, 300, 100]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 127],
      [0, 176, 32, 0],
    ]);
  });

  test("button steps: one note per step change", async () => {
    const vm = await zones(`Z.button("b",2,0,2,2,{bmo=2},${MIDI})`);
    vm.touch([0, 9, 300, 100], [0, 9, 300, 100], [0, 9, 300, 100]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 63],
      [0, 144, 32, 126],
      [0, 144, 32, 0],
    ]);
  });

  test("a high-res button note is 7-bit; a 14-bit CC button sends the pair", async () => {
    const vm = await zones(
      `Z.button("a",0,0,1,1,{res=14},${MIDI}) Z.button("b",1,0,1,1,{res=14,msg="cc"},${MIDI})`,
    );
    vm.touch([0, DOWN, 50, 50], [1, DOWN, 150, 50]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 176, 1, 127],
      [0, 176, 33, 127],
    ]);
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
      `Z.button("b",2,0,2,2,{msg="none"},function(self) if self:g()==1 then gms(0,192,5,0) end end)`,
    );
    vm.touch([0, 9, 300, 100], [0, 9, 300, 100], [0, 9, 300, 100]);
    expect(wire(vm)).toEqual([
      [0, 192, 5, 0],
      [0, 192, 5, 0],
      [0, 192, 5, 0],
    ]);
  });

  test.each(["fader", "xy"])(
    "a %s clamps: sliding off keeps it held",
    async (kind) => {
      const vm = await zones(`Z.${kind}("z",2,0,2,2,{},${REC})`);
      const gates = () => runs(vm).filter((e) => e[0] === "g").length;
      vm.touch([0, DOWN, 300, 100], [0, MOVE, 300, 500]);
      expect(gates()).toBe(1);
      vm.touch([0, UP, 300, 500]);
      expect(gates()).toBe(2);
    },
  );
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

  test("a second contact on a held button is ignored, its lift too", async () => {
    const vm = await zones(button);
    vm.touch([0, DOWN, 300, 100], [1, DOWN, 400, 200]);
    vm.touch([1, UP, 400, 200]);
    expect(wire(vm)).toEqual([[0, 144, 32, 127]]);
    vm.touch([0, UP, 300, 100]);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
    ]);
  });

  test("a second contact on a held fader is ignored until it lifts", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.touch([0, DOWN, 50, 1023], [1, DOWN, 50, 0], [1, MOVE, 50, 512]);
    vm.touch([1, UP, 50, 512], [0, MOVE, 50, 0]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 0],
      [0, 176, 32, 127],
    ]);
    expect(vm.run("return Z.zs[1].k")).toBe(1);
  });

  test("a second contact on a held xy pad is ignored", async () => {
    const vm = await zones(`Z.xy("p",4,0,5,5,{},${MIDI})`);
    vm.touch([0, DOWN, 1023, 0], [1, DOWN, 456, 568], [1, MOVE, 700, 300]);
    vm.touch([1, UP, 700, 300]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 127],
      [0, 176, 33, 127],
    ]);
    expect(vm.run("return Z.zs[1]:g()")).toBe(1);
  });

  test("an ignored contact stays ignored after the owner lifts", async () => {
    const vm = await zones(button);
    vm.touch([0, DOWN, 300, 100], [1, DOWN, 400, 200], [0, UP, 300, 100]);
    vm.clear();
    vm.touch([1, MOVE, 300, 100], [1, UP, 300, 100]);
    expect(wire(vm)).toEqual([]);
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

  test("the body sees the zone as self, with its getters", async () => {
    const vm = await zones(
      `Z.fader("a",0,0,1,9,{}) Z.fader("b",1,0,1,9,{},function(self) _rec("body",4,self.s,self:v(),self:g(),self.n) end)`,
    );
    vm.touch([0, DOWN, 150, 0], [0, UP, 150, 0]);
    expect(vm.calls("body").map((e) => e.args)).toEqual([
      ["v", 127, 1, "b"],
      ["g", 127, 1, "b"],
      ["g", 127, 0, "b"],
    ]);
  });
});

describe("defaults", () => {
  test("the library defaults match zone-model.ts", async () => {
    const vm = await createZonaVM();
    expect(vm.run("return Z.def")).toEqual(zoneDefaults);
    expect(vm.run("return Z.kind")).toEqual(zoneKinds);
    expect(vm.run("return Z.tdef")).toEqual(zoneTickDefaults);
  });

  test.each(["angle", "gate"])(
    "read is the kind's: a fader with read=%j runs as a fader",
    async (read) => {
      const vm = await zones(`Z.fader("f",0,0,1,9,{read="${read}"},${MIDI})`);
      expect(vm.run("return Z.zs[1].o.read")).toBe("axis");
      vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 0]);
      vm.tick();
      expect(wire(vm)).toEqual([
        [0, 176, 32, 0],
        [0, 176, 32, 127],
      ]);
    },
  );

  test("kind presets apply over the defaults, options over both", async () => {
    const vm = await zones(`Z.button("b",0,0,1,1,{res=8})`);
    // z.o reads through to the kind preset and Z.def
    expect(
      vm.run(
        "local o,r=Z.zs[1].o,{} for k in pairs(Z.def) do r[k]=o[k] end r.read=o.read r.msg=o.msg return r",
      ),
    ).toEqual({
      ...zoneDefaults,
      ...zoneKinds.button,
      res: 8,
    });
  });
});

// Records every body run as [source, value, d, name]; a press or release run
// reports the main value.
const REC =
  'function(self) local s=self.s=="g" and (self.o.read=="point" and "x" or "v") or self.s _rec("run",4,self.s,self.u[s],self:d(),self.n) end';
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

describe("spring", () => {
  // 1x9 faders: raw y 0 (top) to 1023 (bottom)
  test("rests at the centre with no output at start", async () => {
    const vm = await createZonaVM();
    vm.setup(
      `Z.fader("f",0,0,1,9,{spring=1},${REC}) Z.fader("p",1,0,1,9,{spring=1,msg="pb"},nil) Z.xy("x",2,0,3,3,{spring=1},nil) Z.start(self)`,
    );
    expect(vm.midi()).toEqual([]);
    expect(
      vm.run(
        "return Z.zs[1]:v() .. ' ' .. Z.zs[2]:v() .. ' ' .. Z.zs[3]:x() .. ' ' .. Z.zs[3]:y()",
      ),
    ).toBe("64 8192 64 64");
    // the start run sees the centre
    expect(runs(vm)).toEqual([["g", 64, 0, "f"]]);
  });

  test("snaps back on lift: one message at the centre", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{spring=1},${MIDI}) Z.fader("p",1,0,1,9,{spring=1,msg="pb"},${MIDI})`,
    );
    vm.touch([0, DOWN, 50, 0], [1, DOWN, 150, 1023]);
    vm.clear();
    vm.touch([0, UP, 50, 0], [1, UP, 150, 1023]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 64],
      [0, 224, 0, 64],
    ]);
    expect(v1(vm)).toBe(64);
  });

  test("the press at the centre re-sends it", async () => {
    const vm = await zones(`Z.fader("f",0,3,1,3,{spring=1,msg="pb"},${MIDI})`);
    vm.touch([0, DOWN, 50, 512]); // rows 3-5: the middle is 0.5
    expect(wire(vm)).toEqual([[0, 224, 0, 64]]);
  });

  test("eases back on the tick: monotonic, the last message the centre", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{spring=1,ease=0.3},${MIDI})`);
    vm.touch([0, DOWN, 50, 0], [0, UP, 50, 0]);
    vm.clear();
    vm.tick(40);
    const sent = wire(vm).map((m) => m[3]);
    expect(sent.length).toBeGreaterThan(3);
    expect(sent.every((v, i) => i === 0 || v < sent[i - 1])).toBe(true);
    expect(sent.at(-1)).toBe(64);
    expect(sent[0]).toBe(105); // q 1 - (0.3 x 0.5 + 0.02) = 0.83
    vm.clear();
    vm.tick(5);
    expect(wire(vm)).toEqual([]);
  });

  test("a touch during the return takes over at once", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{spring=1,ease=0.3},${MIDI})`);
    vm.touch([0, DOWN, 50, 0], [0, UP, 50, 0]);
    vm.tick(2);
    vm.clear();
    vm.touch([0, DOWN, 50, 1023]); // abs: jumps to the bottom
    vm.tick(5);
    expect(wire(vm)).toEqual([[0, 176, 32, 0]]);
  });

  test("rel continues from the current value during the return", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{spring=1,ease=0.3,mode="rel"},${MIDI})`,
    );
    vm.touch([0, DOWN, 50, 512], [0, MOVE, 50, 0], [0, UP, 50, 0]);
    vm.tick(2);
    const at = v1(vm);
    expect(at).toBeGreaterThan(64);
    vm.clear();
    vm.touch([0, DOWN, 50, 512], [0, MOVE, 50, 400]); // + 0.11 of the travel
    expect(v1(vm)).toBe(at + 14);
  });

  test("rel: a finger held still during the return stops it", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{spring=1,ease=0.3,mode="rel"},${MIDI})`,
    );
    vm.touch([0, DOWN, 50, 512], [0, MOVE, 50, 0], [0, UP, 50, 0]);
    vm.tick(2);
    const at = v1(vm);
    vm.clear();
    vm.touch([0, DOWN, 50, 512]);
    vm.tick(5);
    // the press re-sends the current value, then nothing: the return stopped
    expect(vm.midi()).toEqual([[0, 176, 32, at]]);
    expect(v1(vm)).toBe(at);
    vm.touch([0, MOVE, 50, 400]);
    expect(v1(vm)).toBe(at + 14);
  });

  test.each([
    ["RX", (vm) => vm.rx(0, 176, 32, 100)],
    ["Z.set", (vm) => vm.run('Z.set("f",100)')],
  ])("%s during an eased return stops it", async (_, set) => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{spring=1,ease=0.3,rx=1},${MIDI})`,
    );
    vm.touch([0, DOWN, 50, 0], [0, UP, 50, 0]);
    vm.tick();
    set(vm);
    vm.clear();
    vm.tick(10);
    expect(v1(vm)).toBe(100);
    expect(vm.midi()).toEqual([]);
  });

  test("xy: both axes ease back to the centre", async () => {
    const vm = await zones(`Z.xy("p",0,0,3,3,{spring=1,ease=0.3},${MIDI})`);
    vm.touch([0, DOWN, 341, 0], [0, UP, 341, 0]);
    vm.clear();
    vm.tick(40);
    const x = vm
      .midi()
      .filter((m) => m[2] === 32)
      .map((m) => m[3]);
    const y = vm
      .midi()
      .filter((m) => m[2] === 33)
      .map((m) => m[3]);
    expect(x.length).toBeGreaterThan(3);
    expect([x.at(-1), y.at(-1)]).toEqual([64, 64]);
    expect(x.every((v, i) => i === 0 || v < x[i - 1])).toBe(true);
    expect(y.every((v, i) => i === 0 || v < y[i - 1])).toBe(true);
  });

  test("glide aims from the current value; release eases to the centre", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{spring=1,mode="glide",ease=0.5},${MIDI})`,
    );
    vm.touch([0, DOWN, 50, 0]);
    vm.tick(30);
    expect(v1(vm)).toBe(127);
    vm.touch([0, UP, 50, 0]);
    vm.tick(30);
    expect(v1(vm)).toBe(64);
  });

  test("xy: both axes snap back", async () => {
    const vm = await zones(`Z.xy("p",0,0,3,3,{spring=1},${MIDI})`);
    vm.touch([0, DOWN, 341, 0]);
    vm.clear();
    vm.touch([0, UP, 341, 0]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 64],
      [0, 176, 33, 64],
    ]);
  });

  test("RX and Z.set set the value, which stays without a touch", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{spring=1,rx=1},${MIDI})`);
    vm.rx(0, 176, 32, 100);
    vm.tick(10);
    expect(v1(vm)).toBe(100);
    vm.run('Z.set("f",10)');
    vm.tick(10);
    expect(v1(vm)).toBe(10);
    expect(vm.midi()).toEqual([]);
  });

  test("a button ignores spring", async () => {
    const vm = await zones(`Z.button("b",0,0,1,1,{spring=1,bmo=1},${MIDI})`);
    vm.touch([0, 9, 50, 50]);
    expect(wire(vm)).toEqual([[0, 144, 32, 127]]);
    expect(vm.run("return Z.zs[1]:step()")).toBe(1);
  });

  test.each([
    ["res 7", "", 64],
    ["res 14", "res=14", 8192],
    ["min 0, max 100", "max=100", 50],
    ["min 0, max 99", "max=99", 50],
    ["min -1, max 2", "min=-1,max=2", 1],
  ])("the centre for %s", async (_, opt, centre) => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{spring=1,${opt}},${MIDI})`);
    expect(v1(vm)).toBe(centre);
  });
});

describe("fingers (xy)", () => {
  // the whole surface: raw 0-1023 both ways, y up
  const BODY =
    'function(self) _rec("f",4,self:f(),self.s,self:x(),self:y()) end';
  const pad = (opt, body = BODY) => zones(`Z.xy("p",0,0,9,9,{${opt}},${body})`);
  const presses = (vm) =>
    vm
      .calls("f")
      .filter((e) => e.args[1] === "g")
      .map((e) => e.args[0]);

  test("lowest free finger, kept until lift, re-used after; extra contacts ignored", async () => {
    const vm = await pad("fingers=3");
    vm.touch([0, DOWN, 100, 100], [1, DOWN, 500, 500], [2, DOWN, 900, 900]);
    vm.touch([3, DOWN, 300, 300]); // a fourth: ignored
    expect(presses(vm)).toEqual([1, 2, 3]);
    vm.clear();
    vm.touch([1, UP, 500, 500], [4, DOWN, 700, 200]);
    expect(presses(vm)).toEqual([2, 2]); // finger 2 released, then re-used
    vm.clear();
    vm.touch([3, MOVE, 320, 320], [3, UP, 320, 320]);
    expect(vm.calls("f")).toEqual([]); // the ignored contact stays ignored
  });

  test("per-finger values and f() in the body", async () => {
    const vm = await pad("fingers=2");
    vm.touch([0, DOWN, 0, 1023], [1, DOWN, 1023, 0]);
    expect(vm.calls("f").map((e) => e.args)).toEqual([
      [1, "g", 0, 0],
      [2, "x", 127, 0],
      [2, "y", 127, 127],
      [2, "g", 127, 127],
    ]);
    expect(vm.run("return Z.zs[1]:x()")).toBe(0);
  });

  test("MIDI per finger on its own channel, the same CCs", async () => {
    const vm = await pad("fingers=3", "nil");
    vm.touch([0, DOWN, 1023, 0], [1, DOWN, 1023, 0], [2, DOWN, 0, 1023]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 127],
      [0, 176, 33, 127],
      [1, 176, 32, 127],
      [1, 176, 33, 127],
      [2, 176, 32, 0], // a press sends the finger's current values
      [2, 176, 33, 0],
    ]);
    vm.clear();
    vm.touch([2, MOVE, 1023, 1023]);
    expect(wire(vm)).toEqual([[2, 176, 32, 127]]);
  });

  test("channels wrap at 16", async () => {
    const vm = await pad("fingers=3,ch=14", "nil");
    vm.touch([0, DOWN, 1023, 0], [1, DOWN, 1023, 0], [2, DOWN, 1023, 0]);
    expect(wire(vm).map((m) => m[0])).toEqual([14, 14, 15, 15, 0, 0]);
  });

  test("14-bit pairs per finger", async () => {
    const vm = await pad("fingers=2,res=14", "nil");
    vm.touch([0, DOWN, 1023, 0], [1, DOWN, 1023, 0]);
    expect(wire(vm)).toEqual([
      [0, 176, 0, 127],
      [0, 176, 32, 127],
      [0, 176, 1, 127],
      [0, 176, 33, 127],
      [1, 176, 0, 127],
      [1, 176, 32, 127],
      [1, 176, 1, 127],
      [1, 176, 33, 127],
    ]);
  });

  test("the rate limit is per finger", async () => {
    const vm = await pad("fingers=2", "nil");
    vm.touch([0, DOWN, 0, 1023], [1, DOWN, 0, 1023]);
    vm.tick();
    vm.clear();
    // finger 1 twice in one tick: once now, the last on the tick; finger 2 at once
    vm.touch([0, MOVE, 500, 1023], [0, MOVE, 1023, 1023], [1, MOVE, 500, 1023]);
    expect(wire(vm)).toEqual([
      [0, 176, 32, 62],
      [1, 176, 32, 62],
    ]);
    vm.tick();
    expect(wire(vm).at(-1)).toEqual([0, 176, 32, 127]);
  });

  test("a finger's lift sends nothing new; the others carry on", async () => {
    const vm = await pad("fingers=2", "nil");
    vm.touch([0, DOWN, 1023, 0], [1, DOWN, 0, 1023]);
    vm.clear();
    vm.touch([1, UP, 0, 1023], [0, MOVE, 0, 0]);
    expect(wire(vm)).toEqual([[0, 176, 32, 0]]);
  });

  test("spring per finger: a lifted finger returns on its channel", async () => {
    const vm = await pad("fingers=2,spring=1", "nil");
    vm.touch([0, DOWN, 1023, 0], [1, DOWN, 1023, 0]);
    vm.clear();
    vm.touch([1, UP, 1023, 0]);
    expect(wire(vm)).toEqual([
      [1, 176, 32, 64],
      [1, 176, 33, 64],
    ]);
    expect(vm.run("return Z.zs[1]:x()")).toBe(127); // finger 1 still held
  });

  test("the start run and Z.start know finger 1 only", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.xy("p",0,0,9,9,{fingers=5},${BODY}) Z.start(self)`);
    expect(vm.calls("f").map((e) => e.args[0])).toEqual([1]);
    expect(vm.run("return Z.zs[1].fs == nil and #Z.zs[1].os")).toBe(1);
  });

  test("RX sets finger 1 only, not while any finger holds the zone", async () => {
    const vm = await pad("fingers=2,rx=1", "nil");
    vm.rx(0, 176, 32, 100);
    expect(vm.run("return Z.zs[1]:x()")).toBe(100);
    vm.touch([0, DOWN, 0, 1023], [1, DOWN, 0, 1023], [0, UP, 0, 1023]);
    vm.rx(0, 176, 32, 50); // finger 2 still holds the zone
    expect(vm.run("return Z.zs[1]:x()")).toBe(0);
    vm.rx(1, 176, 32, 50); // finger 2's channel is not registered
    expect(vm.run("return Z.zs[1].fs[2]:x()")).toBe(0);
  });

  test("live: a contact sliding in takes a free finger", async () => {
    const vm = await zones(
      `Z.xy("p",0,0,3,3,{fingers=2,grab="live"},${BODY}) Z.fader("f",5,0,1,9,{},nil)`,
    );
    vm.touch([0, DOWN, 100, 100], [1, DOWN, 700, 100], [1, MOVE, 200, 200]);
    expect(presses(vm)).toEqual([1, 2]);
  });

  test("fingers=1: f() is 1, a second contact ignored", async () => {
    const vm = await pad("");
    vm.touch([0, DOWN, 100, 100], [1, DOWN, 500, 500]);
    expect(presses(vm)).toEqual([1]);
  });

  test("LEDs: a crosshair per held finger at top; released: finger 1 at dim", async () => {
    const vm = await createZonaVM();
    // 3x3: cells 0-2, raw 0-341; finger 1 at the bottom left, finger 2 top right
    vm.setup(`Z.xy("p",0,0,3,3,{fingers=2},nil) Z.start(self)`);
    vm.touch([0, DOWN, 0, 341], [1, DOWN, 341, 0]);
    vm.tick();
    const grid = () => {
      const m = leds(vm);
      return [0, 1, 2].map((y) => [0, 1, 2].map((x) => m[`${x},${y}`]));
    };
    expect(grid()).toEqual([
      [136, 136, 255],
      [136, 16, 136],
      [255, 136, 136],
    ]);
    vm.touch([1, UP, 341, 0]);
    vm.tick();
    expect(grid()).toEqual([
      [136, 16, 16],
      [136, 16, 16],
      [255, 136, 136],
    ]);
    vm.touch([0, UP, 0, 341]);
    vm.tick();
    expect(grid()).toEqual([
      [63, 16, 16],
      [63, 16, 16],
      [110, 63, 63],
    ]);
  });
});

describe("dx() and dy() on an XY pad", () => {
  // Mouse Move X and Y in the body, as the editor suggests them
  const MOUSE = "function(self) _rec('m',3,self:f(),self:dx(),self:dy()) end";
  const moves = (vm) =>
    vm
      .calls("m")
      .map((e) => e.args)
      .filter(([, dx, dy]) => dx !== 0 || dy !== 0);
  const pad = (opt = "") => zones(`Z.xy("p",0,0,9,9,{${opt}},${MOUSE})`);

  test("a move along x gives an x change only", async () => {
    const vm = await pad();
    vm.touch([0, DOWN, 500, 500]);
    vm.clear();
    vm.touch([0, MOVE, 700, 500]);
    expect(moves(vm)).toEqual([[1, 24, 0]]); // 200 raw of 1023: 24.8, the fraction carried
  });

  test("a move along y gives a y change only", async () => {
    const vm = await pad();
    vm.touch([0, DOWN, 500, 500]);
    vm.clear();
    vm.touch([0, MOVE, 500, 300]);
    expect(moves(vm)).toEqual([[1, 0, 25]]);
  });

  test("a diagonal move gives both, each once", async () => {
    const vm = await pad();
    vm.touch([0, DOWN, 500, 500]);
    vm.clear();
    vm.touch([0, MOVE, 700, 300]);
    expect(moves(vm)).toEqual([
      [1, 24, 0],
      [1, 0, 25],
    ]);
  });

  test("per finger", async () => {
    const vm = await pad("fingers=2");
    vm.touch([0, DOWN, 100, 100], [1, DOWN, 500, 500]);
    vm.clear();
    vm.touch([1, MOVE, 700, 500], [0, MOVE, 100, 300]);
    expect(moves(vm)).toEqual([
      [2, 24, 0],
      [1, 0, -24],
    ]);
  });

  test("on a fader d() is the value's change, dx() and dy() are 0", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{},function(self) _rec('m',3,self:d(),self:dx(),self:dy()) end)`,
    );
    vm.touch([0, DOWN, 50, 1023]);
    vm.clear();
    vm.touch([0, MOVE, 50, 0]);
    expect(vm.calls("m").map((e) => e.args)).toEqual([[127, 0, 0]]);
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
      ["a", "g"], // a pressed (value already 0)
      ["a", "g"], // a released
      ["b", "v"], // b pressed at the entry position
      ["b", "g"],
      ["b", "g"], // b released
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

  test("a live zone held by one contact isn't taken by another sliding in", async () => {
    const vm = await zones(live);
    vm.touch([0, DOWN, 150, 1023], [1, DOWN, 50, 0], [1, MOVE, 150, 512]);
    vm.touch([1, MOVE, 50, 512], [1, UP, 50, 512], [0, MOVE, 150, 0]);
    expect(wire(vm)).toEqual([
      [0, 176, 33, 0], // b held by contact 0
      [0, 176, 32, 127], // a pressed by contact 1
      [0, 176, 33, 127], // contact 1 ignored after sliding into b
    ]);
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
    vm.tick(); // the entry ran in a glide tick: it waits for the next
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

  test("step()", async () => {
    const vm = await zones(`Z.button("b",2,0,2,2,{bmo=2})`);
    expect(vm.run("return Z.zs[1]:step()")).toBe(0);
    vm.touch([0, 9, 300, 100]);
    expect(vm.run("return Z.zs[1]:step()")).toBe(1);
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

  test("a member can be switched off: no member need be on", async () => {
    const vm = await three("bmo=1,group=1");
    vm.touch(A, A);
    expect(wire(vm)).toEqual([
      [0, 144, 32, 127],
      [0, 144, 32, 0],
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
    ["Z.tick(el,{ms=40})", 40],
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

  test("the first paint sets every cell once; cells outside zones are black, phase 0", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.fader("f",0,0,1,9,{},${MIDI}) Z.start(self)`);
    expect(vm.calls("glp").length).toBe(81);
    expect(vm.calls("glx").length).toBe(81);
    const [r, g, b] = DEFAULT_COLOR;
    // the zone (column 0, LEDs 8, 9, 26, …): its colour, minimum black, at floor
    const zone = [8, 9, 26, 27, 44, 45, 62, 63, 80];
    const of = (fn, led) => vm.calls(fn).find((e) => e.args[0] === led).args;
    expect(of("gln", 8)).toEqual([8, 1, 0, 0, 0, 1]);
    expect(of("gld", 8)).toEqual([8, 1, r >> 1, g >> 1, b >> 1, 1]);
    expect(of("glx", 8)).toEqual([8, 1, r, g, b, 1]);
    for (const e of vm.calls("glp")) {
      expect(e.args[2]).toBe(zone.includes(e.args[0]) ? 16 : 0);
    }
    // outside: a black curve
    for (const fn of ["gln", "gld", "glx"]) {
      const outside = vm.calls(fn).filter((e) => !zone.includes(e.args[0]));
      expect(outside.length).toBe(72);
      expect(
        outside.every((e) => e.args.slice(2, 5).every((c) => c === 0)),
      ).toBe(true);
    }
  });

  test("every Setup run repaints all cells, then only changed cells are sent", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.setup(`Z.fader("f",0,0,1,9,{},${MIDI}) Z.start(self)`);
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

  test("a changed zone repaints on the next tick", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.touch([0, DOWN, 50, 0]);
    expect(vm.calls("glp")).toEqual([]);
    vm.run("Z.tick(el,{ms=40})");
    expect(vm.calls("glp").length).toBe(9);
  });

  test("top while held, dim after the release: the value stays visible", async () => {
    const vm = await zones(`Z.fader("f",0,3,1,3,{},${MIDI})`);
    // rows 3-5; a press at the top fills all three
    vm.touch([0, DOWN, 50, 342]);
    vm.tick();
    expect(column(leds(vm), 0).slice(3, 6)).toEqual([255, 255, 255]);
    vm.clear();
    vm.touch([0, UP, 50, 342]);
    expect(vm.calls("glp")).toEqual([]); // the lift repaints on the tick
    vm.tick();
    expect(column(leds(vm), 0).slice(3, 6)).toEqual([110, 110, 110]);
    vm.clear();
    vm.tick(30);
    expect(vm.calls("glp")).toEqual([]); // nothing fades
  });

  test("an idle tick writes no LED", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{},${MIDI}) Z.button("b",1,0,2,2,{},${MIDI}) Z.xy("p",3,0,3,3,{},${MIDI})`,
    );
    vm.tick(5);
    for (const fn of ["glp", "gln", "gld", "glx"]) {
      expect(vm.calls(fn)).toEqual([]);
    }
  });

  test("a Z.set value shows at dim", async () => {
    const vm = await zones(`Z.fader("f",0,3,1,3,{},${MIDI})`);
    vm.run('Z.set("f",127)');
    vm.tick();
    expect(column(leds(vm), 0).slice(3, 6)).toEqual([110, 110, 110]);
  });

  test.each([
    // glp scales the whole cell: 0 is dark, 100 keeps the floor/value ratio
    [0, [0, 0, 0, 0], [0, 0, 0, 0]],
    [100, [100, 100, 100, 6], [43, 43, 43, 6]],
  ])("Simple Intensity %i: held and released", async (iv, held, released) => {
    // f full, g empty (its cells at floor), both rows 3-5; the start paint stays in the log
    const body = `function(self) self:glp(-1,${iv}) end`;
    const vm = await createZonaVM();
    vm.setup(
      `Z.fader("f",0,3,1,3,{},${body}) Z.fader("g",1,3,1,3,{},${body}) Z.start(self)`,
    );
    const cells = () => {
      const m = leds(vm);
      return [m["0,3"], m["0,4"], m["0,5"], m["1,4"]];
    };
    vm.touch([0, DOWN, 50, 342], [1, DOWN, 150, 682]);
    vm.tick();
    expect(cells()).toEqual(held);
    vm.touch([0, UP, 50, 342], [1, UP, 150, 682]);
    vm.tick();
    expect(cells()).toEqual(released);
  });

  test("an RX value shows at dim", async () => {
    const vm = await zones(`Z.fader("f",0,3,1,3,{rx=1},nil)`);
    vm.rx(0, 176, 32, 127);
    vm.tick();
    expect(column(leds(vm), 0).slice(3, 6)).toEqual([110, 110, 110]);
  });

  test("Simple Color and Intensity in the body: colour from the start, glp scales the lit level", async () => {
    const vm = await createZonaVM();
    vm.setup(
      `Z.fader("f",0,0,1,9,{},function(self) self:glc(-1,{{255,0,0,1}}) self:glp(-1,100) end) Z.start(self)`,
    );
    // no touch: Z.start ran the body once before the first paint
    const red = vm.calls("glx").filter((e) => e.args[2] === 255);
    expect(red.length).toBe(9);
    expect(red[0].args).toEqual([8, 1, 255, 0, 0, 1]);
    expect(vm.calls("gld")[0].args).toEqual([8, 1, 127, 0, 0, 1]);
    expect(vm.calls("gln")[0].args).toEqual([8, 1, 0, 0, 0, 1]); // black minimum
    vm.clear();
    vm.touch([0, DOWN, 50, 0], [0, MOVE, 50, 100]);
    vm.tick();
    // held: top 255 scaled by 100/255
    expect(column(leds(vm), 0)[8]).toBe(100);
  });

  test("the start run sends nothing and sees g=0", async () => {
    const vm = await createZonaVM();
    vm.setup(
      `Z.fader("f",0,0,1,9,{},function(self) _rec("g",1,self:g()) gms(1,144,60,127) ggms(0,1) gmms(1,5) gks(0,0,4) end) Z.start(self)`,
    );
    expect(vm.calls("g").map((e) => e.args)).toEqual([[0]]);
    for (const f of ["gms", "ggms", "gmms", "gks"]) {
      expect(vm.calls(f)).toEqual([]);
    }
    vm.touch([0, DOWN, 50, 0]);
    expect(vm.midi()).toEqual([
      [0, 176, 32, 127], // the zone's own, then the body's
      [1, 144, 60, 127],
      [1, 144, 60, 127],
    ]);
    expect(vm.calls("ggms").length).toBe(2);
  });

  test("a body that fails at start is printed; the surface runs", async () => {
    const vm = await createZonaVM();
    vm.run("print=function(m) _rec('print',1,tostring(m)) end");
    vm.setup(
      `Z.fader("f",0,0,1,9,{},function(self) if self:g()==0 then error("boom") end end) Z.fader("g",1,0,1,9,{},nil) Z.start(self)`,
    );
    expect(vm.calls("print").map((e) => e.args[0])).toEqual([
      expect.stringContaining("boom"),
    ]);
    vm.clear();
    vm.run("gms(9,9,9,9)");
    vm.touch([1, DOWN, 150, 0]);
    expect(vm.midi()).toEqual([
      [9, 9, 9, 9], // outputs restored
      [0, 176, 33, 127],
    ]);
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
  const mid = async () => {
    const vm = await fresh(`Z.fader("f",0,0,1,9,{},${MIDI})`);
    vm.touch([0, DOWN, 50, 512]);
    vm.tick();
    return vm;
  };

  test("fill: from the bottom, the partial cell between floor and top, the rest at floor", async () => {
    expect(column(leds(await mid()), 0)).toEqual([
      16, 16, 16, 16, 134, 255, 255, 255, 255,
    ]);
  });

  test('fill: horizontal with dir="h"', async () => {
    const vm = await fresh(`Z.fader("f",0,0,9,1,{dir="h"},${MIDI})`);
    vm.touch([0, DOWN, 512, 50]);
    vm.tick();
    const m = leds(vm);
    expect(Array.from({ length: 9 }, (_, x) => m[`${x},0`])).toEqual([
      255, 255, 255, 255, 137, 16, 16, 16, 16,
    ]);
  });

  test("button state: off at floor, on lit, steps between (released: dim)", async () => {
    const vm = await zones(`Z.button("b",0,0,2,2,{bmo=2},${MIDI})`);
    const cells = () => {
      const m = leds(vm);
      return [m["0,0"], m["1,0"], m["0,1"], m["1,1"]];
    };
    vm.touch([0, 9, 50, 50]);
    vm.tick();
    expect(cells()).toEqual([63, 63, 63, 63]);
    vm.touch([0, 9, 50, 50]);
    vm.tick();
    expect(cells()).toEqual([110, 110, 110, 110]);
    vm.touch([0, DOWN, 50, 50]); // held: the press wraps to step 0, the floor
    vm.tick();
    expect(cells()).toEqual([16, 16, 16, 16]);
    vm.touch([0, UP, 50, 50], [0, DOWN, 50, 50]); // held step 1: half way to top
    vm.tick();
    expect(cells()).toEqual([136, 136, 136, 136]);
  });

  // 3x3 at the top left: raw 0-341
  const corner = async (kind, led) => {
    const vm = await fresh(`Z.${kind}("p",0,0,3,3,{${led}},${MIDI})`);
    vm.touch([0, DOWN, 341, 341]);
    vm.tick();
    const m = leds(vm);
    return [0, 1, 2].map((y) => [0, 1, 2].map((x) => m[`${x},${y}`]));
  };

  test("crosshair released: the crossing at dim", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.xy("p",0,0,3,3,{},${MIDI}) Z.start(self)`);
    vm.touch([0, DOWN, 341, 341], [0, UP, 341, 341]);
    vm.tick();
    const m = leds(vm);
    expect([0, 1, 2].map((y) => [0, 1, 2].map((x) => m[`${x},${y}`]))).toEqual([
      [16, 16, 63],
      [16, 16, 63],
      [63, 63, 110],
    ]);
  });

  test("crosshair off a cell centre: the brightest cell is still at the lit level", async () => {
    // value at 1.5 / 0.5 cells: between centres on both axes
    const vm = await zones(`Z.xy("p",0,0,3,3,{},${MIDI})`);
    const brightest = () => Math.max(...Object.values(leds(vm)));
    vm.touch([0, DOWN, 255, 85]);
    vm.tick();
    expect(brightest()).toBe(255);
    vm.clear();
    vm.touch([0, UP, 255, 85]);
    vm.tick();
    expect(brightest()).toBe(110);
  });

  test("crosshair: the value's row and column, the crossing full, the rest at floor", async () => {
    expect(await corner("xy", "")).toEqual([
      [16, 16, 136],
      [16, 16, 136],
      [136, 136, 255],
    ]);
  });

  test("led=0 paints nothing: its cells stay dark", async () => {
    const vm = await fresh(
      `Z.fader("f",0,0,1,9,{led=0},${MIDI}) Z.fader("g",1,0,1,9,{},${MIDI})`,
    );
    expect(column(leds(vm), 0)).toEqual(Array(9).fill(0));
    vm.clear();
    vm.touch([0, DOWN, 50, 0], [1, DOWN, 150, 0]);
    vm.tick();
    expect(vm.calls("glp").length).toBe(9);
    expect(column(leds(vm), 0)).toEqual(Array(9).fill(undefined));
  });
});

describe("deadband and rate limit", () => {
  const fader = (opt) => zones(`Z.fader("f",0,0,1,9,{${opt}},${REC})`);

  test("deadband: moves within 2 raw (normal) are dropped", async () => {
    const vm = await fader("");
    vm.touch([0, DOWN, 50, 512], [0, MOVE, 51, 510]);
    expect(values(vm)).toEqual([63]);
    vm.touch([0, MOVE, 50, 509]);
    expect(values(vm)).toEqual([63, 64]);
  });

  test("Z.start stops the rate limit until the next tick", async () => {
    const vm = await fader("");
    vm.tick();
    vm.setup(`Z.fader("f",0,0,1,9,{},${REC}) Z.start(self)`);
    vm.clear();
    vm.touch([0, DOWN, 50, 1023]);
    for (let y = 950; y >= 0; y -= 50) {
      vm.touch([0, MOVE, 50, y]);
    }
    expect(values(vm).length).toBe(20);
  });

  test("rate limit: nothing is held before the first tick", async () => {
    const vm = await fader("");
    vm.touch([0, DOWN, 50, 1023]);
    for (let y = 950; y >= 0; y -= 50) {
      vm.touch([0, MOVE, 50, y]);
    }
    expect(values(vm).length).toBe(20);
    expect(values(vm).at(-1)).toBe(127);
  });

  test("rate limit: a pending run goes out before the release", async () => {
    const vm = await fader("");
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

  test("rate limit: one run per source and tick, the last value on the tick", async () => {
    const vm = await fader("");
    vm.tick();
    vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 0]);
    vm.touch([0, MOVE, 50, 512], [0, MOVE, 50, 600]);
    expect(values(vm)).toEqual([127]);
    expect(vm.run("return Z.zs[1]:v()")).toBe(53);
    vm.tick();
    expect(values(vm)).toEqual([127, 53]);
  });
});

describe("MIDI receive callback", () => {
  test("no RX registered: no midirx_cb", async () => {
    await zones(`Z.fader("f",0,0,1,9,{},${MIDI})`).then((vm) =>
      expect(vm.run("return el.midirx_cb == nil")).toBe(true),
    );
  });

  test("a user midirx_cb runs after the library's, chained once", async () => {
    const vm = await createZonaVM();
    const setup = `Z.fader("f",0,0,1,9,{rx=1},nil) Z.start(self)`;
    const user = `self.midirx_cb=function(s,h,e) _rec("user",1,Z.zs[1]:v()) end`;
    vm.setup(`${user} ${setup}`);
    vm.setup(`${user} ${setup}`);
    vm.rx(0, 176, 32, 100);
    expect(vm.calls("user").map((e) => e.args)).toEqual([[100]]);
  });

  test("a user midirx_cb no longer set in Setup is dropped", async () => {
    const vm = await createZonaVM();
    const setup = `Z.fader("f",0,0,1,9,{rx=1},nil) Z.start(self)`;
    vm.setup(`self.midirx_cb=function() _rec("user",0) end ${setup}`);
    vm.setup(setup);
    vm.rx(0, 176, 32, 100);
    expect(vm.calls("user")).toEqual([]);
  });
});

describe("RX sync", () => {
  test("7-bit CC sets the value and repaints, with no output", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{rx=1},nil)`);
    vm.rx(0, 176, 32, 100);
    expect(v1(vm)).toBe(100);
    vm.tick();
    expect(vm.calls("gms")).toEqual([]);
    expect(vm.calls("glp").length).toBeGreaterThan(0);
  });

  test("other messages and MIDI not from the host are ignored", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{rx=1},nil)`);
    vm.rx(0, 176, 33, 100);
    vm.rx(1, 176, 32, 100);
    vm.rx(0, 176, 32, 100, 14);
    expect(v1(vm)).toBe(0);
  });

  test("notes: on picks the step, note off is 0", async () => {
    const vm = await zones(`Z.button("b",0,0,1,1,{bmo=1,rx=1},nil)`);
    vm.rx(0, 144, 32, 127);
    expect(vm.run("return Z.zs[1]:step()")).toBe(1);
    vm.rx(0, 128, 32, 64);
    expect(vm.run("return Z.zs[1]:step()")).toBe(0);
  });

  test("an incoming value picks the nearest step", async () => {
    const vm = await zones(`Z.button("b",0,0,1,1,{bmo=2,rx=1},nil)`);
    vm.rx(0, 144, 32, 70);
    expect(vm.run("return Z.zs[1]:step()")).toBe(1);
    expect(v1(vm)).toBe(63);
  });

  test("14-bit CC: the MSB at once, the LSB refines", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{res=14,rx=1},nil)`);
    vm.rx(0, 176, 0, 64);
    expect(v1(vm)).toBe(8192);
    vm.rx(0, 176, 32, 5);
    expect(v1(vm)).toBe(8197);
  });

  test("pitch bend: LSB and MSB", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{msg="pb",rx=1},nil)`);
    vm.rx(0, 224, 5, 64);
    expect(v1(vm)).toBe(8197);
    expect(vm.calls("gms")).toEqual([]);
  });

  test("7-bit CC into a wide range is scaled", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{max=1000,rx=1},nil)`);
    vm.rx(0, 176, 32, 127);
    expect(v1(vm)).toBe(1000);
  });

  test("a zone without rx ignores its identity", async () => {
    const vm = await zones(
      `Z.fader("f",0,0,1,9,{},nil) Z.fader("g",1,0,1,9,{rx=1},nil)`,
    );
    vm.rx(0, 176, 32, 100);
    expect(v1(vm)).toBe(0);
  });

  test("msg none registers nothing", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{msg="none",rx=1},nil)`);
    expect(vm.run("return el.midirx_cb == nil")).toBe(true);
  });

  test("touch wins", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{rx=1},nil)`);
    vm.touch([0, DOWN, 50, 0]);
    vm.rx(0, 176, 32, 10);
    expect(v1(vm)).toBe(127);
    vm.touch([0, UP, 50, 0]);
    vm.rx(0, 176, 32, 10);
    expect(v1(vm)).toBe(10);
  });

  test("RX moves the duplicate filter and ends a glide", async () => {
    const vm = await zones(`Z.fader("f",0,0,1,9,{mode="glide",rx=1},nil)`);
    vm.touch([0, DOWN, 50, 0], [0, UP, 50, 0]);
    vm.tick(5);
    vm.rx(0, 176, 32, 100);
    expect(vm.run("return Z.zs[1].l.v")).toBe(100);
    vm.tick(10);
    expect(v1(vm)).toBe(100);
  });

  test("an incoming on makes a group member the active one, no output", async () => {
    const vm = await zones(
      `Z.button("a",0,0,1,1,{bmo=1,group=1,rx=1},nil) Z.button("b",1,0,1,1,{bmo=1,group=1,rx=1},nil)`,
    );
    vm.touch([0, 9, 50, 50]);
    vm.clear();
    vm.rx(0, 144, 33, 127);
    expect(vm.run("return Z.zs[1]:step(), Z.zs[2]:step()")).toBe(0);
    expect(vm.run("return Z.zs[2]:step()")).toBe(1);
    expect(vm.calls("gms")).toEqual([]);
  });

  test("a 14-bit button registers on the CC pair it sends", async () => {
    const vm = await zones(
      `Z.button("b",0,0,1,1,{res=14,bmo=1,msg="cc",rx=1},nil)`,
    );
    vm.touch([0, 9, 50, 50]);
    expect(wire(vm)).toEqual([
      [0, 176, 0, 127],
      [0, 176, 32, 127],
    ]);
    vm.rx(0, 176, 0, 0);
    vm.rx(0, 176, 32, 0);
    expect(vm.run("return Z.zs[1]:step()")).toBe(0);
  });

  test("a high-res button sends and receives its note at 7 bits", async () => {
    const vm = await zones(`Z.button("b",0,0,1,1,{res=14,bmo=1,rx=1},nil)`);
    vm.touch([0, 9, 50, 50]);
    expect(wire(vm)).toEqual([[0, 144, 32, 127]]);
    vm.clear();
    vm.rx(0, 144, 32, 0);
    expect(vm.run("return Z.zs[1]:step()")).toBe(0);
    vm.rx(0, 144, 32, 127);
    expect(vm.run("return Z.zs[1]:step()")).toBe(1);
    expect(vm.calls("gms")).toEqual([]);
  });

  test("RX into a high-res button keeps the 7-bit value for the repeat filter", async () => {
    const vm = await zones(`Z.button("b1",0,0,1,1,{res=14,rx=1},nil)`);
    vm.rx(0, 144, 32, 127);
    expect(vm.run("return Z.zs[1]:step()")).toBe(1);
    vm.touch([0, DOWN, 50, 50]);
    expect(vm.run("return Z.zs[1]:step()")).toBe(1);
    expect(wire(vm)).toEqual([]);
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
