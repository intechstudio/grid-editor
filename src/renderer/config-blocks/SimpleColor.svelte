<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import SimpleColorFace from "./headers/SimpleColorFace.svelte";
  export const header = SimpleColorFace;

  export const information: ActionBlockInformation = {
    short: "sglc",
    name: "SimpleColor",
    category: "led",
    rendering: "standard",
    color: categoryColors["led"] as any,
    displayName: "Simple Color",
    description: "Set the LED color of this element",
    documentationUrl:
      "https://docs.intech.studio/wiki/actions/led/simple-led-color/",
    defaultLua: "self:glc(-1,{{-1,-1,-1,1}}) self:glp(-1,-1)",
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.5a9.5 9.5 0 0 1 0-19 9.5 8.6 0 0 1 9.5 8.6 4.8 4.8 0 0 1-4.8 4.8h-2.1a1.7 1.7 0 0 0-1.36 2.72l.29.38a1.7 1.7 0 0 1-1.36 2.72Z"/><circle cx="13.4" cy="6.6" r="1.05" fill="currentColor" stroke="none"/><circle cx="17.2" cy="10.4" r="1.05" fill="currentColor" stroke="none"/><circle cx="8.6" cy="7.6" r="1.05" fill="currentColor" stroke="none"/><circle cx="6.7" cy="12.4" r="1.05" fill="currentColor" stroke="none"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.5a9.5 9.5 0 0 1 0-19 9.5 8.6 0 0 1 9.5 8.6 4.8 4.8 0 0 1-4.8 4.8h-2.1a1.7 1.7 0 0 0-1.36 2.72l.29.38a1.7 1.7 0 0 1-1.36 2.72Z"/><circle cx="13.4" cy="6.6" r="1.05" fill="currentColor" stroke="none"/><circle cx="17.2" cy="10.4" r="1.05" fill="currentColor" stroke="none"/><circle cx="8.6" cy="7.6" r="1.05" fill="currentColor" stroke="none"/><circle cx="6.7" cy="12.4" r="1.05" fill="currentColor" stroke="none"/></svg>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
    editName: true,
    version: "2.0",
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import {
    Block,
    BlockRow,
    BlockColumn,
    MeltCombo,
    MeltSelect,
    MeltCheckbox,
    MeltSlider,
    SliderColorPicker,
    SquareColorPicker,
    CircleColorPicker,
    ColorLayerSelector,
    type LayerClickDetail,
  } from "@intechstudio/grid-uikit";

  import { GridScript } from "@intechstudio/grid-protocol";
  import { Script } from "./_script_parsers.js";
  import { GridAction } from "./../runtime/runtime";
  import { get } from "svelte/store";
  import { SimpleColor } from "./SimpleColor";
  import { appSettings } from "../runtime/app-helper.store";

  const dispatch = createEventDispatcher();

  export let action: GridAction;

  const data = new SimpleColor.ViewModel(action);

  onDestroy(() => {
    data.destroy();
  });

  $: if (!$action.invalid) {
    handleActionChange(action);
  }

  function handleActionChange(action: GridAction) {
    if (action.script === buildScript($data)) {
      return;
    }

    data.updateData(action);
  }

  function buildScript(data: SimpleColor.ViewModelData) {
    const part1 = Script.toScript({
      short: `${data.element.value}:glc`,
      array: [
        data.layer.value,
        `{${data.colors
          .map((e) => `{${[e.red, e.green, e.blue, e.alpha].join(",")}}`)
          .join(",")}}`,
      ],
    });

    if (!data.updateIntensity) {
      return part1;
    }

    const part2 = Script.toScript({
      short: `${data.element.value}:glp`,
      array: [data.layer.value, -1],
    });

    return `${part1} ${part2}`;
  }

  function sendData(data: SimpleColor.ViewModelData) {
    const script = buildScript(data);
    const validators = [
      data.layer.validator,
      data.element.validator,
      data.red.validator,
      data.green.validator,
      data.blue.validator,
      data.alpha.validator,
    ];

    dispatch("update-action", {
      short: action.short,
      script: script,
      validationError: validators.some((e) => e.value === false),
    });
  }

  function handleAddLayer() {
    data.addLayer();
    sendData(get(data));
    dispatch("sync");
  }

  function handleRemoveLayer() {
    const selected = get(data).selectedIndex;
    data.removeLayer(selected);
    sendData(get(data));
    dispatch("sync");
  }

  function handleLayerClicked(e: CustomEvent<LayerClickDetail>) {
    const { index } = e.detail;
    data.selectLayer(index);
  }

  enum ColorPickerModel {
    Square,
    Slider,
    Circle,
  }

  const colorPickerComponent = new Map([
    [ColorPickerModel.Square, SquareColorPicker],
    [ColorPickerModel.Slider, SliderColorPicker],
    [ColorPickerModel.Circle, CircleColorPicker],
  ]);

  const options = [
    { title: "RGB", value: ColorPickerModel.Circle },
    { title: "Classic", value: ColorPickerModel.Square },
    { title: "HSL", value: ColorPickerModel.Slider },
  ];

  function getGradient(colors: SimpleColor.Color[]) {
    const array = [
      ...(colors.length === 1
        ? [{ red: "0", green: "0", blue: "0", alpha: "0" }]
        : []),
      ...colors,
    ];
    const cssValue = array.map((e) => SimpleColor.colorToCSS(e)).join(",");
    return cssValue;
  }

  function getMixerPreviewColor(data: SimpleColor.ViewModelData) {
    const { previewColors, selectedIndex } = data;
    return SimpleColor.colorToCSS(previewColors[selectedIndex]);
  }
</script>

<config-led-color class="flex flex-col gap-4 w-full p-2 pointer-events-auto">
  <MeltSelect
    bind:target={$appSettings.persistent.colorPicker}
    {options}
    disabled={false}
    size={"full"}
  />
  {#if $appSettings.persistent.userLevelMinimalist == false}
    <BlockRow>
      <MeltCombo
        title={"Element"}
        value={$data.element.value}
        validator={$data.element.validator.func}
        suggestions={$data.element.suggestions}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          $data.element.value = value;
          $data.element.validator.value = !validationError;
          sendData($data);
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />

      <MeltCombo
        title={"Layer"}
        value={$data.layer.value}
        validator={$data.layer.validator.func}
        suggestions={$data.layer.suggestions}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          $data.layer.value = value;
          $data.layer.validator.value = !validationError;
          sendData($data);
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    </BlockRow>
    {#if $data.element.value !== "self"}
      <p style="color: color-mix(in srgb, #EAB308 75%, var(--foreground));">
        Auto values (-1) use the calling event's context. Specify explicit
        values when targeting another element.
      </p>
    {/if}
  {/if}
  <ColorLayerSelector
    colors={$data.previewColors}
    selected={$data.selectedIndex}
    on:add-layer={handleAddLayer}
    on:remove-layer={handleRemoveLayer}
    on:layer-click={handleLayerClicked}
  />
  <BlockRow>
    <div class="flex flex-grow min-w-28 h-28 items-center justify-center">
      <svelte:component
        this={colorPickerComponent.get($appSettings.persistent.colorPicker)}
        color={$data.pickerColor}
        on:input={(e) => {
          const { color } = e.detail;
          data.updatePickerColor(color);
          sendData($data);
        }}
        on:change={(e) => {
          dispatch("sync");
        }}
      />
    </div>

    <BlockColumn>
      <MeltCombo
        title="Alpha"
        value={$data[SimpleColor.Channel.ALPHA].value}
        validator={$data[SimpleColor.Channel.ALPHA].validator.func}
        suggestions={[
          ...$data[SimpleColor.Channel.ALPHA].suggestions,
          { value: "1", info: "Default" },
          { value: "0", info: "Transparent" },
        ]}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          data.updateRGBAChannelValue(
            action,
            value,
            validationError,
            SimpleColor.Channel.ALPHA,
          );
          sendData($data);
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
      <Block>
        <MeltSlider
          target={$data.alphaSliderValue}
          min={0}
          max={1}
          step={0.01}
          on:change={(e) => {
            const { value } = e.detail;
            data.updateAlphaSliderValue(value);
            sendData($data);
          }}
          on:commit={() => {
            dispatch("sync");
          }}
        /></Block
      >
    </BlockColumn>
  </BlockRow>
  <BlockRow>
    {#each [SimpleColor.Channel.RED, SimpleColor.Channel.GREEN, SimpleColor.Channel.BLUE] as channel}
      <MeltCombo
        title={channel.charAt(0).toUpperCase() + channel.slice(1)}
        value={$data[channel].value}
        validator={$data[channel].validator.func}
        suggestions={$data[channel].suggestions}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          data.updateRGBAChannelValue(action, value, validationError, channel);
          sendData($data);
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    {/each}
  </BlockRow>

  {#if $appSettings.persistent.userLevelMinimalist == false}
    <MeltCheckbox
      bind:target={$data.updateIntensity}
      on:change={(e) => {
        data.UpdateIntensityEnabledValue(e.detail);
        sendData($data);
        dispatch("sync");
      }}
      title={"Update intensity automatically"}
    />
  {/if}
</config-led-color>
