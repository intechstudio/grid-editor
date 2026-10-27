import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll, vi } from "vitest";
import { createZonaVM, DOWN, MOVE, UP } from "./zona-vm";
import zonaSource from "../../content/libraries/zona.lua?raw";

// library.ts reaches the module through these; Install runs in the VM.
vi.mock("../runtime/runtime", () => ({}));
vi.mock("../main/panels/FileManager/FileManager", async (importOriginal) => ({
  ...(await importOriginal()),
  createDir: vi.fn(),
  fetchDirEntries: vi.fn().mockResolvedValue([{ name: "00", type: "dir" }]),
  invalidateLuaModule: vi.fn(),
  writeFileContent: vi.fn(),
}));
const { invalidateLuaModule } =
  await import("../main/panels/FileManager/FileManager");
const { findBundledLibrary, installLibrary, libraryScriptToLua } =
  await import("../lib/library");

beforeAll(async () => {
  await initLuaFormatter();
});

// Module RAM is the limit on the ZONA (system heap, no Lua cap; RFC 9).
// wasmoon is wasm32 Lua 5.4, close to the module's pointer sizes. Budgets are
// the measured values plus about 10%, so a regression fails.
const BUDGET_KB = {
  library: 60, // measured 54.3 (zona 0.8.4: fingers +4.9; 65.5 in 0.7.2)
  zone: 1.62, // measured 1.51 (fader, no body; 0.8.4: + the os list)
  finger: 1.5, // an xy's extra finger state, measured 1.34
  rxSurface: 29, // 16 faders with rx=1 + Z.start, measured 26.4 (33.9 in 0.8.0)
};

// no body: a zone sends its own MIDI
const MIDI = "nil";
const RX = "rx=1";

// n faders, 1x4 cells, in two rows; opt: their options
function faders(n, opt = "") {
  let code = "";
  for (let i = 0; i < n; i++) {
    code += `Z.fader("z${i}",${i % 9},${Math.floor(i / 9) * 4},1,4,{${opt}},nil) `;
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

  test("per extra finger (xy, allocated on its first touch)", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.xy("p",0,0,9,9,{fingers=5},nil) Z.start(self)`);
    vm.touch([0, DOWN, 100, 100]);
    const base = vm.kb();
    vm.touch(
      [1, DOWN, 300, 300],
      [2, DOWN, 500, 500],
      [3, DOWN, 700, 700],
      [4, DOWN, 900, 900],
    );
    expect((vm.kb() - base) / 4).toBeLessThanOrEqual(BUDGET_KB.finger);
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
});

describe("a zone defined inside a zone body", () => {
  // the zone sends, then its body (wrongly) defines a zone
  const BAD = `Z.button("bad",2,0,2,2,{rx=1},function(self) Z.fader("x",8,8,1,1,{}) end)`;
  const GOOD = `Z.fader("good",0,0,1,9,{rx=1},nil)`;

  async function surface() {
    const vm = await createZonaVM();
    vm.run("print=function(m) _rec('print',1,tostring(m)) end");
    vm.setup(`${BAD} ${GOOD} Z.start(self)`);
    return vm;
  }

  test("in the start run: logged, the surface and its RX stay", async () => {
    const vm = await surface();
    expect(vm.calls("print").map((e) => e.args[0])).toEqual([
      "zone inside a zone body",
    ]);
    expect(vm.run("return #Z.zs .. ',' .. #Z.nz")).toBe("2,0");
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
    vm.setup(`${user} Z.button("b",2,0,2,2,{rx=1},nil) Z.start(self)`);
    expect(vm.run("return el.midirx_cb == Z.rx")).toBe(true);
    vm.touch([0, DOWN, 300, 100]);
    vm.clear();
    vm.run("Z.unload(Z)");
    expect(vm.midi()).toEqual([RELEASE]);
    expect(vm.run("return el.touch_cb")).toBe(null);
    expect(vm.run("return #Z.zs + #Z.nz")).toBe(0);
    vm.clear();
    vm.rx(0, 144, 32, 99);
    expect(vm.calls("user").map((e) => e.args)).toEqual([[99]]);
  });

  test("without a user callback, midirx_cb is cleared", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.fader("f",0,0,1,9,{${RX}},nil) Z.start(self)`);
    vm.run("Z.unload(Z)");
    expect(vm.run("return el.midirx_cb")).toBe(null);
  });

  test("leaves callbacks that aren't its own", async () => {
    const vm = await createZonaVM();
    vm.setup(`Z.fader("f",0,0,1,9,{},${MIDI}) Z.start(self)`);
    vm.run("el.touch_cb=function() end el.midirx_cb=print _t=el.touch_cb");
    vm.run("Z.unload(Z)");
    expect(vm.run("return el.touch_cb == _t and el.midirx_cb == print")).toBe(
      true,
    );
  });

  test("works on an old instance after a new one is loaded", async () => {
    const vm = await createZonaVM();
    vm.setup(`${button()} Z.start(self)`);
    vm.touch([0, DOWN, 300, 100]);
    vm.clear();
    vm.run(
      'Old=Z package.loaded.zona=nil Z=require("zona") assert(Z ~= Old) Old.unload(Old)',
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
    expect(compressed).toContain("function Z.unload()");
    expect(compressed).toContain('Z.VERSION="0.8.7"');
    // size budget of the file on the module
    expect(compressed.length).toBeLessThan(20480);
  });
});

// Install (library.ts): the System Setup loads zona with the Library line,
// the touch Setup defines the zones, and Install runs both again, System
// first, as the module does on a page load. The chunk is compressed and run
// as the module would.
async function installModule(touchSetup) {
  const vm = await createZonaVM();
  const sent = [];
  const line = libraryScriptToLua([{ global: "_Z", file: "zona" }]);
  vm.run(
    `package.preload["/00/zona"]=package.preload.zona sys={} ele={[0]=el,[1]=sys} ` +
      `sys.ini=function(self) ${line} end ` +
      `el.ini=function(self) collectgarbage() collectgarbage() _old=W and next(W)~=nil ${touchSetup} end`,
  );
  invalidateLuaModule.mockImplementation(async () =>
    vm.run(`package.loaded["/00/zona"]=nil`),
  );
  const module = {
    async execLUAImmediateAndEvalaute(code) {
      const lua = GridScript.compressScript(code);
      sent.push({ code, lua });
      const r = vm.run(
        `local t=table.pack((function() ${lua} end)()) return {ok=t[1],n=t[2],err=t[3]}`,
      );
      return { value: [r.ok, r.n ?? null, r.err ?? null] };
    },
  };
  const install = () => installLibrary(findBundledLibrary("zona"), 0, module);
  return { vm, install, sent };
}

// 8 RX faders (CC slots 0-7), a button in the bottom right cell (slot 8)
const TOUCH_SETUP =
  `${faders(8, RX)} Z.button("b",8,8,1,1,{},${MIDI}) Z.start(self)`.replace(
    /\bZ\./g,
    "_Z.",
  );
const CORNER = [950, 950];
// The old instance, its zones and its callbacks, weakly
const MARK_ALL =
  "W=setmetatable({},{__mode='k'}) W[_Z]=1 W[el.touch_cb]=1 for _,z in ipairs(_Z.zs) do W[z]=1 end";

describe("Install re-runs the page's Setups", () => {
  test("a reinstall frees the old instance before the new Setup runs", async () => {
    const { vm, install } = await installModule(TOUCH_SETUP);
    await install();
    const clean = vm.kb();
    vm.touch([0, DOWN, ...CORNER]); // hold the button
    vm.clear();
    vm.run(MARK_ALL);
    await install(); // the user deleted zona.lua and pressed Install
    expect(vm.run("return _old")).toBe(false);
    expect(vm.midi()).toEqual([[0, 144, 40, 0]]);
    vm.run("W=nil");
    expect(Math.abs(vm.kb() - clean)).toBeLessThan(1);
    vm.clear();
    vm.touch([0, UP, ...CORNER], [1, DOWN, ...CORNER]);
    expect(vm.midi()).toEqual([[0, 144, 40, 127]]);
  });

  test("the zones run on the first Install, with nothing loaded before", async () => {
    const { vm, install } = await installModule(TOUCH_SETUP);
    await install();
    expect(vm.run("return #_Z.zs")).toBe(9);
    vm.clear();
    vm.touch([0, DOWN, ...CORNER]);
    expect(vm.midi()).toEqual([[0, 144, 40, 127]]);
  });

  test("a failing Setup is reported with its element", async () => {
    const { install } = await installModule(`error("nope")`);
    await expect(install()).rejects.toThrow(
      /Setup failed on element 0: .*nope/,
    );
  });

  test("the chunk survives compressScript and fits an immediate message", async () => {
    const { install, sent } = await installModule(TOUCH_SETUP);
    await install();
    const { code, lua } = sent[0];
    // the shortify step changes nothing; only spacing is minified
    expect(lua.replace(/\s/g, "")).toBe(code.replace(/\s/g, ""));
    // The firmware drops an immediate chunk longer than
    // GRID_PARAMETER_ACTIONSTRING_maxlength (909, grid_decode.c v1.5.5).
    expect(lua.length).toBeLessThan(500);
  });
});
