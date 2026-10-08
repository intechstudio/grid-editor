# RFC: ZONA zones — a sandbox-style surface editor in Grid Editor

- **Status:** Draft
- **Date:** 2026-10-06
- **Author:** Kristóf Kerti
- **Related:** PR #1645 (virtual events), PR #1589 (XY → ZONA), PR #1596 (virtual flag for Lua immediate exec), HANGAR (`sabotond-dev/hangar`, `src/lib/sandbox/`)

## 1. Summary

Bring HANGAR's Sandbox into Grid Editor. The user draws **zones** (faders, buttons, XY pads, knobs) on the 9×9 ZONA surface. Each zone is an ordinary **action block** on the touch element's Setup event, and its settings are edited in the action list like any other block. A versioned Lua **zone library**, stored on the module's file system, does the heavy work: touch routing, value maths, MIDI output, LED drawing and state saving. Zone hooks (press, change, release) are **virtual events**, so users can attach normal action blocks to them.

The Setup text stays the single source of truth. The surface editor is just another view of it.

## 2. Background: what we know

### 2.1 ZONA hardware and firmware

- Two elements: **touch (0)** and **system (255)**. The touch element has **only Setup (0) and Timer (6)**.
- Touch input is a callback, not an event: `self.touch_cb(self, id, evt, x, y)`, assigned in Setup.
  - `id` 0–4 is a contact slot (the firmware gives the lowest free one, so it is not a stable finger).
  - `evt` is the raw sensor nibble (1 move, 4 down, 5 up; 9 tap is inferred).
  - `x`, `y` are 0–127. No pressure today.
- 81 LEDs, 9×9, serpentine (see `ZONA.svelte`).
- **Action string limit: 909 characters per event** (`GRID_PARAMETER_ACTIONSTRING_maxlength`, `grid_protocol.h:131`). This is a protocol and buffer limit, not a storage limit.
- **File system:** littlefs on ESP32-S3, RP2350 and D51. `package.path = '/?.lua;/?/init.lua'` (`grid_lua.c:537`), so `require("zona")` loads `/zona.lua` with no 909 limit.
- **Page change restarts the Lua VM** (`grid_ui_bulk_page_load` → `grid_lua_stop_vm` / `grid_lua_start_vm`). All Lua state is lost. Encoder and button values survive because they live in C template buffers. Zone state does not.

### 2.2 What PR #1645 gave us

`src/renderer/runtime/virtual-event.ts`:

- A **virtual event** is a top-level `fst`/`fen` Function block on the **Setup** event, whose first line matches `name = function(params)`. Dotted names such as `Z.f1.change` are allowed.
- `VirtualGridEvent` is a proxy over that slice of Setup. `insert`, `remove`, `sendToGrid` and `store` go to the host. `getAvailableChars()` is the shared Setup budget.
- `realEvent` on `GridEvent` is used for "same underlying event" checks (`operations.ts` `dropActions`).
- Navigation: `user_input.virtualEventName`, tabs in `EventPanel.svelte`, columns in Multi View (`Configuration.svelte`), `AddVirtualEvent.svelte` modal, `lib/function-suggestions.ts`.

What it does not solve:

- It doesn't reduce configuration complexity. There are no blocks for common touch scenarios.
- All virtual events share Setup's 909 characters.
- Only Setup is scanned (`EventType.SETUP` hard-coded in three places).

### 2.3 What HANGAR's Sandbox does

- `model.ts`: a `Surface` of `Region`s (fader, button, knob, XY, blank) on the 9×9 grid, with MIDI options, min/max, flags, colour, radio group.
- `emit.ts` and `runtime.ts`: turn the surface into **minified Lua** (`J` region table, `M` cell map, single-letter runtime), packed across 2–5 slots (touch Setup and Timer, system event 4), to fit 909 characters.
- Output is `--[[@cb]]` code blocks. **Grid Editor can't read them back as anything but raw code.**
- GPL-3.0, same as Grid Editor. Code can be ported with the copyright headers kept.

HANGAR's packing exists only because of the 909 limit. With the library in a file, we don't need it.

## 3. Goals and non-goals

**Goals**

1. Visual zone editor over the ZONA module in the centre layout (drag to create, move, resize).
2. Each zone is an action block, edited in the right-hand action list with grid-uikit controls.
3. Zone behaviour is shared by one library: modes, sensitivity, spring, glide, steps, groups, LED painters.
4. Hooks per zone as virtual events, filled with normal action blocks.
5. State (values, steps, active group member) survives page changes and power-up, stored in a file.
6. Works with profiles, presets, copy and paste, undo, and the unsaved-changes markers.
7. The library is versioned, and the editor installs and updates it.

**Non-goals (for now)**

- A browser preview that runs Lua (HANGAR's wasmoon host). Tuning needs hardware.
- Pressure. The design leaves room for it (section 10.3).
- Importing HANGAR catalog entries. Possible later, as a converter.
- Any firmware change. Everything here works on current firmware.

## 4. Core concepts

### 4.1 Every zone is an XY control

A button, fader, knob and XY pad share one pipeline. The kind only decides how the position is **read**:

```
contact → position → read → output → paint
```

| Kind   | `read`  | Values | Notes |
|--------|---------|--------|-------|
| xy     | `point` | 2      | x and y |
| fader  | `axis`  | 1      | vertical or horizontal |
| knob   | `angle` | 1      | polar: angle around the zone centre |
| button | `gate`  | 0D     | down or up; toggle and steps on top |

A **kind is a preset of options**, not a separate implementation. Every option works on every kind where it makes sense, for example a glide fader or a stepped XY pad.

### 4.2 Shared stages

- **Contact policy** (`contact`): `new` (each press is its own source), `move` (a press re-targets the value: glide), `grab` (a press continues from the current value: relative).
- **Position mode** (`mode`): `abs` (jump), `rel` (drag delta, with `speed`), `glide` (move toward the finger, with `speed` and `ease`).
- **Approach:** one tick-driven "move value toward target" function. It is used by spring (target = centre on release), glide (target = finger) and smoothing.
- **Sensitivity:** deadband → smoothing → send only on change → rate limit (flushed by the tick). In the UI this is one select (Low / Normal / High), with raw numbers under "advanced".
- **Steps:** same meaning as Grid's button mode `bmo` (0 momentary, 1 toggle, n = n+1 steps), with the same step-value maths (`SettingsButton.calculateStepValuesFirmwareStyle`).
- **Groups:** radio groups 1–8. A press sends the other members' "off" first, then this zone's "on". The `empty` setting decides whether all members can be off.
- **Painters:** `fill`, `dot`, `comet`, `crosshair`, `target`. They draw into a per-zone frame buffer, and the library sends only the cells that changed. Painters draw the **value**, not the finger, so relative, glide, spring and "keep last state" all display correctly.
- **Release** (`release`): `clear`, `fade` or `keep` (show the last state dimmed).

### 4.3 Zone events

Each zone acts like a **virtual element** with its own events, the way a real element has Setup, Button and Encoder events:

| Code | Name    | Hook field  | When |
|------|---------|-------------|------|
| 1    | Press   | `press`     | contact lands, or step or group changes |
| 2    | Change  | `change`    | the sent value changes |
| 3    | Release | `release`   | contact lifts |

Hook signature is the same for every kind: `function(z)`. `z` is the zone object, with getters that read like element getters (`self:bva()`): `z:v()`, `z:x()`, `z:y()`, `z:step()`, `z:finger()`, `z:count()`, and later `z:p()`.

Groups have one extra hook: `Z.groups[n].change = function(z)`.

## 5. Device layout

```lua
-- touch element, Setup (must stay under 909 characters)
--[[@zlib]] Z=require("zona") self.touch_cb=Z.touch
--[[@zfd]]  Z.fader("f1",0,0,1,9,{cc=1})
--[[@zbt]]  Z.button("b1",2,0,2,2,{note=60,bmo=1,group=1})
--[[@zxy]]  Z.xy("pad",4,0,5,5,{cc=10,cc2=11,mode="glide",led={"crosshair","target"}})
--[[@fst]]  Z.f1.change = function(z)          -- virtual event tab "Z.f1.change"
--[[@gms]]    gms(0,176,7,z:v())
--[[@fen]]  end
--[[@zend]] Z.ready()                           -- restore state, first paint; always last

-- touch element, Timer
--[[@ztk]]  Z.tick(self) gtt(0,20)              -- springs, glide, rate limit flush, LED fades, state save

-- system element, utility event
--[[@zpg]]  Z.save() gpl(gpn())                 -- next page, saving state first

-- file system
/zona.lua             -- the library (one per device, versioned)
/PP/zona.state        -- runtime state per page (written by the library, not config)
```

**Budget estimate for Setup:** about 45 characters for `zlib`, 40–80 per zone, about 10 for `zend`. That is roughly 10–14 zones plus a few small hooks. Section 8 describes how to grow past that.

## 6. Concerns by code area

### 6.1 Action blocks

**New blocks** in `src/renderer/config-blocks/`. Following the existing pattern, each block has an `information` export, a face component, and a parser that uses `extractParam`-style helpers.

| Short | Name           | Event          | Type      | Notes |
|-------|----------------|----------------|-----------|-------|
| `zlib`| Zona Library   | touch Setup    | single    | Loads the library and sets `touch_cb`. Added automatically. Not movable below zones. |
| `zfd` | Touch Fader    | touch Setup    | single    | Preset `read="axis"` |
| `zbt` | Touch Button   | touch Setup    | single    | Preset `read="gate"` |
| `zxy` | Touch XY Pad   | touch Setup    | single    | Preset `read="point"` |
| `zkn` | Touch Knob     | touch Setup    | single    | Preset `read="angle"` |
| `zgr` | Zone Group     | touch Setup    | single    | Group settings (`empty`). Only shown once a group exists. |
| `zend`| Zona Ready     | touch Setup    | single    | `Z.ready()`. Added automatically, kept last. |
| `ztk` | Zona Tick      | touch Timer    | single    | `Z.tick(self) gtt(0,N)` |
| `zpg` | Zona Page Next | system utility| single    | `Z.save() gpl(gpn())` |
| `zsi`/`zse`/`zsn` | Zone Step If / Else If / End | zone hooks | composite | Mirror Button Step, but test `z:step()` |

**One shared implementation behind the four zone kinds:**

- `config-blocks/zona/zone-model.ts`: the `Zone` type, `PRESET`, the `OPTIONS` schema per kind, defaults, `parseZone(script)`, `zoneToLua(zone)`.
- `config-blocks/zona/ZoneBlock.svelte`: one face, rendered from `OPTIONS[kind]`. The four block files only differ in `information` and preset.

```ts
type ZoneKind = "fader" | "button" | "xy" | "knob";

type Zone = {
  name: string;
  kind: ZoneKind;
  x: number; y: number; w: number; h: number;   // cells, 0-based
  opt: Record<string, ZoneOptionValue>;          // only non-defaults are written to Lua
  unknown?: string;                              // options this editor doesn't know, kept as-is
};

// Fields appear only when they make sense (kind + earlier choices)
const OPTIONS: Record<ZoneKind, OptionGroup[]> = {
  fader: [
    group("Input",     [select("sensitivity", ["low", "normal", "high"])]),
    group("Behaviour", [select("mode", ["abs", "rel", "glide"]),
                        when((o) => o.mode !== "abs", slider("speed")),
                        slider("spring", 0, 16),
                        when((o) => o.spring > 0, number("center")),
                        toggle("keep")]),
    group("Output",    [cc, ch, select("bits", [7, 14]), min, max]),
    group("LED",       [multiselect("led", ["fill", "dot", "comet"]), color("col"),
                        select("release", ["clear", "fade", "keep"])]),
  ],
  // button, xy, knob: same groups, different fields
};
```

**UI rules (from the existing config editing experience):**

- Use grid-uikit controls only (`MeltCombo`, `MeltRadio`, `Toggle`, `Block`, `BlockRow`), the same as `SettingsButton.svelte`.
- Keep the defaults simple. A plain fader shows Output and LED; Behaviour and Input are collapsed.
- Validators follow `config-blocks/validators`. An invalid value keeps the last valid one and shows an inline message.
- A new category `"touch"` in `ActionBlockInformation.category` and `categoryColors.ts` (with a `--category-touch` CSS variable).

**Picker filtering:** zone blocks may only appear on the ZONA touch Setup, `ztk` on the touch Timer, and `zpg` on the system element. Today `ActionPicker.svelte` filters with hard-coded short lists per event (lines ~189–225). Adding a declarative field is cleaner:

```ts
// ActionBlockInformation additions
elementTypes?: ElementType[];   // where this block may be added; undefined = everywhere
eventTypes?: EventType[];
requires?: { zona?: string };   // minimum library version (semver range)
```

### 6.2 Configuration panel changes

**Surface editor overlay (centre layout)**

- A new `ModuleOverlay.Types.ZONA_SURFACE` in `runtime/moduleOverlay.ts`, rendered in `Device.svelte`'s `module-overlay` slot, next to `CalibrationOverlay`.
- It's shown when a ZONA touch element is selected and the overlay is turned on (a toggle in the configuration header, or automatically when a zone block is selected).
- Component: `main/grid-layout/grid-modules/overlays/ZonaSurfaceOverlay.svelte`. Its grid maths reuse `ZONA.svelte` (`gridSize`, `pctPositions`).

**Behaviour**

- **No separate state.** Zones are derived from the Setup event's actions:

  ```ts
  $: zones = setup.config.filter(isZoneBlock).map((a) => parseZone(a.script));
  ```

- **Create:** drag a rectangle, choose a kind → `addActions(setup, indexBefore("zend"), [zoneAction(kind, rect)])`.
- **Move, resize:** update the block's script through the same path a block face uses, so history and unsaved-changes work.
- **Delete:** `removeActions`, with the same confirm pattern as removing a virtual event.
- **Selection:** a selected zone on the surface and a selected block in the action list are the same thing, via the existing `selected_actions` store.
- **Conflicts:** overlaps are prevented by default, and the conflict is shown on the affected zone. A duplicate goes to a free area. Repeated MIDI assignments are informational only.
- **Groups:** members share an outline colour and a number badge (not colour alone). Multi-select → "Group" assigns the next free number.

**Event panel**

- When a zone is selected, `EventPanel.svelte` shows that zone's events: **Settings** (the zone block itself) | **Press** | **Change** | **Release**, the same way a real element shows its events. Hooks that don't exist yet are created when clicked (section 6.4).
- Outside zone selection, the touch element shows Setup and Timer as today.

**Character budget**

- The Toolbar counter and the Multi View header already show `used/budget` for virtual events. For zones, show the zone's own size and the remaining Setup budget, the same way.
- Warn when the next zone would not fit, and offer the remedy from section 8.

### 6.3 Versioned file-system module (`/zona.lua`)

**Source and versioning**

- The library lives in the editor repo: `src/renderer/zona/lib/zona.lua`, with `Z.VERSION` (semver) and `Z.API` (integer, bumped on breaking block syntax).
  - Minor: new options or painters. Old blocks keep working.
  - Major: block syntax changes. The editor must migrate blocks.
- It is imported as a raw string (`?raw`), so the editor always has its bundled version.
- Unit tests run the library in a Lua VM under vitest (wasmoon or fengari). HANGAR's `runtime.spec.ts` is the model: run the Lua, then measure it.

**Install and update** (`src/renderer/zona/zona-library.ts`):

```ts
export const BUNDLED = { version: Z_VERSION, api: Z_API, source: zonaLua };

export async function readInstalledVersion(module: GridModule): Promise<string | null> {
  const { value } = await module.execLUAImmediateAndEvalaute(
    `local ok,z=pcall(require,"zona") return ok and z.VERSION or nil`);
  return value[0] ?? null;
}

export async function ensureInstalled(module: GridModule, required: string) {
  const installed = await readInstalledVersion(module);
  if (installed && satisfies(installed, required)) return;
  await writeFileContent("/zona.lua", BUNDLED.source, module, 200);   // FileManager.ts
  await invalidateLuaModule("zona", module);
}
```

- It runs when a zone block is first added, before a profile with zones is loaded, and when connecting a ZONA (shown as "Library update available", never silent).
- **One library per device**, at the root, so two pages can't use different versions.
- Before upload, the source is stripped of comments but **not minified**. Readability on the device matters more than flash.

**Virtual modules:** `ConnectionSimulator` rejects file operations today. Either support a small in-memory file store for `/zona.lua` and `zona.state`, or let virtual ZONA modules skip the install step. Recommended: the in-memory store, so the editor flow can be tested without hardware.

### 6.4 Virtual events

**Zone hooks are virtual events.** They are `fst` blocks with names like `Z.f1.change = function(z)`. `NAME_REGEX` already matches dotted names, so they are detected today.

Changes to `virtual-event.ts` and its consumers:

1. **Group virtual events by owner.** Add a classifier that recognises `Z.<zone>.<event>` and `Z.groups[<n>].change`, and returns `{ zone, event, code }`. Zone hooks are shown under their zone (section 6.2), not as a flat list of tabs. Other named functions stay as they are.
2. **Creation with the right signature.** Creating a hook inserts `fst` + `fen` just before `zend`, with the fixed signature `function(z)`. The user never types it. `AddVirtualEvent.svelte` stays for free-form functions.
3. **Suggestions inside hooks.** Blocks inside a zone hook get `z:v()`, `z:x()`, `z:step()` and so on as field suggestions (`MeltCombo` suggestions, the same way `function-suggestions.ts` works).
4. **Removing a zone removes its hooks**, after one confirm that names them.
5. **Lift the Setup-only restriction.** Make the host event a parameter instead of `EventType.SETUP` in `EventPanel.svelte`, `Configuration.svelte` and `listVirtualEvents` callers. This is not needed for phase 1, but it removes a hidden assumption.

**Not chosen:** one virtual event per finger (1–5). Contact ids are sensor slots, not stable fingers, and users think in zones. Raw access stays possible with one advanced hook, `Z.raw = function(self, id, evt, x, y)`, edited as code.

**Later: file-backed virtual events** (section 8). `VirtualGridEvent` already isolates storage behind `config`, `insert`, `remove`, `sendToGrid`, `hasChanges` and `getAvailableChars`, so a second implementation that stores the body in `/PP/hooks.lua` can be added without changing `ActionList`.

### 6.5 Reading ZONA config back and forth

**Editor ↔ Lua (block level)**

- `parseZone(script)` and `zoneToLua(zone)` must round-trip exactly: `zoneToLua(parseZone(s)) === s` for anything the editor wrote.
- Only non-default options are written. Defaults live in one table shared by the editor and the library (generated from `zone-model.ts` into the library at build time, or checked by a test).
- **Unknown options are preserved** (`Zone.unknown`). A block written by a newer editor or library must not lose data in an older editor.
- If a script doesn't parse, the block is shown as a code block with a warning. Nothing is deleted.

**Editor ↔ device**

- Config: unchanged. Setup and Timer are loaded and sent through `GridEvent.load()` / `sendToGrid()`. Zone blocks are just actions.
- Library: version read back on connect (section 6.3).
- State: `/PP/zona.state` is **runtime data, not config.** The editor doesn't read it into the config, doesn't mark it as a change, and shows it greyed out in the FileManager.

**Order rules enforced by the editor**

- `zlib` first, then zones and groups, then hooks, then `zend` last.
- Dropping or pasting a block in the wrong place puts it in the nearest valid position. This is the same idea as composite blocks keeping their structure.

**State saving (file only)**

- Discrete changes (toggle, step, group) are saved immediately.
- Continuous values (fader, knob, XY) are saved 1 second after release, from the tick.
- `zpg` saves before a page change from the utility button.
- Writes are skipped when the snapshot is unchanged, to protect the flash.
- Known limitation: a page change from the editor or by MIDI within 1 second of a continuous move loses that move.

Library docs remark:

> Zone state (values, steps, the active group member) is saved to `/PP/zona.state` and restored on page load and power-up. Toggles and steps are saved at once. Faders, knobs and XY pads are saved 1 s after release, or immediately when the page is changed with the utility button.

### 6.6 Grid profiles

- **Profile content:** zone blocks are in the touch Setup text, so profiles carry them with no format change.
- **Library dependency:** profiles don't bundle `/zona.lua` (it's at the root, not in the page folder). Add a field to the profile JSON:

  ```json
  { "requires": { "zona": ">=1.3.0" } }
  ```

  The editor computes it on save as the highest `requires.zona` among the blocks used. On load (`operations.ts`, before `sendFiles` / `sendProfile`), it runs `ensureInstalled`.
- **State file:** exclude `zona.state` when collecting page files for a profile (`ProfileCloud.svelte`, lines ~253–291). A profile is the configuration, not the last finger position. Profile load already clears the page folder (`clearDirFiles`), which also resets the state. That is the intended behaviour.
- **Element presets:** a touch element preset carries its zones and hooks like any Setup content. Pasting zones onto a surface that already has zones in the same cells shows the conflict UI rather than overwriting.
- **Profile Cloud preview:** show zones on the module thumbnail (rectangles), using `parseZone`.
- **Later:** a converter from a HANGAR `Surface` (JSON) to zone blocks, so catalog entries can be opened in the editor.

### 6.7 New APIs

**Lua library (`/zona.lua`)**

| API | Purpose |
|-----|---------|
| `Z.fader/button/xy/knob(name, x, y, w, h, opt)` | Create a zone (presets over `Z.zone`) |
| `Z.zone(name, x, y, w, h, opt)` | Generic zone, `opt.read` decides the kind |
| `Z.group(n, opt)` | Group settings |
| `Z.touch(self, id, evt, x, y, p)` | The `touch_cb` |
| `Z.tick(self)` | Called from the Timer |
| `Z.ready()` | Restore state, first paint |
| `Z.save()` | Write state if changed |
| `Z.<name>.press/change/release = function(z)` | Zone hooks |
| `Z.groups[n].change = function(z)` | Group hook |
| `z:v() z:x() z:y() z:p() z:step() z:finger() z:count()` | Getters inside hooks |
| `Z.raw = function(self, id, evt, x, y)` | Advanced: raw touch |
| `Z.VERSION`, `Z.API`, `Z.has` | Version and capabilities |

**Editor (TypeScript)**

| Module | Purpose |
|--------|---------|
| `config-blocks/zona/zone-model.ts` | Types, presets, option schema, parse and serialize |
| `config-blocks/zona/ZoneBlock.svelte` | Shared block face |
| `zona/zona-library.ts` | Bundled library, version read-back, install |
| `zona/zones.store.ts` | Zones derived from the selected touch Setup |
| `ModuleOverlay.Types.ZONA_SURFACE` + `ZonaSurfaceOverlay.svelte` | Surface editor |
| `ActionBlockInformation.elementTypes / eventTypes / requires` | Declarative picker filtering and version needs |
| `virtual-event.ts`: classifier and zone-hook creation | Zone events as virtual events |
| `UserInputValue.zoneName?` | Selected zone, next to `virtualEventName` |
| Profile JSON `requires` | Library dependency |
| `ConnectionSimulator` in-memory files | Virtual ZONA support |

**Firmware:** none required.

**grid-protocol:** none required. Optional later: register the new block shorts so other tools (HANGAR, docs) know them.

## 7. Phases

1. **Library spike (hardware).** Write `/zona.lua` with one fader and one button, a `require` stub in Setup, and the tick. Check: works after store, reboot and page switch; `invalidateLuaModule` plus Setup re-run picks up a re-upload; CPU load with 5 fingers and a 20 ms tick.
2. **Library v1 + tests.** Pipeline, modes, sensitivity, spring, glide, steps, groups, painters, state file. Lua unit tests under vitest.
3. **Blocks.** `zone-model.ts`, `ZoneBlock.svelte`, the block files, picker filtering, library install on first use.
4. **Surface overlay.** Create, move, resize, delete, selection sync, conflicts.
5. **Zone events.** Classifier, hook creation, zone-scoped event panel, suggestions, Zone Step blocks.
6. **Profiles.** `requires`, state-file exclusion, load-time install, thumbnails.
7. **Later.** File-backed hooks and zone lists (section 8), HANGAR import, pressure.

## 8. When Setup runs out of room

The library's size is not a problem; it's in a file. Setup still holds the zones and the hooks. When those outgrow 909 characters, there are two steps, in this order:

1. **Hooks to file.** Hook bodies move to `/PP/hooks.lua` as file-backed virtual events (section 6.4). Setup keeps only zones.
2. **Zones to file.** The editor generates `/PP/zones.lua` from the zone blocks and Setup becomes `zlib` + `require` + `zend`.

In both cases the editing experience doesn't change: the user still edits blocks. Only where they are stored changes. This needs a "files are part of the config" model (unsaved changes, store and profiles cover the page files), which is the biggest piece of design work in this RFC and deserves its own follow-up.

## 9. Risks

- **Tick cost.** 20 ms is a guess. Measure on ESP32-S3 with 5 contacts and comet trails. If needed, use a slower LED tick than the MIDI tick.
- **Library reload on every page change.** The VM restarts, so `require` reads and compiles `/zona.lua` every time. Measure page switch time.
- **MIDI flood.** The rate limit protects USB MIDI. Test 14-bit output on several zones at once.
- **Flash wear.** State writes happen only on change and with a delay. Watch it in the field.
- **No preview.** The ZONA view only shows LEDs a real module reports. Virtual modules won't animate.
- **Edit vs device drift.** A user can edit `/zona.lua` in the FileManager. Version read-back catches different versions but not local edits. A checksum could be added later.

## 10. Open questions

1. **Hook creation UX:** create all three hooks with a zone, or only when the user opens one? Recommendation: only on open; empty hooks cost characters.
2. **`zpg` ownership:** should the editor add it to the system element automatically when the first zone is created, replacing the default utility action? It changes existing behaviour, so it probably needs a confirm.
3. **Pressure** (future firmware): add `p` as an optional 5th `touch_cb` argument. The library treats `nil` as "not supported" and sets `Z.has.pressure` the first time a value arrives. The editor shows pressure options only when the firmware version and the library both support it.
4. **Library location:** root `/zona.lua` (recommended) versus a per-page copy. Root means profiles depend on it rather than carrying it.
5. **Defaults table:** generate the library's defaults from `zone-model.ts`, or keep two copies checked by a test?
6. **Category name:** `"touch"` vs `"zona"` for the new blocks.

## 11. References

- `src/renderer/runtime/virtual-event.ts`: virtual events (PR #1645)
- `src/renderer/main/panels/configuration/EventPanel.svelte`, `Configuration.svelte`, `ActionList.svelte`, `components/ActionPicker.svelte`, `components/Toolbar.svelte`
- `src/renderer/config-blocks/SettingsButton.svelte`, `SettingsButton.ts`, `ButtonStep_If.svelte`, `Function_Start.svelte`, `ActionBlockInformation.ts`, `categoryColors.ts`
- `src/renderer/main/grid-layout/grid-modules/devices/ZONA.svelte`, `Device.svelte`, `runtime/moduleOverlay.ts`
- `src/renderer/main/panels/FileManager/FileManager.ts`: `writeFileContent`, `invalidateLuaModule`, `pageNumberToFolderPath`
- `src/renderer/runtime/operations.ts` (profile load with files), `runtime.ts` `GridPage.sendFiles`, `main/panels/profileCloud/ProfileCloud.svelte`
- `src/renderer/runtime/connection-simulator.ts`
- grid-fw `main`: `common/src/c/grid_lua.c:537` (package.path), `grid_protocol.h:131` (909), `grid_ui.c` `grid_ui_bulk_page_load` (VM restart, template buffers), `common/src/lua/init.lua`
- HANGAR: `src/lib/sandbox/{model,emit,runtime,geometry}.ts`, `docs/entries/sandbox-runtime.md`, `.planning/research/ZONA-CAPABILITIES.md`, `.planning/phases/13-gui-overhaul/bible/HANGAR-ZONA-GUI-design-specification.md`
