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
    defaultLua: "self:glc(-1,{{-1,-1,-1,1}}) self:glp(-1,-1)",
    icon: `
        <svg width="100%" height="100%" viewBox="0 0 404 404" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M0 202C0 90.4501 90.4501 0 202 0C312.408 0 404 79.7737 404 180.666C404 245.069 351.736 297.333 287.333 297.333H249.68C237.496 297.333 227.68 307.149 227.68 319.333C227.68 325.01 229.708 330 233.104 333.86C239.962 341.32 244 351.165 244 362C244 385.23 225.23 404 202 404C90.4501 404 0 313.55 0 202ZM202 20C101.496 20 20 101.496 20 202C20 302.504 101.496 384 202 384C214.184 384 224 374.184 224 362C224 356.238 221.884 351.185 218.338 347.349L218.267 347.273L218.198 347.195C211.603 339.757 207.68 330.052 207.68 319.333C207.68 296.103 226.45 277.333 249.68 277.333H287.333C340.69 277.333 384 234.023 384 180.666C384 92.9723 303.646 20 202 20ZM148.667 62.667C136.483 62.667 126.667 72.4828 126.667 84.667C126.667 96.8512 136.483 106.667 148.667 106.667C160.85 106.667 170.667 96.851 170.667 84.667C170.667 72.4828 160.851 62.667 148.667 62.667ZM106.667 84.667C106.667 61.4371 125.437 42.667 148.667 42.667C171.897 42.667 190.667 61.4372 190.667 84.667C190.667 107.897 171.896 126.667 148.667 126.667C125.437 126.667 106.667 107.897 106.667 84.667ZM255.333 62.667C243.149 62.667 233.333 72.4828 233.333 84.667C233.333 96.8512 243.149 106.667 255.333 106.667C267.517 106.667 277.333 96.8512 277.333 84.667C277.333 72.4829 267.517 62.667 255.333 62.667ZM213.333 84.667C213.333 61.4372 232.103 42.667 255.333 42.667C278.563 42.667 297.333 61.4371 297.333 84.667C297.333 107.897 278.563 126.667 255.333 126.667C232.103 126.667 213.333 107.897 213.333 84.667ZM84.667 148C72.4828 148 62.667 157.816 62.667 170C62.667 182.184 72.4828 192 84.667 192C96.8504 192 106.667 182.184 106.667 170C106.667 157.816 96.8512 148 84.667 148ZM42.667 170C42.667 146.77 61.4372 128 84.667 128C107.897 128 126.667 146.77 126.667 170C126.667 193.23 107.896 212 84.667 212C61.4372 212 42.667 193.23 42.667 170ZM319.333 148C307.149 148 297.333 157.816 297.333 170C297.333 182.184 307.149 192 319.333 192C331.517 192 341.333 182.184 341.333 170C341.333 157.816 331.517 148 319.333 148ZM277.333 170C277.333 146.77 296.103 128 319.333 128C342.563 128 361.333 146.77 361.333 170C361.333 193.23 342.563 212 319.333 212C296.103 212 277.333 193.23 277.333 170Z" fill="black"/>
        </svg>`,
    blockIcon: `
        <svg width="100%" height="100%" viewBox="0 0 404 404" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M0 202C0 90.4501 90.4501 0 202 0C312.408 0 404 79.7737 404 180.666C404 245.069 351.736 297.333 287.333 297.333H249.68C237.496 297.333 227.68 307.149 227.68 319.333C227.68 325.01 229.708 330 233.104 333.86C239.962 341.32 244 351.165 244 362C244 385.23 225.23 404 202 404C90.4501 404 0 313.55 0 202ZM202 20C101.496 20 20 101.496 20 202C20 302.504 101.496 384 202 384C214.184 384 224 374.184 224 362C224 356.238 221.884 351.185 218.338 347.349L218.267 347.273L218.198 347.195C211.603 339.757 207.68 330.052 207.68 319.333C207.68 296.103 226.45 277.333 249.68 277.333H287.333C340.69 277.333 384 234.023 384 180.666C384 92.9723 303.646 20 202 20ZM148.667 62.667C136.483 62.667 126.667 72.4828 126.667 84.667C126.667 96.8512 136.483 106.667 148.667 106.667C160.85 106.667 170.667 96.851 170.667 84.667C170.667 72.4828 160.851 62.667 148.667 62.667ZM106.667 84.667C106.667 61.4371 125.437 42.667 148.667 42.667C171.897 42.667 190.667 61.4372 190.667 84.667C190.667 107.897 171.896 126.667 148.667 126.667C125.437 126.667 106.667 107.897 106.667 84.667ZM255.333 62.667C243.149 62.667 233.333 72.4828 233.333 84.667C233.333 96.8512 243.149 106.667 255.333 106.667C267.517 106.667 277.333 96.8512 277.333 84.667C277.333 72.4829 267.517 62.667 255.333 62.667ZM213.333 84.667C213.333 61.4372 232.103 42.667 255.333 42.667C278.563 42.667 297.333 61.4371 297.333 84.667C297.333 107.897 278.563 126.667 255.333 126.667C232.103 126.667 213.333 107.897 213.333 84.667ZM84.667 148C72.4828 148 62.667 157.816 62.667 170C62.667 182.184 72.4828 192 84.667 192C96.8504 192 106.667 182.184 106.667 170C106.667 157.816 96.8512 148 84.667 148ZM42.667 170C42.667 146.77 61.4372 128 84.667 128C107.897 128 126.667 146.77 126.667 170C126.667 193.23 107.896 212 84.667 212C61.4372 212 42.667 193.23 42.667 170ZM319.333 148C307.149 148 297.333 157.816 297.333 170C297.333 182.184 307.149 192 319.333 192C331.517 192 341.333 182.184 341.333 170C341.333 157.816 331.517 148 319.333 148ZM277.333 170C277.333 146.77 296.103 128 319.333 128C342.563 128 361.333 146.77 361.333 170C361.333 193.23 342.563 212 319.333 212C296.103 212 277.333 193.23 277.333 170Z" fill="black"/>
        </svg>`,
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
  import SendFeedback from "../main/user-interface/SendFeedback.svelte";
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
  <SendFeedback feedback_context="LedColor" />
</config-led-color>
