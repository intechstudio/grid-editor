<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation";
  import { touchGroupInformation } from "./touch/zone-block-info";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = touchGroupInformation;
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Block, MeltCombo } from "@intechstudio/grid-uikit";
  import type { GridAction } from "../runtime/runtime";
  import type {
    OptionSchema,
    ZoneGroup,
    ZoneOptionValue,
  } from "./touch/zone-model";
  import { zoneGroupDefaults, zoneGroupSchema } from "./touch/zone-model";
  import { parseZoneGroup, zoneGroupToLua } from "./touch/zone-parse";
  import { zoneGroupProblems } from "./touch/zone-validate";
  import { optionLabel, optionText, withOption } from "./touch/zone-blocks";
  import ZoneOptionField from "./touch/ZoneOptionField.svelte";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  let group: ZoneGroup | null = null;
  let fieldErrors: Record<string, string> = {};

  $: if (!$action.invalid) {
    group = parseZoneGroup($action.script);
    fieldErrors = {};
  }

  $: problems = group !== null ? zoneGroupProblems(group) : [];
  $: problemOf = (key: string) =>
    fieldErrors[key] ?? problems.find((e) => e.key === key)?.message;

  const defaults: Record<string, ZoneOptionValue> = zoneGroupDefaults;

  function apply(key: string, result: { next?: ZoneGroup; error?: string }) {
    const next = result.next;
    if (typeof next === "undefined") {
      fieldErrors = { ...fieldErrors, [key]: result.error ?? "Invalid" };
      return;
    }
    const { [key]: _, ...rest } = fieldErrors;
    fieldErrors = rest;
    group = next;
    dispatch("update-action", {
      short: "zgr",
      script: zoneGroupToLua(next),
      validationError:
        zoneGroupProblems(next).length > 0 ||
        Object.keys(fieldErrors).length > 0,
    });
  }

  const optionValid = (schema: OptionSchema) => (text: string) => {
    const { next } = group !== null ? withOption(group, schema, text) : {};
    return (
      typeof next !== "undefined" &&
      !zoneGroupProblems(next).some((e) => e.key === schema.key)
    );
  };

  function setOption(schema: OptionSchema, text: string) {
    if (group !== null) {
      apply(schema.key, withOption(group, schema, text));
    }
  }

  function setNumber(text: string) {
    if (group === null) {
      return;
    }
    const n = Number(text.trim());
    apply(
      "n",
      text.trim() === "" || !Number.isFinite(n)
        ? { error: "Enter a number" }
        : { next: { ...group, n } },
    );
  }
</script>

<touch-group class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  {#if group !== null}
    <Block>
      <MeltCombo
        title={"Group (1–8)"}
        value={String(group.n)}
        validator={(text) => {
          const n = Number(text.trim());
          return (
            group !== null &&
            text.trim() !== "" &&
            !zoneGroupProblems({ ...group, n }).some((e) => e.key === "n")
          );
        }}
        valueInfoEnabled={false}
        on:input={(e) => setNumber(e.detail.value)}
        on:change={() => dispatch("sync")}
      />
      {#if problemOf("n")}
        <span class="text-xs text-error">{problemOf("n")}</span>
      {/if}
      {#each zoneGroupSchema as schema (schema.key)}
        <ZoneOptionField
          {schema}
          title={optionLabel(schema.key)}
          value={optionText(group.opt[schema.key])}
          placeholder={optionText(defaults[schema.key])}
          problem={problemOf(schema.key)}
          validator={optionValid(schema)}
          on:input={(e) => setOption(schema, e.detail)}
          on:change={() => dispatch("sync")}
        />
      {/each}
      <span class="text-xs text-gray-500"
        >Allow none on: 1 lets the last active button switch off, 0 keeps one
        on.</span
      >
    </Block>
  {:else}
    <span class="text-sm text-warning"
      >This line is not in the Touch Group format, so it is shown as is.</span
    >
    <pre
      class="text-xs whitespace-pre-wrap break-all p-2 bg-background-mute">{$action.script}</pre>
  {/if}
</touch-group>
