# ZONA touch zones

Branch `feat/zona-sandbox` (PR #1672), library `zona.lua` 0.11.0, written 2026-10-28.

This document describes what the code on the branch does. It replaces `docs/zona-zones-rfc.md`. Section 13 lists what the RFC had and the code does not.

## 1. What it is

The ZONA has a 9×9 touch surface and 81 LEDs. The user splits the surface into zones: faders, buttons and XY pads. Each zone is one action block on the touch element's Setup event. The block holds the zone's cells and options. A Lua library on the module, `zona.lua`, reads the touch sensor, turns it into values, sends MIDI, mouse or gamepad output, and lights the LEDs.

The action strings are the only store. The editor reads every view from them: the block face, the header, the overlay on the module drawing.

## 2. Where things run

```lua
-- System element, Setup. Loads the library from the page folder as _Z.
_Z=gr("zona")

-- Touch element, Setup. One line per zone.
_Z.fader(self,"f1",0,0,1,9,{})
_Z.fader(self,"f2",1,0,1,9,{cmd="pb",spring=1})
_Z.button(self,"b1",2,0,2,2,{bmo=1,group=1,col="ff0000"})
_Z.xy(self,"p1",4,0,5,5,{msg="mouse"})

-- Touch element, Timer. Runs the library's tick and re-arms the timer.
_Z.tick(self,{})

-- Page folder on the module
/00/zona.lua
```

The Library block is on `stable` already. It is not part of this branch. This branch adds `zona` to the editor's list of bundled libraries, so the Library block offers it and can install it.

The library is loaded under the global `_Z`. The touch blocks always write `_Z.`.

## 3. The zone line

A zone line is:

```
_Z.<kind>(self,"<name>",<x>,<y>,<w>,<h>,{<options>})
```

- `kind` is `fader`, `button` or `xy`.
- `self` is the touch element. Setup passes it.
- `name` is a string. It must be a Lua identifier, not a Lua keyword, and not a firmware function name in either its human or short form. The last rule exists because the editor sends scripts through `compressScript`, which rewrites firmware names inside strings too.
- `x`, `y`, `w`, `h` are cells. `0,0` is the top left. `y` grows down.
- Options are `key=value` pairs. The editor writes only options that differ from the kind's default, in schema order. Options the editor does not know are kept as raw text at the end of the table. A known option with a value of the wrong type makes the line fail to parse.

The editor writes the line in the form `compressScript` produces: no spaces, double quotes, numbers in shortest form. A hand-written line with other spacing, single quotes or another option order parses too, and is written back in the canonical form. Anything else parses to null and the block shows the line as text and never rewrites it.

The Touch Tick line is `_Z.tick(self,{ms=20})`. `_Z.tick(self)` parses too. The `ms` option is left out at the default of 20.

`parseZone`, `zoneToLua`, `parseZoneTick` and `zoneTickToLua` live in `zone-parse.ts`.

## 4. Options

The editor's schema is in `zone-model.ts`. The library's defaults are in `Z.def` and `Z.kind` in `zona.lua`. A test checks that the two match. "Kinds" says which kinds show the option. "Hidden for" says which outputs hide it on the face. The library ignores an option its output does not use.

| Key       | Kinds     | Section    | Default                                             | Range                                             | Hidden for         |
| --------- | --------- | ---------- | --------------------------------------------------- | ------------------------------------------------- | ------------------ |
| `dir`     | fader     | Geometry   | `v`                                                 | `v`, `h`                                          |                    |
| `res`     | all       | Resolution | 7                                                   | 7–14                                              | mouse, pad         |
| `min`     | all       | Resolution | none; the library uses 0                            | integer                                           | mouse, pad         |
| `max`     | all       | Resolution | none; the library uses 127, or 16383 when `res` > 7 | integer                                           | mouse, pad         |
| `mode`    | fader, xy | Behaviour  | `abs`                                               | `abs`, `rel`, `glide`                             | mouse              |
| `speed`   | fader, xy | Behaviour  | 1                                                   | 0.01–10                                           |                    |
| `ease`    | fader, xy | Behaviour  | 0                                                   | 0–1                                               | mouse              |
| `bmo`     | button    | Behaviour  | 0                                                   | 0–127                                             |                    |
| `spring`  | fader, xy | Behaviour  | 0                                                   | 0–1                                               | mouse              |
| `group`   | button    | Behaviour  | 0                                                   | 0–8                                               |                    |
| `fingers` | xy        | Capture    | 1                                                   | 1–5                                               | mouse, pad         |
| `grab`    | all       | Capture    | `focus`                                             | `focus`, `live`                                   |                    |
| `led`     | all       | LED        | 1                                                   | 0–1                                               |                    |
| `col`     | all       | LED        | none; the module's default colour                   | `rrggbb` hex                                      |                    |
| `msg`     | all       | Output     | `midi`                                              | `midi`, `mouse`, `pad`                            |                    |
| `cmd`     | all       | Output     | fader `cc`, button `note`, xy `cc`                  | fader: `cc`, `pb`; button: `note`, `cc`; xy: `cc` | mouse, pad         |
| `ch`      | all       | Output     | -1 (auto)                                           | -1–15                                             | mouse, pad         |
| `num`     | all       | Output     | -1 (auto)                                           | -1–127                                            | mouse on fader, xy |
| `rx`      | all       | Output     | 0                                                   | 0–1                                               | mouse, pad         |
| `tap`     | xy        | Output     | 1                                                   | 0–1                                               | midi, pad          |

Meaning of each option:

- `dir`: which way a fader runs. `v`: bottom is min. `h`: left is min.
- `res`: bits of resolution. The zone has 2^res steps between `min` and `max`.
- `min`, `max`: the value range. Without them the range is 0–127, or 0–16383 when `res` is above 7.
- `mode`: how the finger moves the value. `abs` jumps to the finger. `rel` adds the finger's movement times `speed`. `glide` moves toward the finger on each tick.
- `speed`: for `rel`, the drag factor. For `glide`, the share of the range moved per tick is `speed/50`. For a mouse zone, the move multiplier.
- `ease`: for `glide` and an eased spring, the share of the remaining distance added per tick.
- `bmo`: the button mode, as Grid's Button Mode block. 0 momentary, 1 toggle, n gives n+1 steps.
- `spring`: 1 makes a fader or XY rest at the centre and return there on release.
- `group`: radio group 1–8. 0 is none.
- `fingers`: how many contacts an XY takes at once.
- `grab`: `focus` keeps a contact in the zone it landed on. `live` lets a contact move between live zones.
- `led`: 0 leaves the zone's cells dark.
- `col`: the zone colour.
- `msg`: the output. `midi`, `mouse` or `pad` (gamepad).
- `cmd`: the MIDI command of a `midi` zone.
- `ch`: MIDI channel 0–15. -1 is auto.
- `num`: the CC or note number. For a mouse button, the button (1 left, 2 right, 4 middle; 1 when left out). For a gamepad, the axis 0–5 or the button 0–31. -1 is auto.
- `rx`: 1 makes the zone follow host MIDI on its own identity.
- `tap`: on a mouse XY, 1 makes a short touch click the left button.

Extra rules the validator applies:

- `min` must be below `max`. Pitch bend counts as 14-bit.
- `min` and `max` must be in 0–16383 when the zone sends MIDI.
- An explicit `num` must keep every number on the wire in range: a 14-bit CC 0–31 (XY 0–30), a 7-bit XY 0–126, a gamepad axis 0–5 (XY 0–4), a gamepad button 0–31.
- `spring` on a button is an error. `fingers` on a fader or button is an error.
- The geometry must be whole numbers, at least 1×1, inside the 9×9 grid.

## 5. Outputs

The library reads `o.msg == "midi" and o.cmd or o.msg` as the thing to send. An unknown value sends 7-bit CC.

A zone runs on press, on a value change and on release. A value run sends the source that changed: `v` for a fader or button, `x` or `y` for an XY. A press or release run sends all sources. On a button a press or release also sets the mouse button.

### MIDI

| `cmd`  | Wire format                                                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `cc`   | 7-bit CC when `res` is 7. A 14-bit pair above: MSB on `num`, LSB on `num+32`. A 7-bit CC with a range wider than 127 is scaled to 0–127. |
| `note` | Note on (144) with the value as velocity, scaled to 0–127 when the range is wider. Value 0 is the note off.                              |
| `pb`   | Pitch bend (224), always 14-bit. The library sets `res` to 14. The centre is 8192.                                                       |

A button with `cmd="cc"` sends its step value as a CC. With `res` above 7 it sends a 14-bit pair.

An XY sends x on `num` and y on `num+1`.

A duplicate filter per source holds the last value on the wire. A value is sent only when it changes. The filter is cleared by a press, so a press re-sends the current value. On a button it is cleared only when the step changes.

### Mouse

`msg="mouse"`. Finger 1 only. The library sets `fingers=1`, `spring=0` and caps `bmo` at 1.

- **XY**: a trackpad. The pointer moves by the finger's movement, one step per sensor unit, times `speed`. `gmms(1, dx)` and `gmms(2, dy)`. Sensor y grows down, like the pointer.
- **Fader**: the wheel. One step per 32 sensor units, times `speed`. `gmms(3, step)`. Dragging toward the fader's max sends positive steps.
- **Button**: `gmbs(num, 1)` on touch, `gmbs(num, 0)` on lift. `num` 1 left, 2 right, 4 middle. No auto: without `num` it is left. `bmo=1` is a drag lock: press on one touch, release on the next.
- Moves are summed per zone and sent once per tick. Each axis sends its whole steps, clamped to -127…127, and keeps the fraction. A bigger move is cut.
- **Tap to click** (`tap=1`, XY): a touch shorter than 200 ms and with less than 30 sensor units of travel sends `gmbs(1,1)` on lift, then `gmbs(1,0)` two ticks later. A contact that slid in under `grab="live"` never taps. A tap does not click while a mouse button zone holds the left button, so a drag lock stays.
- Leaving a zone, another group member turning on, a Setup re-run, `Z.set` on a group member and `Z.unload` release a held mouse button.
- A mouse zone has no value. `rx` and `Z.set` skip it.

### Gamepad

`msg="pad"`. Finger 1 only. The library sets `fingers=1`, `rx=0`, `res=8`, `min=-128`, `max=127`.

- **Fader and XY**: axes. The travel maps to -128…127. `ggms(axis, pos)`. An XY sends x on `num` and y on `num+1`. `mode`, `speed`, `ease`, `spring` and `grab` apply. An XY with `spring=1` is a joystick centred on 0.
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

The first zone line of a Setup run does four things: it releases the previous surface (held zones send their release, a held mouse button is released, a pending tap click is released), it remembers the element in `Z.te`, it sets `self:txma(1023)`, `self:tyma(1023)` and `self.touch_cb = Z.touch`, and it kicks the timer with `gtt(self:ind(), 1)`.

Every zone line adds its zone to a pending list. If a pending zone already has the new zone's name, the pending list is cleared first. That handles a Setup that runs again before the previous run went live. It also means a duplicate name inside one Setup drops the zones before it. The editor treats a duplicate name as an error that stops the send.

The pending zones go live on the first `Z.tick` or `Z.touch` after Setup. Going live: held zones are released, the tick count resets, the pending list becomes the surface, `rx` identities are registered, `midirx_cb` is set when some zone has `rx=1`, every zone is painted, and every cell no zone covers is set dark.

If some zone has `rx=1`, the library sets `self.midirx_cb = Z.rx`. A `midirx_cb` the user's own Setup code set before the zones went live is kept and called after the library's handling. If no zone has `rx=1`, the library leaves `midirx_cb` as it found it.

Removing the last zone line leaves the previous surface running until the page reloads. No zone line runs to drop it.

### Touch routing

`Z.touch(self, id, evt, x, y)` is the touch callback. `id` is a contact slot 0–4. `evt` 4 is down, 1 is move, 5 is up. 3 and 7 are treated as up. 9 is a tap in one scan: the library runs a down then an up at the same point.

- A down finds the first zone, in definition order, that contains the point.
- **The first contact owns a zone.** A contact landing on a held zone is ignored until it lifts. An XY with `fingers` above 1 gives a new contact the lowest free finger number instead, up to `fingers`.
- A contact landing on an empty cell is not owned. If it moves into a `live` zone, that zone takes it.
- `grab="focus"`: the contact stays with its zone. A fader or XY clamps the position to the zone's edge. A button releases when the finger leaves, and the contact is ignored until it lifts.
- `grab="live"`: leaving the zone releases it. Entering another `live` zone presses it at the entry position with an `abs` read, whatever its mode.
- A move within 2 sensor units of the last position on both axes is dropped.
- Finger 2 and up on an XY get their own state (values, filter, rate limit, glide target) on first use. The state is kept until the next Setup run.

### Values

- The position inside the zone is 0–1 per axis. For a vertical fader 0 is the bottom. For an XY y 0 is the bottom.
- The value is `min + round(position * (2^res - 1)) * (max - min) / (2^res - 1)`, rounded.
- Rate limit: a source's first change in a tick is sent at once. Later changes in the same tick wait, and the last one is sent on the next tick or on lift. Nothing waits before the first tick.
- `glide` and an eased spring move the value toward the target on each tick: `ease` times the remaining distance, plus `speed/50` of the range. They land exactly on the target.
- Steps: the step values are `min`, then `min + trunc((max - min) / bmo)` added bmo times. With `bmo=0` the second value is `max`. The firmware's own stepping differs for some ranges. That is noted in the code.
- Groups: a press that turns a group member on turns the other members of the group off first. They send their off value. Every member can be off.
- Spring: the zone rests at position 0.5 per axis and sends nothing at start. On release it returns to 0.5 at once with `ease=0`, or eased on the tick with `ease` above 0. A touch during the return takes over. `rx` and `Z.set` put the value where they say.

### Host MIDI and Z.set

`rx=1` registers the identities the zone sends: each source's channel, command and number, both CCs of a 14-bit pair, pitch bend on its channel. On an XY with fingers only finger 1's channel is registered.

`Z.rx` handles host MIDI only (header 13). Note off and velocity 0 are 0. A 14-bit CC applies the MSB at once and the LSB refines it. Pitch bend is LSB then MSB. A 7-bit message into a wider range is scaled up. NRPN is not decoded. A button takes the nearest step; an "on" for a group member turns the others off. The value is set without sending, the glide target is cleared, and the duplicate filter is updated. The zone repaints on the next tick. RX is ignored while any finger holds the zone.

`Z.set(name, value, src)` sets a zone's value the same way, for user code. Without `src` it sets `v`, or `x` on an XY. `src="y"` sets y. Mouse zones and held zones are skipped.

### LEDs

Three fixed phase levels: floor 16, dim 110, top 255. Cells no zone covers are black. A zone's cells are at least the floor. Lit cells are at top while a finger holds the zone and at dim after.

- Fader: a fill from the min end with a partial edge cell.
- Button: the step level, 0 off at the floor to 1 on.
- XY: a soft crosshair, normalised so its brightest cell is at the lit level. With fingers: one crosshair per held finger at top, the highest level per cell. With none held, finger 1's at dim.
- A mouse fader or XY shows the finger at top while held and sits at the floor after.
- `led=0`: the zone's cells are set dark when the zones go live and the library never paints them again.
- `col="rrggbb"` goes through the firmware's `color_curve`. The curve's minimum is replaced by black, so phase 0 is off. Without `col`, or with text that is not hex, the module's default colour is used. Zones with the same colour share one curve.
- The library paints only dirty zones and sends only changed cells. Painting happens in `Z.tick` and when the zones go live. Overlapping zones: the last zone covering a cell owns it.
- The LED index of a cell is `glag(<touch element index>, x + y*9)`, looked up when a cell is written.

### Timer tick

`Z.tick(self, cfg)` is the Touch Tick line. On each call it re-arms the one-shot timer with `cfg.ms` (default 20) first, so an error later in the tick cannot stop it. Then it makes pending zones live, counts the tick, releases a pending tap click, runs glide and spring, flushes rate-limited values, sends summed mouse moves, and paints dirty zones.

Without a Touch Tick block on the Timer the zones still go live on the first touch, and press, move and release still send. Glide, spring, rate-limited values, mouse moves and repaints do not run.

### Unload

`Z.unload()` releases held zones and a held mouse button, drops the surface, clears the pending list, and gives back the callbacks it set on the element: `touch_cb` is set to nil when it is `Z.touch`, `midirx_cb` is set back to the user's callback when it is `Z.rx`. The Library block calls it before it installs a new copy.

## 7. Library API

| Name                                        | What it does                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Z.fader(self, name, x, y, w, h, opt)`      | Adds a fader zone.                                                                 |
| `Z.button(self, name, x, y, w, h, opt)`     | Adds a button zone.                                                                |
| `Z.xy(self, name, x, y, w, h, opt)`         | Adds an XY zone.                                                                   |
| `Z.zone(self, name, x, y, w, h, opt, kind)` | The function behind the three. An unknown kind is a fader. `opt.read` is ignored.  |
| `Z.tick(self, cfg)`                         | The Timer callback. `cfg.ms` is the interval.                                      |
| `Z.touch(self, id, evt, x, y)`              | The touch callback. The first zone sets it.                                        |
| `Z.rx(self, header, event)`                 | The MIDI receive callback. Set when a zone has `rx=1`.                             |
| `Z.set(name, value, src)`                   | Sets a zone's value without sending.                                               |
| `Z.unload()`                                | Releases everything and gives the element's callbacks back.                        |
| `Z.def`, `Z.kind`, `Z.tdef`                 | Option defaults, kind presets, tick defaults. The editor's copies must match them. |
| `Z.has`                                     | `{ sres = 10 }`, the sensor bits. Nothing in the editor reads it.                  |
| `Z.zs`, `Z.nz`, `Z.te`                      | The live zones, the pending zones, the touch element. Internal, but reachable.     |

The file starts with `local LIB_NAME = "_Z"` and `local LIB_VERSION = "0.11.0"`. The Library block reads these.

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
| `gtt(element, ms)`                        | The one-shot timer.                         |
| `gmx()`, `gmy()`, `gpc()`                 | Module column, row and page, for the autos. |
| `self:txma(max)`, `self:tyma(max)`        | Touch range. Set to 1023.                   |
| `self:ind()`                              | Element index.                              |
| `self.touch_cb`, `self.midirx_cb`         | Callbacks the library sets.                 |

## 9. Editor

### Blocks

Four blocks in the new `touch` category. The category has its own colour, `--category-touch`, and sorts first in the picker.

| Short | Name         | Element | Event | Line                              |
| ----- | ------------ | ------- | ----- | --------------------------------- |
| `zfd` | Touch Fader  | touch   | Setup | `_Z.fader(self,"f1",0,0,1,9,{})`  |
| `zbt` | Touch Button | touch   | Setup | `_Z.button(self,"b1",0,0,2,2,{})` |
| `zxy` | Touch XY Pad | touch   | Setup | `_Z.xy(self,"p1",0,0,4,4,{})`     |
| `ztk` | Touch Tick   | touch   | Timer | `_Z.tick(self,{})`                |

All four declare `moduleTypes: [ZONA]`, so other modules never see them. They are single, toggleable blocks with a fixed name. Each links to `https://docs.intech.studio/wiki/actions/touch/touch-zones` with an anchor per block.

A new zone gets the next free name of its kind (`f1`, `b1`, `p1`, then `f2` and so on) and starts at cell 0,0. The picker asks the block for this through `defaultLuaIn(scripts)`.

The three zone blocks share one face, `ZoneBlock.svelte`, and one header, `ZoneFace.svelte`. The block files `TouchFader.svelte`, `TouchButton.svelte` and `TouchXY.svelte` only pick the kind.

### Block face

The face is built from the option schema. It shows the name, then the sections Geometry, Output, Resolution, LED, Behaviour and Capture. Geometry, Output, Resolution and LED are open by default. A section with no field for the zone's kind and output is not shown.

- An enum is a select. The kind's default is selected when the line leaves the option out. Picking the default writes nothing. A value the schema does not know is listed as "value (unknown)" so the line is not rewritten until the user picks something.
- The Output select titles its values by kind: MIDI; Mouse wheel, Mouse button or Mouse; Gamepad axis, Gamepad button or Gamepad. The Command select shows CC, Note and Pitch bend.
- A number is a combo with suggestions. Channel lists Auto and channels 1–16. The number field is titled CC, Note, Button or Axis by the output. It lists Auto and the CC names, the notes, the mouse buttons (Left, Right, Middle, no Auto), the axes (X Axis to RZ Axis) or Button 0–31. Resolution lists 7–14 with their ranges. Max offers 127 and 16383. 0/1 options offer Off and On. Button mode offers Momentary and Toggle. A field without suggestions shows its range in the title.
- Auto placeholders show the resolved values: "auto (ch 1)", "auto (33)", "auto (X)". A mouse button shows "1 (Left)".
- The colour field has the colour picker the app settings choose and a hex field. The empty value means the module's default colour.
- The Output section ends with "Sends …": `CC 32 ch 1`, `CC 1/33 ch 1` (14-bit), `CC 34, 35 ch 1` (XY), `CC 32, 33 ch 1–3` (fingers), `Note 36 ch 1`, `PB ch 1`, `Mouse`, `Mouse wheel`, `Mouse Left`, `Gamepad X`, `Gamepad Y, Z`, `Gamepad button 0`. Channels are 1-based.
- Every edit writes the whole line back with `zoneToLua`. A value the validator rejects is sent as an invalid action, so the module keeps the last valid line. The face never writes a line it could not parse.

The header shows `f1 · 0,0 1×9 · CC 32 ch 1`, with a colour dot when `col` is set. It turns red when the zone has a problem.

The first zone block of the Setup shows a warning when no Library block that runs before it loads `_Z`. The editor loads the System Setup and the Setups of lower-numbered elements to find out. The message is "Add a Library block that loads zona (_Z) above the zones or in the System Setup".

The Touch Tick face has one field, Interval (ms), 5–1000.

### Validation

`zone-validate.ts` has three levels.

- `zoneProblems(zone)`: the name, the geometry, each option the zone's output shows, the range rules and the `num` rules from section 4. Shown inline next to the field.
- `validateSurface(zones)`: every zone's problems plus duplicate names. Each issue names a zone and a level. The face and the overlay both use it.
- `zoneSendProblem(script, eventScripts)`: a duplicate zone name. The block declares it as its `contextProblem`. While it is set, the action is invalid and the event is not sent. Other problems do not block a Setup loaded from the module or a profile.

### Adding, pasting and dropping

Three new hooks on `ActionBlockInformation`:

- `companions`: blocks added with this one from the picker. The zone blocks declare Touch Tick on the Timer. After a zone is added to a real event, the picker loads the Timer event when needed and appends `_Z.tick(self,{})` when no action with the short `ztk` is there. Each event is sent on its own.
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

## 10. Tests

`npx vitest run` on these files passes: 78 tests in `zona-lib.test.js`, `zone-editor.test.js`, `picker-filter.test.js` and `library.test.js`.

- `zona-vm.js`: a Lua VM (wasmoon, Lua 5.4) that loads `compressScript(zona.lua)`, the text that reaches the module. Firmware globals are stubs that record their calls. `glag` is the ZONA's serpentine lookup. `color_curve` follows the firmware's. The firmware runs Lua 5.5, so code 5.5 rejects can pass here.
- `zona-lib.test.js`: the header and version, the compressed size under 20480 bytes, defaults equal to `zone-model.ts`, a fader's CC, a button's note, a toggle, pitch bend, an XY's two CCs, mouse moves summed per tick and cut at 127, tap to click and its limits, the mouse wheel, mouse buttons and drag lock, gamepad axes, joystick and button, host MIDI setting a value, a Setup re-run, `Z.unload`, `led=0`, and 16 zones within 92 KB of Lua memory.
- `zone-editor.test.js`: round trips of zone lines, old body lines not parsing, unknown options kept, defaults left out, surface issues, the CC and channel the editor shows equal to what the library sends, the same for gamepad, overlay rectangles, face fields per output, and the mouse labels.
- `picker-filter.test.js`: `isAllowedIn`.

Measured on 2026-10-28: the source is 22,669 bytes, the compressed file 17,914 bytes.

## 11. Files

| File                                                                                                       | Change                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/content/libraries/zona.lua`                                                                           | New. The library.                                                                                                                                             |
| `src/renderer/config-blocks/touch/zone-model.ts`                                                           | New. Types, defaults, option schema, sections.                                                                                                                |
| `src/renderer/config-blocks/touch/zone-parse.ts`                                                           | New. Parse and write the zone and tick lines.                                                                                                                 |
| `src/renderer/config-blocks/touch/zone-validate.ts`                                                        | New. Validators.                                                                                                                                              |
| `src/renderer/config-blocks/touch/zone-autos.ts`                                                           | New. The identity a zone sends and its labels.                                                                                                                |
| `src/renderer/config-blocks/touch/zone-blocks.ts`                                                          | New. Default names and cells, header text, face sections, suggestions, labels, `uniqueZoneScript`.                                                            |
| `src/renderer/config-blocks/touch/zone-block-info.ts`                                                      | New. Block information of the four blocks, icons.                                                                                                             |
| `src/renderer/config-blocks/touch/zone-library.ts`                                                         | New. The library warning and loading earlier Setups.                                                                                                          |
| `src/renderer/config-blocks/touch/ZoneBlock.svelte`                                                        | New. The zone face.                                                                                                                                           |
| `src/renderer/config-blocks/touch/ZoneOptionField.svelte`                                                  | New. One field of the face.                                                                                                                                   |
| `src/renderer/config-blocks/headers/ZoneFace.svelte`                                                       | New. The zone header.                                                                                                                                         |
| `src/renderer/config-blocks/TouchFader.svelte`, `TouchButton.svelte`, `TouchXY.svelte`, `TouchTick.svelte` | New. The block files.                                                                                                                                         |
| `src/renderer/config-blocks/ActionBlockInformation.ts`                                                     | `touch` category, `defaultLuaIn`, `elementTypes`, `eventTypes`, `moduleTypes`, `companions`, `uniqueIn`, `contextProblem`, `uniqueScripts`, `insertRewrites`. |
| `src/renderer/config-blocks/categoryColors.ts`, `src/renderer/app.css`                                     | The `touch` colour.                                                                                                                                           |
| `src/renderer/main/panels/configuration/components/ActionPickerFilter.ts`                                  | New. `isAllowedIn`, `companionElement`.                                                                                                                       |
| `src/renderer/main/panels/configuration/components/ActionPicker.svelte`                                    | Filtering, `touch` sort, `defaultLuaIn`, companions.                                                                                                          |
| `src/renderer/main/panels/configuration/components/DynamicWrapper.svelte`                                  | Validity follows the event.                                                                                                                                   |
| `src/renderer/main/grid-layout/grid-modules/overlays/TouchZonesOverlay.svelte`                             | New. The overlay.                                                                                                                                             |
| `src/renderer/main/grid-layout/grid-modules/overlays/touch-zones.ts`                                       | New. Overlay data.                                                                                                                                            |
| `src/renderer/main/grid-layout/grid-modules/overlays/ControlNameOverlay.svelte`                            | Uses the overlay on a touch element.                                                                                                                          |
| `src/renderer/main/grid-layout/grid-modules/devices/zona-grid.ts`                                          | New. Cell maths.                                                                                                                                              |
| `src/renderer/main/grid-layout/grid-modules/devices/ZONA.svelte`                                           | Uses `zona-grid.ts`.                                                                                                                                          |
| `src/renderer/runtime/runtime.ts`                                                                          | `contextProblem` in `isValid`, `setInsertScript`, `makeUnique`.                                                                                               |
| `src/renderer/runtime/operations.ts`                                                                       | `makeUnique` on drop.                                                                                                                                         |
| `src/renderer/lib/_utils.ts`                                                                               | `Grid.Auto.getZoneMidi`.                                                                                                                                      |
| `src/renderer/lib/library.ts`                                                                              | Bundles `zona`.                                                                                                                                               |
| `src/renderer/tests/zona-vm.js`, `zona-lib.test.js`, `zone-editor.test.js`, `picker-filter.test.js`        | New. Tests.                                                                                                                                                   |
| `src/renderer/tests/library.test.js`                                                                       | Filters `zona` out of the suggestions.                                                                                                                        |
| `package.json`, `package-lock.json`                                                                        | `wasmoon`.                                                                                                                                                    |

## 12. Known gaps, from the code

- Nothing checks overlapping zones, two zones with the same MIDI identity, or finger channels that overlap another zone's channel.
- A gamepad auto past the last axis (a 7th) or button (a 33rd) is neither checked nor clamped.
- Removing the last zone line leaves the old surface on the module until the page reloads.
- `Z.has.sres` is in the library and nothing reads it.
- The `Companion.elementType` field exists and no block sets it. Its comment names Touch Utility, a block that does not exist.
- `fingers` on a mouse or gamepad XY passes the validator, because the field is hidden. The library sets it to 1.
- The comment on `zoneSendProblem` dates the rule to zona.lua 0.7.1. The rule still holds in 0.11.0.
- The step values differ from the firmware's button stepping for some ranges. The library follows the editor's `SettingsButton` maths.

## 13. Review notes: what the RFC had and the code does not

The RFC went through eight revisions. These ideas were in it at some point and are not in the code. They are listed so nobody reads the old document and expects them.

**Blocks and structure**

- Zone hooks as virtual events (revision 1).
- Touch Knob (`zkn`): an angle reader, an arc painter, a `drag` option.
- Touch Group (`zgr`) with an `empty` option. Groups are the button's `group` option now.
- Touch Utility (`zut`) and the mapping mode for MIDI learn: a window on the utility button, counted by the tick, letting one message stream through.
- Touch Start (`_Z.start(self)`), the picker's `keepLast` rule and the order warnings around it. The first zone line does its work now.
- Touch End and zone bodies: `_Z.fader(…,{opt},function(self) … end)`. A zone had ordinary blocks inside, with `self` as the zone. Gone with it: the getters `v x y g d dx dy step f`, `glc` and `glp` on zones, the body picker rules (`bodyAccepts`), the hidden MIDI block in bodies, the getter suggestions in Mouse and Gamepad blocks, Simple Color and Simple Intensity overriding `col`, and the start run that ran each body once.
- The 7th `nil` argument that remained after the body was cut.
- A default MIDI child block in each zone, and the zone answering `gms`, `gmrr`, `get_auto_value`, `get_auto_mode`, `ind`, `count`, `src`, `dry`. Zone autos in MIDI block previews and a "Zone default" mode label.
- `Z.raw`, `Z.API`, `ZoneOutput`, output keys, an `on` callback option, `UserInputValue.zoneName`, zone-hook classifiers in `virtual-event.ts`, a profile `requires` field.

**Options**

- `read`, `contact`, `drag`, `leave`, `release` (`clear`, `fade`, `keep`), `sens` presets, `db`, `sm`, `rt`. Deadband is fixed at 2 units, there is no smoothing, and the rate limit is built in.
- `led` as a painter name (`fill`, `dot`, `comet`, `crosshair`, `target`, `arc`). It is on or off now, with one look per kind.
- An LED tuning table and LED levels as options. The three levels are constants.
- Touch Tick's LED divider and mapping window options. Only `ms` is left.
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
- Tick cost, heap and Setup budget figures measured on the module. Only the two test ceilings remain in the code: 20480 bytes compressed and 92 KB of Lua memory for 16 zones in the VM.
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
- A positions hint on the face from `Z.has.sres`.

The grid-documentation pages for touch zones were written for revision 3 and are not part of this repository.
