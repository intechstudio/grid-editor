import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll, vi } from "vitest";
import { createZonaVM, DOWN, MOVE, UP } from "./zona-vm";
import zonaSource from "../libraries/zona/zona.lua?raw";

// library-device.ts imports the app through these; rerunSetup needs neither.
vi.mock("../main/panels/FileManager/FileManager", () => ({}));
vi.mock("../runtime/runtime.store", () => ({ logger: { set() {} } }));
const { rerunSetup } = await import("../libraries/library-device");

beforeAll(async () => {
  await initLuaFormatter();
});

// Module RAM is the limit on the ZONA (system heap, no Lua cap; RFC 9).
// wasmoon is wasm32 Lua 5.4, close to the module's pointer sizes. Budgets are
// the measured values (zona 0.7.0) plus about 10%, so a regression fails.
const BUDGET_KB = {
  library: 69, // measured 62.9
  zone: 1.8, // measured 1.63 (fader, default MIDI block)
  rxSurface: 36, // 16 faders with RX + Z.start, measured 32.9
};

const MIDI = "function(self) self:gms(-1,-1,-1,-1) end";
const RX =
  "function(self) self:gms(-1,-1,-1,-1) self:gmrr(-1,-1,-1,-1,{true,true},-1) end";

// n faders, 1x4 cells, in two rows
function faders(n, body = MIDI) {
  let code = "";
  for (let i = 0; i < n; i++) {
    code += `Z.fader("z${i}",${i % 9},${Math.floor(i / 9) * 4},1,4,{},${body}) `;
  }
  return code;
}

describe("RAM budget", () => {
  test("library load", async () => {
    const vm = await createZonaVM();
    vm.run("package.loaded.zona=nil package.preload.zona=nil Z=nil");
    const base = vm.kb();
    vm.run("Z=load(_src)()");
    expect(vm.kb() - base).toBeLessThanOrEqual(BUDGET_KB.library);
  });

  test("per zone", async () => {
    const vm = await createZonaVM();
    vm.setup("Z.start(self)"); // surface tables exist already
    const base = vm.kb();
    vm.setup(faders(16));
    expect((vm.kb() - base) / 16).toBeLessThanOrEqual(BUDGET_KB.zone);
  });

  test("16 faders with RX and Z.start", async () => {
    const vm = await createZonaVM();
    vm.setup("Z.start(self)");
    const base = vm.kb();
    vm.setup(`${faders(16, RX)} Z.start(self)`);
    expect(vm.kb() - base).toBeLessThanOrEqual(BUDGET_KB.rxSurface);
  });

  test("re-running Setup doesn't grow", async () => {
    const vm = await createZonaVM();
    const setup = `${faders(16, RX)} Z.start(self)`;
    vm.setup(setup);
    const once = vm.kb();
    for (let i = 0; i < 3; i++) {
      vm.setup(setup);
    }
    expect(vm.kb() - once).toBeLessThan(0.5);
  });
});

// cells 2-3 x 0-1: raw x 228-455, y 0-227
const button = (n = "b") => `Z.button("${n}",2,0,2,2,{},${MIDI})`;
const RELEASE = [0, 144, 32, 0];

// Marks the running zones in a weak table: `return next(W)` is nil once
// nothing else refers to them.
const MARK =
  "W=setmetatable({},{__mode='k'}) for _,z in ipairs(Z.zs) do W[z]=1 end";

describe("Setup re-run releases the previous surface", () => {
  test("the first zone of a run drops the old zones", async () => {
    const vm = await createZonaVM();
    vm.setup(`${faders(4)} Z.start(self)`);
    vm.run(MARK);
    vm.setup(
      `Z.fader("n",0,0,1,9,{},${MIDI}) collectgarbage() collectgarbage() _old=next(W)~=nil ${faders(3)} Z.start(self)`,
    );
    expect(vm.run("return _old")).toBe(false);
    expect(vm.run("return #Z.zs")).toBe(4);
  });

  test("a group first drops them too", async () => {
    const vm = await createZonaVM();
    vm.setup(`${faders(2)} Z.start(self)`);
    vm.run(MARK);
    vm.setup(
      `Z.group(1,{}) collectgarbage() collectgarbage() _old=next(W)~=nil Z.start(self)`,
    );
    expect(vm.run("return _old")).toBe(false);
  });

  test("held notes are released once", async () => {
    const vm = await createZonaVM();
    vm.setup(`${button()} Z.start(self)`);
    vm.touch([0, DOWN, 300, 100]);
    vm.clear();
    vm.setup(`${button()} Z.start(self)`);
    expect(vm.midi()).toEqual([RELEASE]);
    vm.clear();
    vm.touch([0, MOVE, 310, 100], [0, UP, 310, 100]);
    expect(vm.midi()).toEqual([]);
  });

  test("a Setup that fails halfway leaves an empty, harmless surface", async () => {
    const vm = await createZonaVM();
    vm.setup(`${button()} Z.start(self)`);
    vm.touch([0, DOWN, 300, 100]);
    vm.clear();
    expect(() => vm.setup(`${button()} error("half") Z.start(self)`)).toThrow(
      /half/,
    );
    expect(vm.midi()).toEqual([RELEASE]);
    expect(vm.run("return #Z.zs")).toBe(0);
    vm.clear();
    vm.touch([0, MOVE, 310, 100], [0, UP, 310, 100], [1, DOWN, 300, 100]);
    vm.tick(3);
    vm.rx(0, 144, 32, 127);
    expect(vm.midi()).toEqual([]);
  });

  // A Setup runs to its end before any tick or touch, so zones pending then
  // are from a failed run; the next Setup must not append to them.
  test.each([
    ["a tick", (vm) => vm.tick()],
    ["a touch", (vm) => vm.touch([0, DOWN, 900, 900])],
  ])("zones of a failed Setup are dropped at %s", async (_, between) => {
    const clean = await createZonaVM();
    clean.setup(`${faders(3)} Z.start(self)`);
    clean.clear();
    clean.touch([0, DOWN, 250, 0]);

    const vm = await createZonaVM();
    vm.setup(`${faders(1)} Z.start(self)`);
    expect(() => vm.setup(`${faders(2)} error("half")`)).toThrow(/half/);
    expect(vm.run("return #Z.nz")).toBe(2);
    between(vm);
    expect(vm.run("return #Z.nz")).toBe(0);
    vm.setup(`${faders(3)} Z.start(self)`);
    expect(vm.run("return #Z.zs")).toBe(3);
    vm.clear();
    vm.touch([0, DOWN, 250, 0]); // third fader: CC slot 2, as in a clean run
    expect(vm.midi()).toEqual(clean.midi());
    expect(vm.midi()).toEqual([[0, 176, 34, 127]]);
  });

  test("a failed Setup's zones are dropped when the next run repeats a name", async () => {
    const vm = await createZonaVM();
    expect(() => vm.setup(`${faders(2)} error("half")`)).toThrow(/half/);
    vm.setup(`${faders(3)} Z.start(self)`);
    expect(vm.run("return #Z.zs")).toBe(3);
  });

  // Building a Setup block by block: every edit re-runs it, and until Touch
  // Start is added nothing activates (or clears) the pending zones.
  test("Setup re-run 3 times without Touch Start, then with it: 3 zones", async () => {
    const clean = await createZonaVM();
    clean.setup(`${faders(3)} Z.start(self)`);
    clean.clear();
    clean.touch([0, DOWN, 250, 0]);

    const vm = await createZonaVM();
    for (let i = 0; i < 3; i++) {
      vm.setup(faders(3));
    }
    expect(vm.run("return #Z.nz")).toBe(3);
    vm.setup(`${faders(3)} Z.start(self)`);
    expect(vm.run("return #Z.zs")).toBe(3);
    vm.clear();
    vm.touch([0, DOWN, 250, 0]); // third fader: CC slot 2
    expect(vm.midi()).toEqual(clean.midi());
    expect(vm.midi()).toEqual([[0, 176, 34, 127]]);
  });

  test("mapping mode ends with the surface: outputs are unmuted", async () => {
    const vm = await createZonaVM();
    vm.setup(`${button()} Z.start(self)`);
    vm.tick();
    vm.util();
    vm.touch([0, DOWN, 300, 100]); // enters mapping mode, mutes outputs
    expect(vm.run("return Z.mp")).toBe(1);
    vm.touch([0, UP, 300, 100]);
    vm.setup(button());
    expect(vm.run("return Z.mp or Z.mz or Z.ms or Z.mi")).toBe(null);
    vm.clear();
    vm.run("gms(1,2,3,4)");
    expect(vm.midi()).toEqual([[1, 2, 3, 4]]);
  });
});

describe("a zone defined inside a zone body", () => {
  // the body sends, then (wrongly) defines a zone
  const BAD = `Z.button("bad",2,0,2,2,{},function(self) self:gms(-1,-1,-1,-1) self:gmrr(-1,-1,-1,-1,{true,true},-1) Z.fader("x",8,8,1,1,{}) end)`;
  const GOOD = `Z.fader("good",0,0,1,9,{},${RX})`;

  async function surface() {
    const vm = await createZonaVM();
    vm.run("print=function(m) _rec('print',1,tostring(m)) end");
    vm.setup(`${BAD} ${GOOD} Z.start(self)`);
    return vm;
  }

  test("in the dry run: logged, the surface and its RX stay", async () => {
    const vm = await surface();
    expect(vm.calls("print").map((e) => e.args[0])).toEqual([
      "zone inside a zone body",
    ]);
    expect(vm.run("return #Z.zs .. ',' .. #Z.nz")).toBe("2,0");
    // both zones registered RX before the error
    expect(vm.run("local n=0 for _ in pairs(Z.R) do n=n+1 end return n")).toBe(
      2,
    );
    expect(vm.run("return el.midirx_cb == Z.rx")).toBe(true);
  });

  test("on a touch: an error, then everything still works", async () => {
    const vm = await surface();
    vm.clear();
    expect(() => vm.touch([0, DOWN, 300, 100])).toThrow(
      /zone inside a zone body/,
    );
    expect(vm.midi()).toEqual([[0, 144, 32, 127]]); // sent before the error
    expect(vm.run("return #Z.zs .. ',' .. #Z.nz")).toBe("2,0");
    vm.clear();
    vm.touch([1, DOWN, 50, 0]);
    expect(vm.midi()).toEqual([[0, 176, 33, 127]]);
    vm.touch([1, UP, 50, 0]); // touch wins over RX while held
    vm.clear();
    vm.rx(0, 176, 33, 10);
    expect(vm.run("return Z.zs[2]:v()")).toBe(10);
  });

  test("a group too", async () => {
    const vm = await createZonaVM();
    vm.run("print=function(m) _rec('print',1,tostring(m)) end");
    vm.setup(
      `${GOOD} Z.button("g",2,0,1,1,{},function(self) Z.group(1,{}) end) Z.start(self)`,
    );
    expect(vm.calls("print").map((e) => e.args[0])).toEqual([
      "zone inside a zone body",
    ]);
    expect(vm.run("return #Z.zs")).toBe(2);
  });
});

describe("LED lookup", () => {
  // glag is a C call on the module: only for LEDs actually written
  const COUNT =
    "local g=glag _ng=0 glag=function(...) _ng=_ng+1 return g(...) end";

  test("a repaint with no change looks up no LED", async () => {
    const vm = await createZonaVM();
    vm.setup(`${faders(2)} Z.start(self)`);
    vm.run(COUNT);
    vm.run("for _,z in ipairs(Z.zs) do z.dt=1 end");
    vm.tick(3);
    expect(vm.run("return _ng")).toBe(0);
  });

  test("one lookup per written cell", async () => {
    const vm = await createZonaVM();
    vm.setup(`${faders(1)} Z.start(self)`);
    vm.run(COUNT);
    vm.clear();
    vm.touch([0, DOWN, 50, 0]); // full: 4 cells change phase
    vm.tick();
    expect(vm.run("return _ng")).toBe(vm.calls("glp").length);
    expect(vm.calls("glp").length).toBe(4);
  });
});

describe("Z.unload", () => {
  const user = `self.midirx_cb=function(s,h,e) _rec("user",1,e[4]) end`;

  test("releases notes, restores the callbacks and drops the surface", async () => {
    const vm = await createZonaVM();
    vm.setup(
      `${user} Z.button("b",2,0,2,2,{},function(self) self:gms(-1,-1,-1,-1) self:gmrr(-1,-1,-1,-1,{true,true},-1) end) Z.start(self)`,
    );
    expect(vm.run("return el.midirx_cb == Z.rx")).toBe(true);
    vm.touch([0, DOWN, 300, 100]);
    vm.clear();
    vm.run("Z.unload(el)");
    expect(vm.midi()).toEqual([RELEASE]);
    expect(vm.run("return el.touch_cb")).toBe(null);
    expect(vm.run("return #Z.zs + #Z.nz")).toBe(0);
    vm.clear();
    vm.rx(0, 144, 32, 99);
    expect(vm.calls("user").map((e) => e.args)).toEqual([[99]]);
  });

  test("without a user callback, midirx_cb is cleared", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.fader("f",0,0,1,9,{},${RX}) Z.start(self)`);
    vm.run("Z.unload(el)");
    expect(vm.run("return el.midirx_cb")).toBe(null);
  });

  test("leaves callbacks that aren't its own", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.fader("f",0,0,1,9,{},${MIDI}) Z.start(self)`);
    vm.run("el.touch_cb=function() end el.midirx_cb=print _t=el.touch_cb");
    vm.run("Z.unload(el)");
    expect(vm.run("return el.touch_cb == _t and el.midirx_cb == print")).toBe(
      true,
    );
  });

  test("ends mapping mode: outputs are unmuted", async () => {
    const vm = await createZonaVM();
    vm.setup(`${button()} Z.start(self)`);
    vm.tick();
    vm.util();
    vm.touch([0, DOWN, 300, 100]);
    vm.run("Z.unload(el)");
    vm.clear();
    vm.run("gms(1,2,3,4)");
    expect(vm.midi()).toEqual([[1, 2, 3, 4]]);
  });

  test("works on an old instance after a new one is loaded", async () => {
    const vm = await createZonaVM();
    vm.setup(`${button()} Z.start(self)`);
    vm.touch([0, DOWN, 300, 100]);
    vm.clear();
    vm.run(
      'Old=Z package.loaded.zona=nil Z=require("zona") assert(Z ~= Old) Old.unload(el)',
    );
    expect(vm.midi()).toEqual([RELEASE]);
    expect(vm.run("return el.touch_cb")).toBe(null);
    vm.setup(`${button()} Z.start(self)`);
    vm.clear();
    vm.touch([0, DOWN, 300, 100]);
    expect(vm.midi()).toEqual([[0, 144, 32, 127]]);
  });

  test("survives compressScript (RFC 2.1)", () => {
    const compressed = GridScript.compressScript(zonaSource);
    expect(compressed).toContain("function Z.unload(self)");
    expect(compressed).toContain('Z.VERSION="0.7.2"');
    // size budget of the file on the module
    expect(compressed.length).toBeLessThan(20480);
  });
});

// The Library block's Update/Reload path (library-device.ts rerunSetup), with
// the chunk compressed and run as the module would.
async function libraryModule(setup) {
  const vm = await createZonaVM();
  const sent = [];
  vm.run(
    `ele={[0]=el} el.ini=function(self) collectgarbage() collectgarbage() _old=W and next(W)~=nil ${setup} end`,
  );
  const module = {
    async execLUAImmediateAndEvalaute(code) {
      const lua = GridScript.compressScript(code);
      sent.push(lua);
      const r = vm.run(
        `local t=table.pack((function() ${lua} end)()) return {ok=t[1],err=t[2]}`,
      );
      return { value: [r.ok, r.err ?? null] };
    },
  };
  return { vm, module, sent };
}

// 8 RX faders (CC slots 0-7), a button in the bottom right cell (slot 8)
const SETUP = `Z=require("zona") ${faders(8, RX)} Z.button("b",8,8,1,1,{},${MIDI}) Z.start(self)`;
const CORNER = [950, 950];
// Update: the file is rewritten and the cached module dropped
const INVALIDATE = "package.loaded.zona=nil";
// The old instance, its zones and its callbacks, weakly
const MARK_ALL =
  "W=setmetatable({},{__mode='k'}) W[Z]=1 W[el.touch_cb]=1 for _,z in ipairs(Z.zs) do W[z]=1 end";

describe("Library block re-run (Update, Reload)", () => {
  test("Update: the old instance is gone before the new Setup runs", async () => {
    const { vm, module } = await libraryModule(SETUP);
    await rerunSetup(0, module, ["Z"]);
    const clean = vm.kb();
    vm.touch([0, DOWN, ...CORNER]); // hold the button
    vm.clear();
    vm.run(`${MARK_ALL} ${INVALIDATE}`);
    await rerunSetup(0, module, ["Z"]);
    expect(vm.run("return _old")).toBe(false);
    expect(vm.midi()).toEqual([[0, 144, 40, 0]]);
    vm.run("W=nil");
    expect(Math.abs(vm.kb() - clean)).toBeLessThan(1);
    vm.clear();
    vm.touch([0, UP, ...CORNER], [1, DOWN, ...CORNER]);
    expect(vm.midi()).toEqual([[0, 144, 40, 127]]);
  });

  test("without the release, Setup runs with the old instance alive", async () => {
    const { vm, module } = await libraryModule(SETUP);
    await rerunSetup(0, module);
    vm.run(`${MARK_ALL} ${INVALIDATE}`);
    await rerunSetup(0, module);
    expect(vm.run("return _old")).toBe(true);
  });

  test("Reload: the same instance is unloaded and bound again", async () => {
    const { vm, module } = await libraryModule(SETUP);
    await rerunSetup(0, module, ["Z"]);
    vm.run("Old=Z");
    await rerunSetup(0, module, ["Z"]);
    expect(vm.run("return Z == Old and #Z.zs")).toBe(9);
  });

  test("globals without unload are cleared; an unload error doesn't stop Setup", async () => {
    const { vm, module } = await libraryModule(
      `L=L or {} B=B or {unload=function() error("bad") end} ${SETUP}`,
    );
    await rerunSetup(0, module, ["L", "B", "Z"]);
    vm.run("Lold, Bold = L, B");
    await rerunSetup(0, module, ["L", "B", "Z"]);
    expect(vm.run("return L ~= Lold and B ~= Bold and #Z.zs")).toBe(9);
  });

  test("a failing Setup is reported", async () => {
    const { module } = await libraryModule(`error("nope")`);
    await expect(rerunSetup(0, module, ["Z"])).rejects.toThrow(
      /Setup failed: .*nope/,
    );
  });

  test("the chunk survives compressScript: no firmware human names", async () => {
    const { module, sent } = await libraryModule(SETUP);
    await rerunSetup(0, module, ["Z"]);
    const raw =
      'local e=ele[0] if not(e and e.ini)then return false,"no Setup" end ' +
      'for _,n in ipairs({"Z"}) do local g=rawget(_G,n) if type(g)=="table" and type(g.unload)=="function" then pcall(g.unload,e) end ' +
      "_G[n]=nil end collectgarbage() local ok,err=pcall(e.ini,e) return ok,ok and nil or tostring(err):sub(1,120)";
    // the shortify step changes nothing; only spacing is minified
    expect(sent[0].replace(/\s/g, "")).toBe(raw.replace(/\s/g, ""));
    // The firmware drops an immediate chunk longer than
    // GRID_PARAMETER_ACTIONSTRING_maxlength (909, grid_decode.c v1.5.5);
    // each further global adds about 4 characters.
    expect(sent[0].length).toBeLessThan(300);
  });
});
