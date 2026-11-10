local LIB_NAME = "_Z"
local LIB_VERSION = "0.29.1"

-- ZONA touch zones (docs/zona-touch-zones.md). Short names only: compressScript
-- rewrites human names, also in strings and comments. Lua 5.5: no assignments
-- to for-loop variables.

local Z = {}

-- Defaults: blocks omit them, so they change only in a major version. Meanings
-- and a matching copy in zone-model.ts.
Z.def = {
  dir = "v",
  grab = "focus",
  mode = "abs",
  sensitivity = 1,
  bmo = 0,
  ch = -1,
  num = -1,
  chy = -1,
  numy = -1,
  spring = -1,
  fingers = 1,
  tap = 1,
}

-- read: the kind's reader and painter, not an option; msg: what it sends
-- ("midi": the cmd, "cc", "cc14", "note", "pb", "nrpn" or "nrpn14"; "mouse": wheel, button or pointer
-- by kind; "pad": gamepad axis, button or two axes)
Z.kind = {
  fader = { read = "axis", msg = "midi", cmd = "cc" },
  button = { read = "gate", msg = "midi", cmd = "note" },
}

-- LED phases (0-255) of a zone cell, fixed: LF floor when unlit, LT lit while
-- touched, LD lit after (release, RX, Z.set). The zone curve's minimum is black.
-- LB is the floor of a vertical or horizontal fader: its background is dimmer,
-- so the part below the value stands out.
local LF, LB, LD, LT = 16, 8, 110, 255

Z.zs = {}
Z.ct = {}
Z.op = nil -- the surface is still being built by its Setup run
-- per cell x+y*9: last colour key, last phase; Z.el: the LEDs' owner index
Z.lk = {}
Z.lc = {}
Z.la = {}
Z.ow = {} -- per cell: the layers its zones paint on (bit 1: layer 1, 2: layer 2)
Z.el = 0
Z.R = {}

local function ky(ch, cmd, p1)
  return (ch * 256 + cmd) * 16384 + p1
end

local S = 1024 / 9
local KS = { "v", "x", "y" }
-- the sources a press or release sends, per reader
local SR = { axis = { "v" }, gate = { "v" }, point = { "x", "y" } }
-- mouse axis (gmms) of each source
local MA = { x = 1, y = 2, v = 3 }
-- tap to click: a mouse xy touch shorter (s) and with less travel (raw)
local TT, TD = 0.2, 30

-- route -> pos -> read -> mode -> put/gate -> run; q is a 0-1 position

local function tr(a)
  return a < 0 and math.ceil(a) or math.floor(a)
end

local function cl(t)
  return math.max(0, math.min(1, t))
end

-- wire value of source k: 7-bit (wide ranges scaled), or 14-bit for a CC
-- pair (z.m 1) and pitch bend (z.m 2); a gamepad button (z.m 3) is pressed
-- (1) on any step but the first
local function wv(z, k)
  local v = z.u[k]
  if z.m == 0 and z.ma > 127 then
    v = (v - z.mi) * 127 // (z.ma - z.mi)
  elseif z.m == 3 and z.o.read == "gate" then
    v = z.st > 0 and 1 or 0
  end
  return v
end

-- the zone's MIDI or gamepad target for source k, once per value (z.l,
-- cleared by a press); y is on num+1 and the channel unless the zone sets
-- them, a 14-bit LSB on num+32
local function snd(z, k)
  local w = wv(z, k)
  if z.m and z.l[k] ~= w then
    z.l[k] = w
    local ch, p = z.ch, z.p
    if k == "y" then
      ch, p = z.yc, z.py
    end
    if z.m == 3 and z.o.read == "gate" then
      ggbs(p, w)
    elseif z.m == 3 then
      ggms(p, w)
    elseif z.m == 2 then
      gms(ch, 224, w % 128, w // 128)
    elseif z.m > 3 then -- NRPN: the number, then the value (7 or 14 bits)
      gms(ch, 176, 99, p // 128)
      gms(ch, 176, 98, p % 128)
      if z.m == 4 then
        gms(ch, 176, 6, w)
      else
        gms(ch, 176, 6, w // 128)
        gms(ch, 176, 38, w % 128)
      end
    elseif z.m == 1 then
      gms(ch, 176, p, w // 128)
      gms(ch, 176, p + 32, w % 128)
    else
      gms(ch, z.cmd, p, w)
    end
  end
end

-- mouse button: press (1) or release (0) when it changes; num is the
-- button, 1 left by default
local function mb(z, b)
  if z.ms and (z.mb or 0) ~= b then
    z.mb = b
    gmbs(z.o.num > 0 and z.o.num or 1, b)
  end
end

-- a value run sends its source, a press or release (g) all of them
local function run(z, s)
  if s == "g" then
    if z.o.read == "gate" then
      mb(z, z.st > 0 and 1 or 0)
    end
    for _, k in ipairs(SR[z.o.read]) do
      snd(z, k)
    end
  else
    snd(z, s)
  end
end

local function put(z, k, val)
  if z.u[k] ~= val then
    z.u[k] = val
    z.dt = 1
    run(z, k)
  end
end

local function sc(z, t)
  local n = (1 << z.o.res) - 1
  return math.floor(z.mi + math.floor(t * n + 0.5) * (z.ma - z.mi) / n + 0.5)
end

local function frac(p, a, b)
  return (p - a) / (b - a)
end

local function md(z, c, k, t)
  local p = c.p[k]
  if c.m == "rel" then
    if p then
      z.q[k] = cl(z.q[k] + (t - p) * z.o.sensitivity)
    end
  else
    z.q[k] = cl(t)
  end
  c.p[k] = t
  put(z, k, sc(z, z.q[k]))
end

-- mouse: the raw move r of a source, times f and sensitivity, adds to its sum
-- (z.w). Each axis sends its whole steps (at most 127) and keeps the
-- fraction; a bigger move is cut, so the pointer stops with the finger. q,
-- the finger's spot, is only painted
local function mv(z, c, k, r, f, q)
  local p = c.p[k]
  if p then
    local s = z.w[k] + (r - p) * f * z.o.sensitivity
    local n = tr(s)
    z.w[k] = s - n
    n = math.max(-127, math.min(127, n))
    if n ~= 0 then
      gmms(MA[k], n)
    end
    c.d = c.d + math.abs(r - p)
  end
  c.p[k], z.q[k], z.dt = r, q, 1
end

-- sensor y=0 is the top row: flip y. A mouse fader scrolls the wheel
-- (towards max is positive), a mouse xy moves the pointer (y grows down)
local rd = {}
rd.axis = function(z, c, x, y)
  local a = z.a
  local h = z.o.dir == "h"
  local q = h and frac(x, a[1], a[2]) or 1 - frac(y, a[3], a[4])
  if z.ms then
    mv(z, c, "v", h and x or -y, 1 / 32, q)
  else
    md(z, c, "v", q)
  end
end
rd.point = function(z, c, x, y)
  local a = z.a
  local u, w = frac(x, a[1], a[2]), 1 - frac(y, a[3], a[4])
  if z.ms then
    mv(z, c, "x", x, 1, u)
    mv(z, c, "y", y, 1, w)
  else
    md(z, c, "x", u)
    md(z, c, "y", w)
  end
end
rd.gate = function() end

local function inside(z, x, y)
  local a = z.a
  return x >= a[1] and x <= a[2] and y >= a[3] and y <= a[4]
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

-- a press (gate: a new step) clears the duplicate filter
local function gate(z, g)
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
  if g == 1 and st ~= z.st then
    z.l = {}
  end
  z.st = st
  z.u.v = z.sv[st + 1]
end

-- spring: rest at the spring position (0-100 % of the range), no output
local function rest(z)
  if z.o.spring >= 0 and z.o.read ~= "gate" then
    local f = z.o.spring / 100
    for _, k in ipairs(SR[z.o.read]) do
      z.q[k], z.u[k] = f, sc(z, f)
    end
  end
end

-- a finger's own state over its zone (xy, fingers > 1): values, filter
-- and rate per finger; MIDI on the zone channel + finger - 1
local function fg(z, i)
  local mi = z.mi
  z.fm = z.fm or { __index = z } -- one metatable for the zone's fingers
  local o = setmetatable({
    ch = (z.ch + i - 1) % 16,
    yc = (z.yc + i - 1) % 16,
    k = 0,
    l = {},
    u = { v = mi, x = mi, y = mi },
    q = { x = 0, y = 0 },
  }, z.fm)
  rest(o)
  z.fs = z.fs or {}
  z.fs[i] = o
  z.os[#z.os + 1] = o
  return o
end

-- the first contact owns a zone: another one is ignored until it lifts. An
-- xy with fingers > 1 gives a new contact the lowest free finger instead.
-- Returns the contact's state over the zone, or nothing if the zone is held
local function take(z, x, y, e)
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
    return
  end
  z = t
  -- a finger sliding in doesn't tap; the clock runs only for a tap zone
  local c = { z = z, p = {}, d = 0, t = not e and z.ms and z.o.tap == 1 and os.clock() or nil }
  z.k = 1
  gate(z, 1)
  c.m = e and "abs" or z.o.mode
  pos(z, c, x, y)
  c.m = z.o.mode
  run(z, "g")
  return c
end

-- spring: back to the spring position on release
local function lift(z)
  z.k = 0
  if z.o.spring >= 0 and z.o.read ~= "gate" then
    local f = z.o.spring / 100
    for _, k in ipairs(SR[z.o.read]) do
      z.q[k] = f
      put(z, k, sc(z, f))
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

-- a mouse fader or xy that isn't held: floor
P.off = function()
  return 0
end

-- the crosshair's position in cells, once per paint, in steps of 1/8 cell: a
-- smaller move doesn't repaint the pad
local function pt(z)
  local c = z.c
  local x = math.floor(z.q.x * (c[3] - 1) * 8 + 0.5) / 8
  local y = math.floor((1 - z.q.y) * (c[4] - 1) * 8 + 0.5) / 8
  z.cx, z.cy, z.cm = x, y, 2 - math.abs(x - math.floor(x + 0.5)) - math.abs(y - math.floor(y + 0.5))
end

-- LED x of cell e, looked up once (Z.la) and only when it is written
local function led(e)
  local x = Z.la[e]
  if not x then
    x = glag(Z.el, e) or e
    Z.la[e] = x
  end
  return x
end

-- cell e on layer l (1 or 2; the firmware adds the layers of an LED, so zones
-- that overlap paint on different layers and their colours mix); the caches
-- are by e + 100 * l
local function lit(e, k, cc, ph, l)
  l = l or 1
  local i, x = e + 100 * l
  if Z.lk[i] ~= k then
    x = led(e)
    Z.lk[i] = k
    local u = table.unpack
    gln(x, l, u(cc[1]))
    gld(x, l, u(cc[2]))
    glx(x, l, u(cc[3]))
  end
  if Z.lc[i] ~= ph then
    x = x or led(e)
    Z.lc[i] = ph
    glp(x, l, ph)
  end
end

-- z covers its cells, on its layer
local function claim(z)
  local c = z.c
  for j = c[2], c[2] + c[4] - 1 do
    for i = c[1], c[1] + c[3] - 1 do
      Z.ow[i + j * 9] = (Z.ow[i + j * 9] or 0) | z.lr
    end
  end
end

-- held by any finger
local function hd(z)
  for _, o in ipairs(z.os) do
    if o.k > 0 then
      return true
    end
  end
end

-- the xy pad: a crosshair is lit only in the two columns and the two rows
-- around it (the other cells are at the floor), so only those cells are
-- computed, and the cells the last paint lit that no crosshair lights now go
-- back to the floor. pv: the cells lit by the last paint, pw: a table kept to
-- build the next one (no new table per paint). Cell k is x + y * width.
local function paintpt(z, t, f, h, p)
  local c = z.c
  local w, m = c[3], c[4]
  local nw, pv = z.pw or {}, z.pv
  if not pv then
    -- the first paint writes every cell
    pv = {}
    for k = 0, w * m - 1 do
      pv[k] = true
    end
  end
  if p == P.point then
    for _, o in ipairs(z.os) do
      if o.k > 0 or not t and o == z then
        -- the level of a cell is (wx + wy) / cm: wx is 1 - dx on the column
        -- left of the crosshair and dx on the one right of it (0 on the
        -- others), wy the same for the rows (P.point, by columns and rows)
        local x, y = math.floor(o.cx), math.floor(o.cy)
        local dx, dy, cm = o.cx - x, o.cy - y, o.cm
        for i = math.max(0, x), math.min(w - 1, x + 1) do
          local wx = i == x and 1 - dx or dx
          for j = 0, m - 1 do
            local wy = j == y and 1 - dy or j == y + 1 and dy or 0
            local v, k = (wx + wy) / cm, i + j * w
            if v > (nw[k] or 0) then
              nw[k] = v
            end
          end
        end
        for j = math.max(0, y), math.min(m - 1, y + 1) do
          local v = (j == y and 1 - dy or dy) / cm
          for i = 0, w - 1 do
            if i < x or i > x + 1 then
              local k = i + j * w
              if v > (nw[k] or 0) then
                nw[k] = v
              end
            end
          end
        end
      end
    end
  end
  for k, v in pairs(nw) do
    lit(c[1] + k % w + (c[2] + k // w) * 9, z.ck, z.cc, math.floor(f + v * (h - f) + 0.5), z.lr)
  end
  for k in pairs(pv) do
    if not nw[k] then
      lit(c[1] + k % w + (c[2] + k // w) * 9, z.ck, z.cc, f, z.lr)
    end
  end
  z.pv, z.pw = nw, pv
  for k in pairs(pv) do
    pv[k] = nil
  end
end

local function paint(z)
  z.dt = nil
  local t = hd(z)
  local p = P[z.ms and not t and z.o.read ~= "gate" and "off" or z.o.read]
  local c = z.c
  local n = z.o.read == "gate" and z.st / math.max(#z.sv - 1, 1) or z.q[z.o.read == "point" and "x" or "v"]
  -- level 0-1 between floor and the lit phase (top or dim); glp scales the
  -- whole cell, so glp 0 is dark
  -- fingers: a crosshair per held finger at top, the highest level per cell;
  -- none held: finger 1's at dim
  local f = z.o.read == "axis" and LB or LF
  local h = t and LT or LD
  if z.o.read == "point" then
    -- nothing to paint while no crosshair moved (a step is 1/8 cell), no
    -- finger came or went, and the held state is the same
    local d = not z.pv or z.lh ~= t
    for _, o in ipairs(z.os) do
      pt(o)
      local a = o.k > 0 or not t and o == z
      if o.la ~= a or a and (o.lx ~= o.cx or o.ly ~= o.cy) then
        d = true
      end
      o.la, o.lx, o.ly = a, o.cx, o.cy
    end
    z.lh = t
    if d then
      paintpt(z, t, f, h, p)
    end
    return
  end
  for j = 0, c[4] - 1 do
    for i = 0, c[3] - 1 do
      lit(c[1] + i + (c[2] + j) * 9, z.ck, z.cc, math.floor(f + p(z, i, j, n) * (h - f) + 0.5), z.lr)
    end
  end
end

local function rl() -- release held zones: no stuck notes or buttons
  for _, z in ipairs(Z.zs) do
    for _, o in ipairs(z.os) do
      if o.k > 0 then
        lift(o)
      end
    end
    mb(z, 0) -- a drag lock (toggle) too
  end
end

-- value sync (RX, Z.set): no output; w: the value on the wire
local function sy(z, s, v, w)
  if z.o.read == "gate" then
    local b = 1
    for i, w in ipairs(z.sv) do
      if math.abs(w - v) < math.abs(z.sv[b] - v) then
        b = i
      end
    end
    z.st, z.u.v = b - 1, z.sv[b]
  else
    s = s == "g" and (z.o.read == "point" and "x" or "v") or s
    local q = cl((v - z.mi) / (z.ma - z.mi))
    z.q[s], z.u[s] = q, sc(z, q)
  end
  if w then
    z.l[s] = w
  end
  z.dt = 1
end

-- releases the running surface (held zones send their release) and keeps no
-- reference to it: a new surface is built without the old one in RAM
local function drop()
  rl()
  Z.zs, Z.ct, Z.R = {}, {}, {}
  Z.lv = nil
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

-- zones with the same colour share one curve; weak, so a colour no zone
-- uses goes
local CC = setmetatable({}, { __mode = "v" })

-- the zone colour, {red, green, blue} as Simple Color writes it (-1 is
-- the module's colour), as its curve: the minimum is black, so phase 0 is off
local function col(z, s)
  s = s or { -1, -1, -1 }
  local x, y, w = color_curve({ { s[1], s[2], s[3], s[4] or 1 } })
  x = { 0, 0, 0, x[4] }
  local k = table.concat(x, ",") .. ";" .. table.concat(y, ",") .. ";" .. table.concat(w, ",")
  local e = CC[k] or { x, y, w }
  CC[k] = e
  z.ck, z.cc = k, e
end

-- the first zone of a Setup run takes the touch element: full sensor range,
-- touch input, and the host MIDI it passes on
local function start(self)
  Z.te = self
  Z.el = self:ind()
  self:txma(1023)
  self:tyma(1023)
  self.touch_cb = Z.touch
  local u = self.midirx_cb
  Z.uc = u ~= Z.rx and u or nil
  self.midirx_cb = Z.uc
  Z.lv = nil
  Z.ct, Z.lk, Z.lc, Z.la, Z.R, Z.ow = {}, {}, {}, {}, {}, {}
end

-- the touch element: the ZONA has one, and the library finds it itself
local function te()
  for i = 0, #ele do
    if ele[i].type == "touch" then
      return ele[i]
    end
  end
end

-- the layers no zone paints on are dark (layer 2 only needs its phase at 0,
-- and only once a zone has used it: Z.u2)
local function dark()
  local b = { 0, 0, 0, 1 }
  local d = { b, b, b }
  for e = 0, 80 do
    local m = Z.ow[e] or 0
    if m & 1 == 0 then
      lit(e, 0, d, 0)
    end
    if Z.u2 and m & 2 == 0 and Z.lc[e + 200] ~= 0 then
      Z.lc[e + 200] = 0
      glp(led(e), 2, 0)
    end
  end
end

-- a zone that takes the live grab turns it on for the surface
local function live()
  Z.lv = nil
  for _, q in ipairs(Z.zs) do
    if q.o.grab == "live" then
      Z.lv = 1
    end
  end
end

-- the host MIDI identities a zone sends (a 14-bit pair on both CCs), so the
-- host's messages set its value. The mouse, the gamepad and NRPN have none.
local function reg(z)
  if z.m and z.m < 3 then
    for _, k in ipairs(SR[z.o.read]) do
      local pk, ch = z.p, z.ch
      if k == "y" then
        pk, ch = z.py, z.yc
      end
      local r = { z = z, s = k, m = z.m, p = pk }
      Z.R[z.m == 2 and ky(ch, 224, 0) or ky(ch, z.cmd, pk)] = r
      if z.m == 1 then
        Z.R[ky(ch, 176, pk + 32)] = r
      end
    end
    Z.te.midirx_cb = Z.rx
  end
end

-- Builds the zone of the handle g (kd the kind, op the options set so far, gm
-- the cells, nm the name), or builds it again in place of `old`: every call of
-- the chain does, so a zone is complete after each one. The first zone of a
-- Setup run starts the surface: a touch or a value sync since the last zone
-- sealed it.
local function build(g, old)
  if not old and not Z.op then
    drop()
    start(te())
    Z.op = 1
  end
  local o = setmetatable({}, KM[g.kd])
  for k, val in pairs(g.op) do
    o[k] = val
  end
  o.read = nil -- from the kind, never an option
  if o.dir == "xy" then
    o.read = "point"
  end
  local m = o.msg == "midi" and o.cmd or o.msg
  local ms = m == "mouse" or nil
  -- steps: 7 bits, 14 for pitch bend, a 14-bit CC and a 14-bit NRPN, 8 for the
  -- gamepad
  o.res = (m == "pb" or m == "cc14" or m == "nrpn14") and 14 or m == "pad" and 8 or 7
  if ms then
    -- finger 1 only, no centre to return to; any toggle is a drag lock
    o.fingers, o.spring, o.bmo = 1, -1, math.min(o.bmo, 1)
  elseif m == "pad" then
    o.fingers = 1 -- finger 1 only
  end
  -- CC slot: xy 2, others 1. Gamepad autos: the axes (xy 2, fader 1) and
  -- buttons of the gamepad zones before, counted apart
  local b, ga, gb = 0, 0, 0
  for _, q in ipairs(Z.zs) do
    if q == old then
      break
    end
    local r = q.o.read
    local c = r == "point" and 2 or 1
    b = b + c
    if q.m == 3 and r == "gate" then
      gb = gb + 1
    elseif q.m == 3 then
      ga = ga + c
    end
  end
  -- the range follows the command: 7 bits, 14 above, and a gamepad axis -128
  -- to 127
  local mi, ma = 0, o.res > 7 and 16383 or 127
  if m == "pad" then
    mi, ma = -128, 127
  end
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
  -- m: nil mouse, 0 7-bit, 1 14-bit CC pair, 2 pitch bend, 3 gamepad, 4 NRPN,
  -- 5 NRPN with a 14-bit value
  local z14 = m == "cc14"
  local p, py = o.num, o.num + 1
  if p < 0 and m == "pad" then
    p = o.read == "gate" and gb or ga
    py = p + 1
  elseif p < 0 then
    p = 32 + gmx() * 16 + b
    py = (p + 1) % 128 % (z14 and 32 or 128)
    p = p % 128 % (z14 and 32 or 128)
  end
  if o.numy >= 0 then
    py = o.numy
  end
  local x, y, w, h = g.gm[1], g.gm[2], g.gm[3], g.gm[4]
  local z = {
    n = g.nm,
    ty = g.ty,
    o = o,
    ch = o.ch < 0 and (gmy() * 4 + gpc()) % 16 or o.ch,
    cmd = m == "note" and 144 or 176,
    p = p,
    py = py,
    m = m == "pb" and 2
      or z14 and 1
      or m == "pad" and 3
      or m == "nrpn" and 4
      or m == "nrpn14" and 5
      or not ms and 0
      or nil,
    ms = ms,
    w = ms and { v = 0, x = 0, y = 0 }, -- mouse: the move to send (mv)
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
    u = { v = mi, x = mi, y = mi },
    -- position: only the sources this reader has
    q = o.read == "point" and { x = 0, y = 0 } or { v = 0 },
    c = { x, y, w, h },
  }
  z.os = { z } -- the zone and its fingers' states (fg)
  z.yc = o.chy < 0 and z.ch or o.chy
  rest(z)
  col(z, o.col)
  if old then
    for i, q in ipairs(Z.zs) do
      if q == old then
        Z.zs[i], z.lr = z, old.lr
      end
    end
    for k, r in pairs(Z.R) do
      if r.z == old then
        Z.R[k] = nil
      end
    end
  else
    -- layer 2 when a zone on layer 1 overlaps it
    z.lr = 1
    for _, q in ipairs(Z.zs) do
      local a = q.c
      if q.lr == 1 and x < a[1] + a[3] and a[1] < x + w and y < a[2] + a[4] and a[2] < y + h then
        z.lr, Z.u2 = 2, 1
      end
    end
    Z.zs[#Z.zs + 1] = z
    claim(z)
  end
  live()
  reg(z)
  paint(z)
  if not old then
    dark()
  end
  g.zn = z
end

-- The zone as a chain: _Z.xy(x, y, w, h).n("p1").col(255, 0, 0).spr("50%").
-- A constructor builds the zone with the defaults and every method that
-- follows sets one thing and builds it again (only that zone, in place), so
-- there is no closing call. The methods act on the zone just constructed.
local M = {}
local cur

local function again()
  build(cur, cur.zn)
  return M
end

local function set(k, v)
  cur.op[k] = v
  return again()
end

local function ctor(kind, dir)
  return function(x, y, w, h)
    -- a zone of the same kind and cells on the surface of this Setup run
    -- shows the Setup ran again (a zone needn't have a name)
    local ty = kind .. (dir or "")
    for _, q in ipairs(Z.zs) do
      if q.ty == ty and q.c[1] == x and q.c[2] == y and q.c[3] == w and q.c[4] == h then
        Z.op = nil
        break
      end
    end
    cur = { kd = kind, op = { dir = dir }, gm = { x, y, w, h }, ty = ty }
    build(cur)
    return M
  end
end
Z.v, Z.h, Z.xy, Z.b = ctor("fader", "v"), ctor("fader", "h"), ctor("fader", "xy"), ctor("button")

-- the name; one that another zone has means the Setup ran again, and the
-- surface is built anew from this zone
function M.n(s)
  cur.nm = s
  local z = cur.zn
  for _, q in ipairs(Z.zs) do
    if q ~= z and q.n == s then
      rl()
      Z.zs, Z.ct, Z.R, Z.ow, z.lr = { z }, {}, {}, {}, 1
      claim(z)
      again()
      dark()
      return M
    end
  end
  return again()
end

function M.col(r, g, b, a)
  return set("col", { r or -1, g or -1, b or -1, a or 1 })
end

-- MIDI, as self:gms(ch, cmd, p1, p2, mode) of the Midi block: -1 is auto, p2
-- is the zone's value. cmd 144 is a note, 224 pitch bend, 176 a CC, and mode
-- 1 a 14-bit CC pair, 2 NRPN, 3 NRPN with a 14-bit value
function M.gms(ch, cmd, p1, p2, mode)
  cmd, mode = cmd or -1, mode or 0
  local m = (cmd == 144 or cmd == 128) and "note"
    or cmd == 224 and "pb"
    or (cmd == -1 and mode == 0) and (cur.kd == "button" and "note" or "cc")
    or mode == 1 and "cc14"
    or mode == 2 and "nrpn"
    or mode == 3 and "nrpn14"
    or "cc"
  cur.op.msg, cur.op.cmd, cur.op.ch, cur.op.num = "midi", m, ch or -1, p1 or -1
  return again()
end

-- gms for the x of an xy pad, and gms for its y with the same arguments: the
-- channel and number of y (-1: those of x, number + 1). The command, p2 and
-- mode of y are those of x.
M.gmsx = M.gms
function M.gmsy(ch, _, p1)
  cur.op.chy, cur.op.numy = ch or -1, p1 or -1
  return again()
end

-- the mouse: a button zone presses the button b (1 left, 2 right, 4 middle)
function M.mo(b)
  cur.op.msg, cur.op.num = "mouse", b or -1
  return again()
end

-- the gamepad: the axis or the button n, -1 is auto
function M.ga(n)
  cur.op.msg, cur.op.num = "pad", n or -1
  return again()
end

-- 0 absolute, 1 relative
function M.mode(m)
  return set("mode", m == 1 and "rel" or "abs")
end

function M.sens(n)
  return set("sensitivity", n)
end

-- the position it returns to on release, "50%" or 50; off by default
function M.spr(s)
  -- (no "?" in the pattern: compressScript drops it)
  return set("spring", type(s) == "string" and tonumber(s:match("%d+")) or s)
end

-- 0 focus, 1 live
function M.cap(c)
  return set("grab", c == 1 and "live" or "focus")
end

function M.fing(n)
  return set("fingers", n)
end

-- the steps of a button, 0 momentary
function M.tog(n)
  return set("bmo", n)
end

function M.tap(t)
  return set("tap", t)
end

-- repaints the zones a touch or a value sync changed. A finger repaints its
-- zone
local function refresh()
  for _, z in ipairs(Z.zs) do
    for _, o in ipairs(z.os) do
      if o.dt then
        z.dt, o.dt = 1, o == z and 1 or nil
      end
    end
    if z.dt then
      paint(z)
    end
  end
end

-- A finger takes every zone under it, so zones can overlap and all send:
-- Z.ct[id] is its list of contacts, one per zone it holds. dead: it left a
-- button, so it takes none after
-- ends: 5 up, 3 suppressed, 7 unsuppressed up
local function route(id, evt, x, y)
  local l = Z.ct[id]
  if evt == 4 or evt == 5 or evt == 3 or evt == 7 then
    Z.ct[id] = nil
    for _, c in ipairs(l or {}) do
      local z = c.z
      lift(z)
      -- a mouse xy: a short touch that barely moved clicks left on lift,
      -- unless a mouse button zone holds left (a drag lock stays)
      local m = z.ms and z.o.read == "point" and z.o.tap == 1
      if m and (evt == 5 or evt == 7) and c.t and os.clock() - c.t < TT and c.d < TD then
        for _, o in ipairs(Z.zs) do
          if o.mb == 1 and o.o.num <= 1 then
            m = nil
          end
        end
        if m then
          gmbs(1, 1)
          gmbs(1, 0)
        end
      end
    end
  end
  if evt == 4 then
    l = {}
    Z.ct[id] = l
    for _, z in ipairs(Z.zs) do
      if inside(z, x, y) then
        l[#l + 1] = take(z, x, y)
      end
    end
  elseif evt == 1 and l then
    -- leaving: buttons release (or live), faders and xy clamp
    local i = 1
    while i <= #l do
      local c = l[i]
      local z = c.z
      if not inside(z, x, y) and (z.o.grab == "live" or z.o.read == "gate") then
        lift(z)
        table.remove(l, i)
        l.dead = l.dead or z.o.grab ~= "live"
      else
        pos(z, c, x, y)
        i = i + 1
      end
    end
    if Z.lv and #l == 0 and not l.dead then
      for _, z in ipairs(Z.zs) do
        if z.o.grab == "live" and inside(z, x, y) then
          l[#l + 1] = take(z, x, y, 1)
        end
      end
    end
  end
end

local function event(id, evt, x, y)
  if evt == 9 then -- tap: down and up in one scan
    route(id, 4, x, y)
    evt = 5
  end
  route(id, evt, x, y)
end

-- The touch callback takes the event it is given and then the ones queued
-- behind it (the firmware pops the queue the same way, one callback each), and
-- paints once, so the LEDs show the newest position and a slow paint makes the
-- next one cover more events instead of falling behind. Every event still
-- sends its output.
function Z.touch(self, id, evt, x, y)
  Z.op = nil
  event(id, evt, x, y)
  local pop = self.touch_pop
  while pop and pop(self) do
    event(self:tid(), self:tev(), self:txv(), self:tyv())
  end
  refresh()
end

function Z.set(n, v, s)
  Z.op = nil
  for _, z in ipairs(Z.zs) do
    if z.n == n and not z.ms and not hd(z) then -- touch wins; no mouse value
      sy(z, s or "g", v)
    end
  end
  refresh()
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
    Z.op = nil
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
      refresh()
    end
  end
  if Z.uc then
    Z.uc(self, h, e)
  end
end

-- Lets the Library block free this instance before it runs the page's
-- Setups again (Install): releases the zones and the callbacks it set on the
-- touch element. Acts on this instance only, so an old one can be unloaded
-- after a new one is loaded.
function Z.unload()
  drop()
  for e = 0, Z.u2 and 80 or -1 do
    glp(led(e), 2, 0)
  end
  Z.u2 = nil
  Z.lk, Z.lc, Z.la, Z.ow, Z.op = {}, {}, {}, {}, nil
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
