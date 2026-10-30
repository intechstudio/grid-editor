<script lang="ts">
  // The face of the zone block (docs/zona-touch-zones.md, Block face). A block
  // defines one or more zones, one line each. Everything comes from the
  // action's script: parseZones reads it, every edit writes zonesToLua back
  // through the normal block update, and a select at the top picks the zone
  // the fields edit. A value the validators reject is sent as an invalid
  // action, so the module keeps the last valid script. A script that doesn't
  // parse is shown as it is and never rewritten (docs/zona-touch-zones.md, The zone line).
  import { createEventDispatcher } from "svelte";
  import {
    Block,
    BlockRow,
    IconButton,
    MeltCombo,
    MeltRadio,
    MeltSelect,
    MoltenInput,
  } from "@intechstudio/grid-uikit";
  import { tick } from "svelte";
  import { get } from "svelte/store";
  import { appClipboard, ClipboardKey } from "../../runtime/clipboard.store";
  import { logger } from "../../runtime/runtime.store";
  import { appSettings } from "../../runtime/app-helper.store";
  import addIcon from "../../assets/icons/add.svg?raw";
  import type {
    ActionData,
    GridAction,
    GridEvent,
  } from "../../runtime/runtime";
  import { type OptionSchema, type Zone, zoneRead } from "./zone-model";
  import { parseZones, zonesOf, zonesToLua } from "./zone-parse";
  import { zoneNumsText, zoneOutputLabel } from "./zone-autos";
  import { Grid } from "../../lib/_utils";
  import { globalsLoadedBefore } from "../../lib/library";
  import { libraryIssue, loadSetupsBefore } from "./zone-library";
  import {
    surfaceIssues,
    zoneProblems,
    zoneSendProblem,
  } from "./zone-validate";
  import {
    type ZoneField,
    optionLabel,
    optionPlaceholder,
    optionText,
    withField,
    addedZone,
    placedCopy,
    enumOptions,
    withZoneType,
    zoneCssColor,
    zoneType,
    zoneTypeLabel,
    zoneTypeSchema,
    zoneOptionSuggestions,
    withOption,
    zoneFaceSections,
  } from "./zone-blocks";
  import ZoneOptionField from "./ZoneOptionField.svelte";
  import ZoneGeometryPad from "./ZoneGeometryPad.svelte";

  export let action: GridAction;

  // The whole touch Setup, for issues that depend on other blocks.
  const event = action.parent as GridEvent;

  const dispatch = createEventDispatcher();

  // The block's zones and the one the fields edit; zone is that one.
  let zones: Zone[] | null = null;
  let selected = 0;
  let zone: Zone | null = null;
  // Text that can't be written at all (not a number), per field.
  let fieldErrors: Record<string, string> = {};

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    zones = parseZones(data.script);
    selected = Math.min(selected, Math.max((zones?.length ?? 1) - 1, 0));
    picked = selected;
    fieldErrors = {};
  }

  // MeltSelect only binds its target, and can set it to undefined: keep the
  // last zone then.
  let picked: number | undefined = 0;
  $: handlePick(picked);
  function handlePick(value: number | undefined) {
    if (typeof value === "number" && value !== selected) {
      selected = value;
      fieldErrors = {};
    }
  }

  // The Type is a row of buttons when the block is wide enough, a select
  // otherwise (as in the MIDI block). 360px at the default 12px font size, in
  // em so the breakpoint follows the font size setting.
  const WIDE_BREAKPOINT_EM = 30;
  let containerWidth = 0;
  $: isWide =
    containerWidth / $appSettings.persistent.fontSize > WIDE_BREAKPOINT_EM;
  const typeOptions = enumOptions(zoneTypeSchema, "");

  // After the statement that reads the action: it assigns zones inside a
  // function, which Svelte can't see, so the order here is the source order.
  $: zone = zones?.[selected] ?? null;

  // The radio binds this; picking a button sets the type.
  let typeTarget = "v";
  $: typeTarget = zone === null ? "v" : zoneType(zone);
  $: handleTypeRadio(typeTarget);
  function handleTypeRadio(type: string) {
    if (zone !== null && type !== zoneType(zone)) {
      setType(type);
      sync();
    }
  }

  $: zoneOptions = (zones ?? []).map((e, i) => ({
    title: `${e.name} (${zoneTypeLabel(e)})`,
    value: i,
  }));

  $: sections = zone !== null ? zoneFaceSections(zone) : [];

  $: problems = zone !== null ? zoneProblems(zone) : [];
  // Issues of this zone that no field shows (a duplicate name): errors stop
  // the Setup from being sent until fixed.
  $: sendProblem = zoneSendProblem(
    $action.script,
    $event.config.map((e) => e.script),
  );
  // Issues of the block's zones that no field shows, with the zone's name
  // when the block has several.
  $: zoneIssues =
    zones !== null
      ? surfaceIssues($event.config.map((e) => e.script)).filter(
          (e) =>
            zones!.some((z) => z.name === e.zone) &&
            !(
              e.zone === zone?.name &&
              problems.some((p) => p.message === e.message)
            ),
        )
      : [];
  // The first zone of the Setup tells when no Library block that runs before
  // it loads zona. Not shown until the earlier Setups are loaded.
  $: isFirstZone =
    $event.config.find((e) => parseZones(e.script) !== null)?.id === action.id;
  let libraryRequested = false;
  let libraryKnown = false;
  $: if (isFirstZone && !libraryRequested) {
    libraryRequested = true;
    loadSetupsBefore(event).then(() => (libraryKnown = true));
  }
  $: library =
    isFirstZone && libraryKnown && $event
      ? libraryIssue(globalsLoadedBefore(action))
      : undefined;
  // What the zone sends, for the Output section: "auto (…)" placeholders show
  // the resolved channel (1-based, as the label) and number.
  // The zones before this one count for the autos: the event is a
  // dependency (the extra arguments are only reactive dependencies).
  $: midi = zoneMidiOf($action, $event, selected);
  function zoneMidiOf(..._dependencies: unknown[]) {
    return Grid.Auto.getZoneMidi(action, selected);
  }
  $: placeholderOf = (key: string): string => {
    const text = zone !== null ? optionPlaceholder(zone, key) : "";
    if (midi && key === "ch") {
      return `${text} (ch ${midi.ch + 1})`;
    }
    if (midi && key === "num" && midi.nums.length > 0) {
      return `${text} (${zoneNumsText(midi)})`;
    }
    return text;
  };

  // The module's colour, for a channel left at -1.
  $: autoColor = autoColorOf($action, $event);
  function autoColorOf(..._dependencies: unknown[]) {
    return {
      red: Grid.Auto.getRGB(action, Grid.Auto.Value.LED_RED),
      green: Grid.Auto.getRGB(action, Grid.Auto.Value.LED_GREEN),
      blue: Grid.Auto.getRGB(action, Grid.Auto.Value.LED_BLUE),
    };
  }

  // The other zones of the Setup, in this block and in the others, for the
  // pad's preview. This block's carry their index, so a click selects them.
  $: others = [
    ...zonesOf(
      $event.config.filter((e) => e.id !== action.id).map((e) => e.script),
    ).map((e) => ({ zone: e, index: undefined as number | undefined })),
    ...(zones ?? []).map((e, i) => ({ zone: e, index: i })),
  ]
    .filter((e) => e.index !== selected)
    .map(({ zone: e, index }) => ({
      name: e.name,
      x: e.x,
      y: e.y,
      w: e.w,
      h: e.h,
      color: zoneCssColor(e, autoColor),
      index,
    }));

  function selectZone(index: number) {
    selected = index;
    picked = index;
    fieldErrors = {};
  }

  $: problemOf = (key: string) =>
    fieldErrors[key] ?? problems.find((e) => e.key === key)?.message;

  function apply(key: string, result: { next?: Zone; error?: string }) {
    const next = result.next;
    if (typeof next === "undefined") {
      fieldErrors = { ...fieldErrors, [key]: result.error ?? "Invalid" };
      return;
    }
    const { [key]: _, ...rest } = fieldErrors;
    fieldErrors = rest;
    commit((zones ?? []).map((e, i) => (i === selected ? next : e)));
  }

  // Writes the block's zones to the action. A problem in any zone makes the
  // action invalid, so the module keeps the last valid script.
  function commit(next: Zone[]) {
    zones = next;
    dispatch("update-action", {
      short: action.short,
      script: zonesToLua(next),
      validationError:
        next.some((e) => zoneProblems(e).length > 0) ||
        Object.keys(fieldErrors).length > 0,
    });
  }

  // The problem typed text would give a field, for the field's red state.
  function textProblem(
    key: string,
    result: { next?: Zone; error?: string },
  ): string | undefined {
    if (typeof result.next === "undefined") {
      return result.error;
    }
    // Red right away for a name another zone has. Only the red state uses
    // this text; the issue line above the fields says why.
    if (key === "name" && otherZoneNames().includes(result.next.name)) {
      return "duplicate";
    }
    return zoneProblems(result.next).find((e) => e.key === key)?.message;
  }

  // Names of the other zones of the Setup, in other blocks and in this one.
  function otherZoneNames(): string[] {
    return [
      ...zonesOf(
        event.config.filter((e) => e.id !== action.id).map((e) => e.script),
      ),
      ...(zones ?? []).filter((_, i) => i !== selected),
    ].map((e) => e.name);
  }

  // Scripts of the Setup except this block's zone number `except`.
  function scriptsWithout(except: number): string[] {
    return [
      ...event.config.filter((e) => e.id !== action.id).map((e) => e.script),
      zonesToLua((zones ?? []).filter((_, i) => i !== except)),
    ].filter((e) => e !== "");
  }

  const fieldValid = (field: ZoneField) => (text: string) =>
    zone !== null &&
    typeof textProblem(field, withField(zone, field, text)) === "undefined";

  const optionValid = (schema: OptionSchema) => (text: string) =>
    zone !== null &&
    typeof textProblem(schema.key, withOption(zone, schema, text)) ===
      "undefined";

  function setField(field: ZoneField, text: string) {
    if (zone !== null) {
      apply(field, withField(zone, field, text));
    }
  }

  function setOption(schema: OptionSchema, text: string) {
    if (zone !== null) {
      apply(schema.key, withOption(zone, schema, text));
    }
  }

  // The box on the pad sets all four numbers at once.
  function setGeometry(box: { x: number; y: number; w: number; h: number }) {
    if (zone === null) {
      return;
    }
    const rest = { ...fieldErrors };
    for (const field of GEOMETRY) {
      delete rest[field];
    }
    fieldErrors = rest;
    apply("x", { next: { ...zone, ...box } });
  }

  // The select at the top: a fader's direction, or a button.
  function setType(type: string) {
    if (zone === null) {
      return;
    }
    apply("dir", {
      next: withZoneType(zone, type, scriptsWithout(selected)),
    });
  }

  // The pencil swaps the select for the zone's name, like renaming an element.
  let editingName = false;
  let nameInput: MoltenInput | undefined;
  $: if (editingName) {
    tick().then(() => nameInput?.focus());
  }

  function finishRename() {
    if (editingName) {
      editingName = false;
      sync();
    }
  }

  // A copy of the selected zone next to it, or a 1x1 button where there is
  // room (addedZone); the user is told when the surface is full.
  function handleAddZone() {
    if (zones === null || zone === null) {
      return;
    }
    const added = addedZone(zone, [
      ...zonesOf(
        event.config.filter((e) => e.id !== action.id).map((e) => e.script),
      ),
      ...zones,
    ]);
    if (typeof added === "undefined") {
      logger.set({
        type: "alert",
        mode: 0,
        classname: "zonenospace",
        message: "There is no room on the touch surface for another zone.",
      });
      return;
    }
    editingName = false;
    commit([...zones, added]);
    selected = zones.length - 1;
    picked = selected;
    dispatch("sync");
  }

  // The focused zone goes to the app clipboard.
  function handleCopyZone() {
    if (zone !== null) {
      appClipboard.copyZone(zone);
    }
  }

  // A copy of the clipboard's zone beside the focused one, as Add Zone places
  // a copy; the user is told when it doesn't fit.
  function handlePasteZone() {
    const clipboard = get(appClipboard);
    if (
      zones === null ||
      zone === null ||
      clipboard?.key !== ClipboardKey.ZONE
    ) {
      return;
    }
    const pasted = placedCopy(clipboard.payload as Zone, zone, [
      ...zonesOf(
        event.config.filter((e) => e.id !== action.id).map((e) => e.script),
      ),
      ...zones,
    ]);
    if (typeof pasted === "undefined") {
      logger.set({
        type: "alert",
        mode: 0,
        classname: "zonenospace",
        message: "There is no room beside the zone to paste the copy.",
      });
      return;
    }
    commit([...zones, pasted]);
    selected = zones.length - 1;
    picked = selected;
    dispatch("sync");
  }

  // Delete removes the focused zone; a block keeps at least one.
  function handleDeleteZone() {
    if (zones !== null && zones.length < 2) {
      logger.set({
        type: "alert",
        mode: 0,
        classname: "zonelast",
        message: "A block keeps at least one zone.",
      });
      return;
    }
    handleRemoveZone();
  }

  function handleRemoveZone() {
    if (zones === null || zones.length < 2) {
      return;
    }
    fieldErrors = {};
    const next = zones.filter((_, i) => i !== selected);
    selected = Math.min(selected, next.length - 1);
    picked = selected;
    commit(next);
    dispatch("sync");
  }

  function sync() {
    dispatch("sync");
  }

  const GEOMETRY: ZoneField[] = ["x", "y", "w", "h"];
  const GEOMETRY_TITLES: Record<string, string> = {
    x: "X",
    y: "Y",
    w: "Width",
    h: "Height",
  };
</script>

<zone-block
  bind:clientWidth={containerWidth}
  class="flex flex-col w-full px-4 py-2 pointer-events-auto gap-2"
>
  {#if zone !== null && zones !== null}
    <div class="flex flex-col gap-1">
      <div class="flex flex-row gap-2 items-center">
        <div class="flex flex-grow h-fit min-w-0" data-zone-name-field>
          {#if editingName}
            <MoltenInput
              bind:this={nameInput}
              target={zone.name}
              on:input={(e) => {
                if (e.detail.value !== zone?.name) {
                  setField("name", e.detail.value);
                }
              }}
              on:change={finishRename}
              on:blur={finishRename}
              on:keydown={(e) => {
                if (e.detail?.key === "Enter" || e.detail?.key === "Escape") {
                  finishRename();
                }
              }}
            />
          {:else}
            {#key JSON.stringify(zoneOptions)}
              <MeltSelect options={zoneOptions} bind:target={picked} />
            {/key}
          {/if}
        </div>
        <div class="flex flex-row items-center gap-2">
          <IconButton
            on:click={() => (editingName = !editingName)}
            iconPath="edit"
            compact
            tooltipText="Rename zone"
            ariaLabel="Rename zone"
          />
          <IconButton
            on:click={handleAddZone}
            iconData={addIcon}
            compact
            tooltipText="Add zone"
            ariaLabel="Add zone"
          />
          <IconButton
            on:click={handleRemoveZone}
            iconPath="remove"
            disabled={zones.length < 2}
            compact
            tooltipText="Remove zone"
            ariaLabel="Remove zone"
          />
        </div>
      </div>
      {#if problemOf("name")}
        <span class="text-xs text-error">{problemOf("name")}</span>
      {/if}
    </div>
    {#each [...(library ? [library] : []), ...zoneIssues] as issue}
      <span
        class="text-sm"
        class:text-error={issue.level === "error"}
        class:text-warning={issue.level === "warning"}
        data-zone-issue={issue.level}
        >{zones.length > 1 && issue.zone
          ? `${issue.zone}: `
          : ""}{issue.message}{issue.message === sendProblem
          ? ". The Setup is not sent until this is fixed."
          : ""}</span
      >
    {/each}
    {#each sections as { section, options } (section)}
      <Block>
        {#if section === "geometry"}
          <ZoneGeometryPad
            x={zone.x}
            y={zone.y}
            w={zone.w}
            h={zone.h}
            invalid={GEOMETRY.some((e) => typeof problemOf(e) !== "undefined")}
            color={zoneCssColor(zone, autoColor)}
            {others}
            on:select={(e) => selectZone(e.detail.index)}
            on:copy={handleCopyZone}
            on:paste={handlePasteZone}
            on:delete={handleDeleteZone}
            on:change={(e) => setGeometry(e.detail)}
            on:end={sync}
          />
          <!-- The type is picked under the preview of the zone. -->
          {#if isWide}
            <BlockRow>
              <MeltRadio
                options={typeOptions}
                bind:target={typeTarget}
                orientation="horizontal"
                style="button"
                size="full"
              />
            </BlockRow>
          {:else}
            <ZoneOptionField
              schema={zoneTypeSchema}
              read={zoneRead(zone)}
              title="Type"
              value={zoneType(zone)}
              on:input={(e) => setType(e.detail)}
              on:change={sync}
            />
          {/if}
          <!-- The X, Y, Width and Height fields are hidden: the pad sets them. -->
          {#if false}
            <BlockRow even>
              {#each GEOMETRY as field}
                <div class="flex flex-col">
                  <MeltCombo
                    title={GEOMETRY_TITLES[field]}
                    value={String(zone?.[field])}
                    validator={fieldValid(field)}
                    valueInfoEnabled={false}
                    on:input={(e) => setField(field, e.detail.value)}
                    on:change={sync}
                  />
                  {#if problemOf(field)}
                    <span class="text-xs text-error">{problemOf(field)}</span>
                  {/if}
                </div>
              {/each}
            </BlockRow>
          {/if}
        {/if}
        <div class="grid grid-cols-2 gap-2">
          {#each options.filter((e) => e.key !== "dir") as schema (schema.key)}
            <ZoneOptionField
              {schema}
              read={zoneRead(zone)}
              title={optionLabel(schema.key, zone)}
              value={optionText(zone.opt[schema.key])}
              placeholder={placeholderOf(schema.key)}
              problem={problemOf(schema.key)}
              {autoColor}
              suggestions={zoneOptionSuggestions(zone, schema.key, midi)}
              validator={optionValid(schema)}
              on:input={(e) => setOption(schema, e.detail)}
              on:change={sync}
            />
          {/each}
        </div>
        {#if section === "output" && typeof midi !== "undefined"}
          <span class="text-xs text-gray-400" data-zone-midi
            >Sends {zoneOutputLabel(zone, midi)}</span
          >
        {/if}
      </Block>
    {/each}
  {:else}
    <div class="flex flex-col gap-2">
      <span class="text-sm text-warning">
        This line is not in the Touch block format, so it is shown as is and not
        changed here.
      </span>
      <pre
        class="text-xs whitespace-pre-wrap break-all p-2 bg-background-mute">{$action.script}</pre>
    </div>
  {/if}
</zone-block>
