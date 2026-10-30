<script lang="ts" context="module">
  import { ColorPickerModel } from "../../runtime/app-helper.store";

  // The picker styles the app setting `persistent.colorPicker` chooses from.
  export const colorPickerOptions = [
    { title: "RGB", value: ColorPickerModel.Circle },
    { title: "Classic", value: ColorPickerModel.Square },
    { title: "HSL", value: ColorPickerModel.Slider },
  ];

  export type ColorChannelName = "red" | "green" | "blue" | "alpha";

  // One channel field: its text, the values it suggests, and whether typed
  // text is valid.
  export type ColorChannel = {
    value: string;
    suggestions: Array<{ value: string; info: string; key?: string }>;
    validator: (text: string) => boolean;
  };
</script>

<script lang="ts">
  // The colour editing of the Simple Color block, as one piece: the picker
  // chosen in the app settings, the Red, Green and Blue fields, and the Alpha
  // field with its slider. It only shows what it is given and reports what
  // the user does; the block that uses it keeps the colour and builds the
  // script. Without `alpha` the Alpha field and slider are left out.
  import { createEventDispatcher } from "svelte";
  import {
    Block,
    BlockColumn,
    BlockRow,
    CircleColorPicker,
    type Color,
    MeltCombo,
    MeltSelect,
    MeltSlider,
    SliderColorPicker,
    SquareColorPicker,
  } from "@intechstudio/grid-uikit";
  import { appSettings } from "../../runtime/app-helper.store";

  export let pickerColor: Color.HSL | undefined;
  export let red: ColorChannel;
  export let green: ColorChannel;
  export let blue: ColorChannel;
  export let alpha: ColorChannel | undefined = undefined;
  export let alphaSliderValue: number | undefined = undefined;
  // The select of the picker style. It sets the app setting, so the choice is
  // kept and every colour editor uses it, as in the Simple Color block.
  export let showPickerSelect = false;
  // A fixed picker style, instead of the one the app setting chooses.
  export let pickerStyle: ColorPickerModel | undefined = undefined;
  // The Red, Green and Blue fields; a block can leave them out.
  export let showChannels = true;
  // Shown text to stored text and back (the Simple Color block's Lua names).
  export let preProcessor = (value: string) => value;
  export let postProcessor = (value: string) => value;

  const dispatch = createEventDispatcher<{
    pick: { color: Color.HSL };
    channel: {
      channel: ColorChannelName;
      value: string;
      validationError: boolean;
    };
    "alpha-slider": { value: number };
    // the user finished a change: the block sends it to the module
    sync: undefined;
  }>();

  const pickers = new Map([
    [ColorPickerModel.Square, SquareColorPicker],
    [ColorPickerModel.Slider, SliderColorPicker],
    [ColorPickerModel.Circle, CircleColorPicker],
  ]);
  $: picker =
    pickers.get(pickerStyle ?? $appSettings.persistent.colorPicker) ??
    CircleColorPicker;

  $: rgb = [
    { name: "red", title: "Red", channel: red },
    { name: "green", title: "Green", channel: green },
    { name: "blue", title: "Blue", channel: blue },
  ] as const;
</script>

<color-editor class="flex flex-col gap-4 w-full">
  {#if showPickerSelect}
    <div class="flex flex-row justify-end">
      <MeltSelect
        title="Picker style"
        style="chip"
        bind:target={$appSettings.persistent.colorPicker}
        options={colorPickerOptions}
        disabled={false}
      />
    </div>
  {/if}
  <BlockRow>
    <div class="flex flex-grow min-w-28 h-28 items-center justify-center">
      <svelte:component
        this={picker}
        color={pickerColor}
        on:input={(e) => dispatch("pick", { color: e.detail.color })}
        on:change={() => dispatch("sync")}
      />
    </div>

    {#if alpha}
      <BlockColumn>
        <MeltCombo
          title="Alpha"
          value={alpha.value}
          validator={alpha.validator}
          suggestions={alpha.suggestions}
          on:input={(e) => {
            const { value, validationError } = e.detail;
            dispatch("channel", { channel: "alpha", value, validationError });
          }}
          on:change={() => dispatch("sync")}
          {postProcessor}
          {preProcessor}
        />
        <Block>
          <MeltSlider
            target={alphaSliderValue as number}
            min={0}
            max={1}
            step={0.01}
            on:change={(e) =>
              dispatch("alpha-slider", { value: e.detail.value })}
            on:commit={() => dispatch("sync")}
          /></Block
        >
      </BlockColumn>
    {/if}
  </BlockRow>
  <BlockRow even>
    {#each showChannels ? rgb : [] as { name, title, channel } (name)}
      <MeltCombo
        {title}
        value={channel.value}
        validator={channel.validator}
        suggestions={channel.suggestions}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          dispatch("channel", { channel: name, value, validationError });
        }}
        on:change={() => dispatch("sync")}
        {postProcessor}
        {preProcessor}
      />
    {/each}
  </BlockRow>
</color-editor>
