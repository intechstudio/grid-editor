<script lang="ts">
  // The face of the four zone blocks (RFC 6.2). Everything comes from the
  // action's opening line: parseZone reads it, every edit writes zoneToLua
  // back through the normal block update. A value the validators reject is
  // sent as an invalid action, so the module keeps the last valid line. A line
  // that doesn't parse is shown as it is and never rewritten (RFC 6.5).
  import { createEventDispatcher } from "svelte";
  import { Block, BlockRow, MeltCombo } from "@intechstudio/grid-uikit";
  import type { ActionData, GridAction } from "../../runtime/runtime";
  import type { OptionSchema, Zone } from "./zone-model";
  import { parseZone, zoneToLua } from "./zone-parse";
  import { zoneProblems } from "./zone-validate";
  import {
    type ZoneField,
    optionLabel,
    optionPlaceholder,
    optionText,
    withField,
    withOption,
    zoneFaceSections,
    zoneSectionLabels,
  } from "./zone-blocks";
  import ZoneOptionField from "./ZoneOptionField.svelte";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  let zone: Zone | null = null;
  // Text that can't be written at all (not a number), per field.
  let fieldErrors: Record<string, string> = {};

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    zone = parseZone(data.script);
    fieldErrors = {};
  }

  $: sections = zone !== null ? zoneFaceSections(zone.kind) : [];
  let open: Record<string, boolean> = {};
  $: for (const e of sections) {
    if (typeof open[e.section] === "undefined") {
      open[e.section] = e.open;
    }
  }

  $: problems = zone !== null ? zoneProblems(zone) : [];
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
    zone = next;
    dispatch("update-action", {
      short: action.short,
      script: zoneToLua(next),
      validationError:
        zoneProblems(next).length > 0 || Object.keys(fieldErrors).length > 0,
    });
  }

  // The problem typed text would give a field, for the field's red state.
  function textProblem(
    key: string,
    result: { next?: Zone; error?: string },
  ): string | undefined {
    return typeof result.next === "undefined"
      ? result.error
      : zoneProblems(result.next).find((e) => e.key === key)?.message;
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

<zone-block class="flex flex-col w-full px-4 py-2 pointer-events-auto gap-2">
  {#if zone !== null}
    <Block>
      <MeltCombo
        title={"Name"}
        value={zone.name}
        validator={fieldValid("name")}
        valueInfoEnabled={false}
        on:input={(e) => setField("name", e.detail.value)}
        on:change={sync}
      />
      {#if problemOf("name")}
        <span class="text-xs text-error">{problemOf("name")}</span>
      {/if}
    </Block>
    {#each sections as { section, options } (section)}
      <Block>
        <!-- A plain button: grid-uikit has no disclosure control (its Toggle is
             an on/off switch). -->
        <button
          class="flex flex-row items-center gap-1 text-sm text-gray-400 hover:text-white"
          on:click={() => (open[section] = !open[section])}
          data-section={section}
        >
          <span>{open[section] ? "▾" : "▸"}</span>
          <span>{zoneSectionLabels[section]}</span>
        </button>
        {#if open[section]}
          {#if section === "geometry"}
            <BlockRow even>
              {#each GEOMETRY as field}
                <div class="flex flex-col">
                  <MeltCombo
                    title={GEOMETRY_TITLES[field]}
                    value={String(zone[field])}
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
          <div class="grid grid-cols-2 gap-2">
            {#each options as schema (schema.key)}
              <ZoneOptionField
                {schema}
                title={optionLabel(schema.key)}
                value={optionText(zone.opt[schema.key])}
                placeholder={optionPlaceholder(zone.kind, schema.key)}
                problem={problemOf(schema.key)}
                validator={optionValid(schema)}
                on:input={(e) => setOption(schema, e.detail)}
                on:change={sync}
              />
            {/each}
          </div>
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
