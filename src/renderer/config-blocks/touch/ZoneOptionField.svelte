<script lang="ts">
  // One option of a Touch block face, from its schema: a select for an enum,
  // a field with suggestions for a number, a picker and a hex field for a
  // colour. The empty value means "leave the option out" (the default: the
  // placeholder, or the selected entry of a select).
  import { createEventDispatcher } from "svelte";
  import {
    CircleColorPicker,
    Color,
    MeltCombo,
    MeltSelect,
    SliderColorPicker,
    SquareColorPicker,
  } from "@intechstudio/grid-uikit";
  import {
    appSettings,
    ColorPickerModel,
  } from "../../runtime/app-helper.store";
  import type { OptionSchema, ZoneKind } from "./zone-model";
  import { enumOptions, type OptionSuggestion } from "./zone-blocks";

  export let schema: OptionSchema;
  // the zone's kind, which names its mouse output in the Output select
  export let kind: ZoneKind | undefined = undefined;
  export let title: string;
  export let value: string;
  export let placeholder = "";
  export let problem: string | undefined = undefined;
  export let suggestions: OptionSuggestion[] = [];
  // Whether typed text is valid; MeltCombo checks it before the face updates.
  export let validator: (text: string) => boolean = () => true;

  const dispatch = createEventDispatcher<{ input: string; change: string }>();

  // MeltSelect only binds its target. Report a change only when the user
  // picked something: MeltSelect can set its target on mount (undefined when
  // the value isn't an option), and the parent's own updates come back here.
  // Without the option the select shows the default (the placeholder).
  $: shown = value === "" ? placeholder : value;
  let selected = value === "" ? placeholder : value;
  let last = selected;
  $: if (shown !== last) {
    last = shown;
    selected = shown;
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

  $: options = enumOptions(schema, value, kind);

  // A field with suggestions shows its values there, not as "(min–max)".
  $: range =
    (schema.type === "integer" || schema.type === "number") &&
    suggestions.length === 0 &&
    (typeof schema.min !== "undefined" || typeof schema.max !== "undefined")
      ? ` (${schema.min ?? ""}–${schema.max ?? ""})`
      : "";

  // The picker Simple Color uses, as chosen in the app settings.
  const pickers = new Map([
    [ColorPickerModel.Square, SquareColorPicker],
    [ColorPickerModel.Slider, SliderColorPicker],
    [ColorPickerModel.Circle, CircleColorPicker],
  ]);
  $: picker =
    pickers.get($appSettings.persistent.colorPicker) ?? CircleColorPicker;

  // The picker keeps its own colour while it drags; the field's value moves
  // it only when it changes from elsewhere (typed, undo, another view).
  let pickerColor: Color.HSL | undefined;
  let picked = "";
  $: if (schema.type === "color" && value !== picked) {
    picked = value;
    pickerColor = toHSL(value);
  }

  function toHSL(text: string): Color.HSL | undefined {
    if (!/^[0-9a-f]{6}$/i.test(text)) {
      return undefined;
    }
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(text.slice(i, i + 2), 16));
    return new Color.RGB(r, g, b).toHSL();
  }

  function pick(color: Color.HSL) {
    const { r, g, b } = color.toRGB();
    picked = [r, g, b]
      .map((e) => Math.round(e).toString(16).padStart(2, "0"))
      .join("");
    pickerColor = color;
    dispatch("input", picked);
  }
</script>

<div class="flex flex-col" class:col-span-2={schema.type === "color"}>
  {#if schema.type === "enum"}
    <MeltSelect {title} {options} bind:target={selected} size="full" />
  {:else if schema.type === "color"}
    <div class="flex flex-row gap-2 items-center">
      <div class="flex min-w-28 h-28 items-center justify-center">
        <svelte:component
          this={picker}
          color={pickerColor}
          on:input={(e) => pick(e.detail.color)}
          on:change={() => dispatch("change", value)}
        />
      </div>
      <div class="flex flex-col flex-grow">
        <MeltCombo
          {title}
          {value}
          {placeholder}
          {validator}
          valueInfoEnabled={false}
          on:input={(e) => dispatch("input", e.detail.value)}
          on:change={(e) => dispatch("change", e.detail?.value ?? value)}
        />
      </div>
    </div>
  {:else}
    <MeltCombo
      title={`${title}${range}`}
      {value}
      {placeholder}
      {validator}
      {suggestions}
      valueInfoEnabled={suggestions.length > 0}
      on:input={(e) => dispatch("input", e.detail.value)}
      on:change={(e) => dispatch("change", e.detail?.value ?? value)}
    />
  {/if}
  {#if problem}
    <span class="text-xs text-error">{problem}</span>
  {/if}
</div>
