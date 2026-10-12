-- ZONA touch zones (docs/zona-zones-rfc.md). Short names only: compressScript
-- rewrites firmware human names, even in strings. Lua 5.5: never assign to a
-- for-loop variable.

local Z = {}

Z.VERSION = "0.4.0"
Z.has = { sres = 10 } -- sensor bits

-- Defaults (meanings in zone-model.ts, tested to match) change only in a major
-- version: blocks omit them. min/max: 0-127 for res 7, else 0-16383.
Z.def = {
  read = "axis",
  dir = "v",
  res = 7,
  grab = "focus",
  leave = 0,
  mode = "abs",
  speed = 1,
  ease = 0,
  contact = "new",
  drag = "n",
  bmo = 0,
  group = 0,
  led = "fill",
  release = "keep",
  sens = "n",
  db = -1,
  sm = -1,
  rt = -1,
}

Z.kind = {
  fader = { read = "axis" },
  button = { read = "gate", leave = 1 },
  xy = { read = "point", led = "crosshair" },
  knob = { read = "angle", led = "arc" },
}

-- sens presets {db, sm, rt}; rt needs Z.tick
Z.sens = { l = { 4, 0.5, 1 }, n = { 2, 0, 0 }, h = { 0, 0, 0 } }

-- Z.group defaults; empty=0 keeps one member on.
Z.gdef = { empty = 1 }

Z.zs = {} -- active zones, index = position - 1; Z.start swaps in pending Z.nz
Z.nz = {}
Z.gp = {} -- group settings, pending in Z.ng
Z.ng = {}
Z.ct = {} -- slot -> {z = owner, m = mode, p = readings}, false after leave
Z.tn = 0 -- ticks
-- per cell x+y*9: physical LED, last colour key, last phase (send changes only)
Z.li = {}
Z.lk = {}
Z.lc = {}

local S = 1024 / 9 -- raw 0-1023 over 9 cells
local KS = { "v", "x", "y" } -- continuous sources

-- Zone self: answers the methods action blocks call on a control.
local M = {}
M.__index = M

-- route -> pos -> read -> mode -> put/gate -> run; q is a 0-1 position

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

-- Once Z.tick runs, a run within rt ticks of the last one waits for it.
local function put(z, k, val)
  if z.u[k] ~= val then
    z.u[k] = val
    z.dt = 1
    if z.rt > 0 and Z.tn > 0 and Z.tn - (z.lr[k] or -99) < z.rt then
      z.pd[k] = 1
    else
      z.lr[k] = Z.tn
      run(z, k)
    end
  end
end

-- Pending runs whose rt has passed, or all (a: before a release).
local function fl(z, a)
  for k in pairs(z.pd) do
    if a or Z.tn - z.lr[k] >= z.rt then
      z.pd[k] = nil
      z.lr[k] = Z.tn
      run(z, k)
    end
  end
end

local function sc(z, t)
  local n = (1 << z.o.res) - 1
  return math.floor(z.mi + math.floor(t * n + 0.5) * (z.ma - z.mi) / n + 0.5)
end

local function frac(p, a, b)
  return (p - a) / (b - a)
end

-- a toward b by s plus e of the distance left
local function ap(a, b, s, e)
  local d = b - a
  local m = math.abs(d) * e + s
  if m >= math.abs(d) then
    return b
  end
  return a + (d > 0 and m or -m)
end

-- t along source k (an angle wraps every w), contact c
local function md(z, c, k, t, w)
  local p = c.p[k]
  if c.m == "rel" then
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
-- Clockwise from the bottom, 300 degrees from 30; the centre (1/8 side) is noise
rd.angle = function(z, c, x, y)
  local a = z.a
  local dx, dy = x - (a[1] + a[2]) / 2, y - (a[3] + a[4]) / 2
  local r = math.min(a[2] - a[1], a[4] - a[3]) / 8
  if dx * dx + dy * dy < r * r then
    return
  end
  md(z, c, "v", (math.deg(math.atan(-dx, dy)) % 360 - 30) / 300, 1.2)
end
rd.gate = function() end

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

-- Deadband and smoothing on raw, then clamp (focus stays at the edge). On a
-- tick (t) a rest position within the deadband is taken exactly.
local function pos(z, c, x, y, t)
  c.rx, c.ry = x, y
  if not t then
    z.lm = c -- the zone's last moving contact
  end
  if c.x then
    if math.abs(x - c.x) <= z.db and math.abs(y - c.y) <= z.db then
      if not t or x == c.x and y == c.y then
        return
      end
    else
      x = x + (c.x - x) * z.sm
      y = y + (c.y - y) * z.sm
    end
  end
  c.x, c.y = x, y
  local a = z.a
  x = math.max(a[1], math.min(a[2], x))
  y = math.max(a[3], math.min(a[4], y))
  local r = rd[z.o.read] or rd.gate
  if z.o.read == "angle" and z.o.drag ~= "n" then
    r = rd.axis
  end
  r(z, c, x, y)
end

-- No body run here, so value runs on press see g=1. A press clears the
-- duplicate filter (gate zones: on a step change) so per-press messages repeat.
local function gate(z, g)
  z.u.g = g
  z.dt = 1
  if g == 1 then
    z.br = 1
  elseif z.o.release == "clear" then
    z.br = 0
  end
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
      st = 1
    end
    if st > 0 then
      for _, o in ipairs(Z.zs) do
        if o ~= z and o.o.group == n and o.o.read == "gate" and o.st > 0 then
          o.st = 0
          o.u.v = o.sv[1]
          o.dt = 1
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

-- Later contacts follow o.contact; entering a live zone (e) reads abs
local function take(c, z, x, y, e)
  c.z = z
  c.p = {}
  c.x = nil
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
    fl(z, 1)
    gate(z, 0)
    run(z, "g")
  end
end

-- Painters: level 0-1 of zone cell (i,j) for value position n
local function ax(z, i, j) -- cell along the axis, axis length
  local c = z.c
  local h = (z.o.read == "angle" and z.o.drag or z.o.dir) == "h"
  return h and i or c[4] - 1 - j, h and c[3] or c[4]
end
local P = {}
P.fill = function(z, i, j, n)
  if z.o.read == "gate" then
    return n
  end
  local k, l = ax(z, i, j)
  return cl(n * l - k)
end
P.dot = function(z, i, j, n)
  local k, l = ax(z, i, j)
  return cl(1 - math.abs(n * (l - 1) - k))
end
P.comet = function(z, i, j, n) -- Z.tick decays the trail
  local e = i + j * 9
  local v = math.max(P.dot(z, i, j, n), z.tl[e] or 0)
  z.tl[e] = v
  return v
end
local function xy(z, i, j)
  local c = z.c
  return math.abs(z.q.x * (c[3] - 1) - i), math.abs((1 - z.q.y) * (c[4] - 1) - j)
end
P.crosshair = function(z, i, j)
  local a, b = xy(z, i, j)
  return (cl(1 - a) + cl(1 - b)) / 2
end
P.target = function(z, i, j)
  local a, b = xy(z, i, j)
  return cl(1 - math.sqrt(a * a + b * b))
end
P.arc = function(z, i, j, n)
  local c = z.c
  if i > 0 and j > 0 and i < c[3] - 1 and j < c[4] - 1 then
    return 0
  end
  local dx, dy = i - (c[3] - 1) / 2, j - (c[4] - 1) / 2
  if dx == 0 and dy == 0 then -- a 1x1 knob
    return n
  end
  local t = (math.deg(math.atan(-dx, dy)) % 360 - 30) / 300
  return n > 0 and t >= 0 and t <= n and 1 or 0
end

local function lit(e, k, cc, ph)
  local x = Z.li[e]
  if Z.lk[e] ~= k then
    Z.lk[e] = k
    local u = table.unpack
    gln(x, 1, u(cc[1]))
    gld(x, 1, u(cc[2]))
    glx(x, 1, u(cc[3]))
  end
  if Z.lc[e] ~= ph then
    Z.lc[e] = ph
    glp(x, 1, ph)
  end
end

local function paint(z)
  z.dt = nil
  local p = P[z.o.led]
  if not p then
    return
  end
  local c = z.c
  local n = z.o.read == "gate" and z.st / math.max(#z.sv - 1, 1) or z.q[z.o.read == "point" and "x" or "v"]
  for j = 0, c[4] - 1 do
    for i = 0, c[3] - 1 do
      lit(c[1] + i + (c[2] + j) * 9, z.ck, z.cc, math.floor(p(z, i, j, n) * z.br * z.iv + 0.5))
    end
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
  -- editor step values (calculateStepValuesFirmwareStyle); the firmware has
  -- more when floor(range/bmo)*(bmo+1) <= range
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
    c = { x, y, w, h },
    br = o.release == "keep" and 1 or 0, -- brightness
    iv = 255, -- intensity
    tl = {}, -- comet trail
    lr = {}, -- tick of the last run
    pd = {}, -- pending runs
  }, M)
  local p = Z.sens[o.sens] or Z.sens.n
  z.db = o.db >= 0 and o.db or p[1]
  z.sm = o.sm >= 0 and o.sm or p[2]
  z.rt = o.rt >= 0 and o.rt or p[3]
  z:glc(1, { { -1, -1, -1, 1 } }) -- module default colour
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

-- Caveat: zones of a Setup that errors before this stay pending.
function Z.start(self)
  self:txma(1023)
  self:tyma(1023)
  for _, z in ipairs(Z.zs) do -- release held zones: no stuck notes
    if z.k > 0 then
      z.k = 0
      fl(z, 1)
      gate(z, 0)
      run(z, "g")
    end
  end
  Z.tn = 0 -- runs are not held until Z.tick runs again
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
  Z.lk = {} -- repaint all: LEDs may have changed outside the library
  Z.lc = {}
  self.touch_cb = Z.touch
  -- first paint, uncovered cells dark. Later: RX dry run, midirx_cb.
  local own = {}
  for e = 0, 80 do
    Z.li[e] = glag(self:ind(), e) or e
  end
  for _, z in ipairs(Z.zs) do
    local c = z.c
    for e = 0, c[3] * c[4] - 1 do
      own[c[1] + e % c[3] + (c[2] + e // c[3]) * 9] = 1
    end
    paint(z)
  end
  for e = 0, 80 do
    if not own[e] then
      lit(e, Z.lk[e], nil, 0)
    end
  end
end

-- Touch Timer: glide, pending runs, fade, trails; repaint every cfg.led ticks
function Z.tick(self, cfg)
  Z.tn = Z.tn + 1
  local d = cfg and cfg.led or 1
  for _, z in ipairs(Z.zs) do
    local c = z.lm
    if c and c.z == z and z.sm > 0 then -- smoothing reaches a finger at rest
      pos(z, c, c.rx, c.ry, 1)
    end
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
    fl(z)
    if z.k == 0 and z.br > 0 and z.o.release == "fade" then
      z.br = ap(z.br, 0, 0.05, 0) -- 20 ticks
      z.dt = 1
    end
    for e, v in pairs(z.tl) do
      z.tl[e] = v > 0.05 and v * 0.7 or nil -- trail: 70% per tick
      z.dt = 1
    end
    if z.dt and Z.tn % d == 0 then
      paint(z)
    end
  end
end

-- Ends: 5 up, 3 suppressed, 7 unsuppressed up. Live zones pick up unowned
-- contacts.
local function route(id, evt, x, y)
  local c = Z.ct[id]
  if evt == 4 or evt == 5 or evt == 3 or evt == 7 then
    Z.ct[id] = nil
    if c and c.z then -- also a down on a busy slot
      local z = c.z
      c.z = nil
      lift(z)
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

-- Gate runs on continuous zones report the main value: no gate CC
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

-- Autos as simplemidi.lua, p1 from the CC slot. Global gms takes exactly 4
-- args: modes expand here. Repeats per (ch,cmd,p1) drop until a press.
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

function M:gmrr() end

-- Simple Color shape, through the firmware's color_curve; layer is always 1
function M:glc(l, c)
  local x, y, w = color_curve(c)
  local k = table.concat(x, ",") .. ";" .. table.concat(y, ",") .. ";" .. table.concat(w, ",")
  if k ~= self.ck then
    self.ck = k
    self.cc = { x, y, w }
    self.dt = 1
  end
end

-- Simple Intensity: 0-255, -1 full
function M:glp(l, v)
  self.iv = (v == nil or v == -1) and 255 or math.max(0, math.min(255, v))
  self.dt = 1
end

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
