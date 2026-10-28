import { LuaFactory } from "wasmoon";
import { GridScript } from "@intechstudio/grid-protocol";
import zonaSource from "../../content/libraries/zona.lua?raw";

// Firmware globals the library may touch. Each stub records its call; the
// position getters answer from `env` (module at 0,0 on page 0 by default).
const RECORDED = [
  "gms",
  "gtt",
  "glc",
  "glp",
  "gln",
  "gld",
  "glx",
  "ggms",
  "ggbs",
  "gmms",
  "gmbs",
  "gks",
];

// The firmware runs Lua 5.5 (grid-fw 1.5.5), wasmoon runs 5.4. Code that only
// 5.5 rejects passes here, such as assigning to a for-loop variable.
//
// Lua 5.4 VM with the library loaded from the text that reaches the module
// (compressScript, RFC 6.4) and bound as `Z` the way Setup's require does. `el`
// is a fake touch element. Calls are logged as { fn, args, n }, where n is the
// argument count (the firmware's gms refuses anything but 4) and args are
// numbers, with non-integers kept as strings so they stand out.
export async function createZonaVM(env = {}) {
  const lua = await new LuaFactory().createEngine();
  const log = [];
  const pos = { gmx: 0, gmy: 0, gpc: 0, ...env };

  lua.global.set("_rec", (fn, n, ...args) => log.push({ fn, n, args }));
  for (const name of ["gmx", "gmy", "gpc"]) {
    lua.global.set(name, () => pos[name]);
  }
  lua.global.set("_src", GridScript.compressScript(zonaSource));
  lua.doStringSync(`
    local function num(a)
      if math.type(a) == "integer" then return a end
      return tostring(a)
    end
    local function rec(fn, ...)
      local t = table.pack(...)
      for i = 1, t.n do t[i] = num(t[i]) end
      _rec(fn, t.n, table.unpack(t, 1, t.n))
    end
    for _, fn in ipairs({ ${RECORDED.map((e) => `"${e}"`).join(",")} }) do
      _G[fn] = function(...) rec(fn, ...) end
    end
    -- ZONA LED lookup (grid_module.c on the ZONA branch): rows of 9 cells,
    -- serpentine, row 0 = LEDs 8..0
    function glag(e, i)
      local r, c = i // 9, i % 9
      return r * 9 + (r % 2 == 0 and 8 - c or c)
    end
    -- the module's default colour
    function glr() return 10 end
    function glg() return 20 end
    function glb() return 30 end
    -- as simplecolor.lua: -1 = default, 1 entry = max (min /20, mid /2),
    -- 2 = min and max (mid between), 3 = min, mid, max
    function color_curve(c)
      for _, e in ipairs(c) do
        for i, f in ipairs({ glr, glg, glb }) do
          if e[i] == -1 then e[i] = f() end
        end
      end
      local x, y, z = c[1], c[2], c[#c]
      if #c == 1 then
        x = { z[1] // 20, z[2] // 20, z[3] // 20, z[4] }
        y = { z[1] // 2, z[2] // 2, z[3] // 2, z[4] }
      elseif #c == 2 then
        y = {}
        for i = 1, 4 do y[i] = (x[i] + z[i]) // 2 end
      end
      return x, y, z
    end
    el = {}
    function el:ind() return 0 end
    function el:txma(v) rec("txma", v) end
    function el:tyma(v) rec("tyma", v) end
    package.preload.zona = load(_src)
    Z = require("zona")
    -- the global editor-written lines use (the Library block's row)
    _Z = Z
  `);

  return {
    // Runs Setup-like Lua with `self` = the fake element, then the tick of
    // the Timer the first zone kicks.
    setup(code) {
      lua.doStringSync(`local self = el ${code}`);
      lua.doStringSync("Z.tick(el)");
    },
    run(code) {
      return lua.doStringSync(code);
    },
    // Feeds touch_cb(self, id, evt, x, y); steps are [id, evt, x, y].
    touch(...steps) {
      for (const [id, evt, x, y] of steps) {
        lua.doStringSync(`el:touch_cb(${id},${evt},${x},${y})`);
      }
    },
    // An incoming MIDI message {ch, cmd, p1, p2}, from the host by default
    // (header INSTR 13 = report).
    rx(ch, cmd, p1, p2, instr = 13) {
      lua.doStringSync(
        `if el.midirx_cb then el:midirx_cb({${instr},0,0},{${ch},${cmd},${p1},${p2}}) end`,
      );
    },
    // Runs Z.tick n times, as the touch Timer would.
    tick(n = 1) {
      for (let i = 0; i < n; i++) {
        lua.doStringSync("Z.tick(el)");
      }
    },
    // Lua memory in KB after full collections.
    kb() {
      return lua.doStringSync(
        "collectgarbage() collectgarbage() return collectgarbage('count')",
      );
    },
    // Recorded calls of one firmware function since the last clear().
    calls(fn) {
      return log.filter((e) => e.fn === fn);
    },
    // gms calls as [ch, cmd, p1, p2].
    midi() {
      return this.calls("gms").map((e) => e.args);
    },
    clear() {
      log.length = 0;
    },
  };
}

// Touch events as the firmware reports them (RFC 2.1).
export const DOWN = 4;
export const MOVE = 1;
export const UP = 5;
// Down and up in one scan.
export const TAP = 9;
