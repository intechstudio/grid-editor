# RFC: ZONA touch zones in Grid Editor

- **Status:** Draft, revision 3
- **Date:** 2026-10-12 (rev 1: 2026-10-06, rev 2: 2026-10-09)
- **Author:** Kristóf Kerti
- **Related:** PR #1645 (virtual events), PR #1589 (XY → ZONA), PR #1596 (virtual flag for Lua immediate exec), HANGAR (`sabotond-dev/hangar`, behaviour reference only)

## 0. What changed since revision 2

| Area | Rev 2 | Rev 3 |
|------|-------|-------|
| Outputs | Declarative output tables inside the zone call (`{x={cc=10},g={note=60}}`), with their own keys per target. | **Ordinary action blocks inside the zone.** A zone block is a container, like the Function block. MIDI, Gamepad, Mouse, Keyboard and Code blocks go inside it unchanged. Inside the container `self` is the zone, and the zone answers the same `self:` methods the blocks already call (`gms` with `-1` autos, `gmrr`, `glc`, `glp`, `get_auto_value`). The default MIDI block works with no edits (4.1). |
| Zone settings | Mixed into the output tables. | The zone block's own options play the role of the Encoder Mode / Button Mode blocks: resolution, range, mode, capture, steps, group, LEDs. |
| Callback | One optional `on="name"` callback per zone. | Dropped. The container body *is* the callback. Custom logic is just more blocks in it (4.6). |
| Capture names | `hold` / `leave` / `swipe` | **focus** / **live**. "Release on leave" is a focus sub-option (4.3). |
| Knob | Angle around the centre, absolute only. | Follows TouchOSC's Radial: angular, absolute or relative with a factor. DAW-style vertical/horizontal drag is an option (4.4). |
| Mapping mode | Needed a utility-release event, with a "touch first" fallback. | No firmware change. A utility press opens a short window, timed by the existing touch tick. A touch in the window enters mapping mode, otherwise the page changes. A second utility press exits (4.7). |
| RX sync | Separate `rx={v,l}` keys. | The MIDI block's existing "Receive MIDI" section, unchanged. `Z.start` builds the index with a muted dry run of each body (4.8). Data load addressed. |
| Tick | Fixed 20 ms guess. | Interval and LED divider are options on the Touch Tick block. |
| Resolution | — | The sensor is **10-bit** (0–1023, firmware 1.5.5, `txma`/`tyma`). `Z.start` sets the full range; the sensor resolution is one library constant. |
| Registry | `version` and `api`. | `version` only. Semver major means breaking block syntax. `Z.API` is gone. |
| Send path | Not described. Comments stripped from the library, no minify. | The existing editor and grid-protocol path, unchanged: `compressScript` for actions and for the library file (minified, comments kept). Canonical lines are written in compressed form. Names that `shortify` or the minifier would rewrite are invalid (2.1, 6.1, 6.4). |
| Open questions | 5 open. | `Z.util` ownership: manual step. Mapping exit: second press. Pressure: not a question, future argument. Library scope: global. Defaults table: hand-written copies plus a test. Knob default: absolute. Press/release composite: not in v1. |

## 1. Summary

The user describes **zones** (faders, buttons, XY pads, knobs) on the 9×9 ZONA surface. Each zone is a **container action block** on the touch element's Setup event. Its own options say how touch becomes a value (resolution, range, mode, capture, steps, LEDs). Its body holds **ordinary action blocks** (MIDI, Gamepad, Mouse, Code…) that run when the zone changes, exactly as they run in a button or encoder event today.

A versioned Lua library, `zona.lua`, lives in the page folder and is loaded by a generic **Library** action block. It does the work behind the blocks: touch routing, contact capture, value maths, the zone `self` object, MIDI RX sync, mapping mode and LED drawing.

The action strings on the module (and in the editor) are the single source of truth. Every editor view, including the zone overlay, is derived from them.

## 2. Background: what we know

### 2.1 ZONA hardware and firmware

- Two elements: **touch (0)** and **system (255)**. The touch element has **only Setup (0) and Timer (6)**. The touch Timer is the only tick the zone system uses.
- Touch input is a callback, not an event: `self.touch_cb(self, id, evt, x, y)`, assigned in Setup.
  - `id` 0–4 is a contact slot. The firmware gives the lowest free slot on touch-down, so a slot is stable for one contact but is not a stable finger.
  - `evt` is the raw sensor nibble (1 move, 4 down, 5 up; 9 is a tap: down and up in one scan, with no separate 4 or 5). The library treats 9 as a down then an up at the same position, and 3 and 7 as an up, so no contact is left held.
  - `x`, `y` span the **whole** surface. The range is set per element with `self:txma(max)` and `self:tyma(max)` (touch x/y maximum). The sensor resolution is **10-bit**: with `txma(1023)`/`tyma(1023)`, as set by the configuration on the test module (firmware 1.5.5), coordinates are 0–1023. A zone 3 cells wide sees about 341 raw positions across its width. No pressure today.
- 81 LEDs, 9×9, serpentine (see `ZONA.svelte`). The serpentine lives in the firmware's LED lookup for element 0, so cell (x, y) with y=0 the top row is `glag(0, x+y*9)`, as the default touch Setup paints it.
- **Action string limit: 909 characters per event** (`GRID_PARAMETER_ACTIONSTRING_maxlength`, `grid_protocol.h:131`). The `--[[@short]]` block markers count toward it.
- **Event wrapper:** the firmware runs each event as `ele[i].<fn> = function (self) local _efn = EFN; EFN = "<fn>"; <script> end EFN = _efn` (`grid_ui.c`, `grid_ui_actionstring_header`). `self` and `_efn` are locals of that function, not globals.
- **How action strings travel today (editor and grid-protocol):**
  - **Send:** `GridEvent.sendToGrid()` runs `GridScript.compressScript(event.toLua())` and sends the result with `GridInstruction.SendConfig`, which refuses 909 or more characters. `sendToGrid` also refuses events whose actions fail `GridScript.checkSyntax`.
  - **Read back:** `FetchConfig` returns the stored string, and `GridAction.parse` splits it into actions. It collapses runs of whitespace and trims each action. It does not expand the script.
  - **What `compressScript` does:** it first runs `shortify`, which replaces every firmware human name with its short name (`page_current` → `gpc`, `led_value` → `glp`, the `GridScript.validator.lookup` table). This applies to every word that matches, **including words inside string literals and comments** (a library comment saying "limit" reaches the module as "glim"). Then it minifies: StyLua with double quotes and parentheses forced, statements joined with no space between them, spaces around operators and punctuation removed, `x--y` rewritten to `x- -y`. Comments are kept. Firmware default action strings are stored in this same form.
  - **Files:** `writeFileContent` (`FileManager.ts`) writes the content bytes unchanged, in chunks, through `SendLuaImmediateAndEvaluate`. Its own path commands (`os.remove`, `os.rename`, the size check) go through `compressScript`. Content is transformed by the caller: the File Manager runs `compressScript` on `.lua` files when saving and importing, and `expandScript` when opening one. `GridPage.sendFiles` (profiles) writes content unchanged.
- **File system:** littlefs. Files are loaded with `require`. Page folders are hex (`/00/`, `/01/` …). Profiles save the top-level files of a page folder, and loading a profile clears that folder first (docs: *File Manager → File saving under profiles*). The documented way to load a page-local module:

  ```lua
  local pageHex = string.format("%02X", page_current())
  local M = require("/" .. pageHex .. "/testfile")
  ```

- **Page change restarts the Lua VM.** All Lua state is lost, including `package.loaded`. Encoder and button values survive because they live in C template buffers. Zone values do not.
- **Utility button:** the system element's utility event runs on press and holds `gpl(gpn())` (next page). There is no release event and no hold time (button elapsed time) on it today. Mapping mode is designed around that (4.7).
- **Element methods with autos** (grid-fw `simplemidi.lua`, `autovalue.lua`): every element gets Lua methods such as `self:gms(ch, cmd, p1, p2)` where `-1` means "auto". Autos come from the element and the running event (`midi_auto_ch`, `midi_auto_cmd`, `midi_auto_p1`, `midi_auto_p2`, `get_auto_value`, `get_auto_mode`). The MIDI block's default is `self:gms(-1,-1,-1,-1)`; Simple Color is `self:glc(-1,…) self:glp(-1,-1)`. These are plain Lua methods on a table, so **any table that answers them can stand in for `self`**. The zone design relies on this.
- **MIDI output:** the element method `self:gms(ch, cmd, p1, p2, mode)` takes a 5th `mode` argument (0 7-bit, 1 CC 14-bit, 2 NRPN, 3 NRPN 14-bit). The MIDI block uses it today. On firmware 1.5.5 the mode is handled in Lua (`simplemidi.lua`): mode 1 sends the MSB on `p1` and the LSB on `p1+32` (an auto `p1` is reduced `% 32`), modes 2/3 send NRPN 99/98/6(/38). The global C `gms` takes exactly 4 arguments and sends nothing with 5, so the zone `gms` expands the mode itself the same way.
- **Lua version:** firmware 1.5.5 runs Lua 5.5.0. In 5.5, for-loop control variables are read-only, so the library never assigns to one.
- **MIDI input:**
  - Each incoming voice message is passed to **every** element's `midirx_cb(self, header, event)` (`decode.lua`, `_decode_process`). `event` is `{ch, cmd, p1, p2}`. SysEx goes to `sysexrx_cb`, which the zone library does not set.
  - The RX Mode block (`grxm`) must have MIDI Voice enabled. It is on by default.
  - The MIDI block's "Receive MIDI" section appends `self:gmrr(-1, ch, cmd, p1, {value_sync, led_sync}, mode)` after the `gms`. On a real element it updates the value template and LED in firmware. On a zone, `self:gmrr` is a library method (4.8).

### 2.2 PR #1645 (virtual events) and this RFC

A virtual event is a top-level named Function block (`fst`/`fen`) on Setup, and it is shown as its own tab. All virtual events share Setup's 909 characters.

Rev 1 used virtual events for zone hooks. That does not scale, and per-zone event tabs would need a "virtual element" concept in the event panel. **Nothing in this RFC depends on virtual events.** A zone body is a container in the action list, like an If or Function block, not a tab.

### 2.3 HANGAR

HANGAR's Sandbox (`src/lib/sandbox/`) proved the idea: regions on the 9×9 grid, one runtime, minified Lua packed across several events to fit the 909 limit. Its output is `--[[@cb]]` code that the editor can only show as raw code.

HANGAR is a throwaway prototype without code quality standards. **No HANGAR code is copied or adapted.** It is used only as a behaviour reference (which modes, painters and groups feel right). Everything in this RFC is written new and follows the editor's APIs and conventions. The packing scheme is not needed, because the library lives in a file.

## 3. Goals and non-goals

**Goals**

1. Each zone is a container action block on the touch Setup, edited in the action list with grid-uikit controls.
2. **Outputs are the existing action blocks**, placed inside the zone. The default MIDI block works inside a zone with no edits, and the editor's minimalist defaults apply as they do elsewhere.
3. One shared zone library, versioned, installed by the editor into the page folder, and loaded by a generic **Library** block that VSN1 can reuse.
4. **Resolution** from 7-bit up to 14-bit, set on the zone like `pmo` on a potentiometer.
5. **Capture per zone:** **focus mode** (the contact stays in its zone and clamps to the edge) or **live mode** (swipe across zones).
6. **Mapping mode:** press the utility button, then touch a zone, to send exactly one of its messages, for DAW MIDI learn. A second utility press exits.
7. **MIDI RX sync** with the MIDI block's existing Receive section.
8. Zones drawn on the ZONA module in the **control name overlay**.
9. Profiles, presets, copy and paste, undo and the unsaved-changes markers work with no new mechanism.

**Stretch goals** (section 11): state that survives page changes, an interactive surface editor, zone-scoped event navigation, cross-zone rules such as overlap, Profile Cloud thumbnails.

**Non-goals (for now)**

- A browser preview that runs Lua.
- Pressure. When firmware adds it, it arrives as an extra `touch_cb` argument and gets a getter. Nothing is designed for it now.
- Importing HANGAR catalog entries.
- Firmware changes. The design works on current firmware.

## 4. Core concepts

### 4.1 A zone is an element-like container

```
contact → capture → position → read → value(s) ──→ body (ordinary action blocks, self = zone)
                                              ↘ paint
```

A zone block has two parts, matching how a real element is configured:

| Real element | Zone |
|--------------|------|
| Settings block on Setup (Encoder Mode, Button Mode, Potmeter Mode) | The zone block's own options |
| Action blocks in the element's event (MIDI, Gamepad, LED…) | Action blocks in the zone's body |
| `self` = the element | `self` = the zone |

In Lua, the zone block is an opening line and an end line, the same shape as the Function block:

```lua
--[[@zfd]]Z.fader("f1",0,0,1,9,{res=10},function(self)
--[[@gms]]self:gms(-1,-1,-1,-1)
--[[@zen]]end)
```

The body runs whenever the zone has something to report: press, value change, release. Inside it, `self` is the zone object, which answers the element methods the existing blocks call:

| Method | On a zone |
|--------|-----------|
| `self:gms(ch, cmd, p1, p2, mode)` | Sends MIDI. `-1` autos are resolved from the zone (below). Repeated sends of the same value to the same `(ch, cmd, p1)` are dropped, so a body that sends on every event only puts changes on the wire. The filter is reset on each press, so a message meant to repeat per press (a program change) still goes out. |
| `self:gmrr(-1, ch, cmd, p1, {v, l}, mode)` | Registers RX sync for that message (4.8). |
| `self:glc(...)`, `self:glp(...)` | Sets the painter's colour and intensity, so Simple Color and Simple Intensity work. |
| `self:get_auto_value()`, `self:get_auto_mode()` | The value of the source that triggered this run, and `1` when `res > 7`. |
| `self:ind()` | The zone's index on the surface. |
| `self:v() self:x() self:y() self:g() self:step() self:count() self:src()` | Zone getters for Code, If and Gamepad/Mouse value fields. `src()` tells which source triggered the run. |

**Autos on a zone**, mirroring `simplemidi.lua`:

- `ch`: the same as an element, `(gmy()*4+gpc())%16`.
- `cmd`: 144 for a button, 176 for continuous kinds.
- `p1`: `(32 + gmx()*16 + base + offset) % 128`, where `base` is the zone's first CC slot and `offset` is 0 for `x`/`v` and 1 for `y`. Slots are counted over the zones defined before it: an XY pad takes 2, every other kind 1. An XY pad with one default MIDI block sends x and y on two neighbouring CCs, and the next zone continues after them (`self:ind()` stays the definition index).
- `p2`: the triggering source's value. On a continuous zone, a press or release run (`src()` is `g`) uses the main value (`v`, or `x` for an XY pad), so the default MIDI block sends no gate CC on press and release; the duplicate filter drops it.
- `mode`: `get_auto_mode()`, so `res=10` sends 14-bit CC with the default block.

**Other targets** need no zone support at all: Gamepad Axis (`ggms`), Gamepad Button (`ggbs`), Mouse Move (`gmms`), Mouse Button (`gmbs`) and Keyboard (`gks`) are global functions. Their value field takes a zone getter, for example `ggms(0,self:v())` or `gmms(1,self:d())`, where `d()` is the relative change since the last run with a fractional carry, in the zone's value units (a full swipe on a 7-bit fader is 127; scale with `min`/`max`). The editor offers these getters as suggestions in those fields when the block is inside a zone.

**Several outputs** are several blocks. A fader with a "touched" note for DAW automation:

```lua
--[[@zfd]]Z.fader("f1",0,0,1,9,{},function(self)
--[[@gms]]self:gms(-1,-1,-1,-1)
--[[@gms]]self:gms(-1,144,60,self:g()*127)
--[[@zen]]end)
```

The CC goes out when the value moves, the note on press and release. The duplicate filter on `self:gms` does the sorting, so no If block is needed. For finer control, the usual If block with `self:src()` works.

**Defaults when a zone is added** (minimalist pattern, like the MIDI block's `-1` autos): the zone block arrives with one MIDI block inside, `self:gms(-1,-1,-1,-1)`. A button arrives with a note on/off; a fader, knob or XY with CC. The user gets a working zone in one click and changes only what they need.

**Kinds** only decide how the position is read:

| Kind | Reader | Sources | Notes |
|------|--------|---------|-------|
| xy | `point` | `x`, `y`, `g` | two continuous values |
| fader | `axis` | `v`, `g` | vertical or horizontal |
| knob | `angle` | `v`, `g` | see 4.4 |
| button | `gate` | `g` | down or up; toggle and steps on top |

`g` is the contact gate, and every zone has it. A kind is **a preset of options**, not a separate implementation.

**Zone-specific output blocks** are not planned for v1. The MIDI block already covers 7-bit, 14-bit CC and NRPN through its mode select, so a "Touch MIDI" block would duplicate it. If a pattern later turns out to need several blocks every time, a composite (like the existing button-step composites) is the place for it, not a new output type.

### 4.2 Values and resolution

Resolution belongs to the **zone value**, set in the zone block's options. This follows the potentiometer settings (`pmo` resolution bits, `pmi`/`pma` range), so users meet the same idea twice.

- `res` sets the number of steps, from 7 to 14 bits (default 7).
- `min` and `max` set the value range. They default to the wire range of the auto mode: 0–127 for `res=7`, 0–16383 for any `res > 7`. `res` sets the number of steps (2^res) inside `[min, max]`, so `res=10` gives 1024 values spread across 0–16383 and a 14-bit receiver sees full scale.
- The MIDI block's auto mode follows `res` (4.1). A user who picks a mode by hand gets that mode.
- Gamepad and mouse blocks receive the value through the getter and scale it as the user writes it. The gamepad axis range is documented next to the getter (phase 0).

**What higher resolution really gives.** The sensor reports 10 bits across the whole surface. `Z.start(self)` sets `self:txma(1023)` and `self:tyma(1023)` so the library always gets the full range (phase 0 confirms the firmware default). A zone gets its share of those 1024 positions: a full-width fader has about 1024, a 3-cell fader about 341 (≈8.4 bits). A 7-bit `res` is therefore always real; above the zone's share, a higher `res` only interpolates, and extra resolution comes from smoothing, `glide` and `rel` with `speed < 1`. The block face shows the raw positions the zone has ("about 341 positions across"), computed from the library constant `Z.has.sres` (sensor bits, 10).

### 4.3 Contacts and capture: focus mode and live mode

When a contact lands, the library decides which zone **owns** it. Each zone sets `grab`:

| `grab` | Owner | Leaving the zone | Use |
|--------|-------|------------------|-----|
| `focus` | the zone where the contact landed, until lift | Position **clamps to the zone's edge**: value and LEDs stay at the boundary on the side the finger left. | Fine-tuning. Default for every kind. |
| `live` | whichever `live` zone is under the finger right now | Leaving releases this zone. Entering another `live` zone presses it at the entry position (`abs` read). | Performance: drag across several faders to pull them all down. |

`leave=1` is a focus sub-option: leaving the zone counts as release instead of clamping, and re-entering does nothing until the next touch-down. It is on by default for buttons (slide off to cancel, like a real button).

Names are provisional and may change after user feedback. Only the option values in the block would change.

Rules:

- A contact owned by a `focus` zone never reaches another zone, even if it passes over a `live` zone.
- A contact that lands on an empty cell is not owned. If it moves into a `live` zone, that zone picks it up. `focus` zones only take contacts that land inside them.
- Several contacts in one zone: `contact` decides. `new` lets each contact act, `move` re-targets the value (glide), `grab` continues from the current value (relative). The last active contact wins.
- Clamping applies to the **position** before the reader runs, so it works the same way for every kind.

### 4.4 Knob

TouchOSC is the reference. Its **Radial** control maps angular movement around the centre to the value. *Response* is **Absolute** (jump to the touched angle) or **Relative** (the first touch changes nothing, later movement is applied relative to it, scaled by *Factor*). Its **Encoder** control is the endless version, emitting position and direction.

The zone knob mimics the Radial:

- `read="angle"`, with `mode="abs"` (jump) or `mode="rel"` (angular change × `speed`, the counterpart of TouchOSC's Factor). The default is `abs`, as in TouchOSC.
- The usable arc is about 300°, with a dead gap at the bottom, the same as a physical pot.
- The painter draws an **arc on the zone's outer ring** of LEDs, so the indicator follows the value around the knob whatever the input style.
- `drag="v"` or `drag="h"` swaps the reader for vertical or horizontal drag, the DAW way (Ableton and Bitwig drag vertically, many plugins offer both). The arc painter stays. Because kinds are option presets, this is one option, not a new kind. `drag` doesn't change `mode`: DAW-style drag also needs `mode="rel"`, which the block face writes together with `drag`.
- An endless variant (`endless=1`, the TouchOSC Encoder) is a later addition. It fits the same reader.

Resolution note: a 3×3 knob has about 341 raw positions across, so roughly 1000 around its ring, which is enough for a 7-bit absolute knob. For 14-bit output on a small knob, relative mode with `speed < 1` or vertical drag still gives finer control than absolute angle.

### 4.5 Shared stages

- **Mode** (`mode`): `abs` (jump), `rel` (drag delta with `speed`), `glide` (move toward the finger with `speed` and `ease`).
- **Approach:** one tick-driven "move value toward target" function. Spring, glide and smoothing all use it. Glide `speed` is per tick, so glide time scales with the Touch Tick interval.
- **Sensitivity:** deadband, then smoothing, then change detection, then rate limit (flushed by the tick). In the UI this is one select (Low / Normal / High), with raw numbers under Advanced.
- **Steps:** the same meaning as Grid's button mode `bmo` (0 momentary, 1 toggle, n = n+1 steps), with the same step maths (`SettingsButton.calculateStepValuesFirmwareStyle`), so a zone cycles through the values the Button Mode block shows. The firmware's own stepping (`grid_ui_button.c`) has more states when `floor(range/bmo)*(bmo+1) <= range` (bmo=16 on 0–127: 19, not 17); that mismatch is an editor issue of its own.
- **Groups:** radio groups 1–8. A press runs the other members' bodies with their "off" value first, then this zone's "on". `empty` decides whether every member can be off.
- **Painters:** `fill`, `dot`, `comet`, `crosshair`, `target`, `arc`. They draw the **value**, not the finger, so relative, glide, spring and clamping display correctly. Only changed LED cells are sent. Colour goes through the firmware's Lua `color_curve` global (`simplecolor.lua`), so Simple Color inside a zone gives the same colours as on an element. LEDs repaint only from `Z.tick`, so the editor adds the Touch Tick block together with the first zone (phase 3).
- **Release** (`release`): `clear`, `fade`, `keep`.

### 4.6 Custom logic

The body is the hook. Anything an element event can do, a zone body can do: If blocks on `self:src()` or `self:step()`, Code blocks, locals, timers.

- To keep large logic out of the 909-character Setup, put it in a function in the user's own page file, loaded with the Library block, and call it from a Code block in the body: `myfx(self)`.
- If the user writes such a function as a Function block on Setup, PR #1645 shows it as a tab. Nothing more is built for it.
- Advanced: `Z.raw = function(self, id, evt, x, y)` gets every raw touch before routing.

### 4.7 Mapping mode (utility button + touch)

**Goal:** a DAW's MIDI learn must see exactly one message stream, with the same bytes the zone sends in normal use.

**Entering, without release detection.** The utility event only fires on press, and there's no hold time. A `Z.util(self)` block on the utility event replaces `gpl(gpn())` and uses a short window instead:

1. Utility press: set an "armed" flag and note the tick count. The page does **not** change yet.
2. The existing touch tick (`Z.tick`) watches the window (default 300 ms, a Touch Tick option). The firmware has no millisecond clock in Lua (and `os.clock()` is not a known wall clock on the module), so the window is counted in ticks: `Z.tick(self,{ms=20,win=300})` (both defaults, so the editor writes `Z.tick(self,{})`), where `ms` is the Timer period; `Z.tick` re-arms the one-shot timer with it (section 5). If no tick has run since `Z.start` (no Touch Tick block), `Z.util` changes page at once, so the utility button never gets stuck.
3. A touch inside the window: mapping mode **on**. That touch is already the first mapping touch. The page doesn't change.
4. The window ends with no touch: change page (`gpl(gpn())`), as today.
5. In mapping mode, a **second utility press** turns it off. It doesn't change page.

Mapping mode stays on across touches, so the user can map zone after zone: click learn in the DAW, touch a zone, repeat. The LEDs show that mapping mode is on (a dim frame around the surface).

Using the touch tick for the window means no second timer and nothing on the system element besides `Z.util(self)`. The cost: a normal page change is delayed by the window. 300 ms is a starting point for phase 0.

**Filtering, so one stream comes out.** Mapping mode is a filter on the normal path, not a separate table:

1. Only the **first** contact is processed.
2. The gesture picks the source:
   - **Movement** past a small threshold: the dominant axis picks `x` or `y` (or `v`), locked until lift. Only that source's change events run the body. Press and release don't run it.
   - **Tap** without movement: the value is frozen (no `abs` jump), and only press and release run the body. That sends the gate.
   - The press is held back until movement or lift decides which of the two it is.
3. Of the messages the body sends during that touch, only the **first `(ch, cmd, p1)` identity** goes out. Other blocks in the body are muted, and so are other zones.
4. Values and LEDs update as usual, so the user sees what is sent.

Because the message still goes through `self:gms` with the same arguments, 14-bit CC pairs, NRPN and note on/off come out byte-for-byte as in normal use. Gamepad, mouse and keyboard calls are muted in mapping mode.

**Utility ownership** stays manual for now: to use mapping mode, the user removes the default `gpl(gpn())` block from the utility event and adds the Touch Utility block. The Touch Start block shows a hint when the utility event has no `Z.util`. Touch Utility needs Touch Tick; the editor adds it when missing. Contacts held when mapping mode starts are released first, so no note stays on. Buttons are mapped with a tap: a moving press on a button still counts as a tap.

### 4.8 MIDI RX sync

Users already know the MIDI block's "Receive MIDI" section (value sync, LED sync). It works inside a zone body with **no change to the MIDI block**: it writes `self:gmrr(...)` after the `gms`, and `self` is the zone.

**Building the index.** A body only runs on touch, so `gmrr` calls inside it wouldn't register until the first touch. `Z.start(self)` therefore does a **dry run**: it calls each zone body once per source with every output function muted (`gms`, `ggms`, `ggbs`, `gmms`, `gmbs`, `gks`, LED calls). The `gmrr` calls register `(ch, cmd, p1, mode) → (zone, source)`, with autos resolved. `self:dry()` is true during the dry run, for user code that has other side effects.

**Handling a message:**

- `Z.start` sets `self.midirx_cb` on the touch element **only if** something registered. With no RX in any zone, incoming MIDI costs nothing.
- An unmatched message costs one table lookup on a numeric key. Most traffic stops there.
- The decoder handles what the MIDI block can send: 7-bit CC and note; 14-bit CC (MSB on `cc`, LSB on `cc+32`, MSB applied at once and refined by the LSB); NRPN (a per-channel 99/98/6/38 state machine); pitch bend. The 14-bit and NRPN paths are only active when such an output is registered.
- **Value sync** sets the zone value (scaled into `res`) and, in `glide`/`rel`, the target too. **LED sync** marks the zone dirty; the next tick repaints. Dense automation therefore costs at most one repaint per zone per tick, not one per message. Neither sends MIDI, so there is no echo. Painters draw the zone value, so LED sync without value sync shows nothing in v1. Value sync also updates the duplicate filter, so moving back to the previously sent value is not dropped. The send and the `gmrr` registration must use the same `mode` (phase 3 writes it explicitly in both inside a zone); 14-bit and NRPN registrations key on CC 176 whatever `cmd` says, as `gms` sends them. NRPN uses CC 99/98/6/38 on its channel.
- **Touch wins:** RX for a zone is ignored while a contact owns it.
- **Toggles, steps and groups:** an incoming "on" for a group member makes it the active member, with no output.
- **SysEx is an advanced concept, left to user code.** The library doesn't set `sysexrx_cb` or `eventrx_cb`, so they stay free: a user who needs SysEx sets `self.sysexrx_cb` in a Code block on Setup, as on any element, and can update zones from it with `Z.set(name, value)`, the same path value sync uses, including "touch wins". That user also takes on the processing cost of the SysEx traffic they choose to handle. If a common SysEx use shows up later (a DAW sending values or names as SysEx), it can become an opt-in library feature that chains the user's callback the same way `midirx_cb` does. Nothing in v1 blocks that.
- If the user's own Setup code assigns `self.midirx_cb` before `Z.start`, the library calls it after its own handling. `Z.start` is always the last block, so this order holds.
- The firmware keeps an element's callbacks when a new config is sent to RAM. A `midirx_cb` left by the previous Setup (seen on hardware when a page switched from hand-written code to zones) therefore looks like the user's own and is chained until the page reloads. `Z.start` drops it from the second run on, because it then finds `Z.rx`. Accepted for v1 (10).

**Later, optional firmware help:** a `gmrr` variant that calls a Lua function with the decoded 14-bit/NRPN value would remove the NRPN parser from Lua. It isn't needed for v1.

## 5. Device layout

```lua
-- touch element, Setup (must stay under 909 characters)
--[[@lib]]local p=string.format("/%02X/",gpc())Z=require(p.."zona")
--[[@zfd]]Z.fader("f1",0,0,1,9,{res=10},function(self)
--[[@gms]]self:gms(-1,-1,-1,-1) self:gmrr(-1,-1,-1,-1,{true,true},1)
--[[@gms]]self:gms(-1,144,1,self:g()*127)
--[[@zen]]end)
--[[@zfd]]Z.fader("f2",1,0,1,9,{grab="live"},function(self)
--[[@gms]]self:gms(-1,-1,-1,-1)
--[[@zen]]end)
--[[@zbt]]Z.button("b1",2,0,2,2,{bmo=1,group=1},function(self)
--[[@gms]]self:gms(-1,-1,-1,-1)
--[[@zen]]end)
--[[@zxy]]Z.xy("pad",4,0,5,5,{mode="glide",led="target"},function(self)
--[[@gms]]self:gms(-1,-1,-1,-1)
--[[@zen]]end)
--[[@zst]]Z.start(self)                   -- sets touch_cb, dry run, midirx_cb if needed, first paint, starts the tick; always last

-- touch element, Timer
--[[@ztk]]Z.tick(self,{})   -- spring, glide, flush, LED, mapping window; re-arms the timer. Defaults ms=20, led=1, win=300 are left out

-- system element, utility event (manual step, 4.7)
--[[@zut]]Z.util(self)                    -- arm mapping window; second press exits mapping mode

-- file system (page 00)
/00/zona.lua            -- the library, a copy per page
```

**Global name.** Touch blocks always write `Z.` in v1. The Library block may bind other names, but the touch surface validator warns when no Library row before the zones binds `Z` to `zona`.

**Timer.** `gtt` is one-shot: the firmware counts the element's timer down once and fires the Timer event (v1.5.5 `grid_ui.c`), and a page change resets it. The library therefore owns it: `Z.start` kicks it once (`gtt(self:ind(),1)`), and `Z.tick` re-arms it with `cfg.ms` at the start of every tick, so an error in a zone body can't stop it. The interval lives only in the Touch Tick block.

**Setup budget.** The container costs more than rev 2's tables: about 50 characters for the opening line, 30 for a default MIDI block and 14 for the end line, so about **95 per zone** with one output, plus about 45 per extra output and 50 for RX on an output. With the Library block (~70) and `Z.start` (~25), that is roughly **7–9 simple zones**, fewer with RX or several outputs. That is the price of using the normal blocks. Section 8 covers growing past it.

## 6. Concerns by code area

### 6.1 Generic Library block

A new block that loads Lua modules from the **current page folder**. It is not specific to ZONA; the VSN1 layout library will use it too.

| Short | Name | Event | Category |
|-------|------|-------|----------|
| `lib` | Library | any Setup (top level) | `code` |

**Lua form.** One canonical line that the parser reads back exactly:

```lua
local p=string.format("/%02X/",gpc())Z=require(p.."zona")L=require(p.."layout")
```

- The canonical form has no spaces between statements, because that is what `GridScript.compressScript` stores on the module. Editor-written and device-stored text are then the same string, so change tracking and the character count agree. The parser also accepts one space before each row (the hand-written form).
- Each row binds a **global name** to a **file in the page folder** (without `.lua`). Globals only, since locals would vanish after Setup.
- Global names are Lua identifiers, not keywords, and not a name that breaks the line or the event: `p`, `self`, `_efn` (locals in the firmware's event wrapper, 2.1), `require`, `string`, `gpc`, `_ENV`. Such a script is shown as code (6.5). Names that shadow other built-ins get a warning on the block face.
- Neither a global nor a file may be a name in `GridScript.validator.lookup`, human or short. `compressScript` rewrites human names everywhere, even inside the file string, so `led_value=require(p.."led_value")` would be stored as `glp=require(p.."glp")`. The short names are firmware functions, and a row must not overwrite them.
- File names are bare: `[A-Za-z0-9_]+`, without `.lua`, slashes, dots or hyphens. A hyphen would let `--` through, and the minifier rewrites that to `- -`. Zero rows is the prefix alone, which is still a Library block.
- Rule for the tests: every line the editor writes must survive the send path unchanged. That means `compressScript(toLua(rows)) === toLua(rows)`, checked on a whole event with other blocks around the Library block, and the rows read back through the `GridAction.parse` split must equal the rows written.
- `gpc()` is `page_current()`, so the same block works on any page and in any profile.

**Block face:**

- Rows of *global name* and *file*. File suggestions come from the **library registry** (libraries the editor ships, such as `zona → Z`) and the `.lua` files in the page folder (`fetchDirEntries`).
- Per-row status from the connected module: *missing* (not in the page folder), *not loaded* (in the folder, but the global is not bound, e.g. Setup failed before the file existed; **Reload**), *present*, or, for registry libraries, *older than bundled* or *newer than bundled*. Presence comes from the folder listing, the version from the bound global (6.4).
- **Install** and **Update** buttons for registry libraries: the same path the File Manager uses to save a `.lua` file (2.1). That is `writeFileContent` of `GridScript.compressScript(source)` into the page folder, then `invalidateLuaModule("/PP/zona")`. The key must be the full `require` path. The File Manager's save passes the bare file name, which doesn't clear a page-folder module, so don't copy that call. Afterwards the editor re-runs that element's Setup in the running VM (`pcall(ele[i].ini, ele[i])`, the system element is `ele[#ele]`). Re-sending the config would mark the page as changed. The whole Setup runs again, so its side effects repeat (MIDI sent from Setup, timers, callbacks reassigned), and other elements keep the old table until the page reloads. Library-specific setup such as `Z.start` must be safe to run twice. **Reload** on a *not loaded* row is the same re-run without a write. Known v1 limit: a registry file that is present but broken shows *not loaded*, and Reload fails with the Setup error; the block offers no rewrite, so the user deletes the file in the File Manager to get **Install** back.
- A missing file is a **warning** in the editor, not an error. Offline and virtual modules can't check files.
- **Global name clashes.** Globals are shared by every element on the page, so the chosen name can overwrite a global that user code on another element defines. Seen on hardware: a system Timer defined `function Z(x,y)` for its own LED painter, `Z=require(…)` replaced it, and the old code failed with "attempt to call a table value (global 'Z')". The block should warn when another event on the page assigns the same global (a text check of the page's scripts for `Z=` or `function Z`).
- On the module, a missing (or failing) file is not harmless: the `require` throws, and the **rest of that Setup event does not run**. The line stays an unguarded `require` on purpose: it costs no extra characters, the error names the missing file in the debug log, and the blocks that use the global (zones, `Z.start`) could not work without it anyway. A guarded form (`pcall`) would hide the cause and leave the global unset or wrong. Instead the block makes the state visible at once: the row shows *missing* with **Install** as soon as it is added, and Install re-runs that element's Setup.

**Registry** (`src/renderer/libraries/registry.ts`):

```ts
export type BundledLibrary = {
  id: string;          // "zona"
  file: string;        // "zona.lua"
  global: string;      // suggested global name: "Z"
  version: string;     // semver, read from the source; major = breaking block syntax
  source: string;      // imported with ?raw
};
```

The library itself sets nothing up beyond returning its table. Library-specific setup (`touch_cb`, `midirx_cb`) is the job of that library's own blocks, here `Z.start(self)`.

### 6.2 Touch action blocks and the zone model

**Blocks** in `src/renderer/config-blocks/`, category **`touch`** (new entry in `ActionBlockInformation.category`, `categoryColors.ts`, and a `--category-touch` CSS variable):

| Short | Name | Event | Type | Notes |
|-------|------|-------|------|-------|
| `zfd` | Touch Fader | touch Setup | `composite_open` | preset `read="axis"` |
| `zbt` | Touch Button | touch Setup | `composite_open` | preset `read="gate"` |
| `zxy` | Touch XY Pad | touch Setup | `composite_open` | preset `read="point"` |
| `zkn` | Touch Knob | touch Setup | `composite_open` | preset `read="angle"` |
| `zen` | Touch End | touch Setup | `composite_close` | `end)`, added through `compositeLua` like `fen` |
| `zgr` | Touch Group | touch Setup | single | group settings (`empty`) |
| `zst` | Touch Start | touch Setup | single | `Z.start(self)`, kept last |
| `ztk` | Touch Tick | touch Timer | single | interval, LED divider, mapping window |
| `zut` | Touch Utility | system utility | single | `Z.util(self)` |

The zone blocks follow `Function_Start.svelte`: `compositeLua: [{ short: "zen", script: "end)" }]` plus the default MIDI block, so adding a zone inserts three actions.

**Module layout** (`src/renderer/config-blocks/touch/`):

| File | Holds |
|------|-------|
| `zone-model.ts` | `Zone`, `ZoneKind`, kind presets, defaults, the option schema per kind |
| `zone-parse.ts` | `parseZone(script)`, `zoneToLua(zone)` for the opening line (the Library line lives in `libraries/library-script.ts`: `parseLibraryScript` / `libraryScriptToLua`) |
| `zone-validate.ts` | validators (below) |
| `ZoneBlock.svelte` | one face for all four kinds, rendered from the schema |

```ts
type ZoneKind = "fader" | "button" | "xy" | "knob";

type Zone = {
  name: string;
  kind: ZoneKind;
  x: number; y: number; w: number; h: number;     // cells, 0-based
  opt: Record<string, ZoneOptionValue>;            // only non-defaults are written
  unknown?: string;                                // options this editor doesn't know, kept as-is
};
```

The model has no outputs. They are child actions between the zone block and its `zen`, and the editor treats them like any other actions.

**Validators** (`zone-validate.ts`). They follow `config-blocks/validators.ts`: an invalid value keeps the last valid one and shows an inline message.

- **Per zone (v1):** inside 9×9, `w,h ≥ 1`, name is a Lua identifier and not a `GridScript.validator.lookup` name (it sits in a string that `compressScript` would rewrite, 2.1), `res` 7–14, `min < max`.
- **Per surface (shape defined in v1, rules later):** `(zones: Zone[], context) => ZoneIssue[]`, run on the whole touch Setup (`context` carries the Setup actions for the order rules):
  - duplicate zone names (v1, error);
  - **overlap** (later; an error unless a zone sets `overlap=1`);
  - the same MIDI identity in two zones (later, information only);
  - order: `lib` before zones, `zst` last (v1, warning).
- An issue points at a zone name. The block face and the overlay both show it.

**Picker filtering.** Today `ActionPicker.svelte` filters with hard-coded lists per event. Add a declarative field:

```ts
// ActionBlockInformation additions
elementTypes?: ElementType[];   // where this block may be added; undefined = everywhere
eventTypes?: EventType[];
```

A block that declares `elementTypes` or `eventTypes` is placed at the top level of a real event. The picker does not offer it in virtual-event tabs, which are function bodies (a `require` there would only run when the function is called). Inside composites in the same event (an If, a function) it is not enforced yet; that is a known limit.

Inside a zone body, the picker offers the output blocks (MIDI, Gamepad, Mouse, Keyboard, LED, Code, Condition) and hides element-settings blocks that make no sense there.

**UI rules:**

- grid-uikit controls only, the same as `SettingsButton.svelte`.
- Simple defaults: the zone face shows Geometry, Resolution and LED, with Behaviour, Capture and Sensitivity collapsed.
- The MIDI block inside a zone is the normal MIDI block. Its suggestions show the resolved autos for that zone ("auto: CC 33").

### 6.3 Zones in the control name overlay

The precedent is `ControlNameOverlay`: the element name it shows comes from the `sn` block in Setup (`GridElement.load`, `runtime.ts:1432`). Zones work the same way. They are read from the action chain, with no separate state and no write path.

- On ZONA, the existing **control name overlay** (`ModuleOverlay.Types.CONTROL_NAME`) draws the zones. No new overlay type or toggle in v1.
- `main/grid-layout/grid-modules/overlays/TouchZonesOverlay.svelte`, used by the control name overlay for ZONA, reuses the grid maths in `ZONA.svelte` (`gridSize`, `pctPositions`).
- Derived on every render:

  ```ts
  $: setup = touchElement.findEvent(EventType.SETUP);
  $: zones = $setup.config.filter(isZoneOpen).map((a) => parseZone(a.script));
  $: issues = validateSurface(zones);
  ```

- It draws a rectangle per zone, with its name and kind icon, a group badge, an issue outline, and a highlight for the zone whose block (or a block in its body) is in `selected_actions`.
- **v1 doesn't write.** Clicking a zone may select its block; that only sets the existing selection store. Drag-to-create, move and resize are stretch goals.

### 6.4 The library file

**Source and versioning**

- In the repo: `src/renderer/libraries/zona/zona.lua`, with `Z.VERSION` (semver).
  - Minor: new options or painters. Old blocks keep working. Defaults don't change.
  - Major: block syntax or defaults change, and the editor migrates blocks.
- Uploaded the way the File Manager saves `.lua` files: `GridScript.compressScript(source)`, which minifies and **keeps comments** (2.1). Opened in the File Manager, it shows expanded, like any other page file. No upload transform of its own. The size budget applies to the compressed size, comments included, so keep comments short. Phase 2 ended at 15 KB (0.5.0); from phase 3 the budget is 20 KB, and the hard ceiling is 30 KB (the user's limit; larger files have run fine so far). Every page folder holds its own copy, and `require` compiles it on each page change, so staying well below the ceiling still matters.
- Because `compressScript` runs `shortify`, the source uses the firmware's short names and never uses a human name (`GridScript.validator.lookup`) as its own identifier, table key or string content. Those would be rewritten on upload.
- Unit tests run the library in a Lua VM under vitest (wasmoon, Lua 5.4; the firmware runs 5.5, so the compressed library is also checked with a 5.5 `luac -p` before release). They load `compressScript(source)`, the text that actually reaches the module. They feed `touch_cb` and `midirx_cb` sequences and check the `gms`/`ggms`/`gmms`/LED calls, using stubs for the firmware globals. One test checks that the compressed source still contains `Z.VERSION="x.y.z"`, so the version survives.

**Per page, on purpose**

- Each page folder has its own copy: `/PP/zona.lua`. A setup made with v1 and another made with v2 can sit on different pages, and both keep working.
- Profiles already carry page-folder files, so sharing a profile shares the library version it was built with. No profile format change.
- **Element presets** don't carry files. When a preset with touch blocks is applied to a page without the library, the Library block shows *missing* with **Install**.
- **Version read-back** per page reads the **bound global**, not the file:

  ```ts
  `local g=rawget(_G,"Z") return type(g)=="table", type(g)=="table" and g.VERSION or nil`
  ```

  A `require` probe would load the file itself (running its top-level code) and report "loaded" even when Setup never bound the global. The bound table is what is actually in use, so its version is the one to show and log.

- The editor never updates silently. A newer bundled version appears as **Update** on the Library block.

**Virtual modules:** `ConnectionSimulator` rejects file operations today. Recommended: a small in-memory file store, so the Library block flow can be tested without hardware.

### 6.5 Source of truth and round-trip

- The action strings are the config. The editor has no other zone store.
- `parseZone` and `zoneToLua` round-trip the opening line exactly: `zoneToLua(parseZone(s)) === s` for anything the editor wrote. Body blocks round-trip as they do today.
- Editor-written lines are already in the form the send path stores (2.1): no space between statements, double quotes, no optional spaces. A test compresses a whole event (zone opening line, body, `zen`, `lib`, `zst`) with `GridScript.compressScript`, splits it the way `GridAction.parse` does, and checks that every editor-written block comes back unchanged. The opening line can't be compressed alone, because it isn't complete Lua. This is the same rule as for the Library line (6.1).
- Only non-default options are written. Defaults are written by hand in `zone-model.ts` and in `zona.lua`; a unit test checks they match (10).
- **Unknown options are kept** (`Zone.unknown`), so a block written by a newer editor loses nothing in an older one.
- A script that doesn't parse is shown as a code block with a warning. Nothing is deleted.
- Config travels through `GridEvent.load()` and `sendToGrid()` unchanged. Zone blocks are just actions.

### 6.6 Grid profiles and presets

- **Profiles:** touch blocks are in the touch Setup text and `zona.lua` is in the page folder, so profiles carry both with no format change.
- **Presets:** a touch element preset carries its zone blocks and their bodies. The library is installed on demand (6.4).
- **Profile Cloud preview:** stretch goal (zones drawn on the thumbnail using `parseZone`).

### 6.7 New APIs

**Lua library (`/PP/zona.lua`)**

| API | Purpose |
|-----|---------|
| `Z.fader/button/xy/knob(name, x, y, w, h, opt, body)` | Create a zone (presets over `Z.zone`); `body(self)` runs on press, change, release |
| `Z.zone(name, x, y, w, h, opt, body)` | Generic zone; `opt.read` decides the kind |
| `Z.group(n, opt)` | Group settings |
| `Z.start(self)` | Sets `touch_cb`, dry run for RX, `midirx_cb` if needed (chaining any existing one), first paint |
| `Z.touch(self, id, evt, x, y)` | The `touch_cb` |
| `Z.rx(self, header, event)` | The `midirx_cb` |
| `Z.tick(self, cfg)` | Called from the Timer; `cfg.ms` interval (re-arms the one-shot timer), `cfg.led` LED divider, `cfg.win` mapping window in ms; defaults in `Z.tdef` |
| `Z.util(self)` | Utility button: arm the mapping window, or exit mapping mode |
| zone `self:gms self:gmrr self:glc self:glp self:get_auto_value self:get_auto_mode self:ind` | Element-compatible methods for ordinary blocks |
| zone `self:v() x() y() g() d() step() count() src() dry()` | Getters |
| `Z.set(name, value, src)` | Set a zone value and repaint without sending, the same path as RX value sync; for user code such as a SysEx handler |
| `Z.raw = function(self, id, evt, x, y)` | Advanced: raw touch |
| `Z.VERSION`, `Z.has` | Version and capabilities (`Z.has.sres` sensor bits) |

**Editor (TypeScript)**

| Module | Purpose |
|--------|---------|
| `config-blocks/Library.svelte` + `libraries/registry.ts` + `libraries/library-script.ts` | Generic page-folder `require`, the Library line format, install and update |
| `config-blocks/touch/zone-model.ts`, `zone-parse.ts`, `zone-validate.ts` | Types, schema, parse and serialize, validators |
| `config-blocks/touch/ZoneBlock.svelte` + block files | Touch blocks |
| `ActionBlockInformation.elementTypes / eventTypes` | Declarative picker filtering |
| `TouchZonesOverlay.svelte` in the control name overlay | Zone drawing |
| `ConnectionSimulator` in-memory files | Virtual module support |
| MIDI / Gamepad / Mouse block suggestions | Zone autos and getters when inside a zone |

Not needed any more: `ZoneOutput`, output keys, `rx` keys, the `on` callback option, `Z.API`, `UserInputValue.zoneName`, zone-hook classifiers in `virtual-event.ts`, the profile `requires` field.

**Firmware:** none required.

## 7. Phases

0. **Firmware facts (hardware spike, short).** Check each of these:
   - Does `gms` with `mode` 1/3 send correct 14-bit CC and NRPN?
   - The default `txma`/`tyma` value, so `Z.start` knows whether it must set them.
   - The gamepad axis range.
   - Does the touch element's `midirx_cb` receive voice messages?
   - `require` from a page folder after a page change, and after re-upload plus `invalidateLuaModule`.
   - Tick CPU cost with 5 contacts at 20 ms, and with an LED divider of 2.
   - Mapping window: does 300 ms feel right for page changes?

   Phase 0 was skipped; phase 2 answered some of it on hardware (firmware 1.5.5). The touch element's `midirx_cb` receives CC voice messages, including 14-bit pairs. The library's own 14-bit expansion sends clean MSB/LSB pairs. The tick cost is in section 9. Still open: NRPN on hardware, `require` after a page change, 5 contacts, and how the window feels.
1. **Library block.** Registry, `lib` parse and serialize, page-folder file status, install and update. Useful on its own, and VSN1 can start using it.
2. **Library v1 + Lua tests.** Defaults-match test against `zone-model.ts`, pipeline, zone `self` and autos, duplicate filter, resolution, capture, modes, sensitivity, steps, groups, painters, dry run and RX sync, mapping mode.
3. **Touch blocks.** Zone model, parse and serialize, composite open/close, default body, per-zone and surface validators, `ZoneBlock.svelte`, picker filtering, suggestions inside zones, the `touch` category.
4. **Overlay** in the control name overlay.
5. **Docs.** Library docs, a mapping mode guide, and an RX sync section next to the MIDI RX docs.
6. **Stretch goals** (section 11) as separate RFCs or PRs.

## 8. When Setup runs out of room

The library itself is in a file. Setup holds the Library block, the zones with their bodies, and `Z.start`.

1. **Logic first.** Large body logic can live in a user's own page file, loaded with the Library block, and be called from a one-line Code block (4.6). This needs no new editor feature.
2. **Zones in a file.** Not planned. Moving zone blocks into a generated page file would make a file part of the config. That breaks "action strings are the source of truth" unless unsaved changes, store and profiles all learn about files. If it is ever needed, it gets its own RFC.

## 9. Risks

- **Setup budget.** Containers with normal blocks cost about twice rev 2's tables (section 5). 7–9 simple zones covers the common layouts (a row of faders, a pad, a few buttons) but not 16 pads with RX. Measure against real layouts in phase 3.
- **Dry run side effects.** User code in a body runs once at `Z.start` with outputs muted. Code that writes globals or starts timers would do so too. Mitigated by `self:dry()` and docs.
- **Implicit duplicate filter.** `self:gms` drops repeated values per identity. A user who wants to resend the same value (rare) needs plain `gms(...)` instead of `self:gms`. Document it.
- **Tick cost.** Interval and LED divider are options on the Touch Tick block. Measure on ESP32-S3 with 5 contacts and comet trails to pick defaults. First measurement (phase 2, ZONA, firmware 1.5.5, 8 zones, timed as 100 calls in one Lua chunk): an idle `Z.tick` costs about 1.5 ms, about 5 ms when every zone repaints, so about 8% and 26% of a 20 ms tick. Idle cost grows with the zone count; skipping zones with nothing pending is the first optimisation if needed.
- **Library load on every page change.** The VM restarts, so `require` reads and compiles the file each time. Measure page switch time.
- **Output flood.** The rate limit protects USB MIDI. Test 14-bit output and RX sync on several zones at once.
- **RX data load.** `midirx_cb` is only set when a zone registered RX; unmatched messages cost one lookup; LED sync repaints at most once per tick. Measure with dense automation.
- **Resolution expectations.** The sensor gives 10 bits across the whole surface, so small zones get 8–9 bits of real position. 14-bit absolute output on a small zone is interpolated. Mitigated by the positions hint (4.2).
- **Mapping window delays page change.** Every page change waits for the window. If 300 ms feels slow, shorten it.
- **Copies per page.** Several versions of the library can be in flash at once. That's acceptable at the 20 KB budget each (6.4).
- **Edit vs device drift.** A user can edit `zona.lua` in the FileManager. Version read-back catches a different version but not local edits. A checksum could be added later.

## 10. Open questions

**Resolved**

- *Library location:* per page folder (`/PP/zona.lua`).
- *Category name:* `touch`.
- *Library loading:* the generic Library block, shared with VSN1.
- *Library block scope:* global names.
- *Send path:* blocks and the library file use the editor's existing transforms, with no handling of their own. Actions go through `sendToGrid` (`compressScript` + `SendConfig`). The library file goes through the File Manager's `.lua` save (`compressScript` + `writeFileContent`). The editor writes lines already in compressed form, and the name rules exclude anything those transforms would rewrite (2.1, 6.1, 6.4).
- *Outputs:* ordinary action blocks inside the zone container (4.1). Pending review.
- *Capture names:* focus mode and live mode, provisional.
- *`Z.util` ownership:* a manual step for now (4.7).
- *Mapping mode entry and exit:* window after a utility press, second press exits (4.7).
- *Pressure:* a future `touch_cb` argument. Not designed now.
- *Overlay toggle:* the existing control name overlay.
- *Defaults table:* written by hand in both `zone-model.ts` and `zona.lua`, with a unit test that fails when they differ. The editor leaves defaults out when it writes a block (`{}` instead of `{mode="abs",grab="focus",res=7,…}`, which saves Setup characters), and the library fills them in, so the two copies must agree. `zona.lua` stays a plain hand-written file that reads well on the device and in the FileManager. Generating the Lua table from TypeScript at build time was the alternative, and can be revisited if drift becomes a problem. A default may only change in a major library version, because blocks written by older editors rely on it.
- *Knob default response:* absolute, as in TouchOSC.
- *Press/release composite:* not in v1, and possibly never. Separate press and release branches mattered for mechanical elements, whose events always fire on both. A zone body sends only what changed (the duplicate filter on `self:gms`), so the plain If block on `self:g()` or `self:src()` covers the rare case that needs it.

- *Stale `midirx_cb` after a config change (4.8):* accepted for v1. It only happens the first time a page switches from hand-written code that set `midirx_cb` to zones, in RAM, and ends at the next Setup re-run or page reload. Clearing it in Setup would cost characters and break user code placed before the zones.
- *Touch block global name:* `Z`, fixed in v1 (section 5).

**Still open**

None at the moment.

## 11. Stretch goals

Each of these is welcome if it fits cleanly later. None of them may change the v1 API.

- **State that survives page changes and power-up** (values, steps, active group member) in `/PP/zona.state`. If done, it must be left out of profiles, it must not be marked as a config change, and it needs a save before the page change in `Z.util`.
- **Interactive surface editor:** drag to create, move, resize, writing back through the same block update path, so history and unsaved changes keep working.
- **Zone-scoped navigation:** selecting a zone on the overlay jumps to its block.
- **Cross-zone rules:** overlap errors, shared MIDI identity hints.
- **Endless knob** (TouchOSC Encoder).
- **Build-time defaults:** generate the Lua defaults table from `zone-model.ts`, if the two hand-written copies prove hard to keep in step.
- **Profile Cloud thumbnails** with zones.
- **HANGAR converter** from a `Surface` JSON to touch blocks.

## 12. References

- `src/renderer/runtime/virtual-event.ts` (PR #1645)
- `src/renderer/config-blocks/Midi.svelte` (`self:gms` default, `gms` mode, "Receive MIDI" and `gmrr`), `Function_Start.svelte` / `Function_End.svelte` (composite open/close, `compositeLua`), `_composite-factory.ts`, `RxMode.svelte` (`grxm`), `SettingsPotmeter.svelte` (`pmo`/`pmi`/`pma`), `SettingsButton.svelte`, `SettingsButton.ts`, `GamePadAxis.svelte`, `MouseMove.svelte`, `SimpleColor.svelte`, `ElementName.svelte`, `ActionBlockInformation.ts`, `categoryColors.ts`, `validators.ts`
- `src/renderer/main/panels/configuration/components/ActionPicker.svelte`
- `src/renderer/main/grid-layout/grid-modules/devices/ZONA.svelte`, `Device.svelte`, `overlays/ControlNameOverlay.svelte`, `runtime/moduleOverlay.ts`
- `src/renderer/runtime/runtime.ts` (`GridElement.load` name derivation, `GridPage.sendFiles`)
- `src/renderer/main/panels/FileManager/FileManager.ts`: `writeFileContent`, `invalidateLuaModule`, `fetchDirEntries`, `pageNumberToFolderPath`; `FileManager.svelte` (`.lua` save and import with `compressScript`, open with `expandScript`)
- `src/renderer/serialport/instructions.ts` (`SendConfig`, `FetchConfig`, `SendLuaImmediateAndEvaluate`), `runtime.ts` (`GridEvent.sendToGrid`, `GridEvent.load`, `GridAction.parse`)
- grid-protocol: `GridScript.compressScript` (`shortify` + `minifyLua`), `GridScript.expandScript`, `GridScript.checkSyntax`, `GridScript.validator.lookup`
- `src/renderer/runtime/connection-simulator.ts`
- grid-fw: `grid_lua.c` (package.path), `grid_protocol.h:131` (909), `grid_ui.c` `grid_ui_bulk_page_load` (VM restart), `lua_src/decode.lua` (`midirx_cb` dispatch to every element), `lua_src/simplemidi.lua` (`self:gms` autos), `lua_src/autovalue.lua` (`get_auto_value`, `get_auto_mode`)
- TouchOSC manual, *Control Reference*: Radial (angular, Absolute/Relative response, Factor) and Encoder — https://hexler.net/touchosc/manual/controls
- docs.intech.studio: *File Manager* (page-folder `require`, profiles with files), *MIDI RX*, *RX Mode*, *Utility Event*
- HANGAR `src/lib/sandbox/` (behaviour reference only)
