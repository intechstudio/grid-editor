# ZONA touch zones

Branch `feat/zona-sandbox` (PR #1672), library `zona.lua` 0.28.1, written 2026-10-29.

This document describes what the code on the branch does. It replaces `docs/zona-zones-rfc.md`. Section 13 lists what the RFC had and the code does not.

## 1. What it is

The ZONA has a 9×9 touch surface and 81 LEDs. The user splits the surface into zones: faders, buttons and XY pads. An XY pad is a fader with `dir="xy"`. Each zone is one action block on the touch element's Setup event. The block holds the zone's cells and options. A Lua library on the module, `zona.lua`, reads the touch sensor, turns it into values, sends MIDI, mouse or gamepad output, and lights the LEDs.

The action strings are the only store. The editor reads every view from them: the block face, the header, the overlay on the module drawing.

## 2. Where things run

```lua
-- Touch element, Setup. A Touch Zone block starts with the call that loads the
-- library from the page folder as _Z, then one chain per zone.
_Z=gr("zona")
_Z.v(0,0,1,9).n("f1")
_Z.v(1,0,1,9).n("f2").gms(-1,224,-1,-1).spr("50%")
_Z.b(2,0,2,2).n("b1").col(255,0,0).tog(1).grp(1)
_Z.xy(4,0,5,5).n("p1").mo()

-- Page folder on the module
/00/zona.lua
```

Every Touch Zone block loads the library itself: its script starts with `_Z=gr("zona")`. The module caches the library, so each block can load it and the zones of all blocks share one surface. The block writes the call each time it writes its script, and reads a script without it (from before the block loaded the library) as the same block. The Library block is no longer needed for ZONA. `zona` stays in the editor's list of bundled libraries, so the Library block still offers it.

The page folder must hold the editor's version of `zona.lua`. The block reads the folder, and while the module has no copy or an older one it dims and disables all its controls and shows an Install library (or Update library) button, which writes the editor's copy and runs the Setups again. A module the editor can't read, such as a virtual one, is not blocked.

The library is loaded under the global `_Z`. The touch blocks always write `_Z.`.

## 3. The zone line

A zone line is a chain: a constructor with the cells, then a call for each thing that is not the default.

```
_Z.xy(0,0,5,5).n("p1").col(255,0,0).gms(-1,176,40,-1,1).spr("50%")
```

The constructors are `_Z.v(x,y,w,h)` (vertical fader), `_Z.h(x,y,w,h)` (horizontal fader), `_Z.xy(x,y,w,h)` (XY pad) and `_Z.b(x,y,w,h)` (button). The cells are `x`, `y`, `w`, `h`: `0,0` is the top left, `y` grows down. There is no `self`: the library finds the touch element itself (the element of type `touch`). Each call returns the zone, so calls chain, and a zone is complete after every call: the constructor builds it with the defaults and each call that follows sets one thing and builds that zone again, in place. There is no closing call. The calls act on the zone just constructed.

| Call                      | Arguments                                                                                             | Default (omitted)                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `.n("name")`              | the zone's name, a string                                                                             | none: the editor writes it only when the user names the zone |
| `.col(r,g,b)`             | colour, -1 for a channel is the module's own                                                          | the module's colour                                          |
| `.gms(ch,cmd,p1,p2,mode)` | MIDI, as `self:gms` of the Midi block; `ch` and `p1` -1 are auto, `p2` is the zone's value (write -1) | a fader: `(-1,176,-1,-1,0)`, a button: `(-1,144,-1,-1,0)`    |
| `.mo(btn)`                | the mouse; a button zone presses `btn` (1 left, 2 right, 4 middle)                                    | left                                                         |
| `.ga(n)`                  | the gamepad axis or button `n`, -1 auto                                                               | -1                                                           |
| `.mode(m)`                | `0` absolute, `1` relative                                                                            | 0                                                            |
| `.sens(n)`                | sensitivity                                                                                           | 1                                                            |
| `.spr("50%")`             | the position a fader or XY returns to on release, `"0%"` to `"100%"` or a number                      | off                                                          |
| `.tog(n)`                 | a button's steps, 0 momentary, 1 toggle                                                               | 0                                                            |
| `.grp(n)`                 | a button's radio group, 0 none                                                                        | 0                                                            |
| `.fing(n)`                | the fingers of an XY pad, 1 to 5                                                                      | 1                                                            |
| `.tap(t)`                 | tap to click of a mouse XY pad, 0 or 1                                                                | 1                                                            |
| `.cap(c)`                 | `0` focus, `1` live                                                                                   | 0                                                            |

- `name` must be a Lua identifier, not a Lua keyword, and not a firmware function name in either its human or short form. The last rule exists because the editor sends scripts through `compressScript`, which rewrites firmware names inside strings too.
- `.gms`: `cmd` 144 is a note (128 too), 224 pitch bend, 176 a CC, and `mode` makes a CC `1` a 14-bit pair (the number and the number plus 32), `2` an NRPN and `3` an NRPN with a 14-bit value. The firmware's `gms` takes four arguments and does no encoding; the fifth, `mode`, belongs to `self:gms` in `simplemidi.lua`, and the library encodes the same way (see Outputs).
- `.gms`, `.mo` and `.ga` replace each other: the last one wins.
- The value range follows the command: 0–127 for a CC, a note and a 7-bit NRPN, 0–16383 for a 14-bit CC, pitch bend and a 14-bit NRPN, -128 to 127 for a gamepad axis. Host MIDI is always on: a CC, a 14-bit CC and pitch bend zone follow the host's messages on the identity it sends (there is no option for it).
- The editor writes the calls in a fixed order, skipping what is the default: `.n`, `.col`, the output (`.gms`, `.mo` or `.ga`), `.mode`, `.sens`, `.spr`, `.tog`, `.grp`, `.fing`, `.tap`, `.cap`. It reads them in any order. A call a zone has no use for (`.spr` on a button) is dropped when read. A call the editor doesn't know, or one with arguments that don't fit, makes the line fail to parse, and the block shows it as code and never rewrites it. A zone without `.n` has no name (see Names below).

Earlier line forms still run in the editor's reading, not on the module. The positional `_Z.zone(self,"f1",2,{...},...)` and the option-table `_Z.fader(self,"f1",x,y,w,h,{key=value,...})` and `_Z.button(...)` parse and are written back as chains the next time the block changes. The module's library 0.27.0 has only the chain: a profile written with an older line needs its blocks edited once (or sent again) after the library is updated. An option the editor doesn't know in an option-table line, a range (`min`, `max`) and `rx` of earlier builds are dropped or make the line not a zone line.

`parseZone` and `zoneToLua` live in `zone-parse.ts`. The library has no timer: there is no tick line and no Timer block.

## 4. Options

The editor's schema is in `zone-model.ts`. The library's defaults are in `Z.def` and `Z.kind` in `zona.lua`. A test checks that the two match. "Kinds" says which kinds show the option. "Hidden for" says which outputs hide it on the face. The library ignores an option its output does not use.

| Key           | Applies to | Section   | Default                           | Range                                                                         | Hidden for         |
| ------------- | ---------- | --------- | --------------------------------- | ----------------------------------------------------------------------------- | ------------------ |
| `dir`         | fader      | Geometry  | `v`                               | `v`, `h`, `xy`                                                                |                    |
| `mode`        | fader, xy  | Output    | `abs`                             | `abs`, `rel`                                                                  | mouse              |
| `sensitivity` | fader, xy  | Behaviour | 1                                 | 0.01–10                                                                       |                    |
| `bmo`         | button     | Behaviour | 0                                 | 0–127                                                                         | mouse              |
| `spring`      | fader, xy  | Behaviour | -1                                | -1, 0–100                                                                     | mouse              |
| `group`       | button     | Behaviour | 0                                 | 0–8                                                                           | mouse              |
| `fingers`     | xy         | Behaviour | 1                                 | 1–5                                                                           | mouse, pad         |
| `grab`        | all        | Capture   | `focus`                           | `focus`, `live`                                                               |                    |
| `col`         | all        | LED       | none; the module's default colour | `{r,g,b}`                                                                     |                    |
| `msg`         | all        | Output    | `midi`                            | `midi`, `mouse`, `pad`                                                        |                    |
| `cmd`         | all        | Output    | fader `cc`, button `note`         | fader: `cc`, `cc14`, `pb`; button: `note`, `cc`, `cc14`; XY pad: `cc`, `cc14` | mouse, pad         |
| `ch`          | all        | Output    | -1 (auto)                         | -1–15                                                                         | mouse, pad         |
| `num`         | all        | Output    | -1 (auto)                         | -1–127                                                                        | mouse on fader, xy |
| `tap`         | xy         | Behaviour | 1                                 | 0–1                                                                           | midi, pad          |

Meaning of each option:

- `dir`: which way a fader runs. `v`: bottom is min. `h`: left is min.
- There is no range option. The value range is the command's: 0–127 for `cc`, `note` and `nrpn`, 0–16383 for `cc14`, `pb` and `nrpn14` (a gamepad axis is -128–127). An older line with a range (`min`, `max`, or the `{min,max}` table) reads in the editor, and the range is dropped when the line is written again.
- `dir`: `v` and `h` are a fader, bottom to top or left to right. `xy` is an XY pad with two sources, x and y. In the table, "xy" means a fader with `dir="xy"`.
- `mode`: how the finger moves the value. `abs` jumps to the finger. `rel` adds the finger's movement times `sensitivity`.
- `sensitivity`: for `rel`, the drag factor. For a mouse zone, the move multiplier. The face shows it only in `rel` mode, and for mouse output. The option was called `speed` before 0.16.0; the library still reads it when `sensitivity` is absent, and the editor shows it as an unknown option.
- `bmo`: the button mode, as Grid's Button Mode block. 0 momentary, 1 toggle, n gives n+1 steps.
- `spring`: -1 is off (the default). 0 to 100 makes a fader or XY rest at that percent of its range and return there on release: 0 is the minimum, 50 the centre, 100 the maximum. The editor suggests Off, 0%, 50% and 100%. Before library 0.19.0 the option was 0 or 1 (1 the centre); a line with `spring=1` still returns to the centre.
- `group`: radio group 1–8. 0 is none.
- `fingers`: how many contacts an XY takes at once.
- `grab`: `focus` keeps a contact in the zone it landed on. `live` lets a contact move between live zones.
- `col`: the zone colour, written like the Simple Color block's colour: `{red, green, blue}`, such as `{255,128,0}`. There is no alpha: an older line with a fourth value still reads, and the value is dropped when the line is written again. A channel of -1 is the module's own colour for it. The old `"rrggbb"` text still works (library 0.19.0) and the editor rewrites it as a table.
- `msg`: the output. `midi`, `mouse` or `pad` (gamepad).
- `cmd`: the MIDI command of a `midi` zone: `cc` (7-bit), `cc14` (14-bit pair), `note`, `pb`, `nrpn` (7-bit value) or `nrpn14` (14-bit value). In a line this is `.gms(ch, cmd, p1, p2, mode)`: `cmd` 176 with `mode` 0, 1, 2, 3 is `cc`, `cc14`, `nrpn`, `nrpn14`; 144 is `note`; 224 is `pb`. The `res` option of earlier builds is gone.
- `ch`: MIDI channel 0–15. -1 is auto.
- `num`: the CC or note number, or the NRPN number (0–16383). For a mouse button, the button (1 left, 2 right, 4 middle; 1 when left out). For a gamepad, the axis 0–5 or the button 0–31. -1 is auto.
- `tap`: on a mouse XY, 1 makes a short touch click the left button.

Extra rules the validator applies:

- An explicit `num` must keep every number on the wire in range: a 14-bit CC 0–31 (XY 0–30), an NRPN 0–16383 (XY 0–16382), a 7-bit XY 0–126, a gamepad axis 0–5 (XY 0–4), a gamepad button 0–31.
- `spring` on a button is an error. `fingers` on a fader or button is an error.
- The geometry must be whole numbers, at least 1×1, inside the 9×9 grid.

## 5. Outputs

The library reads `o.msg == "midi" and o.cmd or o.msg` as the thing to send. An unknown value sends 7-bit CC.

A zone runs on press, on a value change and on release. A value run sends the source that changed: `v` for a fader or button, `x` or `y` for an XY. A press or release run sends all sources. On a button a press or release also sets the mouse button.

### MIDI

| `cmd`    | Wire format                                                                                                                |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `cc`     | 7-bit CC. A range wider than 127 is scaled to 0–127.                                                                       |
| `cc14`   | 14-bit CC pair: MSB on `num`, LSB on `num+32`. The auto number wraps at 32. The range is 0–16383 by default.               |
| `note`   | Note on (144) with the value as velocity, scaled to 0–127 when the range is wider. Value 0 is the note off.                |
| `pb`     | Pitch bend (224), always 14-bit. The centre is 8192.                                                                       |
| `nrpn`   | NRPN with a 7-bit value, as `simplemidi.lua` sends mode 2: CC 99 is `num // 128`, CC 98 is `num % 128`, CC 6 is the value. |
| `nrpn14` | NRPN with a 14-bit value, mode 3: the same number, then CC 6 is `value // 128` and CC 38 is `value % 128`.                 |

A button with `cmd="cc"` sends its step value as a CC. With `cmd="cc14"` it sends a 14-bit pair.

An XY sends x on `num` and y on `num+1`.

A duplicate filter per source holds the last value on the wire. A value is sent only when it changes. The filter is cleared by a press, so a press re-sends the current value. On a button it is cleared only when the step changes.

### Mouse

`msg="mouse"`. Finger 1 only. The library sets `fingers=1`, `spring=-1` and caps `bmo` at 1.

- **XY**: a trackpad. The pointer moves by the finger's movement, one step per sensor unit, times `sensitivity`. `gmms(1, dx)` and `gmms(2, dy)`. Sensor y grows down, like the pointer.
- **Fader**: the wheel. One step per 32 sensor units, times `sensitivity`. `gmms(3, step)`. Dragging toward the fader's max sends positive steps.
- **Button**: `gmbs(num, 1)` on touch, `gmbs(num, 0)` on lift. `num` 1 left, 2 right, 4 middle. No auto: without `num` it is left. `bmo=1` is a drag lock: press on one touch, release on the next. The editor shows no Button mode and no Radio group for a mouse button zone and writes neither (a line from an older build or by hand that has `.tog` still runs as a drag lock).
- Each move is sent at once. Each axis sends its whole steps, clamped to -127…127, and keeps the fraction. A bigger move is cut.
- **Tap to click** (`tap=1`, XY): a touch with less than 30 sensor units of travel sends `gmbs(1,1)` then `gmbs(1,0)` on lift, in the same scan. The firmware must send them as two USB reports (`grid_usb_macro_tx_flush` in grid-fw splits a press and a release of one button); older firmware merges them into one report and the host sees no click. The touch must also be shorter than 0.2 s, timed with `os.clock()` between down and up. This needs firmware whose `os.clock` returns real time. The clock is read only on a tap zone. A contact that slid in under `grab="live"` never taps. A tap does not click while a mouse button zone holds the left button, so a drag lock stays.
- Leaving a zone, another group member turning on, a Setup re-run, `Z.set` on a group member and `Z.unload` release a held mouse button.
- A mouse zone has no value. `Z.set` skips it.

### Gamepad

`msg="pad"`. Finger 1 only. The library sets `fingers=1`, and the axis range is -128 to 127.

- **Fader and XY**: axes. The travel maps to -128…127. `ggms(axis, pos)`. An XY sends x on `num` and y on `num+1`. `mode`, `sensitivity`, `spring` and `grab` apply. An XY with `spring=50` is a joystick centred on 0.
- **Button**: `ggbs(button, 1)` on any step but the first, `ggbs(button, 0)` on the first. It follows `bmo` and groups like a note.

### Autos

With `ch=-1` and `num=-1` the library computes the identity. The editor computes the same values in `zone-autos.ts` to show them. A test checks that the two agree.

- Channel: `(gmy()*4 + gpc()) % 16`. Module row and page.
- Number: `(32 + gmx()*16 + slot) % 128`. For a 14-bit CC pair the result is reduced `% 32`. The slot is counted over the zones defined before this one: an XY takes 2, every other zone 1, whatever its output. The y number is the next one, wrapped the same way.
- Gamepad: axes and buttons are counted apart over the gamepad zones defined before. A fader takes one axis, an XY two. So the first gamepad fader is X, the next Y, an XY after them takes Z and RX. Buttons count from 0.

Explicit values are used as given.

With `fingers` above 1, finger k sends on channel `(ch + k - 1) % 16` with the same numbers.

## 6. How the library behaves

### Setup and going live

The first constructor of a Setup run releases the previous surface (held zones send their release, a held mouse button is released), finds the touch element (the `ele` entry of type `touch`), remembers it in `Z.te`, and sets `txma(1023)`, `tyma(1023)` and `touch_cb = Z.touch` on it.

Every constructor adds its zone to the surface and goes live at once: its host-MIDI identities are registered, the zone is painted, and every cell no zone covers is set dark. The LEDs are right after Setup, without a touch. Each call of the chain builds that zone again in place (its fields are derived again, its host-MIDI identities replaced, its own cells painted); the free cells are not darkened again, because a call can't change the cells. A constructor costs about 15,000 to 25,000 Lua VM instructions with a few zones there, and a call 1,000 to 3,500.

A constructor starts a new run when the surface was sealed since the last one: a touch, a host message that matched a zone's identity, or `Z.set` seals it (`Z.op` is nil). Before any of those, a Setup that ran again shows by a zone of the same kind and cells already on the surface: the constructor releases and drops the surface and starts it anew from this zone. A name that is already on the surface, given by `.n`, shows it too (the zone was moved, say): the surface is built anew from this zone (the zones before it are released and dropped, this zone is built again, the free cells are darkened). The editor treats a duplicate name as an error that stops the send. Two zones of the same kind on the very same cells are taken as one Setup run again.

If some zone sends a CC, a 14-bit CC or pitch bend, the library sets `self.midirx_cb = Z.rx` (host MIDI is always on; the mouse, the gamepad and NRPN zones have no host identity). A `midirx_cb` the user's own Setup code set before the first zone is kept and called after the library's handling. If no zone has a host identity, the library leaves `midirx_cb` as it found it.

Removing the last zone line leaves the previous surface running until the page reloads. No zone line runs to drop it.

### Touch routing

`Z.touch(self, id, evt, x, y)` is the touch callback. `id` is a contact slot 0–4. `evt` 4 is down, 1 is move, 5 is up. 3 and 7 are treated as up. 9 is a tap in one scan: the library runs a down then an up at the same point. From library 0.26.0 the callback also takes the events queued behind the one it was given: it calls `self:touch_pop()` and reads `tid`, `tev`, `txv` and `tyv`, as the firmware's own event loop does, until the queue is empty, and paints once. Every event still sends its output, and the LEDs show the newest position, so a slow paint makes the next one cover more events instead of falling behind. A firmware without `touch_pop` on the element gets one event per callback, as before.

- A down finds the first zone, in definition order, that contains the point.
- **The first contact owns a zone.** A contact landing on a held zone is ignored until it lifts. An XY with `fingers` above 1 gives a new contact the lowest free finger number instead, up to `fingers`.
- A contact landing on an empty cell is not owned. If it moves into a `live` zone, that zone takes it.
- `grab="focus"`: the contact stays with its zone. A fader or XY clamps the position to the zone's edge. A button releases when the finger leaves, and the contact is ignored until it lifts.
- `grab="live"`: leaving the zone releases it. Entering another `live` zone presses it at the entry position with an `abs` read, whatever its mode.
- A move within 2 sensor units of the last position on both axes is dropped.
- Finger 2 and up on an XY get their own state (values, filter) on first use. The state is kept until the next Setup run.

### Values

- The position inside the zone is 0–1 per axis. For a vertical fader 0 is the bottom. For an XY y 0 is the bottom.
- `min` and `max` below are the command's range (0 and 127, or 0 and 16383), and -128 and 127 for a gamepad axis. The value is `min + round(position * (2^bits - 1)) * (max - min) / (2^bits - 1)`, rounded.
- Steps: the step values are `min`, then `min + trunc((max - min) / bmo)` added bmo times. With `bmo=0` the second value is `max`. The firmware's own stepping differs for some ranges. That is noted in the code.
- Groups: a press that turns a group member on turns the other members of the group off first. They send their off value. Every member can be off.
- Spring: the zone rests at position 0.5 per axis and sends nothing at start. On release it returns to 0.5 at once. Host MIDI and `Z.set` put the value where they say.

### Host MIDI and Z.set

A zone that sends a CC, a 14-bit CC or pitch bend registers the identities it sends: each source's channel, command and number, both CCs of a 14-bit pair, pitch bend on its channel. On an XY with fingers only finger 1's channel is registered.

`Z.rx` handles host MIDI only (header 13). Note off and velocity 0 are 0. A 14-bit CC applies the MSB at once and the LSB refines it. Pitch bend is LSB then MSB. A 7-bit message into a wider range is scaled up. NRPN is not decoded. A button takes the nearest step; an "on" for a group member turns the others off. The value is set without sending, the glide target is cleared, and the duplicate filter is updated. The zone repaints on the next tick. RX is ignored while any finger holds the zone.

`Z.set(name, value, src)` sets a zone's value the same way, for user code. Without `src` it sets `v`, or `x` on an XY. `src="y"` sets y. Mouse zones and held zones are skipped.

### LEDs

Fixed phase levels: floor 16, dim 110, top 255. A vertical or horizontal fader has a dimmer floor, 8, so its background stands out from the lit part. Cells no zone covers are black. A zone's cells are at least the floor. Lit cells are at top while a finger holds the zone and at dim after.

- Fader: a fill from the min end with a partial edge cell.
- Button: the step level, 0 off at the floor to 1 on.
- XY: a soft crosshair, normalised so its brightest cell is at the lit level. With fingers: one crosshair per held finger at top, the highest level per cell. With none held, finger 1's at dim.
- XY paint cost: a crosshair is lit only in the two columns and the two rows around it, so the library computes only those cells (about 30 of 81 on a 9×9 pad) and returns the cells the last paint lit to the floor. The crosshair position is rounded to 1/8 cell, and a move that stays in the same 1/8 step (with the same fingers and held state) paints nothing; the MIDI or mouse output is not limited by this. The LED index of a cell is looked up once per surface (`Z.la`). From library 0.26.0. Before it, every cell was recomputed and written for each finger on every move: about 14,400 Lua VM instructions per move for a 9×9 pad with two fingers, about 4,800 now (the test `the work per move stays small` counts them).
- A mouse fader or XY shows the finger at top while held and sits at the floor after.
- `col={r,g,b}` goes through the firmware's `color_curve`. The curve's minimum is replaced by black, so phase 0 is off. Without `col` the module's default colour is used, as for a channel of -1. Zones with the same colour share one curve.
- The library paints only dirty zones and sends only changed cells. Painting happens when a zone line runs, after each touch event, and after host MIDI or `Z.set` changed a value. Overlapping zones: a touch reaches every zone under the finger, so a button and an XY pad on the same cells both send. A zone that overlaps an earlier zone paints on LED layer 2, the others on layer 1, and the firmware adds the layers of an LED, so a shared cell shows both colours, each at its own level (a red XY crosshair over a lit blue button gives purple) with one LED call per change, as without overlap. Two layers are all there are: a third zone over the same cells shares layer 2 with the second, and the later one's paint wins there.
- The LED index of a cell is `glag(<touch element index>, x + y*9)`, looked up when a cell is written.

### No timer

The library has no timer, no tick, and no glide or ease. Everything runs from the Setup, the touch callback and host MIDI. The mouse moves, the repaints and the spring return all run inside the touch event that causes them. A value is sent as soon as it changes, with no rate limit.

### Unload

`Z.unload()` releases held zones and a held mouse button, drops the surface, and gives back the callbacks it set on the element: `touch_cb` is set to nil when it is `Z.touch`, `midirx_cb` is set back to the user's callback when it is `Z.rx`. The Library block calls it before it installs a new copy.

## 7. Library API

| Name                                                              | What it does                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `Z.v(x,y,w,h)`, `Z.h(x,y,w,h)`, `Z.xy(x,y,w,h)`, `Z.b(x,y,w,h)`   | Add a zone and return the chain (section 3). The module has `_Z` for `Z`.       |
| `.n .col .gms .mo .ga .mode .sens .spr .cap .fing .tog .grp .tap` | The calls of the chain. Each sets one thing and builds the zone again in place. |
| `Z.touch(self, id, evt, x, y)`                                    | The touch callback. The first zone sets it.                                     |
| `Z.rx(self, header, event)`                                       | The MIDI receive callback. Set when a zone has a host identity.                 |
| `Z.set(name, value, src)`                                         | Sets a zone's value without sending.                                            |
| `Z.unload()`                                                      | Releases everything and gives the element's callbacks back.                     |
| `Z.def`, `Z.kind`                                                 | Option defaults and kind presets. The editor's copies must match them.          |
| `Z.zs`, `Z.te`                                                    | The zones, the touch element. Internal, but reachable.                          |

The file starts with `local LIB_NAME = "_Z"` and `local LIB_VERSION = "0.28.1"`. The Library block reads these.

## 8. Firmware functions the library uses

| Function                                  | Use                                         |
| ----------------------------------------- | ------------------------------------------- |
| `gms(ch, cmd, p1, p2)`                    | MIDI out. A 14-bit CC is two calls.         |
| `gmms(axis, step)`                        | Mouse move. Axis 1 x, 2 y, 3 wheel.         |
| `gmbs(button, state)`                     | Mouse button.                               |
| `ggms(axis, pos)`                         | Gamepad axis 0–5.                           |
| `ggbs(button, state)`                     | Gamepad button 0–31.                        |
| `glag(element, cell)`                     | LED index of a cell.                        |
| `gln`, `gld`, `glx`, `glp`, `color_curve` | LED colour curve and phase.                 |
| `gmx()`, `gmy()`, `gpc()`                 | Module column, row and page, for the autos. |
| `self:txma(max)`, `self:tyma(max)`        | Touch range. Set to 1023.                   |
| `self:ind()`                              | Element index.                              |
| `self.touch_cb`, `self.midirx_cb`         | Callbacks the library sets.                 |

## 9. Editor

### Blocks

Two blocks in the new `touch` category. The category has its own colour, `--category-touch`, and sorts first in the picker.

| Short | Name         | Element    | Event | Line                                                                                   |
| ----- | ------------ | ---------- | ----- | -------------------------------------------------------------------------------------- |
| `zfd` | Touch Zone   | touch      | Setup | `_Z.xy(0,0,5,5).n("f1")`                                                               |
| `zbt` | Touch Button | deprecated | Setup | `_Z.button(self,"b1",0,0,2,2,{})` (not offered; kept so saved configs keep their face) |

Both declare `moduleTypes: [ZONA]`, so other modules never see them. They are single, toggleable blocks with a fixed name. Each links to `https://docs.intech.studio/wiki/actions/touch/touch-zones` with an anchor per block.

A new zone has no name and starts at cell 0,0. A new Touch Zone (block `zfd`) is one XY pad zone of 5×5 cells (`dir="xy"`); a zone changed to the Button type keeps its geometry. The library's own defaults (`dir="v"`) don't change. The picker asks the block for this through `defaultLuaIn(scripts)`.

The zone blocks share one face, `ZoneBlock.svelte`, and one header, `ZoneFace.svelte`. The block files `TouchFader.svelte` and `TouchButton.svelte` only pick the kind; `TouchButton.svelte` is a deprecated block that stays for saved configs. The block is named Touch Zone and uses the XY icon. One block defines one or more zones, one chain each, written one after the other in the block's script. A zone select at the top of the face picks the zone the fields edit; each entry is the zone's name and its type (`f1 (XY Pad)`) when the zone has a name, and the type and a number when it has none (see Names). Three icon buttons sit beside it, as in the element name row: a pencil swaps the select for the zone's name to rename it (Enter, Escape or leaving the field ends it), the plus adds a zone (a copy of the selected one, with the next free name if it has one, placed to its right, else at the beginning of the next line below it (the first row under it, as far left as there is room, then the lines after), where its cells are on the surface and free of every zone of the Setup; otherwise a 1×1 button with the default options on the first free cell, reading left to right and top to bottom; when no cell is free the editor logs that there is no room), and the minus deletes the selected one (a block keeps at least one). There is no separate Name field. The untoggled header shows the first zone and `+N more`. A name is optional. Names stay unique across the whole Setup, so an edit that repeats one is an error, and a pasted block renames the named zones that collide. Its Type select, under the position preview, is Vertical Fader, Horizontal Fader, XY Pad or Button. The three directions are a fader (`dir`); Button writes a `_Z.b` chain. Changing the type resets every setting to its default except the name, the position, the size and the colour. A call the new type has no use for (a button's `.spr`, a fader's `.fing`) is dropped when a line is read, so it is never reported as a problem.

### Block face

The face is built from the option schema. It shows the name, then the sections Geometry, LED, Output, Behaviour and Capture. The LED section (the colour) comes right under the Type select. The sections have no titles and cannot be collapsed; each is a block of fields. A section with no field for the zone's kind and output is not shown. The Geometry section starts with `ZoneGeometryPad.svelte`, a 9×9 cell box area: drag the box to move it, drag a corner to resize it, or the handle in the middle of an edge to resize along that axis alone (the opposite edge and the other axis stay). The box is focusable and takes the DOM focus when pressed (or when selected by a click on it in the preview); the resize corners show only while it has the focus, so the focus is visible. The keyboard shortcuts are scoped to the focused box, as the element button and the action list scope theirs (a `keydown` handler on the focusable node that ignores events from inputs, uses Ctrl or Cmd, and stops the event): Ctrl/Cmd+C copies the zone to the app clipboard (`ClipboardKey.ZONE`), Ctrl/Cmd+V pastes a copy beside the focused zone (to its right, else at the beginning of the next line below it, as Add Zone places a copy) or logs that there is no room, and Delete or Backspace removes the zone (a block keeps at least one; the editor logs that otherwise). Empty cells do nothing, so a zone is moved to its place and then resized. The box has its zone's colour (`col`, the module's colour for a channel at -1), and the other zones of the Setup are drawn dimmer. Clicking another zone of the same block selects it in the zone select; zones of other blocks are only shown. It sets X, Y, Width and Height together; the four number fields are hidden (`{#if false}` in `ZoneBlock.svelte`). The Setup is sent when the drag ends.

- An enum is a select. The kind's default is selected when the line leaves the option out. Picking the default writes nothing. A value the schema does not know is listed as "value (unknown)" so the line is not rewritten until the user picks something.
- Output and Command are one select, Output, as they are one number in the line (section 3). It lists the outputs the zone can take, in the order MIDI CC, MIDI 14, MIDI Note (a button), MIDI Pitchbend (a fader), MIDI NRPN, MIDI NRPN 14, then Mouse wheel, Mouse button or Mouse move, then Gamepad axis, Gamepad button or Gamepad, by the zone's reader. The ones it can't take are not listed: MIDI Note on a fader or an XY pad, MIDI Pitchbend on an XY pad or a button. An output a hand-written line has but the zone can't take is listed, so the select shows it, and the validator reports it. `withOutput` refuses an unavailable output either way. Picking a command sets `msg="midi"` and the `cmd`; picking Mouse or Gamepad sets `msg` and drops the command. There is no separate Command field (`zoneFaceSections` shows the option `out` with its `unavailable` values, `withOutput` sets it).
- A number is a combo with suggestions. Channel lists Auto and channels 1–16. The number field is titled CC, Note, Button or Axis by the output. It lists Auto and the CC names, the notes, the mouse buttons (Left, Right, Middle, no Auto), the axes (X Axis to RZ Axis) or Button 0–31. 0/1 options offer Off and On, except Receive MIDI (`rx`), which is a checkbox. Button mode offers Momentary and Toggle. A field without suggestions shows its range in the title.
- Two options are toggles, not number fields or selects: Tap to click (`tap`, on is 1) and Capture focus (`grab`, on is `focus`, the default; off is `live`). A toggle sits at the bottom of its cell so it lines up with the fields beside it. Spring and Fingers are in one row of the Behaviour section, with Sensitivity after them when the mode is relative; Tap to click takes a row of its own, under Sensitivity for the mouse.
- Right-clicking the zone's box in the position preview opens a context menu with one entry, Reset Zone (`resetZone`): every setting goes back to its default (the output, the colour and the behaviour included) and the type, name, position and size are kept. The box marks itself with `data-context-menu`, which tells the block's interactive-element rule (`interactive-context-menu.action.ts`) to let the right click reach it, and stops the event there so the block's own menu (Delete, Rename, Reset to Default) doesn't open over it. The pad's drag starts on the primary button only.
- The button of a mouse button zone (`num` with `msg="mouse"`) is a row of three buttons, a button-style radio group titled Button: Left (1, the default), Middle (4) and Right (2). A line with no number, or one that is not one of the three, shows Left. Left is written without a number (`.mo()`).
- Auto placeholders show the resolved values: "auto (ch 1)", "auto (33)", "auto (X)". A mouse button shows "1 (Left)".
- The colour field is `ColorEditor.svelte` (`main/user-interface/`), the colour editing of the Simple Color block as one component, which the Simple Color block uses too. In a zone it always uses the classic picker, with no picker style select, and without Alpha and its slider (the colour has no alpha). The Red, Green and Blue fields (with Auto, -1) show only outside minimalist mode. A Reset button, in the same row as the three fields (the `channels-end` slot of `ColorEditor`) and hidden with them in minimalist mode, sets red, green and blue to -1, the page's default colour. The default colour is written as `{-1,-1,-1}`.
- The Output section ends with "Sends …": `CC 32 ch 1`, `CC 1/33 ch 1` (14-bit), `CC 34, 35 ch 1` (XY), `CC 32, 33 ch 1–3` (fingers), `Note 36 ch 1`, `PB ch 1`, `Mouse move`, `Mouse wheel`, `Mouse Left`, `Gamepad X`, `Gamepad Y, Z`, `Gamepad button 0`. Channels are 1-based.
- Every edit writes the whole line back with `zoneToLua`. A value the validator rejects is sent as an invalid action, so the module keeps the last valid line. The face never writes a line it could not parse.

The header shows `f1 · 0,0 1×9 · CC 32 ch 1`, with a colour dot when `col` is set. It turns red when the zone has a problem.

### Empty fields

No number field is ever empty. A field whose option the line leaves out shows the default the library uses (Channel and CC, Note or NRPN number -1, Spring -1, and the other options' defaults). The user types a value over it. Empty text is an error ("Required"): the field turns red and the block is flagged invalid like the MIDI block, so the module keeps the last valid script. A value equal to the option's default is not written to the line: the chain has a call only for what isn't the default. An enum is a select and always has a value, and the colour channels are validated as numbers from -1 to 255.

### Validation

`zone-validate.ts` has three levels.

- `zoneProblems(zone)`: the name, the geometry, each option the zone's output shows, the range rules and the `num` rules from section 4. Shown inline next to the field.
- `validateSurface(zones)`: every zone's problems plus duplicate names. Each issue names a zone and a level. The face and the overlay both use it.
- `zoneSendProblem(script, eventScripts)`: a duplicate zone name. The block declares it as its `contextProblem`. While it is set, the action is invalid and the event is not sent. Other problems do not block a Setup loaded from the module or a profile.

### Adding, pasting and dropping

Hooks on `ActionBlockInformation`:

- `companions`: blocks added with this one from the picker. No block declares any now.
- `uniqueIn(script, others)`: rewrites a script that collides with the event. The zone blocks give a pasted, dropped or snippet-inserted zone whose name is taken the next free name of its kind. `GridEvent.makeUnique` applies it on paste, on snippet load and on drop. A rewritten action also gets the new script as its synced script.
- `contextProblem(script, eventScripts)`: see above. `ActionData.isValid()` checks it on every call, and the block wrapper re-checks on event changes.

Two helpers in `ActionBlockInformation.ts`, `uniqueScripts` and `insertRewrites`, do the work. Inserted items are checked in order, each against the event and the items before it.

### Picker filtering

Three new fields on `ActionBlockInformation`: `elementTypes`, `eventTypes` and `moduleTypes`. `isAllowedIn` in `ActionPickerFilter.ts` applies them:

- A block with `moduleTypes` is offered only on those modules, and not when the module type is unknown.
- A block with `elementTypes` or `eventTypes` is offered only at the top level of a real event of those types. It is never offered in a function body tab.
- A block with none of them is offered everywhere.

### Overlay

The control name overlay draws the zones on a touch element instead of a name. `TouchZonesOverlay.svelte` loads the touch Setup when needed and retries a failed load after two seconds. `overlayZones` in `touch-zones.ts` turns the Setup's actions into rectangles in percent of the surface, in definition order. Each shows the zone's name and kind icon, a group badge, a red or yellow outline for an error or warning, and a highlight while its block is selected. Cells outside the grid are clipped. Clicking a zone shows the touch Setup when needed and selects the block. The overlay does not write.

`zona-grid.ts` holds the 9×9 cell maths. `ZONA.svelte` uses it too.

### Other changes

- `Grid.Auto.getZoneMidi(action)` in `lib/_utils.ts` gives a zone block's identity, using the module's position and page.
- `lib/library.ts` bundles `zona` first, before the test library. `library.test.js` filters it out of its expectations.
- `runtime/operations.ts` calls `makeUnique` before a drop insert.
- `DynamicWrapper.svelte` re-evaluates validity when the event changes.
- `wasmoon` 1.16.0 is a dev dependency, for the Lua VM tests.

### Names

A zone has no name unless the user gives it one (the pencil next to the select). The line has no `.n` then. The editor shows an unnamed zone as its type and its number among the zones of that type that have no name, counted over the whole touch Setup in order: Vertical Fader 1, Horizontal Fader 1, XY Pad 1, XY Pad 2, Button 1. The select, the header, the issue lines and the pad preview use that; the overlay on the module drawing uses a short form (`v1`, `h1`, `xy1`, `b1`). A zone with a name keeps it and takes no number. The rename field shows the shown name as its placeholder, and an empty name removes the name. An unnamed zone can't be found by `Z.set(name, …)`, and two unnamed zones never count as a duplicate. The numbers change when zones are added, removed or reordered; a zone that other code addresses should have a name.

## 10. Tests

`npx vitest run` on these files passes: 78 tests in `zona-lib.test.js`, `zone-editor.test.js`, `picker-filter.test.js` and `library.test.js`.

- `zona-vm.js`: a Lua VM (wasmoon, Lua 5.4) that loads `compressScript(zona.lua)`, the text that reaches the module. Firmware globals are stubs that record their calls. It has a fake touch element (type `touch`, in `ele`) with the firmware's touch queue, and `Z.fader`/`Z.button` shims that build the older option-table calls with the chain, so many tests read as before. `glag` is the ZONA's serpentine lookup. `color_curve` follows the firmware's. The firmware runs Lua 5.5, so code 5.5 rejects can pass here.
- `zona-lib.test.js`: the header and version, the compressed size under 23552 bytes, defaults equal to `zone-model.ts`, a fader's CC, a button's note, a toggle, pitch bend, an XY's two CCs, mouse moves sent at once and cut at 127, tap to click and its limit, the mouse wheel, mouse buttons and drag lock, gamepad axes, joystick and button, host MIDI setting a value, a Setup re-run, `Z.unload`, LEDs painted at Setup, 16 zones within 108 KB of Lua memory, the chain (no `self`, complete after every call, any order, equal to the option table, `gms` as the Midi block sends it including NRPN, spring by percentage, host MIDI always on, a Setup that runs again, an instruction budget so a call rebuilds only its zone, and the call names surviving `compressScript`), overlapping zones (both send, shared cells mix their colours), the XY paint (every cell equal to the plain formula, nothing under 1/8 cell, an instruction budget) and the touch queue.
- `zone-editor.test.js`: round trips of zone chains, old body lines not parsing, chains read in any order, lines that are not chains of known calls, the earlier positional and option-table lines still reading, the chain the editor writes behaving like the older line in the library, surface issues, the CC and channel the editor shows equal to what the library sends, the same for gamepad, overlay rectangles, face fields per output, and the mouse labels.
- `picker-filter.test.js`: `isAllowedIn`.

The compressed file is about 23,500 bytes with library 0.28.1; the test ceilings are 23,552 bytes compressed and 108 KB of Lua memory for the library and 16 zones in the VM (98.9 KB measured).

## 11. Files

| File                                                                                                | Change                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/content/libraries/zona.lua`                                                                    | New. The library.                                                                                                                                             |
| `src/renderer/config-blocks/touch/zone-model.ts`                                                    | New. Types, defaults, option schema, sections.                                                                                                                |
| `src/renderer/config-blocks/touch/zone-parse.ts`                                                    | New. Parse and write the zone lines.                                                                                                                          |
| `src/renderer/config-blocks/touch/zone-validate.ts`                                                 | New. Validators.                                                                                                                                              |
| `src/renderer/config-blocks/touch/zone-autos.ts`                                                    | New. The identity a zone sends and its labels.                                                                                                                |
| `src/renderer/config-blocks/touch/zone-blocks.ts`                                                   | New. Default names and cells, header text, face sections, suggestions, labels, `uniqueZoneScript`.                                                            |
| `src/renderer/config-blocks/touch/zone-block-info.ts`                                               | New. Block information of the four blocks, icons.                                                                                                             |
| `src/renderer/config-blocks/touch/zone-library.ts`                                                  | New. The library warning and loading earlier Setups.                                                                                                          |
| `src/renderer/config-blocks/touch/ZoneBlock.svelte`                                                 | New. The zone face.                                                                                                                                           |
| `src/renderer/config-blocks/touch/ZoneOptionField.svelte`                                           | New. One field of the face.                                                                                                                                   |
| `src/renderer/config-blocks/headers/ZoneFace.svelte`                                                | New. The zone header.                                                                                                                                         |
| `src/renderer/config-blocks/TouchFader.svelte`, `TouchButton.svelte`                                | New. The block files.                                                                                                                                         |
| `src/renderer/config-blocks/ActionBlockInformation.ts`                                              | `touch` category, `defaultLuaIn`, `elementTypes`, `eventTypes`, `moduleTypes`, `companions`, `uniqueIn`, `contextProblem`, `uniqueScripts`, `insertRewrites`. |
| `src/renderer/config-blocks/categoryColors.ts`, `src/renderer/app.css`                              | The `touch` colour.                                                                                                                                           |
| `src/renderer/main/panels/configuration/components/ActionPickerFilter.ts`                           | New. `isAllowedIn`.                                                                                                                                           |
| `src/renderer/main/panels/configuration/components/ActionPicker.svelte`                             | Filtering, `touch` sort, `defaultLuaIn`, companions.                                                                                                          |
| `src/renderer/main/panels/configuration/components/DynamicWrapper.svelte`                           | Validity follows the event.                                                                                                                                   |
| `src/renderer/main/grid-layout/grid-modules/overlays/TouchZonesOverlay.svelte`                      | New. The overlay.                                                                                                                                             |
| `src/renderer/main/grid-layout/grid-modules/overlays/touch-zones.ts`                                | New. Overlay data.                                                                                                                                            |
| `src/renderer/main/grid-layout/grid-modules/overlays/ControlNameOverlay.svelte`                     | Uses the overlay on a touch element.                                                                                                                          |
| `src/renderer/main/grid-layout/grid-modules/devices/zona-grid.ts`                                   | New. Cell maths.                                                                                                                                              |
| `src/renderer/main/grid-layout/grid-modules/devices/ZONA.svelte`                                    | Uses `zona-grid.ts`.                                                                                                                                          |
| `src/renderer/runtime/runtime.ts`                                                                   | `contextProblem` in `isValid`, `setInsertScript`, `makeUnique`.                                                                                               |
| `src/renderer/runtime/operations.ts`                                                                | `makeUnique` on drop.                                                                                                                                         |
| `src/renderer/lib/_utils.ts`                                                                        | `Grid.Auto.getZoneMidi`.                                                                                                                                      |
| `src/renderer/lib/library.ts`                                                                       | Bundles `zona`.                                                                                                                                               |
| `src/renderer/tests/zona-vm.js`, `zona-lib.test.js`, `zone-editor.test.js`, `picker-filter.test.js` | New. Tests.                                                                                                                                                   |
| `src/renderer/tests/library.test.js`                                                                | Filters `zona` out of the suggestions.                                                                                                                        |
| `package.json`, `package-lock.json`                                                                 | `wasmoon`.                                                                                                                                                    |

## 12. Known gaps, from the code

- Nothing checks overlapping zones, two zones with the same MIDI identity, or finger channels that overlap another zone's channel.
- A gamepad auto past the last axis (a 7th) or button (a 33rd) is neither checked nor clamped.
- Removing the last zone line leaves the old surface on the module until the page reloads.
- `fingers` on a mouse or gamepad XY passes the validator, because the field is hidden. The library sets it to 1.
- The comment on `zoneSendProblem` dates the rule to zona.lua 0.7.1. The rule still holds in 0.19.0.
- The step values differ from the firmware's button stepping for some ranges. The library follows the editor's `SettingsButton` maths.

## 13. Review notes: what the RFC had and the code does not

The RFC went through eight revisions. These ideas were in it at some point and are not in the code. They are listed so nobody reads the old document and expects them.

**Blocks and structure**

- Zone hooks as virtual events (revision 1).
- Touch Knob (`zkn`): an angle reader, an arc painter, a `drag` option.
- Touch Group (`zgr`) with an `empty` option. Groups are the button's `group` option now.
- Touch Utility (`zut`) and the mapping mode for MIDI learn: a window on the utility button, letting one message stream through. It needs a clock, which the library no longer has.
- Touch Start (`_Z.start(self)`), the picker's `keepLast` rule and the order warnings around it. The first zone line does its work now.
- Touch End and zone bodies: `_Z.fader(…,{opt},function(self) … end)`. A zone had ordinary blocks inside, with `self` as the zone. Gone with it: the getters `v x y g d dx dy step f`, `glc` and `glp` on zones, the body picker rules (`bodyAccepts`), the hidden MIDI block in bodies, the getter suggestions in Mouse and Gamepad blocks, Simple Color and Simple Intensity overriding `col`, and the start run that ran each body once.
- The 7th `nil` argument that remained after the body was cut.
- A default MIDI child block in each zone, and the zone answering `gms`, `gmrr`, `get_auto_value`, `get_auto_mode`, `ind`, `count`, `src`, `dry`. Zone autos in MIDI block previews and a "Zone default" mode label.
- `Z.raw`, `Z.API`, `ZoneOutput`, output keys, an `on` callback option, `UserInputValue.zoneName`, zone-hook classifiers in `virtual-event.ts`, a profile `requires` field.

**Options**

- `read`, `contact`, `drag`, `leave`, `release` (`clear`, `fade`, `keep`), `sens` presets, `db`, `sm`, `rt`. Deadband is fixed at 2 units, there is no smoothing, and there is no rate limit.
- `led` as a painter name (`fill`, `dot`, `comet`, `crosshair`, `target`, `arc`). It is on or off now, with one look per kind.
- An LED tuning table and LED levels as options. The three levels are constants.
- `msg="none"`. `msg` holding the MIDI command (`cc`, `note`, `pb`). The command moved to `cmd`.
- NRPN, both sending and receiving.
- A muted dry run of each body to index RX identities.

**Library loading**

- `Z.VERSION` in the file. The header `LIB_NAME`/`LIB_VERSION` replaced it.
- A global `Z` chosen on the Library row, a reserved `_` plus uppercase name space, and a text scan of the page for `Z=` and `function Z(`.
- Older/newer status, Update and Reload on the Library row.
- The Library line in the touch Setup, and a `require` with `string.format`. The line is `_Z=gr("zona")` on `stable` now.
- `Z.unload(self)` with the element as an argument.

**Process and measurements**

- Six feedback round test profiles and their findings. The owner review replaced the next pass with a cut list.
- A phase 0 hardware spike list.
- Tick cost, heap and Setup budget figures measured on the module. Only the two test ceilings remain in the code: 21504 bytes compressed and 92 KB of Lua memory for 16 zones in the VM.
- The RFC's section numbers were cited in code comments. Those comments now point at this document.

**Stretch goals never built**

- State that survives page changes (`/PP/zona.state`).
- An interactive surface editor on the overlay.
- Cross-zone checks: overlap, shared identities, finger channels.
- True MPE for XY fingers (pitch bend and CC74 per finger).
- Generating the Lua defaults from `zone-model.ts` at build time.
- Profile Cloud thumbnails with zones.
- A HANGAR converter.
- An in-memory file store for the virtual module.
- A positions hint on the face from the sensor bits (`Z.has.sres`, removed with the dead code).

The grid-documentation pages for touch zones were written for revision 3 and are not part of this repository.
