# RFC: ZONA touch zones in Grid Editor

- **Status:** Draft, revision 2
- **Date:** 2026-10-09 (rev 1: 2026-10-06)
- **Author:** Kristóf Kerti
- **Related:** PR #1645 (virtual events), PR #1589 (XY → ZONA), PR #1596 (virtual flag for Lua immediate exec), HANGAR (`sabotond-dev/hangar`, behaviour reference only)

## 0. What changed since revision 1

| Area | Rev 1 | Rev 2 |
|------|-------|-------|
| Zone hooks | Every zone had Press, Change and Release **virtual events** in Setup. | Out of the core. Zones are **declarative**: their outputs are block settings. One optional callback per zone is the escape hatch (4.7). If it shows up as a virtual event tab, that is a side effect of PR #1645, not a design goal. |
| Event panel | A selected zone swapped the event tabs to Settings, Press, Change, Release. | Removed. The touch element keeps Setup and Timer. The Lua code and the action strings stay the only source of truth. |
| Library loading | A ZONA-only `zlib` block that also set `touch_cb`. | A generic **Library** block that `require`s files from the current page folder (6.1). It will also load the VSN1 layout library later. `touch_cb` is set by `Z.start(self)`. |
| Library location | One `/zona.lua` at the root, profile `requires` field. | One copy **per page folder** (`/PP/zona.lua`). Profiles already carry page files, so no new profile field. |
| Surface editor | Interactive overlay: drag to create, move, resize. | A **read-only** overlay rendered from the zone blocks (6.3). Interactive editing is a stretch goal. |
| State persistence | Goal 5, a state file per page. | Stretch goal (section 11). The API must not bend for it. |
| HANGAR | "Code can be ported with the copyright headers kept." | Behaviour reference only. No HANGAR code is copied. Everything is written new to Editor conventions (2.3). |
| New requirements | — | Multiple outputs per zone (4.1), resolution up to 14-bit for every target (4.2), contact capture and clamping (4.3), utility-button mapping mode (4.5), MIDI RX sync (4.6), a home for parsers and validators (6.2). |

## 1. Summary

The user describes **zones** (faders, buttons, XY pads, knobs) on the 9×9 ZONA surface. Each zone is an ordinary **action block** on the touch element's Setup event, and the user edits it in the action list like any other block. A versioned Lua library, `zona.lua`, lives in the page folder and is loaded by a generic **Library** action block. The library does the work: touch routing, contact capture, value maths, outputs (MIDI, gamepad, mouse), MIDI RX sync, mapping mode and LED drawing.

The action strings on the module (and in the editor) are the single source of truth. Every editor view, including the read-only zone overlay, is derived from them.

## 2. Background: what we know

### 2.1 ZONA hardware and firmware

- Two elements: **touch (0)** and **system (255)**. The touch element has **only Setup (0) and Timer (6)**.
- Touch input is a callback, not an event: `self.touch_cb(self, id, evt, x, y)`, assigned in Setup.
  - `id` 0–4 is a contact slot. The firmware gives the lowest free slot on touch-down, so a slot is stable for one contact but is not a stable finger.
  - `evt` is the raw sensor nibble (1 move, 4 down, 5 up; 9 tap is inferred).
  - `x`, `y` are 0–127 across the **whole** surface. A zone 3 cells wide therefore sees only about 43 raw positions across its width. No pressure today.
- 81 LEDs, 9×9, serpentine (see `ZONA.svelte`).
- **Action string limit: 909 characters per event** (`GRID_PARAMETER_ACTIONSTRING_maxlength`, `grid_protocol.h:131`).
- **File system:** littlefs. Files are loaded with `require`. Page folders are hex (`/00/`, `/01/` …). Profiles save the top-level files of a page folder, and loading a profile clears that folder first (docs: *File Manager → File saving under profiles*). The documented way to load a page-local module:

  ```lua
  local pageHex = string.format("%02X", page_current())
  local M = require("/" .. pageHex .. "/testfile")
  ```

- **Page change restarts the Lua VM.** All Lua state is lost, including `package.loaded`. Encoder and button values survive because they live in C template buffers. Zone values do not.
- **Utility button:** the system element's utility event runs on press. Today it holds `gpl(gpn())` (next page). Whether it also runs on release, or whether the press state can be read, has to be checked on ZONA firmware (section 7, phase 0).
- **MIDI output:** `gms(ch, cmd, p1, p2, mode)` takes a 5th `mode` argument (0 7-bit, 1 CC 14-bit, 2 NRPN, 3 NRPN 14-bit). The MIDI block uses it today.
- **MIDI input:**
  - Each incoming voice message is passed to **every** element's `midirx_cb(self, header, event)` (`decode.lua`, `_decode_process`). `event` is `{ch, cmd, p1, p2}`.
  - The RX Mode block (`grxm`) must have MIDI Voice enabled. It is on by default.
  - Real elements have firmware-side sync: `self:gmrr(-1, ch, cmd, p1, {value_sync, led_sync}, mode)`, written by the MIDI block's "Receive MIDI" section. It updates the element's value template and LED. Zones have no value template, so `gmrr` can't target them as it is.

### 2.2 PR #1645 (virtual events) and this RFC

A virtual event is a top-level named Function block (`fst`/`fen`) on Setup, and it is shown as its own tab. All virtual events share Setup's 909 characters.

In revision 1, every zone hook was a virtual event. That does not scale. Three hooks for each of ten zones don't fit in 909 characters, and the touch element is still one element with one Setup. Showing per-zone event tabs would mean a new "virtual element" concept in the event panel, and that view would no longer be a plain reading of the action string.

**Revision 2:** nothing in this RFC depends on virtual events. If a user writes a zone callback as a named function on Setup (4.7), PR #1645 already shows it as a tab. That is welcome, but no API choice here is made for it.

### 2.3 HANGAR

HANGAR's Sandbox (`src/lib/sandbox/`) proved the idea: regions on the 9×9 grid, one runtime, minified Lua packed across several events to fit the 909 limit. Its output is `--[[@cb]]` code that the editor can only show as raw code.

HANGAR is a throwaway prototype without code quality standards. **No HANGAR code is copied or adapted.** It is used only as a behaviour reference (which modes, painters and groups feel right). Everything in this RFC is written new and follows the editor's APIs and conventions, so a reviewer can review all of it as new code. The packing scheme is not needed, because the library lives in a file.

## 3. Goals and non-goals

**Goals**

1. Each zone is an action block on the touch Setup, edited in the action list with grid-uikit controls.
2. One shared zone library, versioned, installed by the editor into the page folder, and loaded by a generic **Library** block that VSN1 can reuse.
3. Zones with **several outputs** (an XY pad sends x and y, a fader can also send a touch gate), each to MIDI, gamepad or mouse.
4. **Resolution** from 7-bit up to 14-bit for every output.
5. **Contact capture and clamping**, chosen per zone: fine-tuning (clamp to the zone) or performance (swipe across zones).
6. **Mapping mode:** hold the utility button and touch a zone to send exactly one of its messages, for DAW MIDI learn.
7. **MIDI RX sync:** incoming MIDI that matches a zone's output updates its value and LEDs.
8. A **read-only overlay** on the ZONA module that shows the zones described by the action chain.
9. Profiles, presets, copy and paste, undo and the unsaved-changes markers work with no new mechanism.

**Stretch goals** (section 11): state that survives page changes, an interactive surface editor, zone-scoped event navigation, cross-zone rules such as overlap, Profile Cloud thumbnails.

**Non-goals (for now)**

- A browser preview that runs Lua.
- Pressure. There is room for it later (10.4).
- Importing HANGAR catalog entries.
- Firmware changes. The design works on current firmware. Phase 0 may show that mapping mode needs a utility-release event; 4.5 has a fallback that doesn't.

## 4. Core concepts

### 4.1 A zone is a rectangle, a reader and a list of outputs

```
contact → capture → position → read → value(s) → outputs
                                               ↘ paint
```

The **kind** only decides how the position is read, and which **sources** the zone offers:

| Kind   | Reader  | Sources | Notes |
|--------|---------|---------|-------|
| xy     | `point` | `x`, `y`, `g` | two continuous values |
| fader  | `axis`  | `v`, `g` | vertical or horizontal |
| knob   | `angle` | `v`, `g` | angle around the zone centre |
| button | `gate`  | `g` | down or up; toggle and steps on top |

`g` is the contact gate, and every zone has it. It allows, for example, a fader that sends a "touched" note for DAW automation as well as its value.

A kind is **a preset of options**, not a separate implementation. Every option works on every kind where it makes sense.

An **output** connects one source to one target. A zone has 0 to n outputs, keyed by source:

```lua
Z.xy("pad",4,0,5,5,{x={cc=10},y={cc=11,res=10},g={note=60}})
```

| Target | Keys | Container |
|--------|------|-----------|
| MIDI CC | `cc`, `ch` | 7-bit, or 14-bit CC (`cc` and `cc+32`) when the range needs it |
| MIDI note | `note`, `ch` | gate: note on/off; continuous: velocity |
| MIDI NRPN | `nrpn`, `ch` | 7- or 14-bit NRPN |
| Pitch bend | `pb=1`, `ch` | always 14-bit |
| Gamepad | `gpa` (axis) or `gpb` (button) | firmware axis range (phase 0) |
| Mouse | `mx`, `my`, `mw` (move or wheel axis), `mb` (button) | relative deltas |

MIDI is sent with `gms(...)` and its `mode` argument, so 14-bit CC and NRPN bytes come from the firmware and match what the MIDI block sends.

### 4.2 Values and resolution

Resolution belongs to the **value**, not to the target. This follows the potentiometer settings (`pmo` resolution bits, `pmi`/`pma` range), so users meet the same idea twice.

- `res` sets the number of steps, from 7 to 14 bits (default 7).
- `min` and `max` set the output range. They default to the container's full range: 0–127 for 7-bit and 0–16383 for 14-bit.
- Each target maps the value into its container:
  - **MIDI:** 7-bit when `max ≤ 127`, otherwise the 14-bit form of that message type.
  - **Gamepad:** scaled to the firmware's axis range. If that range is smaller than `res`, the editor shows the cap.
  - **Mouse:** the change between two values becomes a relative move. A fractional accumulator keeps fine resolution, so a 10-bit fader moves the cursor in smaller steps than a 7-bit one.

**What higher resolution really gives.** The sensor reports 7 bits across the whole surface. In `abs` mode a small zone has fewer raw positions than 128, and a higher `res` there only interpolates. Real extra resolution comes from smoothing, `glide` and `rel` with `speed < 1`. The block face shows a hint with the raw positions the zone has ("about 43 positions across"), so users aren't misled.

### 4.3 Contacts, capture and clamping

When a contact lands, the library decides which zone **owns** it. Each zone has a `grab` option that sets what happens while the finger stays down:

| `grab` | Owner | Leaving the zone | Use |
|--------|-------|------------------|-----|
| `hold` | the zone where the contact landed, until lift | Position **clamps to the zone's edge**: value and LEDs stay at the boundary on the side the finger left. | Fine-tuning. Default for fader, knob, xy. |
| `leave` | the zone where the contact landed | Counts as release. Re-entering does nothing until the next touch-down. | Default for button (slide off to cancel, like a real button). |
| `swipe` | whichever `swipe` zone is under the finger right now | Leaving releases this zone. **Entering** another `swipe` zone presses it at the entry position (`abs` read). | Performance: drag across several faders to pull them all down. |

Rules:

- A contact owned by a `hold` or `leave` zone never reaches another zone, even if it passes over a `swipe` zone.
- A contact that lands on an empty cell is not owned. If it later moves into a `swipe` zone, that zone picks it up. `hold` and `leave` zones only take contacts that land inside them.
- Several contacts in one zone: `contact` decides, as before. `new` lets each contact act, `move` re-targets the value (glide), `grab` continues from the current value (relative). The last active contact wins.
- Clamping applies to the **position** before the reader runs, so it works the same way for every kind. For `angle` it clamps the radius, not the angle.

### 4.4 Shared stages (unchanged in spirit from rev 1)

- **Mode** (`mode`): `abs` (jump), `rel` (drag delta with `speed`), `glide` (move toward the finger with `speed` and `ease`).
- **Approach:** one tick-driven "move value toward target" function. Spring, glide and smoothing all use it.
- **Sensitivity:** deadband, then smoothing, then send only on change, then rate limit (flushed by the tick). In the UI this is one select (Low / Normal / High), with raw numbers under Advanced.
- **Steps:** the same meaning as Grid's button mode `bmo` (0 momentary, 1 toggle, n = n+1 steps), with the same step maths (`SettingsButton.calculateStepValuesFirmwareStyle`).
- **Groups:** radio groups 1–8. A press sends the other members' "off" first, then this zone's "on". `empty` decides whether every member can be off.
- **Painters:** `fill`, `dot`, `comet`, `crosshair`, `target`. They draw the **value**, not the finger, so relative, glide, spring and clamping display correctly. The library sends only the LED cells that changed.
- **Release** (`release`): `clear`, `fade`, `keep`.

### 4.5 Mapping mode (utility button + touch)

**Goal:** a DAW's MIDI learn must see exactly one message stream, and those must be the same bytes the zone sends in normal use.

**Design:** mapping mode is a **filter on the normal output stage**, not a separate table. While it is on:

1. Only the **first** contact is processed. Other contacts are ignored.
2. Every output except the **selected** one is muted, on all zones. Callbacks (4.7) don't run.
3. The selected output sends through the normal path (same `gms` call, `mode`, channel and range), so 14-bit CC pairs, NRPN and note on/off come out byte-for-byte as in normal use.
4. Values and LEDs update as usual, so the user sees what is being sent.

**Choosing the output** within the touched zone:

- One output: that output.
- Two continuous outputs (`x`, `y`): the **dominant axis** of the first movement past a small threshold picks one, and it stays locked until lift. The LEDs draw a horizontal or vertical bar to show which.
- A gate output (`g`) next to continuous ones: a **tap** without movement sends the gate.
- More than that is not needed for the kinds in this RFC. The rule is "movement axis picks a continuous source, tap picks the gate", so new kinds only have to declare their sources.

**Entering and leaving:** a `Z.util(self)` block on the system element's utility event replaces `gpl(gpn())`:

- **Preferred (if the firmware reports utility release):** press arms mapping mode. A touch while the button is held turns mapping mode on and the page doesn't change. Releasing without a touch changes page, so the page change moves from press to release.
- **Fallback (no firmware change):** touch and hold a zone first, then press the utility button. That zone enters mapping mode until lift. A utility press with no active contact changes page at once, as today.

Phase 0 decides which one ships. The `Z.util` block hides the difference from the user.

### 4.6 MIDI RX sync

Users already know the MIDI block's "Receive MIDI" section (value sync, LED sync). Zone outputs get the same two switches, with the same labels and meaning: `rx={v=1,l=1}` in Lua.

**How it works:**

- `Z.start(self)` sets `self.midirx_cb` on the touch element. Firmware already calls every element's `midirx_cb` (2.1).
- When zones are created, the library builds an index from `(ch, cmd, p1)` to `(zone, source)`.
- The decoder in the library handles the containers the outputs use:
  - 7-bit CC and note.
  - 14-bit CC: MSB on `cc`, LSB on `cc+32`. The MSB is applied at once and refined when the LSB arrives.
  - NRPN: a per-channel 99/98/6/38 state machine.
  - Pitch bend.
- **Value sync** sets the zone value (scaled into `res`) and, in `glide`/`rel`, the target too. **LED sync** repaints. Neither one sends MIDI, so there is no echo.
- **Touch wins:** RX for a zone is ignored while a contact owns that zone, so the DAW and the finger don't fight.
- **Toggles, steps and groups:** an incoming "on" for a group member makes it the active member, with no output.
- If the user's own Setup code assigns `self.midirx_cb` before `Z.start`, the library calls it after its own handling. `Z.start` is always the last block, so this order holds.

**Later, optional firmware help:** a `gmrr` variant that calls a Lua function with the decoded 14-bit/NRPN value would remove the NRPN parser from Lua. It isn't needed for v1.

### 4.7 Custom logic: one optional callback per zone

Declarative outputs cover the usual cases (CC, note, NRPN, gamepad, mouse, groups, steps), so most zones need no code.

For the rest, a zone can name a callback:

```lua
Z.fader("f1",0,0,1,9,{v={cc=1},on="f1cb"})
f1cb = function(z, e) ... end   -- e: 1 press, 2 change, 3 release
```

- `on` is a **name**, resolved when it is called. The function can be anywhere: later in Setup, or in the user's own page file loaded with the Library block. That keeps hook bodies out of the 909-character Setup if needed.
- `z` has getters that read like element getters: `z:v()`, `z:x()`, `z:y()`, `z:g()`, `z:step()`, `z:count()`, and later `z:p()`.
- One signature for every kind, with an event code, instead of three named hooks per zone. The cost is about 10 characters per zone instead of a function header per event.
- **Side effect:** if `f1cb = function(z, e)` is written as a Function block on Setup, PR #1645 shows it as a virtual event tab. Nothing more is built for it.
- Advanced: `Z.raw = function(self, id, evt, x, y)` gets every raw touch before routing.

## 5. Device layout

```lua
-- touch element, Setup (must stay under 909 characters)
--[[@lib]]  local p=string.format("/%02X/",gpc()) Z=require(p.."zona")
--[[@zfd]]  Z.fader("f1",0,0,1,9,{v={cc=1,res=10,rx={v=1,l=1}},g={note=1}})
--[[@zfd]]  Z.fader("f2",1,0,1,9,{v={cc=2},grab="swipe"})
--[[@zbt]]  Z.button("b1",2,0,2,2,{g={note=60},bmo=1,group=1})
--[[@zxy]]  Z.xy("pad",4,0,5,5,{x={cc=10},y={cc=11},mode="glide",led={"crosshair","target"}})
--[[@zst]]  Z.start(self)                    -- sets touch_cb and midirx_cb, first paint; always last

-- touch element, Timer
--[[@ztk]]  Z.tick(self) gtt(0,20)          -- spring, glide, rate-limit flush, LED fades

-- system element, utility event
--[[@zut]]  Z.util(self)                    -- mapping mode, otherwise next page

-- file system (page 00)
/00/zona.lua            -- the library, a copy per page
```

**Setup budget:** about 60 characters for the Library block, 45–110 per zone depending on outputs, about 15 for `Z.start`. That is roughly 8–12 zones. Section 8 covers growing past that.

## 6. Concerns by code area

### 6.1 Generic Library block

A new block that loads Lua modules from the **current page folder**. It is not specific to ZONA; the VSN1 layout library will use it too.

| Short | Name | Event | Category |
|-------|------|-------|----------|
| `lib` | Library | any Setup | `code` |

**Lua form.** One canonical line that the parser reads back exactly:

```lua
local p=string.format("/%02X/",gpc()) Z=require(p.."zona") L=require(p.."layout")
```

- Each row binds a **global name** to a **file in the page folder** (without `.lua`).
- `gpc()` is `page_current()`, so the same block works on any page and in any profile.

**Block face:**

- Rows of *global name* and *file*. File suggestions come from:
  - the **library registry** (libraries the editor ships, such as `zona → Z`);
  - the `.lua` files in the page folder (`fetchDirEntries`).
- Per-row status from the connected module: *present*, *missing*, or, for registry libraries, *older than bundled* or *newer than bundled*.
- **Install** and **Update** buttons for registry libraries: `writeFileContent` into the page folder, then `invalidateLuaModule("/PP/zona")`. A Setup re-run is needed afterwards (phase 0 checks the cleanest way).
- A missing file is a **warning**, not an error. Offline and virtual modules can't check files.

**Registry** (`src/renderer/libraries/registry.ts`):

```ts
export type BundledLibrary = {
  id: string;          // "zona"
  file: string;        // "zona.lua"
  global: string;      // suggested global name: "Z"
  version: string;     // semver, read from the source
  api: number;         // bumped on breaking block syntax
  source: string;      // imported with ?raw
};
```

The library itself sets nothing up beyond returning its table. Library-specific setup (`touch_cb`, `midirx_cb`) is the job of that library's own blocks, here `Z.start(self)`.

### 6.2 Touch action blocks and the zone model

**Blocks** in `src/renderer/config-blocks/`, category **`touch`** (new entry in `ActionBlockInformation.category`, `categoryColors.ts`, and a `--category-touch` CSS variable):

| Short | Name | Event | Notes |
|-------|------|-------|-------|
| `zfd` | Touch Fader | touch Setup | preset `read="axis"` |
| `zbt` | Touch Button | touch Setup | preset `read="gate"` |
| `zxy` | Touch XY Pad | touch Setup | preset `read="point"` |
| `zkn` | Touch Knob | touch Setup | preset `read="angle"` |
| `zgr` | Touch Group | touch Setup | group settings (`empty`) |
| `zst` | Touch Start | touch Setup | `Z.start(self)`, kept last |
| `ztk` | Touch Tick | touch Timer | `Z.tick(self) gtt(0,N)` |
| `zut` | Touch Utility | system utility | `Z.util(self)` |

The Zone Step blocks from rev 1 (`zsi`/`zse`/`zsn`) are dropped. They only made sense inside zone hooks. Inside a callback, the normal If block with `z:step()` does the job.

**Module layout** (`src/renderer/config-blocks/touch/`):

| File | Holds |
|------|-------|
| `zone-model.ts` | `Zone`, `ZoneOutput`, `ZoneKind`, kind presets, defaults, the option schema per kind |
| `zone-parse.ts` | `parseZone(script)`, `zoneToLua(zone)`, `parseLibraryRows` / `libraryRowsToLua` for 6.1 |
| `zone-validate.ts` | validators (below) |
| `ZoneBlock.svelte` | one face for all four kinds, rendered from the schema |

```ts
type ZoneKind = "fader" | "button" | "xy" | "knob";
type Source = "v" | "x" | "y" | "g";

type ZoneOutput = {
  target: "cc" | "note" | "nrpn" | "pb" | "gpa" | "gpb" | "mx" | "my" | "mw" | "mb";
  param?: number;      // cc, note, nrpn number, gamepad axis or button
  ch?: number;
  res?: number;        // 7–14
  min?: number;
  max?: number;
  rx?: { v: boolean; l: boolean };
};

type Zone = {
  name: string;
  kind: ZoneKind;
  x: number; y: number; w: number; h: number;     // cells, 0-based
  outputs: Partial<Record<Source, ZoneOutput>>;
  opt: Record<string, ZoneOptionValue>;            // only non-defaults are written
  unknown?: string;                                // options this editor doesn't know, kept as-is
};
```

**Validators** (`zone-validate.ts`). They follow `config-blocks/validators.ts`: an invalid value keeps the last valid one and shows an inline message.

- **Per zone (v1):** inside 9×9, `w,h ≥ 1`, name is a Lua identifier, MIDI numbers in range, `res` 7–14, `min < max`, the source is valid for the kind, the gamepad range cap.
- **Per surface (shape defined in v1, rules later):** `(zones: Zone[]) => ZoneIssue[]`, run on the whole touch Setup:
  - duplicate zone names (v1, error, since names become Lua fields);
  - **overlap** (later; an error unless a zone sets `overlap=1`);
  - the same MIDI identity on two outputs (later, information only);
  - order: `lib` before zones, `zst` last (v1, warning).
- An issue points at a zone name. The block face and the overlay both show it.

**Picker filtering.** Today `ActionPicker.svelte` filters with hard-coded lists per event. Add a declarative field:

```ts
// ActionBlockInformation additions
elementTypes?: ElementType[];   // where this block may be added; undefined = everywhere
eventTypes?: EventType[];
```

**UI rules:**

- grid-uikit controls only, the same as `SettingsButton.svelte`.
- Simple defaults: a plain fader shows Outputs and LED, with Behaviour, Capture and Input collapsed.
- The Outputs section has one row per source the kind offers. Each row has a target select, its fields, Resolution, and Receive (value / LED), laid out the same way as the MIDI block.

### 6.3 Read-only zone overlay

The precedent is `ControlNameOverlay`. The element name shown there comes from the `sn` block in Setup (`GridElement.load`, `runtime.ts:1432`). Zones work the same way: they are read from the action chain, with no separate state and no write path.

- `ModuleOverlay.Types.TOUCH_ZONES` in `runtime/moduleOverlay.ts`, rendered in `Device.svelte`'s `module-overlay` slot.
- `main/grid-layout/grid-modules/overlays/TouchZonesOverlay.svelte`, which reuses the grid maths in `ZONA.svelte` (`gridSize`, `pctPositions`).
- Derived on every render:

  ```ts
  $: setup = touchElement.findEvent(EventType.SETUP);
  $: zones = $setup.config.filter(isZoneAction).map((a) => parseZone(a.script));
  $: issues = validateSurface(zones);
  ```

- It draws a rectangle per zone, with its name and kind icon, a group badge, an issue outline, and a highlight for the zone whose block is in `selected_actions`.
- It's turned on with the existing overlay toggle, or automatically while a touch block is selected.
- **v1 doesn't write.** Clicking a zone may select its block; that only sets the existing selection store. Drag-to-create, move and resize are stretch goals.

### 6.4 The library file

**Source and versioning**

- In the repo: `src/renderer/libraries/zona/zona.lua`, with `Z.VERSION` (semver) and `Z.API` (integer, bumped when block syntax breaks).
  - Minor: new options or painters. Old blocks keep working.
  - Major: block syntax changes, and the editor migrates blocks.
- Comments are stripped before upload, but the code is **not minified**. Keep it under the documented ~15 KB guideline.
- Unit tests run the library in a Lua VM under vitest (wasmoon or fengari; whichever is added as a dev dependency). They feed `touch_cb` and `midirx_cb` sequences and check the `gms`/`ggms`/`gmms`/LED calls, using stubs.

**Per page, on purpose**

- Each page folder has its own copy: `/PP/zona.lua`. A setup made with v1 and another made with v2 can sit on different pages, and both keep working.
- Profiles already carry page-folder files, so sharing a profile shares the library version it was built with. No profile format change.
- **Element presets** don't carry files. When a preset with touch blocks is applied to a page without the library, the Library block shows *missing* with **Install**.
- **Version read-back** per page:

  ```ts
  `local ok,z=pcall(require,string.format("/%02X/zona",gpc())) return ok and z.VERSION or nil`
  ```

- The editor never updates silently. A newer bundled version appears as **Update** on the Library block.

**Virtual modules:** `ConnectionSimulator` rejects file operations today. Recommended: a small in-memory file store, so the Library block flow can be tested without hardware.

### 6.5 Source of truth and round-trip

- The action strings are the config. The editor has no other zone store.
- `parseZone` and `zoneToLua` round-trip exactly: `zoneToLua(parseZone(s)) === s` for anything the editor wrote.
- Only non-default options are written. Defaults live in `zone-model.ts`; a test checks that the library's defaults match.
- **Unknown options are kept** (`Zone.unknown`), so a block written by a newer editor loses nothing in an older one.
- A script that doesn't parse is shown as a code block with a warning. Nothing is deleted.
- Config travels through `GridEvent.load()` and `sendToGrid()` unchanged. Zone blocks are just actions.

### 6.6 Grid profiles and presets

- **Profiles:** touch blocks are in the touch Setup text and `zona.lua` is in the page folder, so profiles carry both with no format change.
- **Presets:** a touch element preset carries its zone blocks. The library is installed on demand (6.4).
- **Profile Cloud preview:** stretch goal (zones drawn on the thumbnail using `parseZone`).

### 6.7 New APIs

**Lua library (`/PP/zona.lua`)**

| API | Purpose |
|-----|---------|
| `Z.fader/button/xy/knob(name, x, y, w, h, opt)` | Create a zone (presets over `Z.zone`) |
| `Z.zone(name, x, y, w, h, opt)` | Generic zone; `opt.read` decides the kind |
| `Z.group(n, opt)` | Group settings |
| `Z.start(self)` | Sets `touch_cb` and `midirx_cb` (chaining any existing one), first paint |
| `Z.touch(self, id, evt, x, y, p)` | The `touch_cb` |
| `Z.rx(self, header, event)` | The `midirx_cb` |
| `Z.tick(self)` | Called from the Timer |
| `Z.util(self)` | Utility button: mapping mode or next page |
| `opt.on = "name"` → `name(z, e)` | Optional zone callback |
| `z:v() z:x() z:y() z:g() z:step() z:count() z:p()` | Getters |
| `Z.raw = function(self, id, evt, x, y)` | Advanced: raw touch |
| `Z.VERSION`, `Z.API`, `Z.has` | Version and capabilities |

**Editor (TypeScript)**

| Module | Purpose |
|--------|---------|
| `config-blocks/Library.svelte` + `libraries/registry.ts` | Generic page-folder `require`, install and update |
| `config-blocks/touch/zone-model.ts`, `zone-parse.ts`, `zone-validate.ts` | Types, schema, parse and serialize, validators |
| `config-blocks/touch/ZoneBlock.svelte` + block files | Touch blocks |
| `ActionBlockInformation.elementTypes / eventTypes` | Declarative picker filtering |
| `ModuleOverlay.Types.TOUCH_ZONES` + `TouchZonesOverlay.svelte` | Read-only overlay |
| `ConnectionSimulator` in-memory files | Virtual module support |

Not needed any more: `UserInputValue.zoneName`, zone-hook classifiers in `virtual-event.ts`, the profile `requires` field.

**Firmware:** none required (but see 4.5 and phase 0).

## 7. Phases

0. **Firmware facts (hardware spike, short).** Check each of these:
   - Does the utility event fire on release, or can its state be read? This picks the 4.5 variant.
   - Does `gms` with `mode` 1/3 send correct 14-bit CC and NRPN?
   - The gamepad axis range.
   - Does the touch element's `midirx_cb` receive voice messages?
   - `require` from a page folder after a page change, and after re-upload plus `invalidateLuaModule`.
   - Tick CPU cost with 5 contacts at 20 ms.
1. **Library block.** Registry, `lib` parse and serialize, page-folder file status, install and update. Useful on its own, and VSN1 can start using it.
2. **Library v1 + Lua tests.** Pipeline, outputs and resolution, capture and clamping, modes, sensitivity, steps, groups, painters, RX sync, mapping mode.
3. **Touch blocks.** Zone model, parse and serialize, per-zone and surface validators, `ZoneBlock.svelte`, picker filtering, the `touch` category.
4. **Read-only overlay.**
5. **Docs.** Library docs, a mapping mode guide, and an RX sync section next to the MIDI RX docs.
6. **Stretch goals** (section 11) as separate RFCs or PRs.

## 8. When Setup runs out of room

The library itself is in a file. Setup holds the Library block, the zones and `Z.start`.

1. **Callbacks first.** Callback bodies can already live in a user's own page file, loaded with the Library block (4.7). This needs no new editor feature.
2. **Zones in a file.** This is not planned. Moving zone blocks into a generated page file would make a file part of the config. That breaks "action strings are the source of truth" unless unsaved changes, store and profiles all learn about files. If it is ever needed, it gets its own RFC.

## 9. Risks

- **Tick cost.** 20 ms is a guess. Measure on ESP32-S3 with 5 contacts and comet trails. If needed, use a slower LED tick than the output tick.
- **Library load on every page change.** The VM restarts, so `require` reads and compiles the file each time. Measure page switch time.
- **Output flood.** The rate limit protects USB MIDI. Test 14-bit output and RX sync on several zones at once.
- **Resolution expectations.** A 7-bit sensor can't give real 14-bit absolute positions. Mitigated by the hint in 4.2 and good defaults.
- **Mapping mode without release detection.** The fallback order (touch first, then utility) is less obvious. It needs docs, and LED feedback when it starts.
- **RX parsing in Lua.** NRPN and 14-bit pairing cost CPU per message for every element's `midirx_cb`. Keep the index lookup cheap, and measure with dense automation.
- **Copies per page.** Several versions of the library can be in flash at once. That's acceptable at ~15 KB each.
- **Edit vs device drift.** A user can edit `zona.lua` in the FileManager. Version read-back catches a different version but not local edits. A checksum could be added later.

## 10. Open questions

**Resolved in this revision**

- *Library location:* per page folder (`/PP/zona.lua`).
- *Category name:* `touch`.
- *Hook creation UX:* no hooks are created. One optional `on` callback.
- *Library loading:* the generic Library block, shared with VSN1.

**Still open**

1. **`Z.util` ownership.** Should adding the first zone replace the system utility event's `gpl(gpn())` with `Z.util(self)`? It changes existing behaviour, so it probably needs a confirm.
2. **Mapping mode exit:** release of the utility button, a second press, or a timeout? That depends on phase 0.
3. **Defaults table:** generate the library defaults from `zone-model.ts` at build time, or keep two copies checked by a test?
4. **Pressure** (future firmware): `p` as an optional 6th `touch_cb` argument, with `Z.has.pressure` set when the first value arrives.
5. **Library block scope:** global names only, or also `local`? Locals would vanish after Setup, so globals seem right. Confirm with the VSN1 layout needs.

## 11. Stretch goals

Each of these is welcome if it fits cleanly later. None of them may change the v1 API.

- **State that survives page changes and power-up** (values, steps, active group member) in `/PP/zona.state`. If done, it must be left out of profiles, it must not be marked as a config change, and it needs a save before page change in `Z.util`.
- **Interactive surface editor:** drag to create, move, resize, writing back through the same block update path, so history and unsaved changes keep working.
- **Zone-scoped navigation:** selecting a zone on the overlay jumps to its block and its callback.
- **Cross-zone rules:** overlap errors, shared MIDI identity hints.
- **Profile Cloud thumbnails** with zones.
- **HANGAR converter** from a `Surface` JSON to touch blocks.

## 12. References

- `src/renderer/runtime/virtual-event.ts` (PR #1645)
- `src/renderer/config-blocks/Midi.svelte` (`gms` mode, "Receive MIDI" and `gmrr`), `RxMode.svelte` (`grxm`), `SettingsPotmeter.svelte` (`pmo`/`pmi`/`pma`), `SettingsButton.svelte`, `SettingsButton.ts`, `GamePadAxis.svelte`, `MouseMove.svelte`, `ElementName.svelte`, `ActionBlockInformation.ts`, `categoryColors.ts`, `validators.ts`
- `src/renderer/main/panels/configuration/components/ActionPicker.svelte`
- `src/renderer/main/grid-layout/grid-modules/devices/ZONA.svelte`, `Device.svelte`, `overlays/ControlNameOverlay.svelte`, `runtime/moduleOverlay.ts`
- `src/renderer/runtime/runtime.ts` (`GridElement.load` name derivation, `GridPage.sendFiles`)
- `src/renderer/main/panels/FileManager/FileManager.ts`: `writeFileContent`, `invalidateLuaModule`, `fetchDirEntries`, `pageNumberToFolderPath`
- `src/renderer/runtime/connection-simulator.ts`
- grid-fw: `grid_lua.c` (package.path), `grid_protocol.h:131` (909), `grid_ui.c` `grid_ui_bulk_page_load` (VM restart), `lua_src/decode.lua` (`midirx_cb` dispatch to every element), `lua_src/simplemidi.lua`
- docs.intech.studio: *File Manager* (page-folder `require`, profiles with files), *MIDI RX*, *RX Mode*, *Utility Event*
- HANGAR `src/lib/sandbox/` (behaviour reference only)
