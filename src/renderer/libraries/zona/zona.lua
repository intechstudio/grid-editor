-- ZONA touch zones (docs/zona-zones-rfc.md). VERSION: semver, major = block syntax.
-- compressScript rewrites firmware human names, even in strings: short names only.
-- Lua 5.5 (firmware 1.5.5): never assign to a for-loop variable.

local Z = {}

Z.VERSION = "0.3.0"
Z.has = { sres = 10 } -- sensor bits

-- Defaults: blocks omit them, so they change only in a major version. Mirrored
-- in zone-model.ts (tested). min/max default to 0-127 (res 7) or 0-16383.
Z.def = {
  read = "axis", -- axis, gate, point, angle
  dir = "v", -- v: bottom = min, h: left = min
  res = 7, -- 2^res steps inside min-max, 7 to 14
  grab = "focus", -- focus, live
  leave = 0, -- 1: leaving releases, re-entry ignored until next down
  mode = "abs", -- abs, rel, glide
  speed = 1, -- rel: drag factor; glide: 1 = full range in 50 ticks
  ease = 0, -- glide: share of the remaining distance added per tick
  contact = "new", -- later contacts: new, move (glide), grab (rel)
  drag = "n", -- knob: v or h reads a straight drag
  bmo = 0, -- gate: 0 momentary, 1 toggle, n = n+1 steps
  group = 0, -- gate: radio group 1-8, 0 none
}

Z.kind = {
  fader = { read = "axis" },
  button = { read = "gate", leave = 1 },
  xy = { read = "point" },
  knob = { read = "angle" },
}

-- Z.group defaults; empty=0 keeps one member on.
Z.gdef = { empty = 1 }

Z.zs = {} -- active zones, index = position - 1; Z.start swaps in pending Z.nz
Z.nz = {}
Z.gp = {} -- group settings, pending in Z.ng
Z.ng = {}
Z.ct = {} -- slot -> {z = owner, m = mode, p = last readings}, false after leave

local S = 1024 / 9 -- raw 0-1023 over 9 cells
local KS = { "v", "x", "y" } -- continuous sources

-- Zone self: answers the element methods action blocks call.
local M = {}
M.__index = M

-- route -> pos (clamp) -> read -> mode -> put/gate -> run. Sources keep a
-- position q (0-1); values are q in steps.

local function tr(a)
  return a < 0 and math.ceil(a) or math.floor(a)
end

local function cl(t)
  return math.max(0, math.min(1, t))
end

-- d(): change since the source's last run, in value units, fraction carried.
local function run(z, s)
  z.s = s
  z.dd = 0
  local q = z.q[s]
  if q and z.o.read ~= "gate" then
    local d = tr(z.mi + q * (z.ma - z.mi) - z.r[s])
    z.r[s] = z.r[s] + d
    z.dd = d
  end
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

-- 0-1 to one of 2^res steps over min-max.
local function sc(z, t)
  local n = (1 << z.o.res) - 1
  return math.floor(z.mi + math.floor(t * n + 0.5) * (z.ma - z.mi) / n + 0.5)
end

local function frac(p, a, b)
  return (p - a) / (b - a)
end

-- a toward b by s plus e of the distance left (glide; spring, smoothing later).
local function ap(a, b, s, e)
  local d = b - a
  local m = math.abs(d) * e + s
  if m >= math.abs(d) then
    return b
  end
  return a + (d > 0 and m or -m)
end

-- Mode stage: t along source k (0-1; an angle wraps every w), contact c.
local function md(z, c, k, t, w)
  local p = c.p[k]
  if c.m == "rel" then -- the first reading only sets the reference
    if p then
      local d = t - p
      if w and math.abs(d) > w / 2 then
        d = d - (d > 0 and w or -w)
      end
      z.tg[k] = nil
      z.q[k] = cl(z.q[k] + d * z.o.speed)
    end
  else
    if w and c.h then -- held: pick up within 0.05 of the value, like a pot
      if math.abs(cl(t) - (z.tg[k] or z.q[k])) >= 0.05 then
        return
      end
      c.h = nil
    elseif w and p and math.abs(t - p) > 0.5 then
      c.h = 1 -- jump over half the travel = crossed the knob gap
      return
    end
    if c.m == "glide" then
      z.tg[k] = cl(t)
    else
      z.tg[k] = nil
      z.q[k] = cl(t)
    end
  end
  c.p[k] = t
  put(z, k, sc(z, z.q[k]))
end

-- Sensor y=0 is the top row (ZONA.svelte, firmware glag(0,x+y*9)): flip y.
local rd = {}
rd.axis = function(z, c, x, y)
  local a = z.a
  local h = (z.o.read == "angle" and z.o.drag or z.o.dir) == "h"
  md(z, c, "v", h and frac(x, a[1], a[2]) or 1 - frac(y, a[3], a[4]))
end
rd.point = function(z, c, x, y)
  local a = z.a
  md(z, c, "x", frac(x, a[1], a[2]))
  md(z, c, "y", 1 - frac(y, a[3], a[4]))
end
-- Clockwise from the bottom, 300 degree arc from 30: min lower left, max lower
-- right. Within 1/8 of the side from the centre the angle is noise: ignored.
rd.angle = function(z, c, x, y)
  local a = z.a
  local dx, dy = x - (a[1] + a[2]) / 2, y - (a[3] + a[4]) / 2
  local r = math.min(a[2] - a[1], a[4] - a[3]) / 8
  if dx * dx + dy * dy < r * r then
    return
  end
  md(z, c, "v", (math.deg(math.atan(-dx, dy)) % 360 - 30) / 300, 1.2)
end
rd.gate = function() end -- press and release only

local function inside(z, x, y)
  local a = z.a
  return x >= a[1] and x <= a[2] and y >= a[3] and y <= a[4]
end

local function find(x, y)
  for _, z in ipairs(Z.zs) do
    if inside(z, x, y) then
      return z
    end
  end
end

-- Clamped: a focus contact that leaves stays at the edge.
local function pos(z, c, x, y)
  local a = z.a
  x = math.max(a[1], math.min(a[2], x))
  y = math.max(a[3], math.min(a[4], y))
  local r = rd[z.o.read] or rd.gate
  if z.o.read == "angle" and z.o.drag ~= "n" then
    r = rd.axis
  end
  r(z, c, x, y)
end

-- Sets gate and button value, no body run (on press value runs see g=1). A
-- press clears the duplicate filter (on a gate zone only if the step changes),
-- so per-press messages repeat. A press moves to the next step value, wrapping.
local function gate(z, g)
  z.u.g = g
  if z.o.read ~= "gate" then
    if g == 1 then
      z.l = {}
    end
    return
  end
  local st = z.st
  if z.o.bmo == 0 then
    st = g
  elseif g == 1 then
    st = (st + 1) % #z.sv
  end
  local n = z.o.group
  if n > 0 then
    if st == 0 and z.st > 0 and (Z.gp[n] or Z.gdef).empty == 0 then
      st = 1 -- the last member on stays on
    end
    if st > 0 then -- the others go off first
      for _, o in ipairs(Z.zs) do
        if o ~= z and o.o.group == n and o.o.read == "gate" and o.st > 0 then
          o.st = 0
          o.u.v = o.sv[1]
          run(o, "g")
        end
      end
    end
  end
  if g == 1 and st ~= z.st then
    z.l = {}
  end
  z.st = st
  z.u.v = z.sv[st + 1]
end

-- The first contact presses with the zone's mode, later ones follow contact.
-- Entering a live zone (e) reads abs.
local function take(c, z, x, y, e)
  c.z = z
  c.p = {}
  z.k = z.k + 1
  local p = z.k == 1
  local o = z.o
  c.m = not p and (o.contact == "move" and "glide" or o.contact == "grab" and "rel") or o.mode
  if p then
    gate(z, 1)
  end
  local m = c.m
  if e then
    c.m = "abs"
  end
  pos(z, c, x, y)
  c.m = m
  if p then
    run(z, "g")
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
  -- auto CC slot: zones before count xy 2, others 1
  local b = 0
  for _, q in ipairs(Z.nz) do
    b = b + (q.o.read == "point" and 2 or 1)
  end
  local mi = o.min or 0
  local ma = o.max or (o.res > 7 and 16383 or 127)
  -- the editor's step values (SettingsButton.calculateStepValuesFirmwareStyle);
  -- the firmware has more when floor(range/bmo)*(bmo+1) <= range
  local sv = { mi }
  if o.read == "gate" then
    local c = math.max(o.bmo, 1)
    for s = 1, c do
      sv[s + 1] = sv[s] + tr((ma - mi) / c)
    end
    if o.bmo == 0 then
      sv[2] = ma
    end
  end
  local z = setmetatable({
    n = n,
    i = #Z.nz,
    b = b,
    o = o,
    f = f,
    -- raw bounds, inclusive, no overlap
    a = {
      math.ceil(x * S),
      math.ceil((x + w) * S) - 1,
      math.ceil(y * S),
      math.ceil((y + h) * S) - 1,
    },
    mi = mi,
    ma = ma,
    sv = sv,
    st = 0, -- step index
    k = 0, -- contacts held
    l = {}, -- last p2 per (ch,cmd,p1)
    u = { v = mi, x = mi, y = mi, g = 0 }, -- source values
    q = { v = 0, x = 0, y = 0 }, -- positions
    r = { v = mi, x = mi, y = mi }, -- for d()
    tg = {}, -- glide targets
  }, M)
  Z.nz[#Z.nz + 1] = z
  return z
end

for kind in pairs(Z.kind) do
  Z[kind] = function(n, x, y, w, h, opt, f)
    return Z.zone(n, x, y, w, h, opt, f, kind)
  end
end

function Z.group(n, opt)
  local g = {}
  for _, t in ipairs({ Z.gdef, opt or {} }) do
    for k, val in pairs(t) do
      g[k] = val
    end
  end
  Z.ng[n] = g
end

-- Known limit: zones of a Setup that errors before this stay pending.
function Z.start(self)
  self:txma(1023)
  self:tyma(1023)
  for _, z in ipairs(Z.zs) do -- release held zones: no stuck notes
    if z.k > 0 then
      z.k = 0
      gate(z, 0)
      run(z, "g")
    end
  end
  Z.zs = Z.nz
  Z.nz = {}
  Z.lv = nil
  for _, z in ipairs(Z.zs) do
    if z.o.grab == "live" then
      Z.lv = 1
    end
  end
  Z.gp = Z.ng
  Z.ng = {}
  Z.ct = {}
  self.touch_cb = Z.touch
  -- later: RX dry run, midirx_cb, first paint
end

-- From the touch Timer; cfg.led and cfg.win are for later slices.
function Z.tick(self, cfg)
  for _, z in ipairs(Z.zs) do
    for _, k in ipairs(KS) do
      local t = z.tg[k]
      if t then
        local q = ap(z.q[k], t, z.o.speed / 50, z.o.ease)
        z.q[k] = q
        if q == t then
          z.tg[k] = nil
        end
        put(z, k, sc(z, q))
      end
    end
  end
end

-- Ends: 5 up, 3 suppressed, 7 unsuppressed up. Unowned contacts (empty cell,
-- or left a live zone) can be picked up by a live zone.
local function route(id, evt, x, y)
  local c = Z.ct[id]
  if evt == 4 or evt == 5 or evt == 3 or evt == 7 then
    Z.ct[id] = nil
    if c and c.z then -- also a down on a busy slot
      lift(c.z)
    end
  end
  if evt == 4 then
    c = { p = {} }
    Z.ct[id] = c
    local z = find(x, y)
    if z then
      take(c, z, x, y)
    end
  elseif evt == 1 and c then
    local z = c.z
    if z and not inside(z, x, y) and (z.o.grab == "live" or z.o.leave == 1) then
      c.z = nil
      lift(z)
      if z.o.grab ~= "live" then
        Z.ct[id] = false
        return
      end
      z = nil
    end
    if z then
      pos(z, c, x, y)
    elseif Z.lv then
      z = find(x, y)
      if z and z.o.grab == "live" then
        take(c, z, x, y, 1)
      end
    end
  end
end

function Z.touch(self, id, evt, x, y)
  if Z.raw then
    Z.raw(self, id, evt, x, y)
  end
  if evt == 9 then -- tap: down and up in one scan
    route(id, 4, x, y)
    evt = 5
  end
  route(id, evt, x, y)
end

-- Gate runs on a continuous zone report the main value, so the default block
-- sends no gate CC.
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

-- Autos as simplemidi.lua, p1 from the CC slot. The global gms takes exactly 4
-- args, so modes expand here. Repeats per (ch,cmd,p1) drop until a press.
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

-- RX sync and painters: later.
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
function M:d()
  return self.dd or 0
end
function M:step()
  return self.st
end
function M:count()
  return #self.sv
end
function M:src()
  return self.s
end

return Z
