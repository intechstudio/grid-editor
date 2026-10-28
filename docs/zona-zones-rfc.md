# RFC: ZONA touch zones in Grid Editor

- **Status:** Revision 8, implemented on `feat/zona-sandbox` (library 0.10.1). Revision 8 removes Touch Start: each zone line passes `self`, and the zones go live on the first tick after Setup. Revision 7 takes the body out of the zone: a zone is its options, with one Output (MIDI, Mouse or Gamepad) sent by the library. Revision 6 followed the loader's CTO round on `feat/library-block` (PR #1669), revision 5 moved the zones onto that loader, and revision 3 (v1, library 0.7.2) was reshaped by the owner review (section 14).
- **Date:** 2026-10-28 (rev 1: 2026-10-06, rev 2: 2026-10-09, rev 3: 2026-10-12, rev 4: 2026-10-18, rev 5: 2026-10-26, rev 6: 2026-10-27, rev 7: 2026-10-28)
- **Author:** Kristóf Kerti
- **Related:** PR #1645 (virtual events), PR #1589 (XY → ZONA), PR #1596 (virtual flag for Lua immediate exec), HANGAR (`sabotond-dev/hangar`, behaviour reference only)

## 0. What changed since revision 7

Revision 8 removes the Touch Start block (user decision, 2026-10-28). The module runs a Setup top to bottom when the page loads, and runs it again under its element whenever the editor sends it, so the zone lines can attach the surface themselves. Library 0.10.0, breaking, with no migration of old lines.

| Area         | Rev 7 (0.9.3)                                                                                                                 | Rev 8 (0.10.0)                                                                                                                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zone line    | `_Z.fader("f1",0,0,1,9,{},nil)`: the 7th argument was a leftover of the body.                                                 | **`_Z.fader(self,"f1",0,0,1,9,{})`**: the touch element first, as in `Z.tick(self,…)`. One character more per zone (5).                                                                                                                |
| Activation   | Touch Start (`_Z.start(self)`), kept the last block of Setup, made the zones live.                                            | **The first zone of a Setup run** drops the previous surface and takes the element (sensor range, `touch_cb`, the timer kick); **the first tick or touch after Setup** makes the pending zones live: RX, `midirx_cb`, first paint (5). |
| Failed Setup | Zones before an error stayed pending and were dropped at the next tick: an empty surface.                                     | The zones before the error go live.                                                                                                                                                                                                    |
| Editor       | Touch Start block, added with the first zone and kept last by the picker; order warnings; its face held the surface warnings. | **No Touch Start.** The first zone still brings Touch Tick. The library warning shows on the first zone's face; duplicate names and other problems already show on each zone (6.2). `keepLast` is gone from the picker.                |
| Setup budget | Touch Start cost about 25 characters.                                                                                         | 7 plain zones use about 287 of 909 characters, down from 305; still about 21 plain faders (5).                                                                                                                                         |
| Old lines    | —                                                                                                                             | Lines ending `nil)` and `_Z.start(self)` show as Code blocks; the user deletes them and adds the zones again.                                                                                                                          |
| Outputs      | Fader, Button and XY each had None (`msg="none"`).                                                                            | **None removed** (0.10.1). It was left from the body model, where a body read the value; without a body nothing reads it. A line with `msg="none"` shows the unknown value problem (4.1).                                              |

## 0.1 What changed from revision 6 to revision 7

Revision 7 follows the zone outputs design session (user decisions, 2026-10-27). The library went from 0.8.8 to 0.9.3 in four slices (0.9.0 bodies out, 0.9.1 Output select and Mouse, 0.9.2 tap to click, 0.9.3 Gamepad), breaking changes allowed before 1.0, with no migration of old lines.

| Area         | Rev 6 (0.8.8)                                                                                                                                                             | Rev 7 (0.9.3)                                                                                                                                                                                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zone model   | A container: an opening line `…,{opt},function(self)`, a body of ordinary action blocks with `self` = the zone, and a Touch End line `end)`.                              | **A zone is its options.** One line ending `nil)`: `_Z.fader("f1",0,0,1,9,{},nil)`. The call shape is unchanged; the library ignores the 7th argument. No body, no per-finger `self`, no getters `v x y g d dx dy step f`. About 25 Setup characters less per zone (4.1).                                                                          |
| Outputs      | MIDI from the options (`msg ch num rx`); gamepad, mouse and keyboard as action blocks in the body.                                                                        | **One Output per zone**, the `msg` option, shown as a select titled "Output". Fader: CC, Pitch bend, Mouse wheel (`mouse`), Gamepad axis (`pad`). Button: Note, CC, Mouse button, Gamepad button. XY: CC, Mouse, Gamepad. The face shows only the chosen output's fields (6.2).                                                                    |
| Mouse        | `gmms`/`gmbs` blocks in the body, fed by `self:dx()`/`self:dy()`.                                                                                                         | **The library sends it.** An XY is a trackpad (the pointer moves by the finger's movement times `speed`), a fader scrolls the wheel, a button presses a mouse button (`num` 1 Left, 2 Right, 4 Middle) and a toggle is a drag lock. Moves are summed per tick and sent once, at most 127 per step, with the fraction carried. Finger 1 only (4.1). |
| Tap to click | —                                                                                                                                                                         | A short touch on a Mouse XY that barely moves clicks left on lift. Fixed thresholds, no settings; **Tap to click** On by default, `tap=0` turns it off (4.1).                                                                                                                                                                                      |
| Gamepad      | `ggms`/`ggbs` blocks in the body, fed by getters.                                                                                                                         | **The library sends it.** A fader or XY sends axes over the full range −128…127, centred; a button sends a gamepad button. Axes and buttons are autos in Setup order, like the CC autos. Mode, Spring and Capture still apply; Resolution, Min and Max are hidden (4.1).                                                                           |
| Colour       | `col`, overridden by Simple Color and Simple Intensity in the body; a start run ran each body once so they showed from the start.                                         | **`col` only.** Simple Color, Simple Intensity and the start run are gone with the body (4.5).                                                                                                                                                                                                                                                     |
| Editor       | Touch Fader, Button and XY were composites with a Touch End; body picker rules ("no MIDI block in a body"); getter suggestions in Gamepad and Mouse blocks inside a zone. | **Single blocks.** Touch End, the body picker rules and the getter suggestions are gone; Mouse and Gamepad blocks are as on `stable` (6.2).                                                                                                                                                                                                        |
| Old lines    | —                                                                                                                                                                         | Lines with `function(self)` and their `end)` show as invalid blocks. The user deletes them and adds the zone again; no migration (6.5).                                                                                                                                                                                                            |
| Tests        | Many files pinning details of the design.                                                                                                                                 | **Trimmed to smoke tests:** the library in the Lua VM and the editor's parse, validate, autos and overlay, one test per thing a user would notice (6.4).                                                                                                                                                                                           |

## 0.2 What changed from revision 5 to revision 6

Revision 6 merges the loader as `feat/library-block` has it after the CTO meeting (user decisions, 2026-10-27), and `stable` with it.

| Area             | Rev 5                                                                           | Rev 6                                                                                                                                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Library file     | Plain Lua; `Z.VERSION` for reading only.                                        | Starts with `local LIB_NAME = "_Z"` and `local LIB_VERSION = "0.8.7"`, before any comment. The editor reads the global and the version from that header; `Z.VERSION` is gone. CI fails when a bundled library lacks it. The source moved to `src/content/libraries/zona.lua`.             |
| Where zona loads | Only the System Setup.                                                          | A Library block in **any element's Setup** (never in a function body). The System Setup stays the usual place, because it runs first.                                                                                                                                                     |
| Global           | Fixed by the bundled list in the reserved `_` + uppercase space.                | Read from the file's header (`_Z` for zona). No reserved names: a global is `_` plus a letter, then letters, digits or `_`.                                                                                                                                                               |
| Library line     | `_Z=require(p.."zona")`                                                         | `_Z=r("zona")` after a small guard (`pcall(require,…)`): a missing file prints `/00/zona.lua missing` and the rest of the Setup runs, so the module still accepts the config.                                                                                                             |
| Library warning  | From the System Setup only.                                                     | From every Library block that runs before Touch Start: the System Setup, Setups of lower-numbered elements, and blocks above Touch Start in the touch Setup. "Add a Library block that loads zona (_Z) above this block or in the System Setup".                                          |
| Versions         | None shown.                                                                     | The row shows the module file's version, and the bundled one when it differs. There's still no Update: a file on the module is never rewritten.                                                                                                                                           |
| Zone colour      | Only from Simple Color in the body, shown from the start through the start run. | A **`col` option** (`col="ff0000"`, 0.8.8), set in the zone block's LED section with the colour picker Simple Color uses and a hex field, and shown as a dot in the collapsed header. Without it the zone takes the module's default colour. Simple Color in the body still overrides it. |

## 0.3 What changed from revision 4 to revision 5

Revision 5 takes the Library block from `feat/library-block` as it is, and moves zona onto it (user decisions, 2026-10-26).

| Area             | Rev 4 (0.8.6)                                                                                          | Rev 5 (0.8.7)                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where zona loads | A Library line at the top of the touch Setup.                                                          | **The System element's Setup.** The module runs it before every other Setup of the page, so the touch Setup no longer holds the Library line (about 70 characters back). The picker offers the Library block only there.                                                                                                                                                                                                                  |
| Global           | `Z`, chosen on the Library row; the validator warned when no row before the zones bound `Z` to `zona`. | **`_Z`, fixed by the editor's list of bundled libraries** and read-only on the row. Globals starting with `_` and an uppercase letter are kept for bundled libraries, so user code doesn't overwrite them by accident (the aurora demo's `function Z(x,y)` did). Zone lines read `_Z.fader(…)`, `_Z.start(self)`, `_Z.tick(self,{})`. Old `Z.` lines show as Code blocks. This RFC still writes the library's API as `Z.…`, its own name. |
| Library warning  | On the Touch Start face, from the touch Setup.                                                         | On the Touch Start face, from the **System Setup**: "Add a Library block to the System Setup that loads zona (_Z)".                                                                                                                                                                                                                                                                                                                       |
| Versions         | `Z.VERSION` read back from the bound global; _older_ / _newer_ status, **Update** and **Reload**.      | **None.** The block shows _present_ or _missing_, with **Install** for a missing bundled file. A file that is already there is never rewritten. A breaking change ships under a new file name. To pick up a fix, the user deletes the file in the File Manager and presses Install. `Z.VERSION` stays in the file for reading only.                                                                                                       |
| Install          | Wrote the file and re-ran the block's own element's Setup, releasing the bound globals first.          | Writes the file, releases the bundled library's global (`g.unload(g)` if it has one, then `nil` and a full collection), and re-runs **every Setup of the page in page-load order** (System, then elements 0..n-1). It reports the first Setup that fails.                                                                                                                                                                                 |
| `unload`         | `Z.unload(self)` with the touch element.                                                               | `Z.unload()`: `Z.start(self)` remembers the touch element (`Z.te`), so the loader needs no element.                                                                                                                                                                                                                                                                                                                                       |
| Clash scan       | A text scan of the page's events for `Z=` and `function Z(`.                                           | Removed: the reserved `_` + uppercase names take its place.                                                                                                                                                                                                                                                                                                                                                                               |

## 0.4 What changed from revision 3 to revision 4

Revision 4 follows the owner review (section 14): fewer options, a frozen call shape, MIDI and LED feedback owned by the zone. The library went from 0.7.2 to 0.8.6 in six slices (S1–S6), breaking changes allowed before 1.0, with no migration of old lines.

| Area         | Rev 3 (0.7.2)                                                                                                                                     | Rev 4 (0.8.6)                                                                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blocks       | Fader, Button, XY, Knob, End, Group, Start, Tick, Utility.                                                                                        | **Fader, Button, XY, End, Start, Tick.** Touch Knob (D1), Touch Group and Touch Utility are removed. Old `zkn`, `zgr` and `zut` lines show as Code blocks.                                                                                                                                    |
| Outputs      | A default MIDI block in each zone body, with zone autos for `-1`. The zone answered `self:gms`, `gmrr`, `get_auto_value`, `get_auto_mode`, `ind`. | **The zone sends its own MIDI** from four options: `msg`, `ch`, `num`, `rx` (D3). No child block; the MIDI block is hidden in zone bodies. The body holds other blocks (LED, gamepad, mouse, keyboard, Code). The zone `self` keeps `v x y g d step glc glp` and gains `f`, `dx`, `dy` (4.1). |
| RX           | The MIDI block's Receive section (`gmrr`), indexed by a muted dry run of each body; NRPN decoded.                                                 | `rx=1` on the zone registers its own identity. 7-bit CC, 14-bit CC, notes and pitch bend; **no NRPN**, no dry run (4.8).                                                                                                                                                                      |
| Knob         | Angle reader, arc painter, `drag`.                                                                                                                | **Removed** (D1): the arc read poorly on 3×3 LEDs, and a fader or XY with `rel` covers the DAW-style knob.                                                                                                                                                                                    |
| Mapping mode | Utility press opens a window counted by the touch tick; one message stream per touch.                                                             | **Removed**, with Touch Utility. The 300 ms window was far too short in the feedback round, and the goals need to be set first. It may come back (4.7).                                                                                                                                       |
| Options      | 20, among them `read`, `contact`, `drag`, `leave`, `release`, `sens`, `db`, `sm`, `rt`, painter names for `led`.                                  | `dir res min max grab mode speed ease bmo group led col spring fingers msg ch num rx`. The rest is fixed by the kind or built in (4.3, 4.5).                                                                                                                                                  |
| Contacts     | `contact` decided how several contacts share a zone.                                                                                              | **The first contact owns a zone**; others are ignored until they lift. An XY takes up to `fingers` contacts, one finger number each (4.3).                                                                                                                                                    |
| Capture      | `leave` per zone.                                                                                                                                 | Fixed by kind: buttons release on slide-off, faders and XY clamp. `grab` (`focus`/`live`) stays.                                                                                                                                                                                              |
| Sensitivity  | `sens` presets, deadband, smoothing, rate limit as options.                                                                                       | Built in: deadband 2 raw units, no smoothing, rate limit "first change now, the rest on the tick" (4.5).                                                                                                                                                                                      |
| LEDs         | Painters `fill dot comet crosshair target arc`, `release` (`clear fade keep`); unlit cells at the colour minimum.                                 | `led` is on/off with **one look per kind** and three fixed levels: dark outside zones, a floor, bright while touched, a dim value marker after (4.5).                                                                                                                                         |
| Spring       | Not built.                                                                                                                                        | `spring=1` on Fader and XY: back to the centre on release, eased by `ease` (D2; 4.5).                                                                                                                                                                                                         |
| Multi-touch  | One value per zone.                                                                                                                               | `fingers` on XY (1–5): one state, one crosshair and one MIDI channel per finger, MPE style (D4, D5; 4.3).                                                                                                                                                                                     |
| Touch Tick   | `ms`, LED divider `led`, mapping window `win`.                                                                                                    | `ms` only.                                                                                                                                                                                                                                                                                    |
| Groups       | Touch Group block with `empty`.                                                                                                                   | The button's `group` option only; every member can be off.                                                                                                                                                                                                                                    |
| Budget       | About 95 Setup characters per zone, 140 with Receive; 7 mixed zones used 865 of 909.                                                              | About 61–65 per plain zone, `rx=1` costs 4. The same surface uses 589; about 12 plain zones fit (nine plain faders use 668) (5).                                                                                                                                                              |
| Library      | 18,065 bytes compressed.                                                                                                                          | 16,553 bytes; less Lua heap per zone (9).                                                                                                                                                                                                                                                     |

## 1. Summary

The user describes **zones** (faders, buttons, XY pads) on the 9×9 ZONA surface. Each zone is **one action block** on the touch element's Setup event, and **a zone is exactly its options**. They say how touch becomes a value (resolution, range, mode, capture, steps, spring, fingers) and what the zone sends: one **Output**, chosen on the block, which is MIDI (with channel, number and receive), Mouse or Gamepad. The library sends the output and draws the zone's LED feedback. A zone has no body.

A Lua library, `zona.lua`, lives in the page folder and is loaded as `_Z` by a generic **Library** action block in the System element's Setup. It does the work behind the blocks: touch routing, contact capture and fingers, value maths, MIDI, mouse and gamepad out, RX sync and LED drawing.

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
- **File system:** littlefs. Files are loaded with `require`. Page folders are hex (`/00/`, `/01/` …). Profiles save the top-level files of a page folder, and loading a profile clears that folder first (docs: _File Manager → File saving under profiles_). The documented way to load a page-local module:

  ```lua
  local pageHex = string.format("%02X", page_current())
  local M = require("/" .. pageHex .. "/testfile")
  ```

- **Page change restarts the Lua VM.** All Lua state is lost, including `package.loaded`. Encoder and button values survive because they live in C template buffers. Zone values do not.
- **Utility button:** the system element's utility event runs on press and holds `gpl(gpn())` (next page). There is no release event and no hold time (button elapsed time) on it today. Revision 3's mapping mode was designed around that (4.7, removed).
- **Element methods with autos** (grid-fw `simplemidi.lua`, `autovalue.lua`): every element gets Lua methods such as `self:gms(ch, cmd, p1, p2)` where `-1` means "auto". Autos come from the element and the running event (`midi_auto_ch`, `midi_auto_cmd`, `midi_auto_p1`, `midi_auto_p2`, `get_auto_value`, `get_auto_mode`). The MIDI block's default is `self:gms(-1,-1,-1,-1)`; Simple Color is `self:glc(-1,…) self:glp(-1,-1)`. These are plain Lua methods on a table, so any table that answers them can stand in for `self`. Zones answer none of them: they send their outputs from their options.
- **MIDI output:** the element method `self:gms(ch, cmd, p1, p2, mode)` takes a 5th `mode` argument (0 7-bit, 1 CC 14-bit, 2 NRPN, 3 NRPN 14-bit). The MIDI block uses it today. On firmware 1.5.5 the mode is handled in Lua (`simplemidi.lua`): mode 1 sends the MSB on `p1` and the LSB on `p1+32` (an auto `p1` is reduced `% 32`), modes 2/3 send NRPN 99/98/6(/38). The global C `gms` takes exactly 4 arguments and sends nothing with 5, so the library sends a 14-bit pair as two 4-argument `gms` calls itself.
- **Lua version:** firmware 1.5.5 runs Lua 5.5.0. In 5.5, for-loop control variables are read-only, so the library never assigns to one.
- **MIDI input:**
  - Each incoming voice message is passed to **every** element's `midirx_cb(self, header, event)` (`decode.lua`, `_decode_process`). `event` is `{ch, cmd, p1, p2}`. SysEx goes to `sysexrx_cb`, which the zone library does not set.
  - The RX Mode block (`grxm`) must have MIDI Voice enabled. It is on by default.
  - The MIDI block's "Receive MIDI" section appends `self:gmrr(-1, ch, cmd, p1, {value_sync, led_sync}, mode)` after the `gms`. On a real element it updates the value template and LED in firmware. Zones don't use it: `rx=1` registers the zone's identity in the library (4.8).

### 2.2 PR #1645 (virtual events) and this RFC

A virtual event is a top-level named Function block (`fst`/`fen`) on Setup, and it is shown as its own tab. All virtual events share Setup's 909 characters.

Rev 1 used virtual events for zone hooks. That does not scale, and per-zone event tabs would need a "virtual element" concept in the event panel. **Nothing in this RFC depends on virtual events.** A zone is one block in the action list, not a tab.

### 2.3 HANGAR

HANGAR's Sandbox (`src/lib/sandbox/`) proved the idea: regions on the 9×9 grid, one runtime, minified Lua packed across several events to fit the 909 limit. Its output is `--[[@cb]]` code that the editor can only show as raw code.

HANGAR is a throwaway prototype without code quality standards. **No HANGAR code is copied or adapted.** It is used only as a behaviour reference (which modes, painters and groups feel right). Everything in this RFC is written new and follows the editor's APIs and conventions. The packing scheme is not needed, because the library lives in a file.

## 3. Goals and non-goals

**Goals**

1. Each zone is one action block on the touch Setup, edited in the action list with grid-uikit controls.
2. **Few options, a frozen call shape.** `Z.<kind>(self,name,x,y,w,h,{opt})` stays fixed; anything new is a key in the options table, and defaults are left out of the line.
3. **The zone sends its own output** from its options: MIDI, Mouse or Gamepad, with working autos, so a new zone sends something sensible with no edits.
4. One shared zone library, installed by the editor into the page folder, and loaded by a generic **Library** block, usually in the System Setup, that VSN1 can reuse.
5. **Resolution** from 7-bit up to 14-bit, set on the zone like `pmo` on a potentiometer.
6. **Capture per zone:** **focus mode** (the contact stays in its zone) or **live mode** (swipe across zones).
7. **One LED look per kind**, readable on the 9×9 LEDs, with the value always visible.
8. **Spring** (pitch bend, joystick) and **several fingers** on an XY pad, as options.
9. **MIDI RX sync** for a zone's own identity.
10. Zones drawn on the ZONA module in the **control name overlay**.
11. Profiles, presets, copy and paste and the unsaved-changes markers work with no new mechanism.

**Stretch goals** (section 11): state that survives page changes, an interactive surface editor, zone-scoped event navigation, cross-zone rules such as overlap, Profile Cloud thumbnails.

**Non-goals (for now)**

- A browser preview that runs Lua.
- Pressure. When firmware adds it, it arrives as an extra `touch_cb` argument. Nothing is designed for it now.
- Keyboard output, tap-and-drag, two-finger scroll and two-finger right click (later passes, 4.1).
- Mapping mode and a utility button block (removed in revision 4, 4.7).
- Touch calibration, deadband or jitter tuning in the library (user decision after the feedback round, 13).
- Importing HANGAR catalog entries.
- Firmware changes. The design works on current firmware.

## 4. Core concepts

### 4.1 A zone is its options

```
contact → finger → capture → position → read → value(s) ──→ output (MIDI, Mouse or Gamepad, from the options)
                                                     └──→ paint (on the tick)
```

A zone block is the zone's options, the way a real element is configured by its settings blocks (Encoder Mode, Button Mode, Potmeter Mode) and the MIDI block in its event. The zone has no body: nothing else runs when it changes.

In Lua, a zone is one line. The first argument is the touch element, `self` in Setup:

```lua
--[[@zfd]]_Z.fader(self,"f1",0,0,1,9,{res=10})
```

**When it runs.** A zone runs on press, on a value change and on release, and each run sends its output. A value run sends the source that changed (`v`, or `x`/`y` on an XY pad); a press or release run sends all of the zone's sources. MIDI and gamepad sends go through a **duplicate filter** per source (per finger on an XY), which holds the last value on the wire and is cleared on each press: a press re-sends the current value, and a release that changes nothing sends nothing. On a button the filter is cleared only when the step changes. Mouse outputs work by movement instead (below).

**Output.** One output per zone, the `msg` option, shown on the face as a select titled **Output**:

| Kind   | Values (titles)                                                           | Default |
| ------ | ------------------------------------------------------------------------- | ------- |
| fader  | `cc` (CC), `pb` (Pitch bend), `mouse` (Mouse wheel), `pad` (Gamepad axis) | `cc`    |
| button | `note` (Note), `cc` (CC), `mouse` (Mouse button), `pad` (Gamepad button)  | `note`  |
| xy     | `cc` (CC), `mouse` (Mouse), `pad` (Gamepad)                               | `cc`    |

Each output reads only its own options, and the face shows only those (6.2). The library ignores the others. Every output keeps `led`, `col`, the geometry, the button mode and the capture.

**MIDI options:**

| Option | Values                                                                                      | Default |
| ------ | ------------------------------------------------------------------------------------------- | ------- |
| `ch`   | `-1` auto, `0`–`15`                                                                         | `-1`    |
| `num`  | `-1` auto, `0`–`127`; the CC or note number; XY: x on `num`, y on `num+1`; not used by `pb` | `-1`    |
| `rx`   | `0`/`1`: value sync from host MIDI on the zone's own identity (4.8)                         | `0`     |

**MIDI wire format.**

- `note`: note on with the value scaled to 0–127 when the range is wider; value 0 is the note off (velocity 0).
- `cc`: 7-bit when `res` is 7; a 14-bit pair when `res > 7`, MSB on `num` and LSB on `num+32`. A 7-bit CC from a wide `min`/`max` range is scaled to 0–127.
- `pb`: pitch bend, always 14-bit (the zone runs as `res=14`), sent as `gms(ch,224,lsb,msb)`; the centre is 8192.

**MIDI autos**, as an element's:

- channel: `(gmy()*4+gpc())%16`;
- number: `(32 + gmx()*16 + slot) % 128`, reduced `% 32` for a 14-bit pair. Slots are counted over the zones defined before it: an XY pad takes 2, every other zone 1, whatever its `msg`. The y number is the next one, wrapped the same way.

Explicit values are used as given. The editor keeps them valid (6.2): a 14-bit CC `num` is 0–31 (XY 0–30), so the LSB stays below 64; a 7-bit XY `num` is 0–126; a zone that sends MIDI keeps `min`/`max` in 0–16383.

**Mouse** (`msg="mouse"`). Only finger 1 counts; `fingers`, `spring`, `mode`, `ease`, `res`, `min`, `max`, `ch` and `rx` don't apply.

- **XY: a trackpad.** The pointer moves by the finger's movement, one step per sensor unit (1024 across the surface) times `speed`: `gmms(1, dx)` and `gmms(2, dy)`. The sensor's y grows downwards, like the pointer's. A press only sets the start point, and nothing is sent on release.
- **Fader: the wheel.** The drag scrolls the wheel, one step per 32 sensor units times `speed`, with `gmms(3, step)`. Moving towards the fader's max sends positive steps.
- **Sending.** Moves are summed per zone and sent once per tick, each axis as whole steps, clamped to −127…127. The fraction stays in the sum; a bigger move is cut, so the pointer stops with the finger.
- **Button.** `gmbs(num, 1)` on touch and `gmbs(num, 0)` on lift. `num` is the button: 1 Left (the default, also for `-1`), 2 Right, 4 Middle; there is no auto. Button mode 1 (toggle) is a **drag lock**: press on the first touch, release on the next. A higher button mode acts as a toggle. Leaving the zone, a radio group member turning on, a Setup re-run and `Z.unload` release a held button.
- **Tap to click** (`tap`, XY, default 1). A short touch on a Mouse XY that barely moves sends a left click on lift: `gmbs(1,1)`, then `gmbs(1,0)` on the second Touch Tick after it, so the press is held for a whole tick (a release in the same scan never reaches the computer). The tap counts if it is shorter than 200 ms, counted in Touch Tick intervals, and less than 30 sensor units of travel, x and y added up along the path. The thresholds are constants in the library, with no settings. A double tap is a double click by the computer's own timing. A contact that slid in under `grab="live"` never taps, and a tap doesn't click while a Mouse button zone holds left, so a drag lock stays. `tap=0` turns it off.
- Tap-and-drag, two-finger scroll and a two-finger tap for right click are left for later. A Mouse button zone set to Toggle or Right, and a Mouse fader next to the pad, cover dragging, right click and scrolling.

**Gamepad** (`msg="pad"`). Only finger 1 counts; `fingers`, `res`, `min`, `max`, `ch` and `rx` don't apply.

- **Fader and XY: axes over the full range.** The travel maps onto −128…127, centred on 0, and goes out as `ggms(axis, pos)`. An XY sends x on `num` and y on `num+1`. Mode, Spring, glide and Capture apply as on a MIDI zone: an XY with `spring=1` is a joystick, and the centre is 0.
- **Button.** `ggbs(button, 1)` on any step but the first, `ggbs(button, 0)` on it. It follows the button mode and radio groups like a note.
- **Autos in Setup order**, like the CC autos. `num` is the axis (0–5: X, Y, Z, RX, RY, RZ) or the button (0–31). An auto counts the gamepad zones defined before it: axes (a fader takes 1, an XY 2) and buttons separately, whatever `num` they set. So the first gamepad fader is X, the next Y, an XY after them takes Z and RX, and buttons count from 0.

**Kinds** decide how the position is read and what the zone sends by default:

| Kind   | Reader  | Sources            | Default `msg` | LED look  |
| ------ | ------- | ------------------ | ------------- | --------- |
| fader  | `axis`  | `v`                | `cc`          | fill      |
| button | `gate`  | the step value `v` | `note`        | state     |
| xy     | `point` | `x`, `y`           | `cc`          | crosshair |

The reader is fixed by the kind; it is not an option (a `read=` key in a line is ignored).

### 4.2 Values and resolution

Resolution belongs to the **zone value**, set in the zone block's options. This follows the potentiometer settings (`pmo` resolution bits, `pmi`/`pma` range), so users meet the same idea twice.

- `res` sets the number of steps (2^res), from 7 to 14 bits (default 7), inside the value range `[min, max]`.
- `min` and `max` default to the wire range: 0–127 for `res=7`, 0–16383 for any `res > 7`. So `res=10` gives 1024 values spread across 0–16383, and a 14-bit receiver sees full scale.
- A CC follows `res`: 7-bit at 7, a 14-bit pair above. A note is always 7-bit. Pitch bend is always 14-bit, whatever `res` says. A 7-bit CC with more than 7 bits of resolution isn't an option; use `res=7` or a Code block with `gms`.
- Resolution, `min` and `max` belong to the MIDI outputs. A gamepad zone always uses −128…127 (4.1), and a mouse zone sends movement, not a value.

**What higher resolution really gives.** The sensor reports 10 bits across the whole surface. The first zone of a Setup sets `self:txma(1023)` and `self:tyma(1023)` so the library always gets the full range. A zone gets its share of those 1024 positions: a full-width fader has about 1024, a 3-cell fader about 341 (≈8.4 bits). A 7-bit `res` is therefore always real; above the zone's share, a higher `res` only interpolates, and finer control comes from `glide` and `rel` with `speed < 1`. `Z.has.sres` holds the sensor bits (10) for a positions hint on the block face, which isn't built yet.

### 4.3 Contacts, fingers and capture

**The first contact owns a zone.** A contact that lands on a zone another contact holds (or, for `grab="live"`, moves into one) is ignored until it lifts, even if it later moves over a free zone. A zone is held by at most one contact, except an XY with `fingers > 1`.

**Fingers** (S5, XY only): `fingers` is 1–5, default 1.

- A contact landing in an XY with fewer than `fingers` held contacts gets the **lowest free finger number** and keeps it until it lifts. More contacts are ignored until they lift. A live contact sliding in takes a finger the same way.
- Each finger has its own position and value state (values, glide target, spring, rate limit, duplicate filter). Finger 1 is the zone itself; the state of fingers 2–5 is made on their first touch and kept for re-use until the next Setup run.
- MIDI is **MPE style**: finger k sends the zone's CC numbers (and 14-bit pairs) on channel `(ch + k − 1) % 16`. Channels of different zones can overlap; nothing checks that, and the face shows the range ("CC 32, 33 ch 1–3").
- RX syncs finger 1 only (4.8).
- Mouse and Gamepad zones use finger 1 only; the library sets `fingers=1` for them (4.1).

**Capture.** Each zone sets `grab`:

| `grab`  | Owner                                               | Leaving the zone                                                                                                                                                                                | Use                                                            |
| ------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `focus` | the zone where the contact landed, until lift       | Fader and XY: the position **clamps to the zone's edge**, so value and LEDs stay at the boundary. Button: leaving releases it, and the contact is ignored until it lifts (slide off to cancel). | Default for every kind.                                        |
| `live`  | whichever `live` zone is under the finger right now | Leaving releases this zone. Entering another `live` zone presses it at the entry position (`abs` read, whatever its mode).                                                                      | Performance: drag across several faders to pull them all down. |

Rules:

- A contact owned by a `focus` zone never reaches another zone, even if it passes over a `live` zone.
- A contact that lands on an empty cell is not owned. If it moves into a `live` zone, that zone picks it up. `focus` zones only take contacts that land inside them.
- Clamping applies to the **position** before the reader runs, so it works the same way for every kind.

### 4.4 Knob (removed)

Revision 3 had a Touch Knob after TouchOSC's Radial: an angle reader, an arc painter on the zone's outer ring, and `drag` for a DAW-style straight drag. Revision 4 removes it (D1). On 3×3 LEDs the arc read poorly and the top of the range needed a finger outside the arc, and the angle needed a careful circle. A fader or XY with `mode="rel"` covers the DAW-style knob. Old `zkn` lines show as Code blocks.

### 4.5 Shared stages

- **Mode** (`mode`, fader and XY): `abs` (jump), `rel` (drag delta × `speed`), `glide` (move toward the finger with `speed` and `ease`).
- **Approach:** one tick-driven "move value toward target" function. Glide and an eased spring use it: each tick takes `ease` × the remaining distance plus `speed/50` of the range, and it lands exactly on the target. Glide `speed` is per tick, so glide time scales with the Touch Tick interval.
- **Deadband and rate limit** (built in): a move of 2 raw units or less is dropped; there is no smoothing. A source's first change in a tick runs at once; further changes in the same tick wait, and the last one goes out on the next tick or at lift. Nothing is held before the first tick.
- **Spring** (`spring`, fader and XY, S4): `spring=1` makes the zone rest at the centre (q 0.5 per axis: 64 at 7 bits, 8192 for pitch bend; an odd range takes the grid step just above the middle, 0–99 gives 50), with nothing sent at start. On release it goes back to the centre through the normal path (output, LEDs): at once with `ease=0` (one value per axis), eased on the tick with `ease > 0`. A touch during the return takes over at once (abs jumps, rel continues from the current value, glide aims from it). RX and `Z.set` put the value where they say, and the spring acts again after the next touch. A fader with `msg="pb", spring=1` is a pitch bend wheel; an XY with `spring=1` is a joystick, centred on 0 with `msg="pad"`. Mouse zones have no spring.
- **Steps:** the same meaning as Grid's button mode `bmo` (0 momentary, 1 toggle, n = n+1 steps), with the same step maths (`SettingsButton.calculateStepValuesFirmwareStyle`), so a zone cycles through the values the Button Mode block shows. The firmware's own stepping (`grid_ui_button.c`) has more states when `floor(range/bmo)*(bmo+1) <= range` (bmo=16 on 0–127: 19, not 17); that mismatch is an editor issue of its own.
- **Groups:** `group` 1–8 on buttons makes radio groups. A press that turns a member on turns the others off first (they send their "off" value; a Mouse button releases). Every member can be off.
- **LEDs** (`led`, S3): `led=1` (default) draws one look per kind; `led=0` leaves the zone's cells dark once the zones are live, and only user code paints them.
  - Three fixed levels, in phase units: floor 16, dim 110, top 255. They are constants in the library, not options, and nothing tunes them.
  - Cells no zone covers are off: a black curve at phase 0. The zone's colour curve gets a black minimum, so low phases are a faint tint of the zone colour.
  - Every zone cell is at least `floor`. Lit cells are at `top` while a contact holds the zone and at `dim` otherwise (after release, RX, `Z.set`). Nothing fades, so an absolute control keeps showing its value.
  - Fader: a fill from the min end with a partial edge cell. Button: off at the floor, on lit, steps in between. XY: a soft crosshair (row and column at half, the crossing full), normalised so its brightest cell is always at the lit level wherever the value is between cell centres. With several fingers: one crosshair per held finger at `top`, the highest level per cell; with none held, finger 1's at `dim`.
  - Mouse XY and Mouse fader: while held, the crosshair or fill follows the finger at `top`; after release the zone is at the floor, since it has no value to show. A Mouse button shows pressed and released like a MIDI button. Gamepad zones show their values like MIDI zones.
  - Colour: `col="rrggbb"` (hex) sets the zone's colour from the first paint; without it, or with text that isn't hex, the zone takes the module's default colour. It goes through the firmware's `color_curve` (`simplecolor.lua`), so a zone shows the same colours as an element. The colour is fixed per zone; Simple Color and Simple Intensity don't reach zones.
  - Only changed cells are sent. LEDs repaint from `Z.tick` only, for zones marked dirty, so the editor adds Touch Tick together with the first zone. Overlapping zones: the last zone painting a cell owns it.

### 4.6 Custom logic

A zone has no hook for custom logic: it has no body, and the library runs no user code when it changes. Its output covers MIDI, Mouse and Gamepad.

- Custom per-zone logic may come back later as an Output of its own, without changing the call shape.
- Until then, user code reads nothing from zones. It can set a zone's value with `Z.set(name, value, src)` (4.8), and it can send anything from a Code block elsewhere (a `midirx_cb`, a timer), as on any element.

### 4.7 Mapping mode (removed)

Revision 3 had a mapping mode for DAW MIDI learn: a Touch Utility block replaced `gpl(gpn())` on the utility event, a press opened a 300 ms window counted by the touch tick, and a touch in the window let exactly one message stream out. Revision 4 removes it with Touch Utility and the Touch Tick window option. In the feedback round the window was far too short, and the goals need to be clarified before it is designed again. It may come back.

### 4.8 MIDI RX sync

`rx=1` makes a zone follow host MIDI on its own identity (S2).

**Registration.** When the zones go live, the library registers the identities the zone sends: each source's channel, command and number from the options and autos, both CCs of a 14-bit pair, and pitch bend on its channel. Mouse and Gamepad zones register nothing; the face hides Receive MIDI for them. On an XY with fingers only finger 1's channel is registered.

**Handling a message:**

- The library sets `self.midirx_cb` on the touch element **only if** some zone has `rx=1`. With none, incoming MIDI costs nothing.
- Only host MIDI is used (header 13, as the firmware's `gmrr`). An unmatched message costs one table lookup on a numeric key.
- Decoded: 7-bit CC and notes (note off and velocity 0 are 0; on a button the nearest step wins), 14-bit CC (MSB applied at once and refined by the LSB), and pitch bend (LSB, MSB). A 7-bit message into a wide range is scaled up. NRPN is not decoded.
- **Value sync** sets the zone value and ends a glide; it marks the zone dirty, so its LEDs follow on the next tick at `dim`. It sends no MIDI, so there is no echo, and it updates the duplicate filter, so moving back to the previously sent value is not dropped.
- **Touch wins:** RX for a zone is ignored while any contact (any finger) holds it.
- **Toggles, steps and groups:** an incoming "on" for a group member makes it the active member, with no output.
- **SysEx is an advanced concept, left to user code.** The library doesn't set `sysexrx_cb` or `eventrx_cb`, so they stay free: a user who needs SysEx sets `self.sysexrx_cb` in a Code block on Setup, as on any element, and can update zones from it with `Z.set(name, value, src)`, the same path value sync uses, including "touch wins". If a common SysEx use shows up later, it can become an opt-in library feature that chains the user's callback the same way `midirx_cb` does.
- If the user's own Setup code assigns `self.midirx_cb`, the library calls it after its own handling. The zones go live after Setup has run, so this holds wherever the code sits.
- The firmware keeps an element's callbacks when a new config is sent to RAM. A `midirx_cb` left by the previous Setup (seen on hardware when a page switched from hand-written code to zones) therefore looks like the user's own and is chained until the page reloads. The library drops it from the second run on, because it then finds `Z.rx`. Accepted (10).

## 5. Device layout

```lua
-- system element, Setup (runs before every other Setup of the page)
--[[@lib]]local p=string.format("/%02X/",gpc())local function r(n)local ok,m=pcall(require,p..n)if ok then return m end print(p..n..".lua missing")end _Z=r("zona")

-- touch element, Setup (must stay under 909 characters)
--[[@zfd]]_Z.fader(self,"f1",0,0,1,9,{res=10,rx=1})   -- the first zone takes the element: touch_cb, sensor range, timer kick
--[[@zfd]]_Z.fader(self,"f2",1,0,1,9,{spring=1,msg="pb"})
--[[@zbt]]_Z.button(self,"b1",2,0,2,2,{bmo=1,group=1,col="ff0000"})
--[[@zxy]]_Z.xy(self,"p1",4,0,5,5,{msg="mouse"})
--[[@zbt]]_Z.button(self,"b2",4,5,2,2,{msg="mouse",num=2})

-- touch element, Timer
--[[@ztk]]_Z.tick(self,{})   -- the first tick makes the zones live (RX, midirx_cb, first paint); then glide, spring, rate-limit flush, LEDs; re-arms the timer. The default ms=20 is left out

-- file system (page 00)
/00/zona.lua            -- the library, a copy per page
```

**Global name.** Touch blocks always write `_Z.`, the global zona's header declares. The first zone's face warns when no Library block that runs before it loads `_Z`.

**Timer.** `gtt` is one-shot: the firmware counts the element's timer down once and fires the Timer event (v1.5.5 `grid_ui.c`), and a page change resets it. The library therefore owns it: the first zone of a Setup run kicks it once (`gtt(self:ind(),1)`), and `Z.tick` re-arms it with `cfg.ms` (default 20) at the start of every tick, so an error in a tick can't stop it. The interval lives only in the Touch Tick block.

**Setup budget.** A zone is one line. With the `--[[@…]] ` marker it costs **38–42 characters as a plain zone** (XY 38, fader 41, button 42), more with options: `msg="mouse"` adds 11, `rx=1` 4 or 5. Nothing else in the touch Setup is needed. The Library block sits in the System Setup and costs the touch Setup nothing.

- 7 plain zones (three faders, three buttons, an XY) use **about 287 of 909** characters (measured as 305 with revision 7's Touch Start and `nil)` lines, less 25, plus 7);
- so **about 21 plain faders** fit (names from `f10` on cost one more; a 22nd would need about 915), fewer with options.

Section 8 covers growing past it. A factory-fresh ZONA's touch Setup holds a 642-character demo Code block that has to go first, and its touch Timer holds a `print` that floods the debug log once Touch Tick runs.

## 6. Concerns by code area

### 6.1 Generic Library block

The Library block comes from `feat/library-block` (PR #1669) and is not specific to ZONA: VSN1 libraries use it too. It loads Lua modules from the **current page folder** into globals.

| Short | Name    | Event                           | Category |
| ----- | ------- | ------------------------------- | -------- |
| `lib` | Library | any element's Setup (top level) | `code`   |

**Lua form.** One canonical line that the parser reads back exactly:

```lua
local p=string.format("/%02X/",gpc())local function r(n)local ok,m=pcall(require,p..n)if ok then return m end print(p..n..".lua missing")end _Z=r("zona") _Mine=r("mine")
```

- The editor writes one space before each row; the guard costs about 75 characters once per block.
- `gpc()` is `page_current()`, so the same block works on any page and in any profile.
- **Where.** Any element's Setup, never a function body. At a page load the firmware runs the System Setup first, then the elements 0..n-1 (`grid_lua.c` post_init), so a block in the System Setup serves every element. A global that an earlier block of the page already loads is marked on the later one (only among the Setups the editor has loaded).
- **Libraries and headers.** Every library starts with `local LIB_NAME = "_Name"` and `local LIB_VERSION = "x.y.z"`. A row is a combo of the bundled libraries (zona first on this branch, then the test library) and the page folder's `.lua` files with a valid header; the editor reads the first 150 bytes of each. The row's global comes from the module file's header, or the bundled copy's when the file isn't there yet. A mismatch is an error on the row, fixed by picking the file again; the editor never rewrites a profile on its own.
- **Status.** With a module connected, each row shows the module file's version (and the bundled one when it differs) or _missing_, with **Install** for a missing bundled file. A missing file the editor has no copy of is an error on the row and in the editor log. A missing page folder counts as missing, and Install creates it. Offline and virtual modules show no status.
- **Install** writes `compressScript(source)` with `writeFileContent`, calls `invalidateLuaModule("/PP/<file>")` (the full `require` key), releases the library's global (its `unload` if it has one, called as `g.unload(g)`, then `nil` and a full collection, all before the new copy compiles), and runs every Setup of the page again in page-load order. The config is not marked as changed and nothing is stored. Every Setup's side effects repeat, as on a page load. The first Setup that fails is reported with its element.
- **No Update.** A file that is already there is never rewritten. A library whose API changes ships under a new file name. To pick up a fix, the user deletes the file in the File Manager and presses Install, and the release step keeps the old copy from being held in RAM while the new one compiles.
- On the module, a missing file prints `/PP/<file>.lua missing` and leaves its global `nil`; the rest of the Setup runs. An unguarded `require` stopped the Setup, the module never acked the config, and the editor sent it again and again (seen on an EN16). The zones then fail on their first `_Z.` call with the global missing, which the debug log shows.

The library itself sets nothing up beyond returning its table. Library-specific setup (`touch_cb`, `midirx_cb`) is the job of that library's own blocks, here the zone lines. A library that sets callbacks exports `unload()` and remembers where it set them: zona keeps the touch element the first zone passed in `Z.te`.

### 6.2 Touch action blocks and the zone model

**Blocks** in `src/renderer/config-blocks/`, category **`touch`** (an entry in `ActionBlockInformation.category`, `categoryColors.ts`, and a `--category-touch` CSS variable):

| Short | Name         | Event       | Type   | Notes                                   |
| ----- | ------------ | ----------- | ------ | --------------------------------------- |
| `zfd` | Touch Fader  | touch Setup | single | kind preset `read="axis"`, `msg="cc"`   |
| `zbt` | Touch Button | touch Setup | single | kind preset `read="gate"`, `msg="note"` |
| `zxy` | Touch XY Pad | touch Setup | single | kind preset `read="point"`, `msg="cc"`  |
| `ztk` | Touch Tick   | touch Timer | single | `Z.tick(self,{ms=…})`, interval only    |

There is no Touch End block. Revision 3's `zkn` (Touch Knob), `zgr` (Touch Group) and `zut` (Touch Utility) are removed; such lines show as Code blocks.

A zone block is one line, `_Z.<kind>(self,…)`. It comes from an optional `defaultLuaIn(scripts)` on the block information, so the picker gives the next free name (`f1`, `b2`, `p1` …) for the event it inserts into.

- **Unknown values stay visible.** An enum value the editor doesn't know (a newer library's `msg`) is shown as "value (unknown)" with the validator's message, and the face shows every field for it; opening a face never writes. Options the editor doesn't know at all are kept in the line as they are (`Zone.unknown`). A known option with a value of the wrong type (a 0.7.x `led="fill"`) makes the line show as code.
- **Module type.** Touch blocks declare `moduleTypes: [ZONA]`, so the picker doesn't offer them on other modules.
- **Duplicate zone names start a new run.** If the Setup runs again before a tick or touch made the last run live (no Touch Tick on the Timer, and no touch since), the library treats a zone name that is already pending as the start of a new run and drops the pending ones. The flip side: a duplicate name inside one Setup (a pasted zone block keeps its name) drops the zones before it. The editor therefore renames pasted or duplicated zones (paste, snippet insert and drag-drop give a taken name the next free name of its kind) and treats a duplicate name as an error that stops the send. Other per-zone problems (an unknown value from a newer library, an out-of-range value) show on the face but don't block a Setup loaded from the module or a profile; the face itself never sends an invalid edit.
- **Companions.** The first zone added from the picker also adds Touch Tick on the Timer when missing. The first zone's face shows the library warning.
- **Removing the last zone** leaves the previous surface running until the page reloads: no zone line runs to drop it. Accepted.

**Module layout** (`src/renderer/config-blocks/touch/`):

| File                                         | Holds                                                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `zone-model.ts`                              | `Zone`, `ZoneKind`, kind presets, defaults, the option schema with its face sections and the outputs each option is hidden for                                                        |
| `zone-parse.ts`                              | `parseZone(script)`, `zoneToLua(zone)` for the zone line, `parseZoneTick` / `zoneTickToLua` (the Library line lives in `lib/library.ts`: `parseLibraryScript` / `libraryScriptToLua`) |
| `zone-library.ts`                            | `libraryIssue`: the first zone's warning when no Library block that runs before it loads `_Z` (`globalsLoadedBefore` in `lib/library.ts`)                                             |
| `zone-validate.ts`                           | validators (below)                                                                                                                                                                    |
| `zone-autos.ts`                              | the TS copy of the library's MIDI identity and gamepad autos (`zoneMidi`), and what the zone sends as text (`zoneOutputLabel`, `zoneMidiLabel`)                                       |
| `zone-blocks.ts`, `zone-block-info.ts`       | block shorts, default names and cells, face sections, titles, suggestions, block information                                                                                          |
| `ZoneBlock.svelte`, `ZoneOptionField.svelte` | one face for the three kinds, rendered from the schema; `config-blocks/headers/ZoneFace.svelte` is the untoggled header                                                               |

```ts
type ZoneKind = "fader" | "button" | "xy";

type Zone = {
  name: string;
  kind: ZoneKind;
  x: number;
  y: number;
  w: number;
  h: number; // cells, 0-based
  opt: Record<string, ZoneOptionValue>; // only non-defaults are written
  unknown?: string; // options this editor doesn't know, kept as-is
};
```

The output is the `msg` option; the model has nothing else for it.

**Options, defaults and face sections** (`zone-model.ts`, equal to `Z.def` and `Z.kind` in the library; a test checks they match):

| Section           | Option         | Kinds     | Default                     | Range                                                                                              | Hidden for         |
| ----------------- | -------------- | --------- | --------------------------- | -------------------------------------------------------------------------------------------------- | ------------------ |
| Geometry (open)   | `x y w h`      | all       | —                           | inside 9×9                                                                                         |                    |
|                   | `dir`          | fader     | `v`                         | `v`, `h`                                                                                           |                    |
| Output (open)     | `msg`          | all       | per kind                    | the kind's values (4.1)                                                                            |                    |
|                   | `tap`          | xy        | 1                           | 0–1                                                                                                | all but Mouse      |
|                   | `ch`           | all       | `-1` (auto)                 | −1–15                                                                                              | Mouse, Gamepad     |
|                   | `num`          | all       | `-1` (auto)                 | −1–127 (and the limits in 4.1); Gamepad: axes 0–5 (XY 0–4), buttons 0–31; Mouse button: the button | Mouse fader and XY |
|                   | `rx`           | all       | `0`                         | 0–1                                                                                                | Mouse, Gamepad     |
| Resolution (open) | `res`          | all       | 7                           | 7–14                                                                                               | Mouse, Gamepad     |
|                   | `min`, `max`   | all       | 0, 127 or 16383 by `res`    | `min < max`; 0–16383 when the zone sends MIDI                                                      | Mouse, Gamepad     |
| LED (open)        | `led`          | all       | 1                           | 0–1                                                                                                |                    |
|                   | `col`          | all       | the module's default colour | `rrggbb` hex; picker and hex field on the face                                                     |                    |
| Behaviour         | `mode`, `ease` | fader, xy | `abs`, 0                    | modes; 0–1                                                                                         | Mouse              |
|                   | `speed`        | fader, xy | 1                           | 0.01–10                                                                                            |                    |
|                   | `spring`       | fader, xy | 0                           | 0–1                                                                                                | Mouse              |
|                   | `bmo`, `group` | button    | 0, 0                        | 0–127; 0–8                                                                                         |                    |
| Capture           | `grab`         | all       | `focus`                     | `focus`, `live`                                                                                    |                    |
|                   | `fingers`      | xy        | 1                           | 1–5                                                                                                | Mouse, Gamepad     |

`spring` on a button and `fingers` on a fader or button are errors, because the library ignores them there.

**Fields per output.** Every output shows the geometry, `led`, `col`, the button mode and group, and `grab`. Besides those:

| Output                      | Fader                                                                      | Button                                                  | XY                                                 |
| --------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| MIDI (CC, Note, Pitch bend) | Channel, CC, Receive MIDI, Resolution, Min, Max, Mode, Speed, Ease, Spring | Channel, Note or CC, Receive MIDI, Resolution, Min, Max | as the fader, plus Fingers                         |
| Mouse                       | Speed (the wheel)                                                          | Button                                                  | Tap to click, Speed                                |
| Gamepad                     | Axis, Mode, Speed, Ease, Spring                                            | Button                                                  | Axis (x; y on the next), Mode, Speed, Ease, Spring |

**Validators** (`zone-validate.ts`). They follow `config-blocks/validators.ts`: an invalid value keeps the last valid one and shows an inline message.

- **Per zone:** inside 9×9, `w,h ≥ 1`; the name is a Lua identifier and not a `GridScript.validator.lookup` name (it sits in a string that `compressScript` would rewrite, 2.1); `msg` against the kind's values; each option the zone's output shows against the table above, and nothing else, because the library ignores the rest; `min < max`, with pitch bend counted as 14-bit; `min`/`max` in 0–16383 when `msg` is a MIDI output; an explicit `num` that keeps every number on the wire in range (14-bit CC 0–31, XY 0–30; 7-bit XY 0–126; a gamepad axis 0–5, an XY 0–4, a gamepad button 0–31).
- **Per surface:** `(zones: Zone[]) => ZoneIssue[]`, run on the whole touch Setup:
  - duplicate zone names (error);
  - **overlap**, the same MIDI identity in two zones and gamepad autos past the last axis or button: not checked yet (section 11).
- An issue points at a zone name. The block face and the overlay both show it.

**Picker filtering.** A declarative field on the block information:

```ts
// ActionBlockInformation additions
elementTypes?: ElementType[];   // where this block may be added; undefined = everywhere
eventTypes?: EventType[];
moduleTypes?: ModuleType[];
```

A block that declares `elementTypes` or `eventTypes` is placed at the top level of a real event. The picker does not offer it in virtual-event tabs, which are function bodies (a `require` there would only run when the function is called).

**UI rules:**

- grid-uikit controls only, the same as `SettingsButton.svelte`.
- The face shows Geometry, Output, Resolution and LED open, with Behaviour and Capture collapsed. A section with no field for the zone's output isn't shown.
- An enum is a select of its values with titles, and the kind's default is selected when the line leaves the option out. There is no separate "default" entry; picking the default writes nothing. The **Output** select titles its values by kind (4.1): CC, Note, Pitch bend, Mouse wheel / Mouse button / Mouse, Gamepad axis / Gamepad button / Gamepad.
- A number option is a combo with suggestions, like the MIDI block's. Channel lists Auto and channels 1–16. The number field is titled by the output: **CC** or **Note** with Auto and the CC names or the notes (no list for pitch bend); **Button** for a Mouse button, with Left 1, Right 2, Middle 4 and no Auto; **Axis** or **Button** for Gamepad, with Auto and X Axis…RZ Axis or Button 0…31. Resolution bits list 7–14 with their ranges, Max offers 127 and 16383, and 0/1 options (`rx` as "Receive MIDI", `tap` as "Tap to click", `led`, `spring`) offer Off and On. Fields without suggestions show their range in the title.
- The Output section's `ch` and `num` placeholders and Auto suggestions show the resolved autos ("auto (ch 1)", "Auto (33)", "auto (X)", "Auto (Y Axis)"), computed by `zone-autos.ts`, a TypeScript copy of the library's identity rules checked against the library in the Lua VM tests. A Mouse button's placeholder is "1 (Left)". The section ends with what the zone sends.
- The untoggled header shows the name, the cells and what the zone sends: `f1 · 0,0 1×9 · CC 32 ch 1`, `CC 1/33 ch 1` (14-bit), `CC 34, 35 ch 1` (XY), `CC 32, 33 ch 1–3` (fingers), `Note 36 ch 1`, `PB ch 1`, `Mouse`, `Mouse wheel`, `Mouse Left`, `Gamepad X`, `Gamepad Y, Z`, `Gamepad button 0`, `no MIDI`. The channel is 1-based, like the MIDI block's. The zone autos use `(gmy()*4+gpc())%16` for the channel, like the library, not the page's `midi_auto_ch` override (by decision, section 10).
- Mouse and Gamepad action blocks are the same as on `stable`; they have nothing for zones.

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

- It draws a rectangle per zone, with its name and kind icon, a group badge, an issue outline, and a highlight for the zone whose block is in `selected_actions`.
- **v1 doesn't write.** Clicking a zone may select its block; that only sets the existing selection store. Drag-to-create, move and resize are stretch goals.

### 6.4 The library file

**Source and versions**

- In the repo: `src/content/libraries/zona.lua`, starting with the `LIB_NAME` / `LIB_VERSION` header the editor reads (6.1).
  - Before 1.0 breaking changes come in 0.x versions, with no migration of old lines.
  - From 1.0 a breaking change ships under a new file name, so pages that hold the old file keep working, and the editor keeps the blocks for every file it ever shipped.
- Uploaded the way the File Manager saves `.lua` files: `GridScript.compressScript(source)`, which minifies and **keeps comments** (2.1). Opened in the File Manager, it shows expanded, like any other page file. No upload transform of its own. The size budget applies to the compressed size, comments included, so keep comments short. It is about 17.7 KB now (9); the budget is 20 KB, and the hard ceiling is 30 KB (the user's limit; larger files have run fine so far). Every page folder holds its own copy, and `require` compiles it on each page change, so staying well below the ceiling still matters.
- Because `compressScript` runs `shortify`, the source uses the firmware's short names and never uses a human name (`GridScript.validator.lookup`) as its own identifier, table key or string content. Those would be rewritten on upload.
- Unit tests run the library in a Lua VM under vitest (wasmoon, Lua 5.4; the firmware runs 5.5, so the compressed library is also checked with a 5.5 `luac -p` before release). They load `compressScript(source)`, the text that actually reaches the module. They feed `touch_cb` and `midirx_cb` sequences and check the `gms`/`gmms`/`gmbs`/`ggms`/`ggbs`/LED calls, using stubs for the firmware globals. They are smoke tests, one per thing a user would notice: each output sends, the defaults match `zone-model.ts`, RX, a Setup re-run, `unload`, LEDs on and off, size and RAM. The editor side has the same kind of tests for parse, validate, autos and the overlay. Mouse and gamepad on hardware are tested by hand.

**Per page, on purpose**

- Each page folder has its own copy: `/PP/zona.lua`. A setup made with v1 and another made with v2 can sit on different pages, and both keep working.
- Profiles already carry page-folder files, so sharing a profile shares the library version it was built with. No profile format change.
- **Element presets** don't carry files. When a preset with touch blocks is applied to a page without the library, the Library block shows _missing_ with **Install**.
- The editor never rewrites a file that is there. Install appears only for a missing file (6.1).

**Virtual modules:** `ConnectionSimulator` rejects file operations today. Recommended: a small in-memory file store, so the Library block flow can be tested without hardware.

### 6.5 Source of truth and round-trip

- The action strings are the config. The editor has no other zone store.
- `parseZone` and `zoneToLua` round-trip the zone line exactly: `zoneToLua(parseZone(s)) === s` for anything the editor wrote.
- Editor-written lines are already in the form the send path stores (2.1): no space between statements, double quotes, no optional spaces. This is the same rule as for the Library line (6.1).
- Only non-default options are written. Defaults are written by hand in `zone-model.ts` and in `zona.lua`; a unit test checks they match (10).
- **Unknown options are kept** (`Zone.unknown`), so a block written by a newer editor loses nothing in an older one.
- A zone line that doesn't parse keeps its block and shows the line as it is, with "This line is not in the Touch block format". Nothing is deleted.
- Config travels through `GridEvent.load()` and `sendToGrid()` unchanged. Zone blocks are just actions.

**Old lines with a body.** No migration before 1.0. A line that still ends `function(self)` doesn't parse as a zone: it shows as above, and because it leaves its bracket open it fails the syntax check, so the block is invalid and the event isn't sent until it goes. Its old `end)` line has no block any more and shows as a Code block; the blocks that were in the body show as what they are. The user deletes the old lines and adds the zone again. On a module that still holds such a Setup, the library ignores the body function: the zone sends its MIDI, and the body code no longer runs. Lines from revision 3 (0.7.x) are also left as they are: removed options stay in the line as unknown keys and the library ignores them, and every 0.7.x `led` value is a string, so the editor shows such a line as a Code block.

### 6.6 Grid profiles and presets

- **Profiles:** touch blocks are in the touch Setup text and `zona.lua` is in the page folder, so profiles carry both with no format change. Checked on a ZONA (phase 4): a profile saved from a zone page includes `zona.lua` (the profile save reads the page folder's files), and loading it on another page clears that page folder, writes the file and sends the Setup; the zones run with no Install step.
- **Presets:** a touch element preset carries its zone blocks, not the Library block when it sits in the System Setup. On a page that doesn't load zona, the first zone shows the library warning; a System element preset carries the Library block, and its row shows _missing_ with **Install** when the file isn't in the page folder. Checked on a ZONA before revision 5 (Library line in the touch Setup): on a page without the file, Install made the zones run.
- **Undo:** the editor has no undo history, so there is nothing for zones to support. The unsaved-changes markers work as for any event, since zones are ordinary actions.
- **Profile Cloud preview:** stretch goal (zones drawn on the thumbnail using `parseZone`).

### 6.7 New APIs

**Lua library (`/PP/zona.lua`)**

| API                                              | Purpose                                                                                                                                                                                                                                               |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Z.fader/button/xy(self, name, x, y, w, h, opt)` | Create a zone (kind presets over `Z.zone`) on the touch element `self`. The first zone of a Setup run drops the previous surface, sets `touch_cb` and the sensor range and kicks the timer                                                            |
| `Z.zone(self, name, x, y, w, h, opt, kind)`      | Generic zone; `kind` picks the preset (a fader when it is missing); `opt.read` is ignored                                                                                                                                                             |
| `Z.touch(self, id, evt, x, y)`                   | The `touch_cb`; like `Z.tick`, it first makes pending zones live                                                                                                                                                                                      |
| `Z.rx(self, header, event)`                      | The `midirx_cb`                                                                                                                                                                                                                                       |
| `Z.tick(self, cfg)`                              | Called from the Timer: makes pending zones live (RX, `midirx_cb` when some zone has `rx=1`, chaining an existing one, the first paint), glide, spring, rate-limit flush, mouse moves, LEDs; `cfg.ms` re-arms the one-shot timer (default in `Z.tdef`) |
| `Z.set(name, value, src)`                        | Set a zone value and repaint without sending, the same path as RX value sync; for user code such as a SysEx handler. Mouse zones have no value and skip it                                                                                            |
| `Z.unload()`                                     | Release held zones (and a held mouse button), the callbacks set on the touch element (kept from the first zone in `Z.te`) and the surface (6.1)                                                                                                       |
| `Z.def`, `Z.kind`, `Z.tdef`                      | Defaults, kind presets, Touch Tick defaults                                                                                                                                                                                                           |
| `Z.has`                                          | Capabilities (`Z.has.sres` sensor bits); the version is the file's `LIB_VERSION`                                                                                                                                                                      |

**Firmware functions the library calls** (globals, as on any element)

| Function                                             | Use                                                               |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| `gms(ch, cmd, p1, p2)`                               | MIDI out: notes, CCs (a 14-bit pair as two calls), pitch bend     |
| `gmms(axis, step)`                                   | Mouse move: axis 1 X, 2 Y, 3 wheel; a relative step, −127…127     |
| `gmbs(button, state)`                                | Mouse button: 1 left, 2 right, 4 middle; state 1 press, 0 release |
| `ggms(axis, pos)`                                    | Gamepad axis 0–5 (X Y Z RX RY RZ), pos −128…127                   |
| `ggbs(button, state)`                                | Gamepad button 0–31, state 1 or 0                                 |
| `glag`, `gln`/`gld`/`glx`, `glp`, `color_curve`      | LEDs: the cell lookup, the colour curve, the phase (4.5)          |
| `gtt`, `gmx`, `gmy`, `gpc`, `self:txma`, `self:tyma` | Timer, module position and page for the autos, touch range        |

Zones have no methods of their own: no getters and no `glc`/`glp`.

**Editor (TypeScript)**

| Module                                                                                        | Purpose                                                                                                                                            |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config-blocks/Library.svelte` + `lib/library.ts`                                             | Generic page-folder `require`: headers, bundled and page-folder libraries, the Library line format, status and Install (from `feat/library-block`) |
| `config-blocks/touch/zone-model.ts`, `zone-parse.ts`, `zone-validate.ts`                      | Types, schema, parse and serialize, validators                                                                                                     |
| `config-blocks/touch/zone-autos.ts`                                                           | The zone's MIDI identity and gamepad autos, and the header label                                                                                   |
| `config-blocks/touch/ZoneBlock.svelte`, `config-blocks/headers/ZoneFace.svelte` + block files | Touch blocks                                                                                                                                       |
| `ActionBlockInformation.elementTypes / eventTypes / moduleTypes / companions`                 | Declarative picker filtering, Touch Tick with the first zone                                                                                       |
| `TouchZonesOverlay.svelte` in the control name overlay                                        | Zone drawing                                                                                                                                       |
| `ConnectionSimulator` in-memory files                                                         | Virtual module support (recommended, not built)                                                                                                    |

Not needed any more: `ZoneOutput`, output keys, the `on` callback option, `Z.API`, `UserInputValue.zoneName`, zone-hook classifiers in `virtual-event.ts`, the profile `requires` field. Removed in revision 4: zone autos in MIDI block previews and the "Zone default" mode label, `Z.knob`, `Z.group`, `Z.util`, `Z.raw`, the zone methods `gms gmrr get_auto_value get_auto_mode ind count src dry`. Removed in revision 7 with the body: the getters `v x y g d dx dy step f`, `glc`/`glp` on zones, the start run, Touch End, `bodyAccepts` and the getter suggestions in Gamepad and Mouse blocks.

**Firmware:** none required.

## 7. Phases

0. **Firmware facts (hardware spike, short).** Check each of these:
   - Does `gms` with `mode` 1/3 send correct 14-bit CC and NRPN?
   - The default `txma`/`tyma` value, so the library knows whether it must set them.
   - The gamepad axis range.
   - Does the touch element's `midirx_cb` receive voice messages?
   - `require` from a page folder after a page change, and after re-upload plus `invalidateLuaModule`.
   - Tick CPU cost with 5 contacts at 20 ms, and with an LED divider of 2.
   - Mapping window: does 300 ms feel right for page changes?

   Phase 0 was skipped; phase 2 answered some of it on hardware (firmware 1.5.5). The touch element's `midirx_cb` receives CC voice messages, including 14-bit pairs. The library's own 14-bit expansion sends clean MSB/LSB pairs. The tick cost is in section 9. `require` from the page folder works after a stored page is left and re-entered (phase 4 check). V1 (bring-up on a factory-clean ZONA, library 0.7.2) checked NRPN (99/98/6), 5 simultaneous contacts and the mapping window's entry and exit with synthetic touches. Still open, because they need a finger: how the window, glide, rel and knob drag feel, and the real sensor's direction.

1. **Library block.** Registry, `lib` parse and serialize, page-folder file status, install and update. Useful on its own, and VSN1 can start using it.
2. **Library v1 + Lua tests.** Defaults-match test against `zone-model.ts`, pipeline, zone `self` and autos, duplicate filter, resolution, capture, modes, sensitivity, steps, groups, painters, dry run and RX sync, mapping mode.
3. **Touch blocks.** Zone model, parse and serialize, composite open/close, default body, per-zone and surface validators, `ZoneBlock.svelte`, picker filtering, suggestions inside zones, the `touch` category. The composite, the body and the suggestions inside zones went in revision 7.
4. **Overlay** in the control name overlay.
5. **Docs.** Library docs, a mapping mode guide, and an RX sync section next to the MIDI RX docs.
6. **Stretch goals** (section 11) as separate RFCs or PRs.

Phases 1–5 are done (revision 3). Docs live in grid-documentation: `wiki/actions/code/library`, `wiki/actions/touch/touch-zones`, `wiki/more/zona-mapping-mode` and a Touch zones section in `wiki/actions/midi/midi-rx`; the editor's blocks link to them. They describe revision 3 and need a follow-up for revision 4 (MIDI options, removed blocks, no mapping mode).

Revision 4, after the owner review (section 14), was done in slices S1–S6: S1 cut (0.8.0), S2 MIDI in the zone (0.8.1), S3 LEDs per kind (0.8.2), S4 spring (0.8.3), S5 multi-touch XY (0.8.4), S6 this revision with `dx()`/`dy()` for XY (0.8.5), then fixed LED levels with no tuning table (0.8.6). Each slice was tested in the Lua VM and checked on a ZONA with synthetic touches.

Revision 7, after the zone outputs session (section 0.1), was done in four slices: bodies out (0.9.0), Output select and Mouse (0.9.1), tap to click (0.9.2) and Gamepad (0.9.3), after the ZONA tests were trimmed to smoke tests. They were tested in the Lua VM; mouse and gamepad on hardware are hand-tested by the user. The grid-documentation pages need a follow-up for the Output select and the removed body.

Revision 8 removed Touch Start in one slice (0.10.0), tested in the Lua VM. The grid-documentation pages need a follow-up for it too.

## 8. When Setup runs out of room

The library itself is in a file and loads from a Library block, usually in the System Setup. The touch Setup holds the zone lines, about 40 characters per plain zone (5).

**Zones in a file** are not planned. Moving zone blocks into a generated page file would make a file part of the config. That breaks "action strings are the source of truth" unless unsaved changes, store and profiles all learn about files. If it is ever needed, it gets its own RFC.

## 9. Risks

- **Setup budget.** 38–42 characters per plain zone (5): about 21 plain faders, fewer with options. Section 8 covers growing past it.
- **Implicit duplicate filter.** A zone drops repeated values per source. A user who wants to resend the same value needs a plain `gms(...)` in a Code block elsewhere. Document it.
- **Tick cost.** Measured on a ZONA (esp32s3, firmware 1.5.5), 100 `Z.tick` calls in one Lua chunk:
  - nine faders covering all 81 cells (0.8.4): 0.6 ms idle, 4.6–4.7 ms with every zone dirty, 4.8 ms with five faders held (24% of a 20 ms tick);
  - a 6×9 XY pad with three moving fingers plus a 3×4 XY: about 11 ms with every zone dirty, about 6 ms with one finger. Each extra held finger adds about 2 ms on a pad that size; while fingers move the pad repaints every tick, so about half of a 20 ms tick goes to painting;
  - earlier: 0.7.2 with 7 zones 0.4 ms idle and 3.6 ms dirty; 0.8.1 0.3 / 2.7 ms.

  Only dirty zones repaint, and only changed cells are sent. If large multi-finger pads matter, options are a longer Touch Tick interval for such layouts, repainting held XY zones every other tick, or painting only the rows and columns that changed.

- **Library load on every page change.** The VM restarts, so `require` reads and compiles the file each time. Measure page switch time.
- **Output flood.** The built-in rate limit sends at most one message per source per tick (per finger on an XY), so a dense swipe stays within USB MIDI. An XY swipe at 20 ms ticks sends at most about 100 messages per second per finger (two sources); the editor's MIDI monitor lags at that rate.
- **RX data load.** `midirx_cb` is only set when a zone has `rx=1`; unmatched messages cost one lookup; value sync repaints at most once per zone per tick.
- **Resolution expectations.** The sensor gives 10 bits across the whole surface, so small zones get 8–9 bits of real position. 14-bit absolute output on a small zone is interpolated.
- **Lua memory (RAM).** Lua runs on the module's system heap, and RAM, not the file size, limits layouts. In the Lua VM tests (wasm32, 0.8.4): the library takes about 54 KB, a zone about 1.5 KB, an extra XY finger state about 1.3 KB (made on its first touch, kept until the next Setup run). On a ZONA without other Lua code: the factory page uses about 59 KB of heap; 0.8.4 with nine faders and `Z.start` about 124 KB after a full collection (0.8.0: the library about 38 KB, 7 zones about 17 KB). Revision 3's measurement with the aurora system code (about 73 KB of Lua) left about 40 KB free with 0.7.0 and 8 zones; 0.8.x takes less per zone. The library keeps per-zone data small (options through metatables, shared colour curves, finger states on demand), the first zone of a Setup run frees the previous surface, and Install releases the old instance through `unload` before the new one compiles (6.1). Budget tests in vitest fail when these numbers grow. Measure free heap on hardware only with `collectgarbage("count")`; probing with allocations stalls the module.
- **Library size.** 17,741 bytes compressed, comments included, against the 20 KB budget (6.4).
- **MPE channel overlap.** A multi-finger XY sends finger k on `ch + k − 1`. With auto channels, zones on one module share `ch` and are kept apart by their CC numbers, so they don't collide. Collisions come from a zone with an explicit `ch` equal to a finger's channel; from the next page, whose auto channel is `ch + 1` and whose first zones use the same auto CC numbers (32, 33, …), so a DAW mapping learnt on that page also catches finger 2 of this XY; and, for finger 5, from the module one row down (auto channel `ch + 4`). Nothing checks it (10).
- **Copies per page.** Several versions of the library can be in flash at once. That's acceptable at the 20 KB budget each (6.4).
- **Edit vs device drift.** A user can edit `zona.lua` in the FileManager, and the editor doesn't notice: it only checks that the file is there.
- **Install re-runs every Setup.** Their side effects repeat (MIDI sent from Setup, timers started), as on a page load, but in RAM and without a page reload.

## 10. Open questions

**Resolved**

- _Library location:_ per page folder (`/PP/zona.lua`).
- _Category name:_ `touch`.
- _Library loading:_ the generic Library block, shared with VSN1, in any element's Setup (revision 6; only the System Setup in revision 5).
- _Library block scope:_ global names, declared by each library's `LIB_NAME` header (revision 6; reserved `_` + uppercase names in revision 5).
- _Library versions:_ shown from `LIB_VERSION`, never updated. A breaking change ships under a new file name; a present file is never rewritten (revision 6).
- _Name protection:_ no `_G` metatable guard. If names ever need protecting, the firmware should protect its own API and the libraries together (revision 5).
- _Blocks that add their own Library row:_ not planned. The library warning stays, so a future firmware-provided zone API doesn't depend on an auto-added row (revision 5).
- _Send path:_ blocks and the library file use the editor's existing transforms, with no handling of their own. Actions go through `sendToGrid` (`compressScript` + `SendConfig`). The library file goes through the File Manager's `.lua` save (`compressScript` + `writeFileContent`). The editor writes lines already in compressed form, and the name rules exclude anything those transforms would rewrite (2.1, 6.1, 6.4).
- _Outputs:_ one output per zone, the `msg` option: MIDI (`ch num rx`), Mouse or Gamepad, sent by the library; no body (revision 7, 4.1).
- _Capture names:_ focus mode and live mode.
- _Several contacts in one zone:_ the first contact owns a zone; an XY takes `fingers` contacts, MPE style (4.3; D4, D5).
- _Pressure:_ a future `touch_cb` argument. Not designed now.
- _Overlay toggle:_ the existing control name overlay.
- _Defaults table:_ written by hand in both `zone-model.ts` and `zona.lua`, with a unit test that fails when they differ. The editor leaves defaults out when it writes a block (`{}` instead of `{mode="abs",grab="focus",res=7,…}`, which saves Setup characters), and the library fills them in, so the two copies must agree. `zona.lua` stays a plain hand-written file that reads well on the device and in the FileManager. Generating the Lua table from TypeScript at build time was the alternative, and can be revisited if drift becomes a problem. Before 1.0 a default may change between 0.x versions (no migration); from 1.0 only in a major version.
- _Press/release composite:_ not planned. A zone sends only what changed (the duplicate filter).
- _Stale `midirx_cb` after a config change (4.8):_ accepted. It only happens the first time a page switches from hand-written code that set `midirx_cb` to zones, in RAM, and ends at the next Setup re-run or page reload. Clearing it in Setup would cost characters and break user code placed before the zones.
- _Touch block global name:_ `_Z`, from zona's header (section 5; `Z` before revision 5).
- _Zone channel and `midi_auto_ch`:_ zones don't follow the page's MIDI channel override. The override suits many identical elements (16 encoders on one channel); a few zones with their own settings are set up deliberately, so the user sets `ch` on the zone (user decision, phase 3).
- _Knob, mapping mode, groups block, sensitivity and release options:_ removed in revision 4 (section 0.4, 14).
- _Spring minimum step:_ the glide minimum, `speed/50` per tick, shared with glide (S4).

**Still open**

- _Multi-finger channels._ Finger channels can overlap other zones' channels (9). A face hint or a surface check could flag it.
- _Mapping mode and a utility block:_ their goals are to be clarified before they come back (4.7).
- _Custom per-zone logic:_ may come back as an Output of its own (4.6).
- _Gamepad autos past the range:_ a 7th auto axis or a 33rd auto button is neither checked nor clamped.
- _Repaint cost of large multi-finger pads_ (9).
- _Positions hint:_ `Z.has.sres` is there for a "raw positions" hint on the block face (4.2); not built.

## 11. Stretch goals

Each of these is welcome if it fits cleanly later. None of them may change the frozen call shape (section 14).

- **State that survives page changes and power-up** (values, steps, active group member) in `/PP/zona.state`. If done, it must be left out of profiles, it must not be marked as a config change, and it needs a save before the page change.
- **Interactive surface editor:** drag to create, move, resize, writing back through the same block update path, so history and unsaved changes keep working.
- **Zone-scoped navigation:** selecting a zone on the overlay jumps to its block.
- **Cross-zone rules:** overlap errors, shared MIDI identity hints (including finger channels).
- **True MPE for XY fingers:** pitch bend and CC74 per finger as another `msg`.
- **Build-time defaults:** generate the Lua defaults table from `zone-model.ts`, if the two hand-written copies prove hard to keep in step.
- **Profile Cloud thumbnails** with zones.
- **HANGAR converter** from a `Surface` JSON to touch blocks.

## 12. References

- `src/renderer/runtime/virtual-event.ts` (PR #1645)
- `src/renderer/config-blocks/Midi.svelte` (`self:gms` default, `gms` mode, "Receive MIDI" and `gmrr`), `RxMode.svelte` (`grxm`), `SettingsPotmeter.svelte` (`pmo`/`pmi`/`pma`), `SettingsButton.svelte`, `SettingsButton.ts`, `GamePadAxis.svelte`, `MouseMove.svelte`, `SimpleColor.svelte`, `ElementName.svelte`, `ActionBlockInformation.ts`, `categoryColors.ts`, `validators.ts`
- `src/renderer/main/panels/configuration/components/ActionPicker.svelte`
- `src/renderer/main/grid-layout/grid-modules/devices/ZONA.svelte`, `Device.svelte`, `overlays/ControlNameOverlay.svelte`, `runtime/moduleOverlay.ts`
- `src/renderer/runtime/runtime.ts` (`GridElement.load` name derivation, `GridPage.sendFiles`)
- `src/renderer/main/panels/FileManager/FileManager.ts`: `writeFileContent`, `invalidateLuaModule`, `fetchDirEntries`, `pageNumberToFolderPath`; `FileManager.svelte` (`.lua` save and import with `compressScript`, open with `expandScript`)
- `src/renderer/serialport/instructions.ts` (`SendConfig`, `FetchConfig`, `SendLuaImmediateAndEvaluate`), `runtime.ts` (`GridEvent.sendToGrid`, `GridEvent.load`, `GridAction.parse`)
- grid-protocol: `GridScript.compressScript` (`shortify` + `minifyLua`), `GridScript.expandScript`, `GridScript.checkSyntax`, `GridScript.validator.lookup`
- `src/renderer/runtime/connection-simulator.ts`
- grid-fw: `grid_lua.c` (package.path), `grid_protocol.h:131` (909), `grid_ui.c` `grid_ui_bulk_page_load` (VM restart), `lua_src/decode.lua` (`midirx_cb` dispatch to every element), `lua_src/simplemidi.lua` (`self:gms` autos), `lua_src/autovalue.lua` (`get_auto_value`, `get_auto_mode`)
- TouchOSC manual, _Control Reference_: Radial (angular, Absolute/Relative response, Factor) and Encoder — https://hexler.net/touchosc/manual/controls
- docs.intech.studio: _File Manager_ (page-folder `require`, profiles with files), _MIDI RX_, _RX Mode_, _Utility Event_
- HANGAR `src/lib/sandbox/` (behaviour reference only)

## 13. Feedback round: v1 test profiles

v1 is checked with synthetic touches. What's left is how it feels with a finger and how it works with a DAW. Six profiles, one scenario each, collect that feedback. Each profile:

- is a normal ZONA page profile in the user's profile folder (`grid-userdata/configs`, `configType: "profile"`), named `ZONA test N – <scenario>`;
- **carries `zona.lua` in `files`** (the compressed text, as the module holds it). Loading a profile with files clears the page folder before writing them, so a profile without the library would leave its zones with nothing to `require`;
- replaces the whole page, including the factory demo code on the touch Setup and the `print` on the touch Timer (5);
- has Touch Tick on the touch Timer and Touch Utility on the system utility event, so mapping mode and page changes work;
- fits in the Setup budget (5): about 7 plain zones, 5–6 with extra options or Receive MIDI;
- lists in its description what is on the surface (zone, cells, settings, MIDI) and the questions to answer.

Load them on pages 1–4 and store, so the utility button also tests page changes and `require` from each page folder. Report per profile: what felt wrong, what was surprising, and anything you expected and didn't find.

| #   | Profile      | Surface                                                                                                                                                 | Decision points                                                                                                                                                                                                       |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Faders       | Five vertical faders: abs 7-bit with a touched note, abs 14-bit, rel (speed 0.5), glide (ease), NRPN; one horizontal fader. Painters fill, dot, comet.  | Sensor direction and reach to the edges. Abs vs rel vs glide: right defaults for speed and ease? Is 14-bit smoother in a DAW? Touched note useful for automation?                                                     |
| 2   | Pads         | Three momentary pads, a radio group of three toggles, a 4-step button.                                                                                  | Tap reliability and `leave` on buttons. Radio and step LED states readable? Should buttons in a group default to toggle (5)?                                                                                          |
| 3   | XY and knobs | Large XY pad (crosshair), knob absolute (angle), knob with vertical drag (`mode="rel"`, like a DAW knob), knob relative.                                | Angle vs drag: which should be the default, and should Knob drag set `rel` by itself? Drag speed (one knob height for the full range). Knob gap and pick-up after crossing it. XY crosshair readable?                 |
| 4   | Live swipe   | Six one-column faders with `grab=live`, release fade, low sensitivity on half (a seventh didn't fit: about 125 characters per zone with these options). | Swiping across faders, several fingers at once, fade on release, sensitivity presets (do `l`/`n`/`h` differ enough?).                                                                                                 |
| 5   | DAW sync     | Three faders (one 14-bit) and two toggles with Receive MIDI on (about 140 characters per zone with Receive).                                            | Feedback from the DAW (value and LEDs), touch wins, no echo. MIDI learn through mapping mode: window length (300 ms), the one-message rule, second press to exit, page change when the window runs out with no touch. |
| 6   | HID          | XY pad driving Mouse Move (relative, `res=14`, `speed=0.0125`, `d()` per axis), a fader on a Gamepad Axis, a button on a Keyboard key.                  | Do ordinary blocks inside a zone feel right? Mouse speed scaling. Is the getter suggestion enough, or do users need presets?                                                                                          |

The answers decide the follow-ups after v1: defaults that may only change before release (4.2, 6.5), the editor hints from section 5 (factory demo code, momentary radio), and which stretch goal comes first.

Found while building them (synthetic touches, to confirm with a finger):

- A 4-step button's top step is 126, not 127: the step size is rounded before it is added up.
- A relative zone clamps at its range, so a mouse driven by `self:d()` stops moving at the end of the range: about 80 full swipes in one direction at the profile's speed (0.0125). HID use may need a relative mode that doesn't clamp.
- Low sensitivity (`sens=l`) stops smoothing at lift, so the value can stay a few steps short of where the finger left. Held still, it catches up within about 100 ms.
- A new press resends the zone's current value (the duplicate filter resets per press, 4.1).
- Mapping mode lets one identity through as a stream: a fader being mapped keeps sending its CC (4.7). Mapping a toggle also switches it.

Results (user, 2026-10-14, test ZONA on firmware 1.5.5):

- **Works as intended:** taps and fast repeats, radio groups as the button default, `leave` and slide-off, DAW sync with touch wins (the DAW value lands on release), 7- vs 14-bit visibly different in Ableton, live swipe, the touched note, knob drag with `rel` (k2), HID blocks.
- **LEDs need work.** The default colour curve's minimum is (10,5,0), so every cell outside a zone and every unlit zone cell glows; configured zones are hard to see. The arc painter is on/off per cell, and on a 3×3 knob the last lit cell sits at 0.95 of the range, so the top value needs a finger outside the arc. `release="fade"` goes to dark, which loses the last value of an absolute control.
- **XY with two fingers:** with `contact="new"` both fingers drive the zone and the crosshair flickers between them.
- **Profile values, not defaults:** rel at `speed=0.5` feels slow; the mouse at `speed=0.0125` covers too little of the screen; the angle knob (k3) needs too careful a circle in 3×3.
- **Data rate:** an XY swipe sends about 156 messages per second (7-bit, two axes), which USB MIDI carries easily; the editor's MIDI monitor lags at that rate. A held 14-bit fader keeps sending (finger jitter of about ±6 sensor units).
- **RX chain:** loading profiles one after another reuses the same `Z` (require cache), and only the touch element has a `midirx_cb`; no chain forms outside the case in 4.8.
- **Hit position:** on this unit the sensor spans about 141 units per cell in the middle and saturates at the outer LED centres, so taps near the edges land one zone outward. Decision (user, CTO, firmware engineer): no calibration in the library; newer ZONA hardware senses touch where expected. No deadband or jitter tuning either.
- **Out of this pass:** utility mode and mapping mode (300 ms is far too short), until their goals are clear.

Next (library 0.8.0): LEDs (dark outside zones, a faint zone floor, soft arc spanning the lit cells, fade to a dim marker), first contact owns an XY zone, the rate limit as its own setting (off by default), retuned test profiles, then a second feedback round.

Superseded by the owner review (14): the next pass cuts options instead of tuning them.

## 14. Revision 4: owner review

The project owner reviewed v1 and the feedback round (2026-10-15). In short:

- **Fewer options.** Past features shipped small, and users found the real needs. A system that is intricate from the start bloats when each new need has to find its place. Aim for the minimum.
- **Frozen call shape.** Library updates must not break the action blocks. Versioning the blocks against the library is too big a task for small wins, so the block's Lua stays simple and stable instead: `Z.<kind>(name,x,y,w,h,{opt},function(self)` is fixed, and anything new is a key in the options table.
- **LED feedback belongs to the zone kind:** one good style per kind instead of a painter option.
- **Generalised interactions.** A pitch bend is a fader that springs back; a joystick is an XY pad that springs back, with tuneable easing; a fader is a one-axis XY pad. The knob's arc doesn't fit and reads poorly on 3×3 LEDs.
- **Specific blocks stay** (Fader, Button, XY), rather than one zone block with a mode tree.
- **MIDI child blocks don't fit zones**, least of all with several fingers in one zone. Their `-1` autos and free fields invite edits that are wrong for a zone.

Decisions (user, 2026-10-15):

| #   | Decision                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Touch Knob is dropped: the block, the angle reader, the arc painter and `drag`.                                                                            |
| D2  | Pitch bend and joystick are a `spring` option on Fader and XY, not blocks.                                                                                 |
| D3  | MIDI is a zone option. Zones get no default MIDI child block, and the MIDI block is hidden in zone bodies; a Code block with plain `gms(...)` still works. |
| D4  | Multi-touch XY: one crosshair per finger, all in the zone colour.                                                                                          |
| D5  | Per-finger MIDI is MPE style: each finger on its own channel, the same CC numbers.                                                                         |
| D6  | No test profile rebuild and no profile feedback round in this pass.                                                                                        |

Section 0 lists what changed, and the body (sections 1–11) describes the result, library 0.8.6. The work was done in slices S1–S6, with breaking changes allowed before 1.0 and no migration of old lines. Out of this pass: utility and mapping mode, touch calibration, deadband and jitter tuning, the test profile rebuild (D6).
