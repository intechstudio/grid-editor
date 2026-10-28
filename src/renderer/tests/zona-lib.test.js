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
const button = `Z.button("b",2,0,2,2,{})`;

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

test("the library loads and declares its version in the header", async () => {
  const vm = await createZonaVM();
  expect(vm.run("return type(Z.start)")).toBe("function");
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
  const vm = await zones(`Z.fader("f",0,0,1,9,{})`);
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
  const vm = await zones(`Z.button("b",2,0,2,2,{bmo=1})`);
  vm.touch([0, TAP, 300, 100], [0, TAP, 300, 100]);
  expect(wire(vm)).toEqual([
    [0, 144, 32, 127],
    [0, 144, 32, 0],
  ]);
});

test("an XY pad sends x and y on neighbouring CCs", async () => {
  // cells 4-8 x 0-4: raw x 456-1023, y 0-568
  const vm = await zones(`Z.xy("p",4,0,5,5,{})`);
  vm.touch([0, DOWN, 1023, 0], [0, MOVE, 456, 568]);
  expect(wire(vm)).toEqual([
    [0, 176, 32, 127],
    [0, 176, 33, 127],
    [0, 176, 32, 0],
    [0, 176, 33, 0],
  ]);
});

test("MIDI from the host sets a zone's value without sending", async () => {
  const vm = await zones(`Z.fader("f",0,0,1,9,{rx=1})`);
  vm.rx(0, 176, 32, 100);
  expect(vm.run("return Z.zs[1].u.v")).toBe(100);
  vm.tick();
  expect(vm.calls("gms")).toEqual([]);
});

test("running Setup again replaces the zones and releases held notes", async () => {
  const vm = await zones(button);
  vm.touch([0, DOWN, 300, 100]);
  vm.clear();
  vm.setup(`Z.fader("f",0,0,1,9,{}) Z.start(self)`);
  expect(vm.midi()).toEqual([[0, 144, 32, 0]]);
  expect(vm.run("return #Z.zs")).toBe(1);
  vm.clear();
  vm.touch([0, UP, 300, 100], [1, DOWN, 50, 0]);
  expect(vm.midi()).toEqual([[0, 176, 32, 127]]);
});

test("Z.unload releases notes, gives back the callbacks and drops the zones", async () => {
  const vm = await createZonaVM();
  vm.setup(
    `self.midirx_cb=function(s,h,e) _rec("user",1,e[4]) end Z.button("b",2,0,2,2,{rx=1}) Z.start(self)`,
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
    `Z.fader("f",0,0,1,9,{led=0}) Z.fader("g",1,0,1,9,{})`,
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
    faders += `Z.fader("z${i}",${i % 9},${Math.floor(i / 9) * 4},1,4,{}) `;
  }
  vm.run("Z=load(_src)()");
  vm.setup(`${faders} Z.start(self)`);
  expect(vm.kb() - base).toBeLessThanOrEqual(BUDGET_KB);
});
