import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, beforeAll } from "vitest";
import { createZonaVM, DOWN, MOVE, UP, TAP } from "./zona-vm";
import zonaSource from "../../content/libraries/zona.lua?raw";
import {
  zoneDefaults,
  zoneKinds,
  zoneTickDefaults,
} from "../config-blocks/touch/zone-model";

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
  expect(compressed.length).toBeLessThan(20480);
});

test("the library defaults match zone-model.ts", async () => {
  const vm = await createZonaVM();
  expect(vm.run("return Z.def")).toEqual(zoneDefaults);
  expect(vm.run("return Z.kind")).toEqual(zoneKinds);
  expect(vm.run("return Z.tdef")).toEqual(zoneTickDefaults);
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

test("a fader with cmd=pb sends pitch bend, LSB then MSB", async () => {
  const vm = await zones(`Z.fader(self,"f",0,0,1,9,{cmd="pb"})`);
  vm.touch([0, DOWN, 50, 0]);
  expect(wire(vm)).toEqual([[0, 224, 127, 127]]);
});

test("an XY pad sends x and y on neighbouring CCs", async () => {
  // cells 4-8 x 0-4: raw x 456-1023, y 0-568
  const vm = await zones(`Z.xy(self,"p",4,0,5,5,{})`);
  vm.touch([0, DOWN, 1023, 0], [0, MOVE, 456, 568]);
  vm.tick(); // the move waits for the tick after the press
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

test("a mouse XY sends the finger's move once per tick, summed per axis", async () => {
  const vm = await zones(`Z.xy(self,"p",0,0,9,9,{msg="mouse",speed=2})`);
  vm.touch([0, DOWN, 500, 500], [0, MOVE, 510, 497], [0, MOVE, 520, 494]);
  expect(mouse(vm, "gmms")).toEqual([]);
  vm.tick();
  expect(mouse(vm, "gmms")).toEqual([
    [1, 40],
    [2, -12],
  ]);
  vm.clear();
  vm.tick();
  vm.touch([0, UP, 520, 494]);
  expect(mouse(vm, "gmms")).toEqual([]);
  expect(wire(vm)).toEqual([]);
});

test("a big mouse move is cut at 127, so the pointer stops with the finger", async () => {
  const vm = await zones(`Z.xy(self,"p",0,0,9,9,{msg="mouse"})`);
  vm.touch([0, DOWN, 100, 500], [0, MOVE, 300, 500]);
  vm.tick(2);
  expect(mouse(vm, "gmms")).toEqual([[1, 127]]);
});

test("a quick tap on a mouse XY clicks left on lift", async () => {
  const vm = await zones(`Z.xy(self,"p",0,0,9,9,{msg="mouse"})`);
  vm.touch([0, DOWN, 500, 500], [0, MOVE, 505, 498]);
  vm.tick(3);
  expect(mouse(vm, "gmbs")).toEqual([]);
  vm.touch([0, UP, 505, 498]);
  expect(mouse(vm, "gmbs")).toEqual([[1, 1]]);
  // held a whole tick: a release in the same scan never reaches the computer
  vm.tick();
  expect(mouse(vm, "gmbs")).toEqual([[1, 1]]);
  vm.tick();
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

test("a mouse XY with tap=0 doesn't click", async () => {
  const vm = await zones(`Z.xy(self,"p",0,0,9,9,{msg="mouse",tap=0})`);
  vm.touch([0, TAP, 500, 500]);
  expect(mouse(vm, "gmbs")).toEqual([]);
});

test("a tap doesn't release a drag-locked left button", async () => {
  const vm = await zones(
    `Z.xy(self,"p",0,2,9,7,{msg="mouse"}) Z.button(self,"t",4,0,2,2,{msg="mouse",bmo=1})`,
  );
  vm.touch([0, TAP, 500, 100], [0, TAP, 500, 500]);
  expect(mouse(vm, "gmbs")).toEqual([[1, 1]]);
});

test("a mouse XY touch that moves far or holds long doesn't click", async () => {
  const vm = await zones(`Z.xy(self,"p",0,0,9,9,{msg="mouse"})`);
  vm.touch([0, DOWN, 500, 500], [0, MOVE, 520, 500], [0, MOVE, 500, 500]);
  vm.touch([0, UP, 500, 500]);
  vm.touch([0, DOWN, 500, 500]);
  vm.tick(10);
  vm.touch([0, UP, 500, 500]);
  expect(mouse(vm, "gmbs")).toEqual([]);
});

test("a mouse fader scrolls up when dragged towards its max", async () => {
  const vm = await zones(`Z.fader(self,"f",0,0,1,9,{msg="mouse"})`);
  vm.touch([0, DOWN, 50, 800], [0, MOVE, 50, 480]);
  vm.tick();
  vm.touch([0, MOVE, 50, 800]);
  vm.tick();
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
  const vm = await zones(`Z.xy(self,"p",4,0,5,5,{msg="pad",spring=1})`);
  vm.touch([0, DOWN, 1023, 0], [0, UP, 1023, 0]);
  expect(mouse(vm, "ggms")).toEqual([
    [0, 127],
    [1, 127],
    [0, 0],
    [1, 0],
  ]);
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
  vm.tick();
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
  expect(vm.run("return #Z.zs + #Z.nz")).toBe(0);
  vm.rx(0, 144, 32, 99);
  expect(vm.calls("user").map((e) => e.args)).toEqual([[99]]);
});

test("led=0 keeps a zone dark while a default zone lights up", async () => {
  // LED of cell (x,y): serpentine rows of 9, row 0 = LEDs 8..0
  const led = (x, y) => y * 9 + (y % 2 === 0 ? 8 - x : x);
  const column = (x) => Array.from({ length: 9 }, (_, y) => led(x, y));
  const vm = await zones(
    `Z.fader(self,"f",0,0,1,9,{led=0}) Z.fader(self,"g",1,0,1,9,{})`,
  );
  vm.touch([0, DOWN, 50, 0], [1, DOWN, 150, 0]);
  vm.tick();
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
