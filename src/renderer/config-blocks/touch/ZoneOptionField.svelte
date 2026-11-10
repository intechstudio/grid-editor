<script lang="ts">
  // One option of a Touch block face, from its schema: a select for an enum,
  // a field with suggestions for a number, the colour editor of the Simple Color block for a
  // colour. A number field is never empty: it shows the option's value, or the
  // default when the line leaves it out, and empty text is an error. Only an
  // enum or a colour can be empty, meaning "leave the option out" (the default:
  // the selected entry of a select).
  import { createEventDispatcher } from "svelte";
  import {
    Color,
    MeltCombo,
    MeltRadio,
    MeltSelect,
    MoltenPushButton,
    Toggle,
  } from "@intechstudio/grid-uikit";
  import ColorEditor from "../../main/user-interface/ColorEditor.svelte";
  import {
    appSettings,
    ColorPickerModel,
  } from "../../runtime/app-helper.store";
  import type { OptionSchema, ZoneRead } from "./zone-model";
  import {
    enumOptions,
    type OptionChoice,
    type OptionSuggestion,
  } from "./zone-blocks";

  export let schema: OptionSchema;
  // what the zone reads, which names its mouse output in the Output select
  export let read: ZoneRead | undefined = undefined;
  export let title: string;
  // the field takes the whole row (the colour always does)
  export let wide = false;
  // A few values shown as a row of buttons, one to pick (the button of a mouse
  // button zone); the first is the default. Without them, the field.
  export let choices: OptionChoice[] | undefined = undefined;
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

  $: options = enumOptions(schema, value, read);

  // The picked button: the option's value, or the first button when it has
  // none (-1 or out of the choices). Only a pick by the user is reported.
  let choice = 0;
  let lastChoice = 0;
  $: if (typeof choices !== "undefined") {
    const next = choices.some((e) => e.value === Number(shown))
      ? Number(shown)
      : choices[0].value;
    if (next !== lastChoice) {
      lastChoice = next;
      choice = next;
    }
  }
  $: if (typeof choices !== "undefined" && choice !== lastChoice) {
    lastChoice = choice;
    dispatch("input", String(choice));
    dispatch("change", String(choice));
  }

  // Options shown as a toggle: the text of its on and its off state. Tap to
  // click is 1 or 0; Capture focus is on for focus (the default) and off for
  // live.
  const TOGGLES: { [key: string]: { on: string; off: string } } = {
    tap: { on: "1", off: "0" },
    grab: { on: "focus", off: "live" },
  };
  $: isToggle = schema.key in TOGGLES;
  let toggled = false;
  $: toggled = isToggle && shown === TOGGLES[schema.key].on;
  function handleToggle() {
    const next = toggled ? TOGGLES[schema.key].on : TOGGLES[schema.key].off;
    dispatch("input", next);
    dispatch("change", next);
  }

  // A field with suggestions shows its values there, not as "(min–max)".
  $: range =
    (schema.type === "integer" || schema.type === "number") &&
    suggestions.length === 0 &&
    (typeof schema.min !== "undefined" || typeof schema.max !== "undefined")
      ? ` (${schema.min ?? ""}–${schema.max ?? ""})`
      : "";

  // The module's colour for a channel left at -1 (auto).
  export let autoColor:
    { red?: number; green?: number; blue?: number } | undefined = undefined;

  // The colour as the Simple Color block edits it: the four channels as text.
  // The picker keeps its own colour while it drags; the value moves the
  // channels only when it changes from elsewhere (undo, another view).
  type Channels = { red: string; green: string; blue: string; alpha: string };
  const NO_COLOR: Channels = {
    red: "-1",
    green: "-1",
    blue: "-1",
    alpha: "1",
  };
  let channels: Channels = { ...NO_COLOR };
  let picked = "";
  $: if (schema.type === "color" && value !== picked) {
    picked = value;
    const [red, green, blue, alpha] = value.split(",");
    channels =
      typeof blue === "undefined"
        ? { ...NO_COLOR }
        : { red, green, blue, alpha: alpha ?? "1" };
  }

  const channelValid = (text: string) =>
    /^-?\d+$/.test(text) && Number(text) >= -1 && Number(text) <= 255;

  const autoSuggestion = (n: number | undefined) => [
    {
      value: "-1",
      info: typeof n === "undefined" ? "Auto" : `Auto (${n})`,
      key: "auto",
    },
  ];
  $: red = {
    value: channels.red,
    suggestions: autoSuggestion(autoColor?.red),
    validator: channelValid,
  };
  $: green = {
    value: channels.green,
    suggestions: autoSuggestion(autoColor?.green),
    validator: channelValid,
  };
  $: blue = {
    value: channels.blue,
    suggestions: autoSuggestion(autoColor?.blue),
    validator: channelValid,
  };
  // What the picker shows: the channels, the module's colour for an auto one.
  $: pickerColor = ((): Color.HSL | undefined => {
    const channel = (text: string, auto: number | undefined) =>
      text === "-1" ? auto : parseInt(text);
    const r = channel(channels.red, autoColor?.red);
    const g = channel(channels.green, autoColor?.green);
    const b = channel(channels.blue, autoColor?.blue);
    return [r, g, b].some((e) => typeof e === "undefined" || isNaN(e))
      ? undefined
      : new Color.RGB(r as number, g as number, b as number).toHSL();
  })();

  // The red, green and blue at -1: the page's default colour, which leaves
  // the option out.
  $: isDefaultColor =
    channels.red === "-1" &&
    channels.green === "-1" &&
    channels.blue === "-1" &&
    channels.alpha === "1";
  function handleUseDefaultColor() {
    channels = { ...NO_COLOR };
    report();
    dispatch("change", picked);
  }

  // The option is left out while the colour is the module's own.
  function report() {
    const { red, green, blue, alpha } = channels;
    picked =
      red === "-1" && green === "-1" && blue === "-1" && alpha === "1"
        ? ""
        : [red, green, blue, ...(alpha === "1" ? [] : [alpha])].join(",");
    dispatch("input", picked);
  }

  function handleAlpha(alpha: number) {
    channels = { ...channels, alpha: String(Math.round(alpha * 100) / 100) };
    report();
  }

  function handlePick(color: Color.HSL) {
    const { r, g, b } = color.toRGB();
    channels = {
      ...channels,
      red: String(Math.round(r)),
      green: String(Math.round(g)),
      blue: String(Math.round(b)),
    };
    report();
  }

  function handleChannel(
    name: keyof Channels,
    text: string,
    validationError: boolean,
  ) {
    channels = { ...channels, [name]: text };
    if (!validationError) {
      report();
    }
  }
</script>

<div
  class="flex flex-col"
  class:col-span-2={schema.type === "color" ||
    wide ||
    typeof choices !== "undefined"}
  class:justify-end={isToggle}
>
  {#if isToggle}
    <div class="py-2">
      <Toggle
        bind:value={toggled}
        {title}
        testid={`zone-${schema.key}`}
        on:change={handleToggle}
      />
    </div>
  {:else if typeof choices !== "undefined"}
    <span class="choices-title">{title}</span>
    <MeltRadio
      options={choices}
      bind:target={choice}
      orientation="horizontal"
      style="button"
      size="full"
    />
  {:else if schema.type === "enum"}
    <MeltSelect {title} {options} bind:target={selected} size="full" />
  {:else if schema.type === "color"}
    <!-- The classic picker with a vertical alpha slider beside it; the
         minimalist mode leaves out the red, green and blue fields. -->
    <ColorEditor
      pickerStyle={ColorPickerModel.Square}
      verticalAlpha
      alphaSliderValue={Number(channels.alpha)}
      on:alpha-slider={(e) => handleAlpha(e.detail.value)}
      showChannels={!$appSettings.persistent.userLevelMinimalist}
      {pickerColor}
      {red}
      {green}
      {blue}
      on:pick={(e) => handlePick(e.detail.color)}
      on:channel={(e) =>
        handleChannel(
          e.detail.channel,
          e.detail.value,
          e.detail.validationError,
        )}
      on:sync={() => dispatch("change", picked)}
    >
      <!-- in the row of the three fields, at the foot of their inputs, as wide
           as it is (the fields share the rest of the row); the minimalist mode
           leaves the fields out, and the button with them -->
      <div slot="channels-end" class="flex flex-col justify-end !flex-none">
        <MoltenPushButton
          text="Reset"
          disabled={isDefaultColor}
          click={handleUseDefaultColor}
        />
      </div>
    </ColorEditor>
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

<style>
  /* the title of a row of buttons, like the title of a field */
  .choices-title {
    color: var(--foreground);
    font-size: 0.875em;
    line-height: 1.25em;
    margin-bottom: 0.25em;
  }
</style>
