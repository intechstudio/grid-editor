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
  expect(vm.run("return type(Z.zone)")).toBe("function");
  expect(GridScript.compressScript(zonaSource)).toMatch(
    /^local LIB_NAME="_Z" local LIB_VERSION="\d+\.\d+\.\d+"/,
  );
});

test("the library fits on the module after compressScript", () => {
  const compressed = GridScript.compressScript(zonaSource);
  expect(compressed).toContain("function Z.unload()");
  expect(compressed.length).toBeLessThan(21504);
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

test("a fader with cmd=cc14 sends a 14-bit CC pair, and the old res option still does", async () => {
  for (const opt of [`cmd="cc14"`, `res=14`]) {
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

test("the old speed option still scales a mouse XY", async () => {
  const vm = await zones(
    `Z.fader(self,"p",0,0,9,9,{dir="xy",msg="mouse",speed=2})`,
  );
  vm.touch([0, DOWN, 100, 500], [0, MOVE, 110, 500]);
  expect(mouse(vm, "gmms")).toEqual([[1, 20]]);
});

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
    `Z.button(self,"b",2,0,2,2,{msg="mouse",num=2}) Z.button(self,"t",4,0,2,2,{msg="mouse",bmo=1,group=1}) Z.button(self,"a",6,0,2,2,{group=1})`,
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
  // another button of its group, set from the host, releases the lock
  vm.clear();
  vm.touch([0, TAP, 500, 100]);
  vm.run(`Z.set("a",127)`);
  expect(mouse(vm, "gmbs")).toEqual([
    [1, 1],
    [1, 0],
  ]);
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
    `Z.fader(self,"p",4,0,5,5,{dir="xy",msg="pad",spring=1})`,
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
  // the old option, 1, is the centre
  expect(await lastCC(`spring=1`)).toBe(64);
});

test("a gamepad button presses while held", async () => {
  const vm = await zones(`Z.button(self,"b",2,0,2,2,{msg="pad",num=3})`);
  vm.touch([0, DOWN, 300, 100], [0, UP, 300, 100]);
  expect(mouse(vm, "ggbs")).toEqual([
    [3, 1],
    [3, 0],
  ]);
});

test("MIDI from the host sets a zone's value without sending", async () => {
  const vm = await zones(`Z.fader(self,"f",0,0,1,9,{rx=1})`);
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
  const BUDGET_KB = 92; // measured 84.1
  const vm = await createZonaVM();
  vm.run("package.loaded.zona=nil package.preload.zona=nil Z=nil _Z=nil");
  const base = vm.kb();
  let faders = "";
  for (let i = 0; i < 16; i++) {
    faders += `Z.fader(self,"z${i}",${i % 9},${Math.floor(i / 9) * 4},1,4,{}) `;
  }
  vm.run("Z=load(_src)()");
  vm.setup(`${faders}`);
  expect(vm.kb() - base).toBeLessThanOrEqual(BUDGET_KB);
});

test("a zone colour is a {red, green, blue, alpha} table, or the old hex text", async () => {
  const paint = async (opt) => {
    const vm = await createZonaVM();
    vm.setup(`Z.button(self,"b",0,0,1,1,{${opt}})`);
    return ["gln", "gld", "glx"].map((fn) => vm.calls(fn));
  };
  const table = await paint(`col={255,128,0,1}`);
  expect(table[2].length).toBeGreaterThan(0);
  expect(await paint(`col="ff8000"`)).toEqual(table);
  // the module's own colour differs
  expect(await paint(`col={-1,-1,-1,1}`)).not.toEqual(table);
  expect(await paint(``)).toEqual(await paint(`col={-1,-1,-1,1}`));
});

test("Z.zone takes the zone by position, and a short table leaves the defaults", async () => {
  const run = async (line) => {
    const vm = await createZonaVM();
    vm.setup(line);
    const led = ["gln", "gld", "glx", "glp"].map((fn) => vm.calls(fn));
    vm.clear();
    vm.touch([0, DOWN, 50, 0], [0, UP, 50, 0]);
    return { led, midi: vm.midi() };
  };
  const old = await run(`Z.fader(self,"f",0,0,1,9,{})`);
  expect(old.midi.length).toBeGreaterThan(0);
  // empty or missing tables are the defaults
  expect(await run(`Z.zone(self,"f",0,{0,0,1,9},{},{},{},{},{})`)).toEqual(old);
  expect(await run(`Z.zone(self,"f",0,{0,0,1,9},{})`)).toEqual(old);
  // slots by position: the output, the range and the colour
  expect(
    await run(
      `Z.zone(self,"f",0,{0,0,1,9},{255,0,0,1},{"midi","cc",2,40,0},{0,100})`,
    ),
  ).toEqual(
    await run(
      `Z.fader(self,"f",0,0,1,9,{col={255,0,0,1},msg="midi",cmd="cc",ch=2,num=40,rx=0,min=0,max=100})`,
    ),
  );
  // the type by number (0 v, 1 h, 2 xy, 3 button), or by its older name
  for (const [code, name] of [
    [0, "v"],
    [1, "h"],
    [2, "xy"],
  ]) {
    expect(await run(`Z.zone(self,"f",${code},{0,0,4,4},{})`)).toEqual(
      await run(`Z.zone(self,"f","${name}",{0,0,4,4},{})`),
    );
  }
  expect(await run(`Z.zone(self,"f",2,{0,0,4,4},{})`)).toEqual(
    await run(`Z.fader(self,"f",0,0,4,4,{dir="xy"})`),
  );
  // the output as a number (0 CC, 1 CC 14-bit, 2 Note, 3 Pitch bend, 4 Mouse,
  // 5 Gamepad), mode and grab as numbers, and the earlier build's strings
  expect(
    await run(
      `Z.zone(self,"f",0,{0,0,1,9},{},{3,2,7,0},{0,16383},{1,1,50},{1,1,1})`,
    ),
  ).toEqual(
    await run(
      `Z.zone(self,"f","v",{0,0,1,9},{},{"midi","pb",2,7,0},{0,16383},{"rel",1,50},{1,1,"live"})`,
    ),
  );
  expect(
    await run(
      `Z.zone(self,"f",0,{0,0,1,9},{},{3,2,7,0},{0,16383},{1,1,50},{1,1,1})`,
    ),
  ).toEqual(
    await run(
      `Z.fader(self,"f",0,0,1,9,{msg="midi",cmd="pb",ch=2,num=7,rx=0,min=0,max=16383,mode="rel",sensitivity=1,spring=50,fingers=1,tap=1,grab="live"})`,
    ),
  );
  expect(await run(`Z.zone(self,"f",0,{0,0,1,9},{},{4})`)).toEqual(
    await run(`Z.fader(self,"f",0,0,1,9,{msg="mouse"})`),
  );
  // a button is the type 3
  expect(await run(`Z.zone(self,"b",3,{0,0,2,2},{})`)).toEqual(
    await run(`Z.button(self,"b",0,0,2,2,{})`),
  );
});

// The xy pad paints only the cells around each crosshair, in 1/8 cell steps.
describe("the xy pad paint", () => {
  const SETUP = `Z.zone(self,"p",2,{0,0,9,9},{},{0,-1,-1,0},{0,127},{0,1,-1,0,0},{2,1,0})`;
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
  const SETUP = `Z.zone(self,"p",2,{0,0,9,9},{},{0,-1,-1,0},{0,127},{0,1,-1,0,0},{1,1,0})`;
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
