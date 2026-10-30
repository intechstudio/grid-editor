<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation";
  import { touchTickInformation } from "./touch/zone-block-info";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = touchTickInformation;
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Block } from "@intechstudio/grid-uikit";
  import type { GridAction } from "../runtime/runtime";
  import type {
    OptionSchema,
    ZoneOptionValue,
    ZoneTick,
  } from "./touch/zone-model";
  import { zoneTickDefaults, zoneTickSchema } from "./touch/zone-model";
  import { parseZoneTick, zoneTickToLua } from "./touch/zone-parse";
  import { zoneTickProblems } from "./touch/zone-validate";
  import { optionLabel, optionText, withOption } from "./touch/zone-blocks";
  import ZoneOptionField from "./touch/ZoneOptionField.svelte";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  let tick: ZoneTick | null = null;
  let fieldErrors: Record<string, string> = {};

  $: if (!$action.invalid) {
    tick = parseZoneTick($action.script);
    fieldErrors = {};
  }

  $: problems = tick !== null ? zoneTickProblems(tick) : [];
  $: problemOf = (key: string) =>
    fieldErrors[key] ?? problems.find((e) => e.key === key)?.message;

  const defaults: Record<string, ZoneOptionValue> = zoneTickDefaults;

  function apply(key: string, result: { next?: ZoneTick; error?: string }) {
    const next = result.next;
    if (typeof next === "undefined") {
      fieldErrors = { ...fieldErrors, [key]: result.error ?? "Invalid" };
      return;
    }
    const { [key]: _, ...rest } = fieldErrors;
    fieldErrors = rest;
    tick = next;
    dispatch("update-action", {
      short: "ztk",
      script: zoneTickToLua(next),
      validationError:
        zoneTickProblems(next).length > 0 ||
        Object.keys(fieldErrors).length > 0,
    });
  }

  const optionValid = (schema: OptionSchema) => (text: string) => {
    const { next } = tick !== null ? withOption(tick, schema, text) : {};
    return (
      typeof next !== "undefined" &&
      !zoneTickProblems(next).some((e) => e.key === schema.key)
    );
  };

  function setOption(schema: OptionSchema, text: string) {
    if (tick !== null) {
      apply(schema.key, withOption(tick, schema, text));
    }
  }
</script>

<touch-tick class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  {#if tick !== null}
    <Block>
      <div class="grid grid-cols-3 gap-2">
        {#each zoneTickSchema as schema (schema.key)}
          <ZoneOptionField
            {schema}
            title={optionLabel(schema.key)}
            value={optionText(tick.opt[schema.key])}
            placeholder={optionText(defaults[schema.key])}
            problem={problemOf(schema.key)}
            validator={optionValid(schema)}
            on:input={(e) => setOption(schema, e.detail)}
            on:change={() => dispatch("sync")}
          />
        {/each}
      </div>
    </Block>
  {:else}
    <span class="text-sm text-warning"
      >This line is not in the Touch Tick format, so it is shown as is.</span
    >
    <pre
      class="text-xs whitespace-pre-wrap break-all p-2 bg-background-mute">{$action.script}</pre>
  {/if}
</touch-tick>
