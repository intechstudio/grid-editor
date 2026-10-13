-- ZONA touch zones (docs/zona-zones-rfc.md). Short names only: compressScript
-- rewrites human names, also in strings and comments. Lua 5.5: no assignments
-- to for-loop variables.

local Z = {}

Z.VERSION = "0.7.0"
Z.has = { sres = 10 } -- sensor bits

-- Defaults: blocks omit them, so they change only in a major version. Meanings
-- and a matching copy in zone-model.ts.
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

-- sens: {db, sm, rt}
Z.sens = { l = { 4, 0.5, 1 }, n = { 2, 0, 0 }, h = { 0, 0, 0 } }

Z.gdef = { empty = 1 }

-- Z.tick: interval (ms), LED divider, mapping window (ms)
Z.tdef = { ms = 20, led = 1, win = 300 }

Z.zs = {}
Z.nz = {}
Z.gp = {}
Z.ng = {}
Z.ct = {}
Z.tn = 0
-- per cell x+y*9: last colour key, last phase; Z.el: the LEDs' owner index
Z.lk = {}
Z.lc = {}
Z.el = 0
Z.R = {}
Z.og = {}
-- muted: all in the dry run, the first 6 in mapping mode
local OUT = { "gms", "ggms", "ggbs", "gmms", "gmbs", "gks", "glp", "gln", "gld", "glx" }
local function mute(n)
  for i, f in ipairs(OUT) do
    Z.og[f] = Z.og[f] or _G[f]
    _G[f] = i <= n and function() end or Z.og[f]
  end
end

local function ky(ch, cmd, p1)
  return (ch * 256 + cmd) * 16384 + p1
end

local S = 1024 / 9
local KS = { "v", "x", "y" }

local M = {}
M.__index = M

-- route -> pos -> read -> mode -> put/gate -> run; q is a 0-1 position

local function tr(a)
  return a < 0 and math.ceil(a) or math.floor(a)
end

local function cl(t)
  return math.max(0, math.min(1, t))
end

-- d(): change since the last run, fraction carried
local function run(z, s)
  z.s = s
  z.dd = 0
  local q = z.q[s]
  if q and z.o.read ~= "gate" then
    local d = tr(z.mi + q * (z.ma - z.mi) - z.r[s])
    z.r[s] = z.r[s] + d
    z.dd = d
  end
  if z.f and (not Z.mp or Z.mz == z and Z.ms == s) then
    z.f(z)
  end
end

-- read-only stand-in for tables a zone creates only when it needs them
local E = {}

-- rate: a run within rt ticks of the last waits for Z.tick; lr/pd only with rt
local function put(z, k, val)
  if z.u[k] ~= val then
    z.u[k] = val
    z.dt = 1
    if z.rt > 0 and Z.tn > 0 and Z.tn - (z.lr[k] or -99) < z.rt then
      z.pd[k] = 1
    else
      if z.rt > 0 then
        z.lr[k] = Z.tn
      end
      run(z, k)
    end
  end
end

local function fl(z, a)
  for k in pairs(z.pd or E) do
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

local function ap(a, b, s, e)
  local d = b - a
  local m = math.abs(d) * e + s
  if m >= math.abs(d) then
    return b
  end
  return a + (d > 0 and m or -m)
end

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

-- sensor y=0 is the top row: flip y
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
-- clockwise from the bottom, 300 degrees from 30; centre ignored
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

-- deadband, smoothing, clamp; a tick (t) takes a rest position exactly
local function pos(z, c, x, y, t)
  c.rx, c.ry = x, y
  if not t then
    z.lm = c
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

local function off(z, r)
  for _, o in ipairs(Z.zs) do
    if o ~= z and o.o.group == z.o.group and o.o.read == "gate" and o.st > 0 then
      o.st = 0
      o.u.v = o.sv[1]
      o.dt = 1
      if r then
        run(o, "g")
      end
    end
  end
end

-- no body run, so value runs on press see g=1; a press (gate: a new step)
-- clears the duplicate filter
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
      off(z, 1)
    end
  end
  if g == 1 and st ~= z.st then
    z.l = {}
  end
  z.st = st
  z.u.v = z.sv[st + 1]
end

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
  if Z.mp then
    Z.mz, c.ox, c.oy = z, x, y
  else
    pos(z, c, x, y)
  end
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

-- painters: level 0-1 of cell (i,j) for value position n
local function ax(z, i, j)
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
P.comet = function(z, i, j, n)
  local e = i + j * 9
  local v = math.max(P.dot(z, i, j, n), z.tl[e] or 0)
  z.tl[e] = v
  return v
end
local function xy(z, i, j)
  local c = z.c
  local q = z.q
  return math.abs((q.x or 0) * (c[3] - 1) - i), math.abs((1 - (q.y or 0)) * (c[4] - 1) - j)
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
  if dx == 0 and dy == 0 then
    return n
  end
  local t = (math.deg(math.atan(-dx, dy)) % 360 - 30) / 300
  return n > 0 and t >= 0 and t <= n and 1 or 0
end

-- LED x of cell e, looked up only when it is written
local function lit(e, k, cc, ph)
  local x
  if Z.lk[e] ~= k then
    x = glag(Z.el, e) or e
    Z.lk[e] = k
    local u = table.unpack
    gln(x, 1, u(cc[1]))
    gld(x, 1, u(cc[2]))
    glx(x, 1, u(cc[3]))
  end
  if Z.lc[e] ~= ph then
    x = x or glag(Z.el, e) or e
    Z.lc[e] = ph
    glp(x, 1, ph)
  end
end

local function bd(e)
  return e % 9 % 8 == 0 or e // 9 % 8 == 0
end

-- zone painting cell e (the last one, as painted)
local function own(e)
  local o
  for _, z in ipairs(Z.zs) do
    local c = z.c
    local i, j = e % 9 - c[1], e // 9 - c[2]
    if i >= 0 and j >= 0 and i < c[3] and j < c[4] then
      o = z
    end
  end
  return o
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
      local e = c[1] + i + (c[2] + j) * 9
      local h = math.floor(p(z, i, j, n) * z.br * z.iv + 0.5)
      lit(e, z.ck, z.cc, Z.mp and bd(e) and math.max(h, 24) or h)
    end
  end
end

local function rl() -- release held zones: no stuck notes
  for _, z in ipairs(Z.zs) do
    if z.k > 0 then
      z.k, z.lm = 0
      fl(z, 1)
      gate(z, 0)
      run(z, "g")
    end
  end
end

-- on: held zones release first, other contacts are ignored until they lift
local function mm(on)
  if on then
    rl()
    for i in pairs(Z.ct) do
      Z.ct[i] = false
    end
  end
  Z.mp, Z.mc = on, nil
  mute(on and 6 or 0)
  for e = 0, 80 do
    if bd(e) then
      local z = own(e)
      if z then
        z.dt = 1
      else
        lit(e, Z.lk[e], nil, on and 24 or 0)
      end
    end
  end
end

-- value sync (RX, Z.set): no body run, no output
local function sy(z, s, v, r)
  if not r or r.f[1] then
    if z.o.read == "gate" then
      local b = 1
      for i, w in ipairs(z.sv) do
        if math.abs(w - v) < math.abs(z.sv[b] - v) then
          b = i
        end
      end
      z.st, z.u.v = b - 1, z.sv[b]
      if b > 1 and z.o.group > 0 then
        off(z)
      end
    else
      s = s == "g" and (z.o.read == "point" and "x" or "v") or s
      local q = cl((v - z.mi) / (z.ma - z.mi))
      z.q[s], z.tg[s], z.u[s] = q, nil, sc(z, q)
      z.r[s] = z.mi + q * (z.ma - z.mi)
    end
    if r then
      z.l[r.k] = v
    end
  end
  z.dt = 1
end

-- releases the running surface (held zones send their release) and keeps no
-- reference to it: a new surface is built without the old one in RAM, and a
-- Setup that fails before Z.start leaves an empty surface
local function drop()
  rl()
  if Z.mp then
    mm()
  end
  Z.zs, Z.ct, Z.R, Z.N, Z.ns = {}, {}, {}, {}, {}
  Z.mz, Z.ms, Z.mi, Z.aw, Z.lv = nil
end

-- A Setup runs to its end before any tick or touch, so zones still pending
-- then are left from a Setup that failed: drop them, or the next run would
-- append to them
local function stale()
  if Z.nz[1] or next(Z.ng) then
    Z.nz, Z.ng = {}, {}
  end
end

-- the first zone or group of a Setup run drops the previous surface
local function first()
  if not (Z.nz[1] or next(Z.ng)) then
    drop()
  end
end

-- options read through: zone opt -> kind preset -> Z.def (no copy per zone)
local KM = { [""] = { __index = Z.def } }
for kind, p in pairs(Z.kind) do
  local t = setmetatable({}, KM[""])
  for k, val in pairs(p) do
    t[k] = val
  end
  KM[kind] = { __index = t }
end

function Z.zone(n, x, y, w, h, opt, f, kind)
  first()
  local o = setmetatable({}, KM[kind] or KM[""])
  for k, val in pairs(opt or {}) do
    o[k] = val
  end
  -- CC slot: xy 2, others 1
  local b = 0
  for _, q in ipairs(Z.nz) do
    b = b + (q.o.read == "point" and 2 or 1)
  end
  local mi = o.min or 0
  local ma = o.max or (o.res > 7 and 16383 or 127)
  -- editor step values; firmware has more if floor(range/bmo)*(bmo+1)<=range
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
    st = 0,
    k = 0,
    l = {},
    u = { v = mi, x = mi, y = mi, g = 0 },
    -- position and value carry: only the sources this reader has
    q = o.read == "point" and { x = 0, y = 0 } or { v = 0 },
    r = o.read == "point" and { x = mi, y = mi } or { v = mi },
    tg = {},
    c = { x, y, w, h },
    br = o.release == "keep" and 1 or 0,
    iv = 255,
    tl = o.led == "comet" and {} or nil, -- trail
  }, M)
  local p = Z.sens[o.sens] or Z.sens.n
  z.db = o.db >= 0 and o.db or p[1]
  z.sm = o.sm >= 0 and o.sm or p[2]
  z.rt = o.rt >= 0 and o.rt or p[3]
  if z.rt > 0 then
    z.lr, z.pd = {}, {}
  end
  z:glc(1, { { -1, -1, -1, 1 } })
  Z.nz[#Z.nz + 1] = z
  return z
end

for kind in pairs(Z.kind) do
  Z[kind] = function(n, x, y, w, h, opt, f)
    return Z.zone(n, x, y, w, h, opt, f, kind)
  end
end

function Z.group(n, opt)
  first()
  local g = {}
  for _, t in ipairs({ Z.gdef, opt or {} }) do
    for k, val in pairs(t) do
      g[k] = val
    end
  end
  Z.ng[n] = g
end

-- zones of a Setup that errors before this stay pending until the next tick
-- or touch (stale)
function Z.start(self)
  self:txma(1023)
  self:tyma(1023)
  rl()
  Z.tn, Z.aw = 0
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
  Z.lk = {}
  Z.lc = {}
  Z.R = {}
  Z.ns = {}
  Z.N = {}
  self.touch_cb = Z.touch
  -- dry run: gmrr registers
  if Z.mp then
    mm()
  end
  Z.dr = 1
  mute(10)
  for _, z in ipairs(Z.zs) do
    for k in (z.o.read == "point" and "xyg" or z.o.read == "gate" and "g" or "vg"):gmatch(".") do
      local ok, e = pcall(run, z, k)
      if not ok then
        print(e)
      end
    end
  end
  mute(0)
  Z.dr = nil
  local u = self.midirx_cb
  Z.uc = u ~= Z.rx and u or nil
  self.midirx_cb = next(Z.R) and Z.rx or Z.uc
  Z.el = self:ind()
  for _, z in ipairs(Z.zs) do
    paint(z)
  end
  local d = { color_curve({ { -1, -1, -1, 1 } }) } -- default colour for the frame
  for e = 0, 80 do
    if not own(e) then
      lit(e, 0, d, 0)
    end
  end
  gtt(self:ind(), 1) -- one-shot timer: kick it, Z.tick re-arms
end

function Z.tick(self, cfg)
  local t = Z.tdef
  cfg = cfg or t
  local ms = cfg.ms or t.ms
  gtt(self:ind(), ms) -- re-arm first: a body error can't stop the tick
  stale()
  Z.tn = Z.tn + 1
  local d = cfg.led or t.led
  if Z.aw and (Z.tn - Z.aw) * ms > (cfg.win or t.win) then
    Z.aw = nil
    gpl(gpn())
  end
  for _, z in ipairs(Z.zs) do
    local c = z.lm
    if c and c.z == z and z.sm > 0 then
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
    for e, v in pairs(z.tl or E) do
      z.tl[e] = v > 0.05 and v * 0.7 or nil -- trail: 70% per tick
      z.dt = 1
    end
    if z.dt and Z.tn % d == 0 then
      paint(z)
    end
  end
end

-- ends: 5 up, 3 suppressed, 7 unsuppressed up
local function route(id, evt, x, y)
  local c = Z.ct[id]
  if evt == 4 or evt == 5 or evt == 3 or evt == 7 then
    Z.ct[id] = nil
    if c and c.z then
      local z = c.z
      c.z = nil
      if Z.mp and not Z.ms then -- mapping tap: press and release only
        Z.ms = "g"
        run(z, "g")
      end
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
    if z and Z.mp and not Z.ms and z.o.read ~= "gate" then -- movement picks (buttons: tap)
      local a, b = math.abs(x - c.ox), math.abs(y - c.oy)
      if math.max(a, b) < 24 then
        return
      end
      Z.ms = z.o.read ~= "point" and "v" or a > b and "x" or "y"
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
  stale()
  if Z.raw then
    Z.raw(self, id, evt, x, y)
  end
  local dn = evt % 5 == 4
  if Z.aw and dn then
    Z.aw = nil
    mm(1)
  end
  if Z.mp then
    if dn and not Z.mc then
      Z.mc, Z.mz, Z.ms, Z.mi = id
    elseif Z.mc ~= id then
      return
    end
  end
  if evt == 9 then -- tap: down and up in one scan
    route(id, 4, x, y)
    evt = 5
  end
  route(id, evt, x, y)
  if Z.mc == id and Z.ct[id] == nil then
    Z.mc = nil
  end
end

-- the window is timed by Z.tick; without ticks, change page at once
function Z.util(self)
  if Z.mp then
    mm()
  elseif Z.tn > 0 then
    Z.aw = Z.tn
  else
    gpl(gpn())
  end
end

function Z.set(n, v, s)
  for _, z in ipairs(Z.zs) do
    if z.n == n and z.k == 0 then -- touch wins
      sy(z, s or "g", v)
    end
  end
end

-- host MIDI only (header 13, as the firmware gmrr)
function Z.rx(self, h, e)
  local ch, cmd, p1, v = e[1], e[2], e[3], e[4]
  if cmd == 128 then
    cmd, v = 144, 0
  elseif cmd == 224 then -- pitch bend: the MSB, as a zone sends it
    p1 = 0
  end
  local r = h[1] == 13 and Z.R[ky(ch, cmd, p1)]
  if r == Z.ns then
    local s = Z.ns[ch] or {}
    Z.ns[ch], r = s, nil
    if p1 > 90 then
      s[p1] = v
    else
      r = Z.N[ch * 16384 + (s[99] or 0) * 128 + (s[98] or 0)]
      if r and r.m == 3 then
        v = p1 == 6 and v * 128 or (s.v or 0) // 128 * 128 + v
      elseif p1 == 38 then
        r = nil
      end
      s.v = v
    end
  elseif r and r.m == 1 then
    v = p1 == r.p and v * 128 or (r.v or 0) // 128 * 128 + v
    r.v = v
  end
  if r and r.z.k == 0 then -- touch wins
    sy(r.z, r.s, v, r)
  end
  if Z.uc then
    Z.uc(self, h, e)
  end
end

-- gate runs report the main value: no gate CC
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

local function au(z, ch, cmd, p1, mode)
  if mode == nil or mode == -1 then
    mode = z:get_auto_mode()
  end
  if ch == -1 then
    ch = (gmy() * 4 + gpc()) % 16
  end
  if cmd == -1 then
    cmd = z.o.read == "gate" and 144 or 176
  end
  if p1 == -1 then
    p1 = (32 + gmx() * 16 + z.b + (z.s == "y" and 1 or 0)) % 128
    if mode == 1 then
      p1 = p1 % 32
    end
  end
  return ch, cmd, p1, mode
end

-- global gms takes exactly 4 args: modes expand here
function M:gms(ch, cmd, p1, p2, mode)
  if Z.dr then
    return
  end
  ch, cmd, p1, mode = au(self, ch, cmd, p1, mode)
  if p2 == -1 then
    p2 = self:get_auto_value()
  end
  local k = ky(ch, cmd, p1)
  Z.mi = Z.mp and (Z.mi or k)
  if self.l[k] == p2 or Z.mi and Z.mi ~= k then
    return
  end
  self.l[k] = p2
  local gms = Z.og.gms or gms
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

-- MIDI block order: (ev, ch, cmd, p1, {value sync, LED sync}, mode)
function M:gmrr(ev, ch, cmd, p1, f, mode)
  if not Z.dr then
    return
  end
  ch, cmd, p1, mode = au(self, ch, cmd, p1, mode)
  cmd = mode > 0 and 176 or cmd -- as gms sends it
  local r = { z = self, s = self.s, f = f, m = mode, p = p1, k = ky(ch, cmd, p1) }
  if mode > 1 then
    Z.N[ch * 16384 + p1] = r
    for _, n in ipairs({ 99, 98, 6, 38 }) do
      Z.R[ky(ch, 176, n)] = Z.ns
    end
  else
    Z.R[ky(ch, cmd, cmd == 224 and 0 or p1)] = r
    if mode == 1 then
      Z.R[ky(ch, cmd, p1 + 32)] = r
    end
  end
end

function M:dry()
  return Z.dr == 1
end

-- zones with the same colour share one curve; weak, so dynamic colours go
local CC = setmetatable({}, { __mode = "v" })

-- layer is always 1
function M:glc(l, c)
  local x, y, w = color_curve(c)
  local k = table.concat(x, ",") .. ";" .. table.concat(y, ",") .. ";" .. table.concat(w, ",")
  if k ~= self.ck then
    local e = CC[k] or { x, y, w, k }
    CC[k] = e
    self.ck = e[4]
    self.cc = e
    self.dt = 1
  end
end

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

-- The Library block calls a library's unload(self) before it re-runs Setup
-- (Update, Reload). Acts on this instance only, so an old one can be unloaded
-- after a new one is loaded.
function Z.unload(self)
  drop()
  Z.nz, Z.ng, Z.gp, Z.lk, Z.lc = {}, {}, {}, {}, {}
  if self.touch_cb == Z.touch then
    self.touch_cb = nil
  end
  if self.midirx_cb == Z.rx then
    self.midirx_cb = Z.uc
  end
  Z.uc = nil
end

return Z
