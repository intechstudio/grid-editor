<script lang="ts">
  // One option of a Touch block face, from its schema: a select for an enum,
  // a text field for a number. The empty value means "leave the option out"
  // (the default, shown as the placeholder or the first select entry).
  import { createEventDispatcher } from "svelte";
  import { MeltCombo, MeltSelect } from "@intechstudio/grid-uikit";
  import type { OptionSchema } from "./zone-model";
  import { enumOptions } from "./zone-blocks";

  export let schema: OptionSchema;
  export let title: string;
  export let value: string;
  export let placeholder = "";
  export let problem: string | undefined = undefined;
  // Whether typed text is valid; MeltCombo checks it before the face updates.
  export let validator: (text: string) => boolean = () => true;

  const dispatch = createEventDispatcher<{ input: string; change: string }>();

  // MeltSelect only binds its target. Report a change only when the user
  // picked something: MeltSelect can set its target on mount (undefined when
  // the value isn't an option), and the parent's own updates come back here.
  let selected = value;
  let last = value;
  $: if (value !== last) {
    last = value;
    selected = value;
  }
  $: if (
    schema.type === "enum" &&
    typeof selected === "string" &&
    selected !== last
  ) {
    last = selected;
    dispatch("input", selected);
    dispatch("change", selected);
  }

  $: options = enumOptions(schema, value, placeholder);

  $: range =
    schema.type !== "enum" &&
    (typeof schema.min !== "undefined" || typeof schema.max !== "undefined")
      ? ` (${schema.min ?? ""}–${schema.max ?? ""})`
      : "";
</script>

<div class="flex flex-col">
  {#if schema.type === "enum"}
    <MeltSelect {title} {options} bind:target={selected} size="full" />
  {:else}
    <MeltCombo
      title={`${title}${range}`}
      {value}
      {placeholder}
      {validator}
      valueInfoEnabled={false}
      on:input={(e) => dispatch("input", e.detail.value)}
      on:change={(e) => dispatch("change", e.detail?.value ?? value)}
    />
  {/if}
  {#if problem}
    <span class="text-xs text-error">{problem}</span>
  {/if}
</div>
