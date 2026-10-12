-- ZONA touch zones library (docs/zona-zones-rfc.md).
-- Loaded per page by the Library block: Z=require(p.."zona")
-- The editor reads Z.VERSION from this file (semver, major = breaking block syntax).
-- Uploaded through compressScript, which rewrites firmware human names even in
-- strings, so this file uses short names only.
-- Target is Lua 5.5 (firmware 1.5.5): never assign to a for-loop variable.

local Z = {}

Z.VERSION = "0.2.0"
Z.has = { sres = 10 } -- sensor bits

-- Option defaults. Blocks write only options that differ, so a default may only
-- change in a major version. Mirrored in config-blocks/touch/zone-model.ts; a
-- test checks they match. min/max default to the wire range of the auto mode:
-- 0-127 for res=7, 0-16383 above.
Z.def = {
  read = "axis", -- axis, gate, point, angle
  dir = "v", -- axis direction: v (bottom = min) or h (left = min)
  res = 7, -- 2^res steps inside min-max, 7 to 14
  grab = "focus", -- focus, live
  leave = 0, -- 1: leaving a focus zone releases, re-entry ignored until next down
  mode = "abs", -- abs, rel, glide
}

-- Kinds are option presets over Z.def.
Z.kind = {
  fader = { read = "axis" },
  button = { read = "gate", leave = 1 },
  xy = { read = "point" },
  knob = { read = "angle" },
}

Z.zs = {} -- active zones in Setup order; a zone's index is its position - 1
Z.nz = {} -- zones defined since the last Z.start, swapped in by it
Z.ct = {} -- contact slot -> owning zone, false after a leave release

-- Raw touch range is 0-1023 over 9x9 cells (Z.start sets txma/tyma).
local S = 1024 / 9

-- Zone self: answers the element methods ordinary action blocks call.
local M = {}
M.__index = M

-- Pipeline: route -> pos (clamp) -> read -> put/gate -> run body.

local function run(z, s)
  z.s = s
  if z.f then
    z.f(z)
  end
end

local function put(z, k, val)
  if z.u[k] ~= val then
    z.u[k] = val
    run(z, k)
  end
end

-- Position 0-1 to one of 2^res steps spread over min-max.
local function sc(z, t)
  local n = (1 << z.o.res) - 1
  return math.floor(z.mi + math.floor(t * n + 0.5) * (z.ma - z.mi) / n + 0.5)
end

local function frac(p, a, b)
  return (p - a) / (b - a)
end

-- Sensor y grows downward: y=0 is the top row, like LED row 0 in ZONA.svelte
-- and the firmware's default touch Setup (glag(0,x+y*9)). Vertical values are
-- flipped so the bottom is min.
local rd = {}
rd.axis = function(z, x, y)
  local a = z.a
  local t = z.o.dir == "h" and frac(x, a[1], a[2]) or 1 - frac(y, a[3], a[4])
  put(z, "v", sc(z, t))
end
rd.point = function(z, x, y)
  local a = z.a
  put(z, "x", sc(z, frac(x, a[1], a[2])))
  put(z, "y", sc(z, 1 - frac(y, a[3], a[4])))
end
rd.gate = function() end -- press and release only; angle is not built yet

local function inside(z, x, y)
  local a = z.a
  return x >= a[1] and x <= a[2] and y >= a[3] and y <= a[4]
end

-- Clamps to the zone edge, so a focus contact that leaves stays at the boundary.
local function pos(z, x, y)
  local a = z.a
  x = math.max(a[1], math.min(a[2], x))
  y = math.max(a[3], math.min(a[4], y))
  local r = rd[z.o.read] or rd.gate
  r(z, x, y)
end

-- Sets the gate without running the body. On press it is set before the
-- reader, so value runs already see g=1; the body then runs once for g. A
-- press clears the duplicate filter, so messages meant to repeat go out again.
local function gate(z, g)
  z.u.g = g
  if g == 1 then
    z.l = {}
  end
  if z.o.read == "gate" then
    z.u.v = g == 1 and z.ma or z.mi
  end
end

local function lift(z)
  z.k = z.k - 1
  if z.k == 0 then
    gate(z, 0)
    run(z, "g")
  end
end

function Z.zone(n, x, y, w, h, opt, f, kind)
  local o = {}
  for _, t in ipairs({ Z.def, Z.kind[kind] or {}, opt or {} }) do
    for k, val in pairs(t) do
      o[k] = val
    end
  end
  -- auto CC slot: continuous sources of the zones before (xy 2, others 1)
  local b = 0
  for _, q in ipairs(Z.nz) do
    b = b + (q.o.read == "point" and 2 or 1)
  end
  local z = setmetatable({
    n = n,
    i = #Z.nz,
    b = b,
    o = o,
    f = f,
    -- owned raw bounds, inclusive; neighbouring zones don't overlap
    a = {
      math.ceil(x * S),
      math.ceil((x + w) * S) - 1,
      math.ceil(y * S),
      math.ceil((y + h) * S) - 1,
    },
    mi = o.min or 0,
    ma = o.max or (o.res > 7 and 16383 or 127),
    k = 0, -- contacts held
    l = {}, -- last p2 per (ch,cmd,p1)
  }, M)
  z.u = { v = z.mi, x = z.mi, y = z.mi, g = 0 } -- source values
  Z.nz[#Z.nz + 1] = z
  return z
end

for kind in pairs(Z.kind) do
  Z[kind] = function(n, x, y, w, h, opt, f)
    return Z.zone(n, x, y, w, h, opt, f, kind)
  end
end

-- Known limit: a Setup that errors before Z.start leaves its zones pending,
-- and they are added to the next Setup's list.
function Z.start(self)
  self:txma(1023)
  self:tyma(1023)
  for _, z in ipairs(Z.zs) do -- release held zones, so no note is left stuck
    if z.k > 0 then
      z.k = 0
      gate(z, 0)
      run(z, "g")
    end
  end
  Z.zs = Z.nz
  Z.nz = {}
  Z.ct = {}
  self.touch_cb = Z.touch
  -- dry run for RX sync, midirx_cb and first paint: later slices
end

-- Ends: 5 up, 3 suppressed, 7 unsuppressed up. A tap (9) is a down and an up
-- in one scan.
local function route(id, evt, x, y)
  local z = Z.ct[id]
  if evt == 4 or evt == 5 or evt == 3 or evt == 7 then
    Z.ct[id] = nil
    if z then -- a down on a busy slot lifts the old contact first
      lift(z)
    end
  end
  if evt == 4 then
    for _, c in ipairs(Z.zs) do
      if inside(c, x, y) then
        Z.ct[id] = c
        c.k = c.k + 1
        local p = c.k == 1
        if p then
          gate(c, 1)
        end
        pos(c, x, y)
        if p then
          run(c, "g")
        end
        break
      end
    end
  elseif evt == 1 and z then
    if z.o.leave == 1 and not inside(z, x, y) then
      Z.ct[id] = false
      lift(z)
    else
      pos(z, x, y)
    end
  end
end

function Z.touch(self, id, evt, x, y)
  if Z.raw then
    Z.raw(self, id, evt, x, y)
  end
  if evt == 9 then
    route(id, 4, x, y)
    evt = 5
  end
  route(id, evt, x, y)
end

-- The triggering source's value. A gate run on a continuous zone reports the
-- main value, so the default block resends nothing on release; a press resends
-- the current value once (the filter resets on press).
function M:get_auto_value()
  local s = self.s
  if s == "g" then
    s = self.o.read == "point" and "x" or "v"
  end
  return self.u[s]
end

function M:get_auto_mode()
  return self.o.res > 7 and 1 or 0
end

function M:ind()
  return self.i
end

-- Autos as simplemidi.lua, from the zone, with p1 counted from its CC slot.
-- The firmware's global gms takes exactly 4 arguments, so modes are expanded
-- here like the element method. Repeated p2 to the same (ch,cmd,p1) is dropped
-- until the next press.
function M:gms(ch, cmd, p1, p2, mode)
  if mode == nil or mode == -1 then
    mode = self:get_auto_mode()
  end
  if ch == -1 then
    ch = (gmy() * 4 + gpc()) % 16
  end
  if cmd == -1 then
    cmd = self.o.read == "gate" and 144 or 176
  end
  if p1 == -1 then
    p1 = (32 + gmx() * 16 + self.b + (self.s == "y" and 1 or 0)) % 128
    if mode == 1 then
      p1 = p1 % 32
    end
  end
  if p2 == -1 then
    p2 = self:get_auto_value()
  end
  local k = (ch * 256 + cmd) * 16384 + p1
  if self.l[k] == p2 then
    return
  end
  self.l[k] = p2
  if mode == 1 then
    gms(ch, 176, p1, p2 // 128)
    gms(ch, 176, p1 + 32, p2 % 128)
  elseif mode == 2 or mode == 3 then
    gms(ch, 176, 99, p1 // 128)
    gms(ch, 176, 98, p1 % 128)
    if mode == 2 then
      gms(ch, 176, 6, p2)
    else
      gms(ch, 176, 6, p2 // 128)
      gms(ch, 176, 38, p2 % 128)
    end
  else
    gms(ch, cmd, p1, p2)
  end
end

-- RX sync and painters: later slices.
function M:gmrr() end
function M:glc() end
function M:glp() end

function M:v()
  return self.u.v
end
function M:x()
  return self.u.x
end
function M:y()
  return self.u.y
end
function M:g()
  return self.u.g
end
function M:src()
  return self.s
end

return Z
