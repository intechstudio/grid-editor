import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, beforeAll, describe } from "vitest";
import { createZonaVM, DOWN, MOVE, UP, TAP } from "./zona-vm";
import zonaSource from "../../content/libraries/zona.lua?raw";
import { zoneDefaults, zoneKinds } from "../config-blocks/touch/zone-model";

beforeAll(async () => {
  await initLuaFormatter();
});

// cells 2-3 x 0-1: raw x 228-455, y 0-227
const button = `Z.button(self,"b",2,0,2,2,{})`;

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
  vm.setup(`${code}`);
  vm.clear();
  return vm;
}

test("the library loads and declares its version in the header", async () => {
  const vm = await createZonaVM();
  expect(vm.run("return type(Z.xy)")).toBe("function");
  expect(GridScript.compressScript(zonaSource)).toMatch(
    /^local LIB_NAME="_Z" local LIB_VERSION="\d+\.\d+\.\d+"/,
  );
});

test("the library fits on the module after compressScript", () => {
  const compressed = GridScript.compressScript(zonaSource);
  expect(compressed).toContain("function Z.unload()");
  expect(compressed.length).toBeLessThan(23552);
});

test("the library defaults match zone-model.ts", async () => {
  const vm = await createZonaVM();
  expect(vm.run("return Z.def")).toEqual(zoneDefaults);
  expect(vm.run("return Z.kind")).toEqual(zoneKinds);
});

test("a fader sends its CC, bottom to top", async () => {
  const vm = await zones(`Z.fader(self,"f",0,0,1,9,{})`);
  vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 0], [0, UP, 50, 0]);
  expect(wire(vm)).toEqual([
    [0, 176, 32, 0],
    [0, 176, 32, 127],
  ]);
});

test("a button sends note on while held, note off on release", async () => {
  const vm = await zones(button);
  vm.touch([0, DOWN, 300, 100], [0, MOVE, 310, 120], [0, UP, 310, 120]);
  expect(wire(vm)).toEqual([
    [0, 144, 32, 127],
    [0, 144, 32, 0],
  ]);
});

test("a toggle button turns on, then off on the next press", async () => {
  const vm = await zones(`Z.button(self,"b",2,0,2,2,{bmo=1})`);
  vm.touch([0, TAP, 300, 100], [0, TAP, 300, 100]);
  expect(wire(vm)).toEqual([
    [0, 144, 32, 127],
    [0, 144, 32, 0],
  ]);
});

test("a fader with cmd=cc14 sends a 14-bit CC pair", async () => {
  for (const opt of [`cmd="cc14"`]) {
    const vm = await zones(`Z.fader(self,"f",0,0,1,9,{${opt}})`);
    vm.touch([0, DOWN, 40, 0]);
    const sent = vm.midi();
    expect(sent.length).toBe(2);
    expect(sent.map((e) => e[2])).toEqual([0, 32]);
  }
});

test("a fader with cmd=pb sends pitch bend, LSB then MSB", async () => {
  const vm = await zones(`Z.fader(self,"f",0,0,1,9,{cmd="pb"})`);
  vm.touch([0, DOWN, 50, 0]);
  expect(wire(vm)).toEqual([[0, 224, 127, 127]]);
});

test("an XY pad sends x and y on neighbouring CCs", async () => {
  // cells 4-8 x 0-4: raw x 456-1023, y 0-568
  const vm = await zones(`Z.fader(self,"p",4,0,5,5,{dir="xy"})`);
  vm.touch([0, DOWN, 1023, 0], [0, MOVE, 456, 568]);
  expect(wire(vm)).toEqual([
    [0, 176, 32, 127],
    [0, 176, 33, 127],
    [0, 176, 32, 0],
    [0, 176, 33, 0],
  ]);
});

// gmms and ggms calls as [axis, step or position], gmbs and ggbs as
// [button, state].
const mouse = (vm, fn) => vm.calls(fn).map((e) => e.args);

test("a mouse XY sends each move of the finger, scaled by sensitivity", async () => {
  const vm = await zones(
    `Z.fader(self,"p",0,0,9,9,{dir="xy",msg="mouse",sensitivity=2})`,
  );
  vm.touch([0, DOWN, 500, 500], [0, MOVE, 510, 497], [0, MOVE, 520, 494]);
  expect(mouse(vm, "gmms")).toEqual([
    [1, 20],
    [2, -6],
    [1, 20],
    [2, -6],
  ]);
  vm.clear();
  vm.touch([0, UP, 520, 494]);
  expect(mouse(vm, "gmms")).toEqual([]);
  expect(wire(vm)).toEqual([]);
});

test("a big mouse move is cut at 127, so the pointer stops with the finger", async () => {
  const vm = await zones(`Z.fader(self,"p",0,0,9,9,{dir="xy",msg="mouse"})`);
  vm.touch([0, DOWN, 100, 500], [0, MOVE, 300, 500]);
  expect(mouse(vm, "gmms")).toEqual([[1, 127]]);
});

test("a quick tap on a mouse XY clicks left on lift", async () => {
  const vm = await zones(`Z.fader(self,"p",0,0,9,9,{dir="xy",msg="mouse"})`);
  vm.touch([0, DOWN, 500, 500], [0, MOVE, 505, 498]);
  expect(mouse(vm, "gmbs")).toEqual([]);
  vm.touch([0, UP, 505, 498]);
  expect(mouse(vm, "gmbs")).toEqual([
    [1, 1],
    [1, 0],
  ]);
  // its small move still moves the pointer
  expect(mouse(vm, "gmms")).toEqual([
    [1, 5],
    [2, -2],
  ]);
});

test("a long touch on a mouse XY doesn't click", async () => {
  const vm = await zones(`Z.fader(self,"p",0,0,9,9,{dir="xy",msg="mouse"})`);
  vm.touch([0, DOWN, 500, 500]);
  vm.wait(0.3);
  vm.touch([0, UP, 500, 500]);
  expect(mouse(vm, "gmbs")).toEqual([]);
  vm.touch([0, DOWN, 500, 500]);
  vm.wait(0.1);
  vm.touch([0, UP, 500, 500]);
  expect(mouse(vm, "gmbs")).toEqual([
    [1, 1],
    [1, 0],
  ]);
});

test("a mouse XY with tap=0 doesn't click", async () => {
  const vm = await zones(
    `Z.fader(self,"p",0,0,9,9,{dir="xy",msg="mouse",tap=0})`,
  );
  vm.touch([0, TAP, 500, 500]);
  expect(mouse(vm, "gmbs")).toEqual([]);
});

test("a tap doesn't release a drag-locked left button", async () => {
  const vm = await zones(
    `Z.fader(self,"p",0,2,9,7,{dir="xy",msg="mouse"}) Z.button(self,"t",4,0,2,2,{msg="mouse",bmo=1})`,
  );
  vm.touch([0, TAP, 500, 100], [0, TAP, 500, 500]);
  expect(mouse(vm, "gmbs")).toEqual([[1, 1]]);
});

test("a mouse XY touch that moves far doesn't click", async () => {
  const vm = await zones(`Z.fader(self,"p",0,0,9,9,{dir="xy",msg="mouse"})`);
  vm.touch([0, DOWN, 500, 500], [0, MOVE, 520, 500], [0, MOVE, 500, 500]);
  vm.touch([0, UP, 500, 500]);
  expect(mouse(vm, "gmbs")).toEqual([]);
});

test("a mouse fader scrolls up when dragged towards its max", async () => {
  const vm = await zones(`Z.fader(self,"f",0,0,1,9,{msg="mouse"})`);
  vm.touch([0, DOWN, 50, 800], [0, MOVE, 50, 480]);
  vm.touch([0, MOVE, 50, 800]);
  expect(mouse(vm, "gmms")).toEqual([
    [3, 10],
    [3, -10],
  ]);
});

test("a mouse button presses while held; toggle is a drag lock", async () => {
  const vm = await zones(
    `Z.button(self,"b",2,0,2,2,{msg="mouse",num=2}) Z.button(self,"t",4,0,2,2,{msg="mouse",bmo=1})`,
  );
  vm.touch([0, DOWN, 300, 100], [0, UP, 300, 100]);
  vm.touch([0, TAP, 500, 100], [0, TAP, 500, 100]);
  expect(mouse(vm, "gmbs")).toEqual([
    [2, 1],
    [2, 0],
    [1, 1],
    [1, 0],
  ]);
  expect(wire(vm)).toEqual([]);
});

test("running Setup again releases a drag-locked mouse button", async () => {
  const vm = await zones(`Z.button(self,"t",4,0,2,2,{msg="mouse",bmo=1})`);
  vm.touch([0, TAP, 500, 100]);
  vm.clear();
  vm.setup(`Z.fader(self,"f",0,0,1,9,{})`);
  expect(mouse(vm, "gmbs")).toEqual([[1, 0]]);
});

test("a gamepad fader sends its axis from -128 at the bottom to 127 at the top", async () => {
  const vm = await zones(`Z.fader(self,"f",0,0,1,9,{msg="pad"})`);
  vm.touch([0, DOWN, 50, 1023], [0, MOVE, 50, 0], [0, UP, 50, 0]);
  expect(mouse(vm, "ggms")).toEqual([
    [0, -128],
    [0, 127],
  ]);
  expect(wire(vm)).toEqual([]);
});

test("a gamepad XY with spring is a joystick: two axes, back to 0 on lift", async () => {
  const vm = await zones(
    `Z.fader(self,"p",4,0,5,5,{dir="xy",msg="pad",spring=50})`,
  );
  vm.touch([0, DOWN, 1023, 0], [0, UP, 1023, 0]);
  expect(mouse(vm, "ggms")).toEqual([
    [0, 127],
    [1, 127],
    [0, 0],
    [1, 0],
  ]);
});

test("spring returns a fader to 0%, 50% or 100% of its range on release, and is off by default", async () => {
  const lastCC = async (opt) => {
    const vm = await zones(`Z.fader(self,"f",0,0,1,9,{${opt}})`);
    vm.touch([0, DOWN, 40, 300], [0, UP, 40, 300]);
    return vm.midi().at(-1)[3];
  };
  expect(await lastCC(`spring=0`)).toBe(0);
  expect(await lastCC(`spring=50`)).toBe(64);
  expect(await lastCC(`spring=100`)).toBe(127);
  // off: the value stays where the finger left it
  const held = await lastCC(``);
  expect(held).not.toBe(0);
  expect(held).not.toBe(64);
});

test("a gamepad button presses while held", async () => {
  const vm = await zones(`Z.button(self,"b",2,0,2,2,{msg="pad",num=3})`);
  vm.touch([0, DOWN, 300, 100], [0, UP, 300, 100]);
  expect(mouse(vm, "ggbs")).toEqual([
    [3, 1],
    [3, 0],
  ]);
});

test("MIDI from the host sets a zone's value without sending, with no option to turn it on", async () => {
  const vm = await zones(`Z.fader(self,"f",0,0,1,9,{})`);
  vm.rx(0, 176, 32, 100);
  expect(vm.run("return Z.zs[1].u.v")).toBe(100);
  expect(vm.calls("gms")).toEqual([]);
});

test("running Setup again replaces the zones and releases held notes", async () => {
  const vm = await zones(button);
  vm.touch([0, DOWN, 300, 100]);
  vm.clear();
  vm.setup(`Z.fader(self,"f",0,0,1,9,{})`);
  expect(vm.midi()).toEqual([[0, 144, 32, 0]]);
  expect(vm.run("return #Z.zs")).toBe(1);
  vm.clear();
  vm.touch([0, UP, 300, 100], [1, DOWN, 50, 0]);
  expect(vm.midi()).toEqual([[0, 176, 32, 127]]);
});

test("Z.unload releases notes, gives back the callbacks and drops the zones", async () => {
  const vm = await createZonaVM();
  vm.setup(
    `self.midirx_cb=function(s,h,e) _rec("user",1,e[4]) end Z.button(self,"b",2,0,2,2,{rx=1})`,
  );
  vm.touch([0, DOWN, 300, 100]);
  vm.clear();
  vm.run("Z.unload(Z)");
  expect(vm.midi()).toEqual([[0, 144, 32, 0]]);
  expect(vm.run("return el.touch_cb")).toBe(null);
  expect(vm.run("return #Z.zs")).toBe(0);
  vm.rx(0, 144, 32, 99);
  expect(vm.calls("user").map((e) => e.args)).toEqual([[99]]);
});

test("every zone lights its cells and the others stay dark", async () => {
  // LED of cell (x,y): serpentine rows of 9, row 0 = LEDs 8..0
  const led = (x, y) => y * 9 + (y % 2 === 0 ? 8 - x : x);
  const column = (x) => Array.from({ length: 9 }, (_, y) => led(x, y));
  const vm = await createZonaVM();
  vm.setup(`Z.fader(self,"f",0,0,1,9,{}) Z.fader(self,"g",1,0,1,9,{})`);
  // painted at once, without a touch: the last phase written to each cell
  const phase = new Map();
  for (const e of vm.calls("glp")) {
    phase.set(e.args[0], e.args[2]);
  }
  const cellsAt = (n) => [...phase].filter(([, p]) => p === n).map(([i]) => i);
  const zoneCells = [...column(0), ...column(1)].sort((a, b) => a - b);
  // a vertical fader's background is at the dimmer floor, 8
  expect(cellsAt(8).sort((a, b) => a - b)).toEqual(zoneCells);
  expect(cellsAt(0).length).toBe(81 - zoneCells.length);
  vm.clear();
  vm.touch([1, DOWN, 150, 0]);
  const lit = vm.calls("glp").map((e) => e.args[0]);
  expect(lit.sort((a, b) => a - b)).toEqual(column(1).sort((a, b) => a - b));
});

test("the library and 16 zones stay within the module's RAM budget", async () => {
  // wasmoon is wasm32 Lua 5.4, close to the module's pointer sizes; the
  // ceiling is the measured value plus about 10%.
  const BUDGET_KB = 108; // measured 98.9
  const vm = await createZonaVM();
  vm.run("package.loaded.zona=nil package.preload.zona=nil Z=nil _Z=nil");
  const base = vm.kb();
  let faders = "";
  for (let i = 0; i < 16; i++) {
    faders += `Z.v(${i % 9},${Math.floor(i / 9) * 4},1,4).n("z${i}") `;
  }
  vm.run("Z=load(_src)()");
  vm.setup(`${faders}`);
  expect(vm.kb() - base).toBeLessThanOrEqual(BUDGET_KB);
});

test("a zone colour is a {red, green, blue} table", async () => {
  const paint = async (opt) => {
    const vm = await createZonaVM();
    vm.setup(`Z.b(0,0,1,1)${opt}`);
    return ["gln", "gld", "glx"].map((fn) => vm.calls(fn));
  };
  const table = await paint(`.col(255,128,0)`);
  expect(table[2].length).toBeGreaterThan(0);
  // the module's own colour differs, and is what a zone without .col has
  expect(await paint(`.col(-1,-1,-1)`)).not.toEqual(table);
  expect(await paint(``)).toEqual(await paint(`.col(-1,-1,-1)`));
});

// The xy pad paints only the cells around each crosshair, in 1/8 cell steps.
describe("the xy pad paint", () => {
  const SETUP = `Z.xy(0,0,9,9).n("p").fing(2)`;
  const led = (x, y) => y * 9 + (y % 2 === 0 ? 8 - x : x);
  // the last phase written to each LED, from a recorded call list
  const phases = (vm, from = new Map()) => {
    const p = new Map(from);
    for (const e of vm.calls("glp")) p.set(e.args[0], e.args[2]);
    return p;
  };
  const cl = (t) => Math.max(0, Math.min(1, t));
  // the level of every cell by the plain formula, for crosshairs at (cx, cy)
  const expected = (crosshairs) => {
    const want = new Map();
    for (let j = 0; j < 9; j++) {
      for (let i = 0; i < 9; i++) {
        let v = 0;
        for (const [cx, cy] of crosshairs) {
          const cm =
            2 -
            Math.abs(cx - Math.floor(cx + 0.5)) -
            Math.abs(cy - Math.floor(cy + 0.5));
          v = Math.max(
            v,
            (cl(1 - Math.abs(cx - i)) + cl(1 - Math.abs(cy - j))) / cm,
          );
        }
        want.set(led(i, j), Math.floor(16 + v * (255 - 16) + 0.5));
      }
    }
    return want;
  };
  // the crosshair of a raw touch in cells (y grows down), in 1/8 cell steps
  const cross = (x, y) => [
    Math.floor((x / 1023) * 8 * 8 + 0.5) / 8,
    Math.floor((y / 1023) * 8 * 8 + 0.5) / 8,
  ];

  test("every cell is what the plain formula gives, for one and two fingers", async () => {
    const vm = await createZonaVM();
    vm.setup(SETUP);
    let seen = phases(vm);
    const touch = (...steps) => {
      vm.touch(...steps);
      seen = phases(vm, seen);
      vm.clear();
    };
    vm.clear();
    touch([0, DOWN, 300, 200]);
    expect(seen).toEqual(expected([cross(300, 200)]));
    touch([1, DOWN, 700, 800]);
    expect(seen).toEqual(expected([cross(300, 200), cross(700, 800)]));
    // a long drag leaves no cell lit behind the crosshair
    for (const [x, y] of [
      [420, 260],
      [560, 610],
      [90, 900],
      [1000, 40],
    ]) {
      touch([0, MOVE, x, y]);
      expect(seen).toEqual(expected([cross(x, y), cross(700, 800)]));
    }
    // lifting a finger: the other one stays
    touch([0, 5, 1000, 40]);
    expect(seen.get(led(8, 0))).not.toBe(255);
  });

  test("a move under 1/8 cell paints nothing", async () => {
    const vm = await createZonaVM();
    vm.setup(SETUP);
    // two positions that fall in the same 1/8 cell step
    let x = 300;
    while (cross(x, 500)[0] !== cross(x + 5, 500)[0]) x++;
    vm.touch([0, DOWN, x, 500]);
    vm.clear();
    vm.touch([0, MOVE, x + 5, 500]);
    expect(vm.calls("glp")).toEqual([]);
    // the position is still sent
    expect(vm.midi().length).toBeGreaterThan(0);
  });

  test("the work per move stays small", async () => {
    const vm = await createZonaVM();
    vm.setup(SETUP);
    vm.run("_n = 0 function _count() _n = _n + 1 end");
    vm.touch([0, DOWN, 100, 100], [1, DOWN, 600, 400]);
    let total = 0;
    let moves = 0;
    for (let s = 0; s < 100; s++) {
      for (const id of [0, 1]) {
        const x = Math.round(100 + id * 500 + 300 * Math.sin((s + id * 7) / 5));
        const y = Math.round(500 + 400 * Math.cos((s + id * 3) / 7));
        vm.run('_n = 0 debug.sethook(_count, "", 1)');
        vm.touch([id, MOVE, x, y]);
        total += vm.run("debug.sethook() return _n");
        moves++;
      }
    }
    // Lua VM instructions per move of a 9x9 pad with two fingers: about
    // 14,400 when every cell was repainted on every move, about 4,800 now
    expect(total / moves).toBeLessThan(6500);
  });
});

describe("the touch queue", () => {
  const SETUP = `Z.xy(0,0,9,9).n("p")`;
  const led = (x, y) => y * 9 + (y % 2 === 0 ? 8 - x : x);
  const moves = [
    [200, 300],
    [300, 400],
    [420, 520],
    [560, 610],
    [700, 700],
  ];

  test("events queued behind the callback's are handled in it, and painted once", async () => {
    // the LED state: the last phase written to each LED since the Setup
    const state = (vm) => {
      const p = new Map();
      for (const e of vm.calls("glp")) p.set(e.args[0], e.args[2]);
      return p;
    };
    // one callback per event, as the firmware without the drain would
    const each = await createZonaVM();
    each.setup(SETUP);
    each.touch([0, DOWN, 100, 100]);
    const before = each.calls("glp").length;
    each.touch(...moves.map(([x, y]) => [0, MOVE, x, y]));
    const eachWrites = each.calls("glp").length - before;
    // the first event is the callback's, the others wait in the queue
    const drained = await createZonaVM();
    drained.setup(SETUP);
    drained.touch([0, DOWN, 100, 100]);
    const drainedBefore = drained.calls("glp").length;
    drained.queue(...moves.slice(1).map(([x, y]) => [0, MOVE, x, y]));
    drained.touch([0, MOVE, ...moves[0]]);
    const drainedWrites = drained.calls("glp").length - drainedBefore;
    // every position is still sent (the Setup and the first touch aside)
    expect(drained.midi()).toEqual(each.midi());
    // the LEDs end where the newest position puts them
    expect(state(drained)).toEqual(state(each));
    // and there are fewer LED writes: one paint instead of five
    expect(drainedWrites).toBeLessThan(eachWrites / 2);
    // the queue is empty afterwards
    expect(drained.run("return #_q")).toBe(0);
    expect(state(drained).get(led(6, 5))).toBeGreaterThan(16);
  });

  test("a finger lift in the queue ends the touch in the same callback", async () => {
    const vm = await createZonaVM();
    vm.setup(SETUP);
    vm.touch([0, DOWN, 100, 100]);
    vm.clear();
    vm.queue([0, MOVE, 400, 400], [0, 5, 400, 400]);
    vm.touch([0, MOVE, 300, 300]);
    // the move, the next move and the release's output came out in order
    expect(vm.midi().length).toBeGreaterThanOrEqual(4);
    expect(vm.run("return Z.zs[1].k")).toBe(0);
  });

  test("a firmware without the queue calls still works", async () => {
    const vm = await createZonaVM();
    vm.setup(SETUP);
    vm.run("el.touch_pop = nil");
    vm.touch([0, DOWN, 100, 100], [0, MOVE, 300, 300]);
    expect(vm.midi().length).toBeGreaterThan(0);
  });
});

describe("the chain", () => {
  const sent = async (setup, touches, env = {}) => {
    const vm = await createZonaVM(env);
    vm.setup(setup);
    vm.clear();
    vm.touch(...touches);
    return vm;
  };

  test("a zone is built without self and is complete after every call", async () => {
    // the constructor alone is a working fader on the default CC
    const bare = await sent(`Z.v(0,0,1,9)`, [[0, DOWN, 50, 0]]);
    expect(wire(bare)).toEqual([[0, 176, 32, 127]]);
    // every call of the chain leaves a zone that works
    for (const call of [
      `.n("f")`,
      `.col(255,0,0)`,
      `.mode(0)`,
      `.sens(1)`,
      `.cap(0)`,
      `.gms(-1,176,-1,-1)`,
    ]) {
      const vm = await sent(`Z.v(0,0,1,9)${call}`, [[0, DOWN, 50, 0]]);
      expect(wire(vm), call).toEqual([[0, 176, 32, 127]]);
    }
  });

  test("the calls give what the older option table gave", async () => {
    const run = async (setup) => {
      const vm = await createZonaVM({ gmx: 1, gmy: 2, gpc: 1 });
      vm.setup(setup);
      const led = ["gln", "gld", "glx", "glp"].map((fn) => vm.calls(fn));
      const touches = [
        [50, 0],
        [200, 100],
        [796, 0],
        [960, 0],
        [200, 400],
      ].map(([x, y]) => {
        vm.clear();
        vm.touch([0, DOWN, x, y], [0, UP, x, y]);
        return [vm.midi(), vm.calls("gmbs"), vm.calls("ggms")];
      });
      return { led, touches };
    };
    const pairs = [
      [`Z.v(0,0,1,9).n("f1")`, `Z.fader(self,"f1",0,0,1,9,{})`],
      [
        `Z.h(1,1,5,1).n("h").gms(2,176,40,-1)`,
        `Z.fader(self,"h",1,1,5,1,{dir="h",ch=2,num=40})`,
      ],
      [
        `Z.xy(3,0,4,4).n("p").gms(-1,176,-1,-1,1).col(255,0,0).fing(2)`,
        `Z.fader(self,"p",3,0,4,4,{dir="xy",cmd="cc14",col={255,0,0},fingers=2})`,
      ],
      [
        `Z.v(8,0,1,9).n("b").gms(-1,224,-1,-1).spr("50%")`,
        `Z.fader(self,"b",8,0,1,9,{cmd="pb",spring=50})`,
      ],
      [
        `Z.b(1,3,2,2).n("m").mo(2).tog(1)`,
        `Z.button(self,"m",1,3,2,2,{msg="mouse",num=2,bmo=1})`,
      ],
      [
        `Z.v(7,0,1,9).n("g").ga(3).col(0,255,0)`,
        `Z.fader(self,"g",7,0,1,9,{msg="pad",num=3,col={0,255,0}})`,
      ],
    ];
    for (const [chain, old] of pairs) {
      expect(await run(chain), chain).toEqual(await run(old));
    }
    // the order of the calls doesn't matter
    expect(await run(`Z.xy(3,0,4,4).fing(2).col(255,0,0).n("p")`)).toEqual(
      await run(`Z.xy(3,0,4,4).n("p").col(255,0,0).fing(2)`),
    );
  });

  test("gms is the Midi block's: a note, pitch bend, 14-bit CC and NRPN", async () => {
    const top = [[0, DOWN, 50, 0]];
    expect(wire(await sent(`Z.v(0,0,1,9).gms(2,144,40,-1)`, top))).toEqual([
      [2, 144, 40, 127],
    ]);
    expect(wire(await sent(`Z.v(0,0,1,9).gms(-1,224,-1,-1)`, top))).toEqual([
      [0, 224, 127, 127],
    ]);
    expect(wire(await sent(`Z.v(0,0,1,9).gms(2,176,5,-1,1)`, top))).toEqual([
      [2, 176, 5, 127],
      [2, 176, 37, 127],
    ]);
    // an NRPN: the number (MSB 99, LSB 98), then the value on 6; 14-bit adds 38
    expect(wire(await sent(`Z.v(0,0,1,9).gms(2,176,300,-1,2)`, top))).toEqual([
      [2, 176, 99, 2],
      [2, 176, 98, 44],
      [2, 176, 6, 127],
    ]);
    expect(wire(await sent(`Z.v(0,0,1,9).gms(2,176,300,-1,3)`, top))).toEqual([
      [2, 176, 99, 2],
      [2, 176, 98, 44],
      [2, 176, 6, 127],
      [2, 176, 38, 127],
    ]);
    // a button: the default command is a note, -1 is auto
    expect(
      wire(await sent(`Z.b(0,0,2,2).gms(-1,-1,-1,-1)`, [[0, DOWN, 100, 100]])),
    ).toEqual([[0, 144, 32, 127]]);
    // an XY pad sends the NRPN of x and the next one of y
    const xy = wire(await sent(`Z.xy(0,0,9,9).gms(0,176,10,-1,2)`, top));
    expect(xy.filter((e) => e[2] === 98).map((e) => e[3])).toEqual([10, 11]);
  });

  test("spring takes a percentage string or a number, and is off by default", async () => {
    const lastCC = async (call) => {
      const vm = await sent(`Z.v(0,0,1,9)${call}`, [
        [0, DOWN, 40, 300],
        [0, UP, 40, 300],
      ]);
      return vm.midi().at(-1)[3];
    };
    expect(await lastCC(`.spr("0%")`)).toBe(0);
    expect(await lastCC(`.spr("50%")`)).toBe(64);
    expect(await lastCC(`.spr("100%")`)).toBe(127);
    expect(await lastCC(`.spr(50)`)).toBe(64);
    expect(await lastCC(``)).not.toBe(64);
  });

  test("host MIDI is always on for a CC, a 14-bit CC and pitch bend", async () => {
    for (const call of [``, `.gms(-1,176,-1,-1,1)`, `.gms(-1,224,-1,-1)`]) {
      const vm = await createZonaVM();
      vm.setup(`Z.v(0,0,1,9)${call}`);
      vm.rx(0, 224, 0, 100);
      vm.rx(0, 176, 32, 100);
      expect(vm.run("return Z.zs[1].u.v"), call).toBeGreaterThan(0);
    }
    // the mouse, the gamepad and NRPN have no host identity
    for (const call of [`.mo()`, `.ga()`, `.gms(-1,176,32,-1,2)`]) {
      const vm = await createZonaVM();
      vm.setup(`Z.v(0,0,1,9)${call}`);
      const before = vm.run("return Z.zs[1].u.v");
      vm.rx(0, 176, 32, 100);
      vm.rx(0, 176, 6, 100);
      expect(vm.run("return Z.zs[1].u.v"), call).toBe(before);
    }
  });

  test("a Setup that runs again builds the same surface, with fewer zones too", async () => {
    const vm = await createZonaVM();
    const setup = `Z.v(0,0,1,9).n("a") Z.v(1,0,1,9).n("b") Z.v(2,0,1,9).n("c")`;
    vm.setup(setup);
    vm.setup(setup);
    expect(vm.run("return #Z.zs")).toBe(3);
    // the autos count the zones before, not the first run's
    vm.clear();
    vm.touch([0, DOWN, 150, 0]);
    expect(wire(vm)[0][2]).toBe(33);
    // a shorter Setup drops the zone that is gone, and its cells go dark
    vm.touch([0, UP, 150, 0]);
    vm.setup(`Z.v(0,0,1,9).n("a") Z.v(1,0,1,9).n("b")`);
    vm.setup(`Z.v(0,0,1,9).n("a")`);
    expect(vm.run("return #Z.zs")).toBe(1);
    const phase = new Map();
    for (const e of vm.calls("glp")) phase.set(e.args[0], e.args[2]);
    // column 1 (cell x=1 of rows 0 and 1: LEDs 7 and 10) is dark, column 0 lit
    expect(phase.get(7)).toBe(0);
    expect(phase.get(10)).toBe(0);
    expect(phase.get(8)).toBeGreaterThan(0);
  });

  test("a Setup that runs again builds the same surface when the zones have no names", async () => {
    // the same kind and cells show the Setup ran again
    const vm = await createZonaVM();
    const setup = `Z.v(0,0,1,9) Z.v(1,0,1,9) Z.xy(2,0,4,4)`;
    vm.setup(setup);
    vm.setup(setup);
    expect(vm.run("return #Z.zs")).toBe(3);
    vm.clear();
    vm.touch([0, DOWN, 150, 0]);
    expect(wire(vm)[0][2]).toBe(33);
    // a different kind on the same cells is another zone
    const other = await createZonaVM();
    other.setup(`Z.v(0,0,1,9) Z.h(0,0,1,9)`);
    expect(other.run("return #Z.zs")).toBe(2);
  });

  test("a name used twice in a Setup run is the same zone ran again only after a Setup", async () => {
    // a touch seals the surface: the next zone starts a new one
    const vm = await createZonaVM();
    vm.setup(`Z.v(0,0,1,9).n("a") Z.v(1,0,1,9).n("b")`);
    vm.touch([0, DOWN, 50, 0], [0, UP, 50, 0]);
    vm.setup(`Z.v(2,0,1,9).n("c")`);
    expect(vm.run("return #Z.zs")).toBe(1);
  });

  test("a zone is found by its name for Z.set, and may have none", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.v(0,0,1,9).n("a") Z.v(1,0,1,9)`);
    vm.run('Z.set("a", 100)');
    expect(vm.run("return Z.zs[1].u.v")).toBe(100);
    expect(vm.run("return Z.zs[2].u.v")).toBe(0);
  });

  test("a chained call rebuilds only its zone, not the surface", async () => {
    const vm = await createZonaVM();
    let others = "";
    for (let i = 0; i < 9; i++) {
      others += `Z.b(${i},0,1,1).n("z${i}") `;
    }
    vm.setup(others);
    vm.run("_n = 0 function _count() _n = _n + 1 end");
    vm.run('debug.sethook(_count, "", 1)');
    vm.setup(
      `Z.xy(0,2,5,5).n("p").col(255,0,0).gms(-1,176,-1,-1,1).mode(1).spr("50%")`,
    );
    const total = vm.run("debug.sethook() return _n");
    // the constructor builds and darkens the free cells (about 20,000 VM
    // instructions with 9 zones there); each call after it is 1,000 to 3,500.
    // Building the whole surface again on every call would be about 120,000.
    expect(total).toBeLessThan(50000);
    expect(vm.run("return #Z.zs")).toBe(10);
  });

  test("the calls survive compressScript unchanged", () => {
    for (const call of [
      "n",
      "col",
      "gms",
      "mo",
      "ga",
      "mode",
      "sens",
      "spr",
      "cap",
      "fing",
      "tog",
      "tap",
    ]) {
      const line = `_Z.v(0,0,1,9).${call}(1)`;
      expect(GridScript.compressScript(line)).toBe(line);
    }
    // the constructors too
    for (const ctor of ["v", "h", "xy", "b"]) {
      expect(GridScript.compressScript(`_Z.${ctor}(0,0,1,9)`)).toBe(
        `_Z.${ctor}(0,0,1,9)`,
      );
    }
  });
});

test("a colour's alpha reaches the LED curve, 1 when it is left out", async () => {
  const alpha = async (code) => {
    const vm = await createZonaVM();
    vm.setup(code);
    const g = vm.calls("glx").filter((e) => e.args[1] === 1);
    return Number(g[g.length - 1].args[5]);
  };
  expect(await alpha(`Z.b(0,0,1,1).col(255,0,0)`)).toBe(1);
  expect(await alpha(`Z.b(0,0,1,1).col(255,0,0,0.5)`)).toBe(0.5);
  expect(await alpha(`Z.b(0,0,1,1).col(-1,-1,-1,0.25)`)).toBe(0.25);
});

describe("overlapping zones", () => {
  const led = (x, y) => y * 9 + (y % 2 === 0 ? 8 - x : x);
  const both = `Z.xy(0,0,9,9).n("p") Z.b(0,0,9,9).n("b")`;

  test("a touch over both reaches both, and both release", async () => {
    const vm = await built(both);
    vm.touch([0, DOWN, 500, 500], [0, MOVE, 600, 400], [0, UP, 600, 400]);
    const sent = wire(vm);
    // the xy: x and y CCs; the button: note on, then off
    expect(sent.filter((e) => e[1] === 176).length).toBeGreaterThan(0);
    expect(sent.filter((e) => e[1] === 144)).toEqual([
      [0, 144, 34, 127],
      [0, 144, 34, 0],
    ]);
  });

  test("a touch over only one reaches only that one", async () => {
    const vm = await built(`Z.xy(0,0,9,9).n("p") Z.b(0,0,3,3).n("b")`);
    vm.touch([0, DOWN, 900, 900], [0, UP, 900, 900]);
    expect(wire(vm).filter((e) => e[1] === 144)).toEqual([]);
    vm.clear();
    vm.touch([0, DOWN, 100, 100], [0, UP, 100, 100]);
    expect(wire(vm).filter((e) => e[1] === 144).length).toBe(2);
  });

  // what the firmware shows on a cell: the layers added (each is its colour
  // times its phase), cut at full
  const shown = (vm, x, y) => {
    const rgb = [0, 0, 0];
    for (const layer of [1, 2]) {
      const cs = vm
        .calls("glx")
        .filter((e) => e.args[0] === led(x, y) && e.args[1] === layer);
      const ps = vm
        .calls("glp")
        .filter((e) => e.args[0] === led(x, y) && e.args[1] === layer);
      if (!cs.length || !ps.length) continue;
      const c = cs[cs.length - 1].args.slice(2, 5);
      const p = ps[ps.length - 1].args[2];
      for (let i = 0; i < 3; i++) rgb[i] += Math.floor((c[i] * p) / 255);
    }
    return rgb.map((v) => Math.min(v, 255));
  };
  // the Setup's own paint stays in the call list
  async function built(code) {
    const vm = await createZonaVM();
    vm.setup(code);
    return vm;
  }
  const layers = (vm) =>
    vm.run("local t = {} for i, z in ipairs(Z.zs) do t[i] = z.lr end return t");

  test("zones that overlap are on different layers, the others on layer 1", async () => {
    const a = await built(
      `Z.b(0,0,3,3).n("b") Z.xy(0,0,9,9).n("p") Z.b(6,6,3,3).n("c")`,
    );
    expect(layers(a)).toEqual([1, 2, 1]);
    const b = await built(`Z.b(0,0,3,3).n("b") Z.b(5,5,3,3).n("c")`);
    expect(layers(b)).toEqual([1, 1]);
  });

  test("a shared cell shows the colours of both zones added", async () => {
    const vm = await built(
      `Z.b(0,0,9,9).n("b").col(0,0,200) Z.xy(0,0,9,9).n("p").col(200,0,0)`,
    );
    vm.touch([0, DOWN, 500, 500]);
    // the button is held (255) and the crosshair is on (4,4): red and blue
    expect(shown(vm, 4, 4)).toEqual([200, 0, 200]);
    // a cell away from the crosshair: the button's blue, the xy's floor red
    const far = shown(vm, 0, 0);
    expect(far[2]).toBe(200);
    expect(far[0]).toBeLessThan(20);
    expect(far[1]).toBe(0);
  });

  test("the order of the zones doesn't change the mix", async () => {
    const a = await built(
      `Z.b(0,0,9,9).n("b").col(0,0,200) Z.xy(0,0,9,9).n("p").col(200,0,0)`,
    );
    const b = await built(
      `Z.xy(0,0,9,9).n("p").col(200,0,0) Z.b(0,0,9,9).n("b").col(0,0,200)`,
    );
    for (const vm of [a, b]) vm.touch([0, DOWN, 500, 500]);
    expect(shown(b, 4, 4)).toEqual(shown(a, 4, 4));
    expect(shown(b, 0, 0)).toEqual(shown(a, 0, 0));
  });

  test("a sum above full is cut at full", async () => {
    const vm = await built(
      `Z.b(0,0,9,9).n("b").col(200,200,0) Z.xy(0,0,9,9).n("p").col(200,0,200)`,
    );
    vm.touch([0, DOWN, 500, 500]);
    expect(shown(vm, 4, 4)).toEqual([255, 200, 200]);
  });

  test("a zone rebuilt by a chained call keeps its layer and its mix", async () => {
    const vm = await built(
      `Z.b(0,0,9,9).n("b").col(0,0,200) Z.xy(0,0,9,9).n("p").col(200,0,0).col(200,0,0)`,
    );
    expect(layers(vm)).toEqual([1, 2]);
    vm.touch([0, DOWN, 500, 500]);
    expect(shown(vm, 4, 4)).toEqual([200, 0, 200]);
  });

  test("a surface built again without overlaps clears layer 2", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.b(0,0,9,9).n("b") Z.xy(0,0,9,9).n("p")`);
    vm.clear();
    vm.setup(`Z.b(0,0,3,3).n("b") Z.b(5,5,3,3).n("c")`);
    // the last phase written to each LED on layer 2
    const last = new Map();
    for (const e of vm.calls("glp")) {
      if (e.args[1] === 2) last.set(e.args[0], e.args[2]);
    }
    expect(last.size).toBeGreaterThan(0);
    expect([...last.values()].every((v) => v === 0)).toBe(true);
  });
});
