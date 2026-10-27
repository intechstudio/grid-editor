local LIB_NAME = "_Z"
local LIB_VERSION = "0.8.8"

-- ZONA touch zones (docs/zona-zones-rfc.md). Short names only: compressScript
-- rewrites human names, also in strings and comments. Lua 5.5: no assignments
-- to for-loop variables.

local Z = {}

Z.has = { sres = 10 } -- sensor bits

-- Defaults: blocks omit them, so they change only in a major version. Meanings
-- and a matching copy in zone-model.ts.
Z.def = {
  dir = "v",
  res = 7,
  grab = "focus",
  mode = "abs",
  speed = 1,
  ease = 0,
  bmo = 0,
  group = 0,
  led = 1,
  ch = -1,
  num = -1,
  rx = 0,
  spring = 0,
  fingers = 1,
}

-- read: the kind's reader and painter, not an option; msg: what it sends
Z.kind = {
  fader = { read = "axis", msg = "cc" },
  button = { read = "gate", msg = "note" },
  xy = { read = "point", msg = "cc" },
}

-- Z.tick: interval (ms)
Z.tdef = { ms = 20 }

-- LED phases (0-255) of a zone cell, fixed: LF floor when unlit, LT lit while
-- touched, LD lit after (release, RX, Z.set). The zone curve's minimum is black.
local LF, LD, LT = 16, 110, 255

Z.zs = {}
Z.nz = {}
Z.ct = {}
Z.tn = 0
-- per cell x+y*9: last colour key, last phase; Z.el: the LEDs' owner index
Z.lk = {}
Z.lc = {}
Z.el = 0
Z.R = {}

-- outputs muted while Z.start runs the bodies (not the LEDs)
local OUT = { "gms", "ggms", "ggbs", "gmms", "gmbs", "gks" }

local function ky(ch, cmd, p1)
  return (ch * 256 + cmd) * 16384 + p1
end

local S = 1024 / 9
local KS = { "v", "x", "y" }
-- the sources a press or release sends, per reader
local SR = { axis = { "v" }, gate = { "v" }, point = { "x", "y" } }

local M = {}
M.__index = M

-- route -> pos -> read -> mode -> put/gate -> run; q is a 0-1 position

local function tr(a)
  return a < 0 and math.ceil(a) or math.floor(a)
end

local function cl(t)
  return math.max(0, math.min(1, t))
end

-- wire value of source k: 7-bit (wide ranges scaled), or 14-bit for a CC
-- pair (z.m 1) and pitch bend (z.m 2)
local function wv(z, k)
  local v = z.u[k]
  if z.m == 0 and z.ma > 127 then
    v = (v - z.mi) * 127 // (z.ma - z.mi)
  end
  return v
end

-- the zone's MIDI for source k, once per value (z.l, cleared by a press);
-- y is on num+1, a 14-bit LSB on num+32
local function snd(z, k)
  local w = wv(z, k)
  if z.m and z.l[k] ~= w then
    z.l[k] = w
    local ch, p = z.ch, k == "y" and z.py or z.p
    if z.m == 2 then
      gms(ch, 224, w % 128, w // 128)
    elseif z.m == 1 then
      gms(ch, 176, p, w // 128)
      gms(ch, 176, p + 32, w % 128)
    else
      gms(ch, z.cmd, p, w)
    end
  end
end

-- d(): change since the last run, fraction carried. MIDI first: a value run
-- sends its source, a press or release (g) all of them; then the body
local function run(z, s)
  z.s = s
  z.dd = 0
  local q = z.q[s]
  if q and z.o.read ~= "gate" then
    local d = tr(z.mi + q * (z.ma - z.mi) - z.r[s])
    z.r[s] = z.r[s] + d
    z.dd = d
  end
  if s == "g" then
    for _, k in ipairs(SR[z.o.read]) do
      snd(z, k)
    end
  else
    snd(z, s)
  end
  if z.fn then
    Z.rb = 1 -- a body is running: no zones may be defined (Z.zone)
    local ok, e = pcall(z.fn, z)
    Z.rb = nil
    if not ok then
      error(e, 0)
    end
  end
end

-- rate: a source's first change in a tick runs at once, later ones
-- wait for Z.tick or the lift (fl); none before the first tick
local function put(z, k, val)
  if z.u[k] ~= val then
    z.u[k] = val
    z.dt = 1
    if Z.tn > 0 and z.lr[k] == Z.tn then
      z.pd[k] = 1
    else
      z.lr[k] = Z.tn
      run(z, k)
    end
  end
end

local function fl(z)
  for _, k in ipairs(KS) do -- a fixed order: x before y
    if z.pd[k] then
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

local function md(z, c, k, t)
  local p = c.p[k]
  if c.m == "rel" then
    z.tg[k] = nil -- the press too: a held finger stops a spring return
    if p then
      z.q[k] = cl(z.q[k] + (t - p) * z.o.speed)
    end
  else
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
  md(z, c, "v", z.o.dir == "h" and frac(x, a[1], a[2]) or 1 - frac(y, a[3], a[4]))
end
rd.point = function(z, c, x, y)
  local a = z.a
  md(z, c, "x", frac(x, a[1], a[2]))
  md(z, c, "y", 1 - frac(y, a[3], a[4]))
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

-- deadband (2 raw units), clamp
local function pos(z, c, x, y)
  if c.x and math.abs(x - c.x) <= 2 and math.abs(y - c.y) <= 2 then
    return
  end
  c.x, c.y = x, y
  local a = z.a
  x = math.max(a[1], math.min(a[2], x))
  y = math.max(a[3], math.min(a[4], y))
  rd[z.o.read](z, c, x, y)
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
  if z.o.group > 0 and st > 0 then
    off(z, 1)
  end
  if g == 1 and st ~= z.st then
    z.l = {}
  end
  z.st = st
  z.u.v = z.sv[st + 1]
end

-- spring: rest at the centre, no output
local function rest(z)
  if z.o.spring == 1 and z.o.read ~= "gate" then
    for _, k in ipairs(SR[z.o.read]) do
      z.q[k], z.u[k], z.r[k] = 0.5, sc(z, 0.5), z.mi + (z.ma - z.mi) / 2
    end
  end
end

-- a finger's own state over its zone (xy, fingers > 1): values, filter,
-- rate and carry per finger; MIDI on the zone channel + finger - 1
local function fg(z, i)
  local mi = z.mi
  z.fm = z.fm or { __index = z } -- one metatable for the zone's fingers
  local o = setmetatable({
    fi = i,
    pa = z,
    ch = (z.ch + i - 1) % 16,
    k = 0,
    l = {},
    u = { v = mi, x = mi, y = mi, g = 0 },
    q = { x = 0, y = 0 },
    r = { x = mi, y = mi },
    tg = {},
    lr = {},
    pd = {},
  }, z.fm)
  rest(o)
  z.fs = z.fs or {}
  z.fs[i] = o
  z.os[#z.os + 1] = o
  return o
end

-- the first contact owns a zone: another one is ignored until it lifts. An
-- xy with fingers > 1 gives a new contact the lowest free finger instead
local function take(id, c, z, x, y, e)
  local t = z.k == 0 and z
  if z.k > 0 and z.o.read == "point" then
    for i = 2, z.o.fingers do
      local o = z.fs and z.fs[i]
      if not o or o.k == 0 then
        t = o or fg(z, i)
        break
      end
    end
  end
  if not t then
    Z.ct[id] = false
    return
  end
  z = t
  c.z = z
  c.p = {}
  c.x = nil
  z.k = 1
  gate(z, 1)
  c.m = e and "abs" or z.o.mode
  pos(z, c, x, y)
  c.m = z.o.mode
  run(z, "g")
end

-- spring: back to the centre on release, at once (ease 0) or eased on the
-- tick like a glide (minimum step speed/50)
local function lift(z)
  z.k = 0
  fl(z)
  if z.o.spring == 1 and z.o.read ~= "gate" then
    for _, k in ipairs(SR[z.o.read]) do
      if z.o.ease > 0 then
        z.tg[k] = 0.5
      else
        z.tg[k], z.q[k] = nil, 0.5
        put(z, k, sc(z, 0.5))
      end
    end
  end
  gate(z, 0)
  run(z, "g")
end

-- painters per reader: level 0-1 of cell (i,j) for value position n. Fader
-- fill, button state, xy crosshair
local P = {}
P.axis = function(z, i, j, n)
  local c = z.c
  local h = z.o.dir == "h"
  return cl(n * (h and c[3] or c[4]) - (h and i or c[4] - 1 - j))
end
P.gate = function(z, i, j, n)
  return n
end
-- normalised by the cell nearest the value (m), so it is at the lit level
-- wherever the value lies between cell centres; cx, cy, cm: set by pt
P.point = function(z, i, j)
  return (cl(1 - math.abs(z.cx - i)) + cl(1 - math.abs(z.cy - j))) / z.cm
end

-- the crosshair's position in cells, once per paint
local function pt(z)
  local c = z.c
  local x, y = z.q.x * (c[3] - 1), (1 - z.q.y) * (c[4] - 1)
  z.cx, z.cy, z.cm = x, y, 2 - math.abs(x - math.floor(x + 0.5)) - math.abs(y - math.floor(y + 0.5))
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

-- held by any finger
local function hd(z)
  for _, o in ipairs(z.os) do
    if o.k > 0 then
      return true
    end
  end
end

local function paint(z)
  z.dt = nil
  if z.o.led == 0 then
    return
  end
  local p = P[z.o.read]
  local c = z.c
  local n = z.o.read == "gate" and z.st / math.max(#z.sv - 1, 1) or z.q[z.o.read == "point" and "x" or "v"]
  -- level 0-1 between floor and the lit phase (top or dim); glp scales the
  -- whole cell, so glp 0 is dark
  -- fingers: a crosshair per held finger at top, the highest level per cell;
  -- none held: finger 1's at dim
  local f = LF
  local t = hd(z)
  local h = t and LT or LD
  if z.o.read == "point" then
    for _, o in ipairs(z.os) do
      pt(o)
    end
  end
  for j = 0, c[4] - 1 do
    for i = 0, c[3] - 1 do
      local e = c[1] + i + (c[2] + j) * 9
      local v = 0
      if z.fs then
        for _, o in ipairs(z.os) do
          if o.k > 0 or not t and o == z then
            v = math.max(v, p(o, i, j, n))
          end
        end
      else
        v = p(z, i, j, n)
      end
      lit(e, z.ck, z.cc, math.floor((f + v * (h - f)) * z.iv / 255 + 0.5))
    end
  end
end

local function rl() -- release held zones: no stuck notes
  for _, z in ipairs(Z.zs) do
    for _, o in ipairs(z.os) do
      if o.k > 0 then
        lift(o)
      end
    end
  end
end

-- value sync (RX, Z.set): no body run, no output; w: the value on the wire
local function sy(z, s, v, w)
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
  if w then
    z.l[s] = w
  end
  z.dt = 1
end

-- releases the running surface (held zones send their release) and keeps no
-- reference to it: a new surface is built without the old one in RAM, and a
-- Setup that fails before Z.start leaves an empty surface
local function drop()
  rl()
  Z.zs, Z.ct, Z.R = {}, {}, {}
  Z.lv = nil
end

-- A Setup runs to its end before any tick or touch, so zones still pending
-- then are left from a Setup that failed: drop them, or the next run would
-- append to them
local function stale()
  if Z.nz[1] then
    Z.nz = {}
  end
end

-- the first zone of a Setup run drops the previous surface. Zones
-- are defined only by Setup: one inside a body would drop the running
-- surface, so it is an error and changes nothing.
local function first()
  if Z.rb then
    error("zone inside a zone body", 0)
  end
  if not Z.nz[1] then
    drop()
  end
end

-- options read through: zone opt -> kind preset -> Z.def (no copy per zone)
local KM = {}
for kind, p in pairs(Z.kind) do
  local t = setmetatable({}, { __index = Z.def })
  for k, val in pairs(p) do
    t[k] = val
  end
  KM[kind] = { __index = t }
end

function Z.zone(n, x, y, w, h, opt, f, kind)
  -- a name already pending: a new Setup run after one that never reached
  -- Z.start (or failed) without a tick or touch in between
  for _, q in ipairs(Z.nz) do
    if q.n == n and not Z.rb then
      Z.nz = {}
      break
    end
  end
  first()
  local o = setmetatable({}, KM[kind] or KM.fader)
  for k, val in pairs(opt or {}) do
    o[k] = val
  end
  o.read = nil -- from the kind, never an option
  local m = o.msg
  if m == "pb" then
    o.res = 14 -- pitch bend is always 14-bit
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
  -- MIDI identity, autos as before: ch from module row and page, num from
  -- module column and slot (% 32 for a 14-bit pair), xy y on the next one.
  -- m: nil none, 0 7-bit, 1 14-bit CC pair, 2 pitch bend
  local z14 = m == "cc" and o.res > 7
  local p, py = o.num, o.num + 1
  if p < 0 then
    p = 32 + gmx() * 16 + b
    py = (p + 1) % 128 % (z14 and 32 or 128)
    p = p % 128 % (z14 and 32 or 128)
  end
  local z = setmetatable({
    n = n,
    o = o,
    ch = o.ch < 0 and (gmy() * 4 + gpc()) % 16 or o.ch,
    cmd = m == "note" and 144 or 176,
    p = p,
    py = py,
    m = m == "pb" and 2 or z14 and 1 or m ~= "none" and 0 or nil,
    fn = f, -- the body (self:f() is the finger)
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
    lr = {}, -- tick of the last run, pending run: per source
    pd = {},
    c = { x, y, w, h },
    iv = 255,
  }, M)
  z.os = { z } -- the zone and its fingers' states (fg)
  rest(z)
  -- col: the zone colour as "rrggbb"; without it the module's default colour
  local c = tonumber(o.col or "", 16)
  z:glc(1, { c and { math.floor(c / 65536), math.floor(c / 256) % 256, c % 256, 1 } or { -1, -1, -1, 1 } })
  Z.nz[#Z.nz + 1] = z
  return z
end

for kind in pairs(Z.kind) do
  Z[kind] = function(n, x, y, w, h, opt, f)
    return Z.zone(n, x, y, w, h, opt, f, kind)
  end
end

-- zones of a Setup that errors before this stay pending until the next tick
-- or touch (stale)
function Z.start(self)
  self:txma(1023)
  self:tyma(1023)
  rl()
  Z.tn = 0
  Z.zs = Z.nz
  Z.nz = {}
  Z.lv = nil
  for _, z in ipairs(Z.zs) do
    if z.o.grab == "live" then
      Z.lv = 1
    end
  end
  Z.ct = {}
  Z.lk = {}
  Z.lc = {}
  Z.R = {}
  Z.te = self
  self.touch_cb = Z.touch
  -- rx=1: the identities the zone sends, a 14-bit pair on both CCs
  for _, z in ipairs(Z.zs) do
    if z.o.rx == 1 and z.m then
      for _, k in ipairs(SR[z.o.read]) do
        local p = k == "y" and z.py or z.p
        local r = { z = z, s = k, m = z.m, p = p }
        Z.R[z.m == 2 and ky(z.ch, 224, 0) or ky(z.ch, z.cmd, p)] = r
        if z.m == 1 then
          Z.R[ky(z.ch, 176, p + 32)] = r
        end
      end
    end
  end
  local u = self.midirx_cb
  Z.uc = u ~= Z.rx and u or nil
  self.midirx_cb = next(Z.R) and Z.rx or Z.uc
  -- each body once, muted and without the zone's MIDI: colours (Simple
  -- Color in the body) show from the start
  local og = {}
  for _, f in ipairs(OUT) do
    og[f], _G[f] = _G[f], function() end
  end
  Z.rb = 1
  for _, z in ipairs(Z.zs) do
    if z.fn then
      z.s, z.dd = "g", 0
      local ok, e = pcall(z.fn, z)
      if not ok then
        print(e)
      end
    end
  end
  Z.rb = nil
  for _, f in ipairs(OUT) do
    _G[f] = og[f]
  end
  Z.el = self:ind()
  for _, z in ipairs(Z.zs) do
    paint(z)
  end
  local b = { 0, 0, 0, 1 }
  local d = { b, b, b } -- dark: no zone, or led=0
  for e = 0, 80 do
    local z = own(e)
    if not z or z.o.led == 0 then
      lit(e, 0, d, 0)
    end
  end
  gtt(self:ind(), 1) -- one-shot timer: kick it, Z.tick re-arms
end

function Z.tick(self, cfg)
  gtt(self:ind(), cfg and cfg.ms or Z.tdef.ms) -- re-arm first: a body error can't stop the tick
  stale()
  Z.tn = Z.tn + 1
  for _, z in ipairs(Z.zs) do
    for _, o in ipairs(z.os) do
      for _, k in ipairs(KS) do
        local t = o.tg[k]
        if t then
          local q = ap(o.q[k], t, o.o.speed / 50, o.o.ease)
          o.q[k] = q
          if q == t then
            o.tg[k] = nil
          end
          put(o, k, sc(o, q))
        end
      end
      fl(o)
      if o.dt then -- a finger repaints its zone
        z.dt, o.dt = 1, o == z and 1 or nil
      end
    end
    if z.dt then
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
      lift(z)
    end
  end
  if evt == 4 then
    c = { p = {} }
    Z.ct[id] = c
    local z = find(x, y)
    if z then
      take(id, c, z, x, y)
    end
  elseif evt == 1 and c then
    local z = c.z
    -- leaving: buttons release (or live), faders and xy clamp
    if z and not inside(z, x, y) and (z.o.grab == "live" or z.o.read == "gate") then
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
        take(id, c, z, x, y, 1)
      end
    end
  end
end

function Z.touch(self, id, evt, x, y)
  stale()
  if evt == 9 then -- tap: down and up in one scan
    route(id, 4, x, y)
    evt = 5
  end
  route(id, evt, x, y)
end

function Z.set(n, v, s)
  for _, z in ipairs(Z.zs) do
    if z.n == n and not hd(z) then -- touch wins
      sy(z, s or "g", v)
    end
  end
end

-- host MIDI only (header 13, as the firmware gmrr)
function Z.rx(self, h, e)
  local ch, cmd, p1, v = e[1], e[2], e[3], e[4]
  if cmd == 128 then
    cmd, v = 144, 0
  elseif cmd == 224 then -- pitch bend: LSB, MSB
    p1, v = 0, v * 128 + p1
  end
  local r = h[1] == 13 and Z.R[ky(ch, cmd, p1)]
  if r then
    local z = r.z
    if r.m == 1 then -- 14-bit CC: the MSB at once, the LSB refines
      v = p1 == r.p and v * 128 or (r.v or 0) // 128 * 128 + v
      r.v = v
    end
    local w = v
    if r.m == 0 and z.ma > 127 then -- 7-bit into a wide range
      v = z.mi + v * (z.ma - z.mi) // 127
    end
    if not hd(z) then -- touch wins (any finger)
      sy(z, r.s, v, w)
    end
  end
  if Z.uc then
    Z.uc(self, h, e)
  end
end

-- zones with the same colour share one curve; weak, so dynamic colours go
local CC = setmetatable({}, { __mode = "v" })

-- layer is always 1; the minimum is black: phase 0 is off
-- colour and intensity are the zone's, also from a finger's body
function M:glc(l, c)
  self = self.pa or self
  local x, y, w = color_curve(c)
  x = { 0, 0, 0, x[4] }
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
  self = self.pa or self
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
-- xy: the change of one axis, 0 when this run is for the other (Mouse Move)
function M:dx()
  return self.s == "x" and self.dd or 0
end
function M:dy()
  return self.s == "y" and self.dd or 0
end
function M:step()
  return self.st
end
function M:f()
  return self.fi or 1
end

-- Lets the Library block free this instance before it runs the page's
-- Setups again (Install): releases the zones and the callbacks it set on the
-- touch element. Acts on this instance only, so an old one can be unloaded
-- after a new one is loaded.
function Z.unload()
  drop()
  Z.nz, Z.lk, Z.lc = {}, {}, {}
  local e = Z.te
  if e and e.touch_cb == Z.touch then
    e.touch_cb = nil
  end
  if e and e.midirx_cb == Z.rx then
    e.midirx_cb = Z.uc
  end
  Z.uc, Z.te = nil, nil
end

return Z
