<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "sglc",
    name: "SimpleColor",
    category: "led",
    rendering: "standard",
    color: "#726E60",
    displayName: "Simple Color",
    defaultLua: "self:led_color(1, {{255,255,255,1}})",
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
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    MeltCombo,
    MeltSelect,
    MoltenPushButton,
  } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import SendFeedback from "../main/user-interface/SendFeedback.svelte";
  import { Validator } from "./_validators";
  import { Script } from "./_script_parsers.js";
  import { LocalDefinitions } from "../runtime/runtime.store";
  import { GridAction, GridEvent } from "./../runtime/runtime";
  import SliderColorPicker from "../main/user-interface/SliderColorPicker.svelte";
  import SquareColorPicker from "../main/user-interface/SquareColorPicker.svelte";
  import CircleColorPicker from "../main/user-interface/CircleColorPicker.svelte";
  import VerticalSlider from "../main/user-interface/VerticalSlider.svelte";
  import { get } from "svelte/store";
  import { SimpleColor } from "./SimpleColor";

  const dispatch = createEventDispatcher();
  const checkboard =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="50" height="50" fill="white" /><rect x="50" y="50" width="50" height="50" fill="white" /><rect x="50" width="50" height="50" fill="transparent" /><rect y="50" width="50" height="50" fill="transparent" /></svg>';

  export let config: GridAction;
  export let index;

  const event = config.parent as GridEvent;

  const data = new SimpleColor.ViewModel(config);

  $: data.updateData(new SimpleColor.ParsedData(config));

  function sendData() {
    const script = Script.toScript({
      short: `${get(data).element.value}:led_color`,
      array: [
        get(data).layer.value,
        `{${get(data)
          .colors.map((e) => `{${[e.r, e.g, e.b, e.a].join(",")}}`)
          .join(",")}}`,
      ],
    });

    dispatch("update-action", { short: config.short, script: script });
  }

  function handleAddLayer() {
    const last = get(data).colors.at(-1);
    data.addLayer(last);
    sendData();
    dispatch("sync");
  }

  function handleRemoveLayer() {
    const selected = get(data).selectedIndex;
    data.removeLayer(selected);
    sendData();
    dispatch("sync");
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
  let selected = ColorPickerModel.Circle;
</script>

<config-led-color class="flex flex-col gap-4 w-full p-2 pointer-events-auto">
  <div class="flex flex-row w-full justify-between items-center">
    <span class="text-white text-sm">Color</span>
    <div class="flex flex-row gap-1">
      <MoltenPushButton
        text="-"
        click={() => handleRemoveLayer()}
        disabled={$data.colors.length === 1}
      />
      <MoltenPushButton
        text="+"
        click={handleAddLayer}
        disabled={$data.colors.length === 3}
      />
    </div>
  </div>

  <div class="flex flex-row w-full gap-2">
    <MeltCombo
      title={"Element"}
      bind:value={$data.element.value}
      validator={(e) => {
        return new Validator(e).NotEmpty().Result();
      }}
      suggestions={$data.element.suggestions}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
      on:input={(e) => {
        sendData();
      }}
      on:change={() => dispatch("sync")}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />

    <MeltCombo
      title={"Layer"}
      bind:value={$data.layer.value}
      validator={(e) => {
        return new Validator(e).NotEmpty().Result();
      }}
      suggestions={$data.layer.suggestions}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
      on:input={(e) => {
        sendData();
      }}
      on:change={() => dispatch("sync")}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />
  </div>

  <div class="flex w-full h-[20px] border border-black rounded-full">
    <div class="relative flex w-full h-full">
      <div
        class="absolute inset-0 opacity-20 rounded-full"
        style="background-image: url('{checkboard}');
      background-size: 7px 7px;
      background-repeat: repeat;"
      />
      <div class="absolute w-full h-full grid grid-cols-1">
        <div
          class="flex flex-grow h-full rounded-full"
          style="background-image: linear-gradient(to right, {($data.colors
            .length === 1
            ? [new SimpleColor.ColorData('0', '0', '0', '0'), ...$data.colors]
            : $data.colors
          )
            .map((e) => `rgba(${e.r},${e.g},${e.b},${e.a})`)
            .join(',')});"
        />
      </div>

      {#each $data.colors as color, i}
        {@const isFirst = i === 0}
        {@const isLast = i === $data.colors.length - 1}
        {@const totalSteps = $data.colors.length - 1}
        {@const stepSize = 100 / totalSteps}
        {@const position =
          isFirst && $data.colors.length > 1
            ? "12px"
            : isLast
            ? "calc(100% - 12px)"
            : `${stepSize * i}%`}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          on:click={() => {
            data.selectLayer(i);
          }}
          class="aspect-square rounded-full bg-primary"
          style="position: absolute; height: calc(100% + 8px); left: {position}; top: 0%; transform: translate(-50%, -4px);"
        >
          <div
            class="absolute flex w-full h-full opacity-20 rounded-full"
            style="background-image: url('{checkboard}');
      background-size: 7px 7px;
      background-repeat: repeat;"
          />
          <div
            class="absolute flex w-full h-full rounded-full cursor-pointer hover:scale-110 border border-black"
            style="background-color: rgba({color.r}, {color.g},{color.b},{color.a});"
          />
          <div
            class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full bg-black bg-opacity-50 pointer-events-none"
            class:hidden={i !== $data.selectedIndex}
          />
        </div>
      {/each}
    </div>
  </div>

  <div
    class="grid grid-cols-[2fr_1fr] w-full gap-2 text-white place-items-center"
  >
    <div class="flex w-full">
      <MeltSelect
        bind:target={selected}
        {options}
        disabled={false}
        size={"full"}
      />
    </div>

    <span class="text-white">Intensity</span>
    <div class="flex h-32 w-full items-center justify-center">
      <svelte:component
        this={colorPickerComponent.get(selected)}
        color={$data.getSelectedColor().toHSL()}
        on:input={(e) => {
          const { color } = e.detail;
          data.updateSelectedLayer(color);
          sendData();
        }}
        on:change={() => dispatch("sync")}
      />
    </div>

    <VerticalSlider
      value={Number($data.getSelectedColor().a)}
      max={1}
      on:input={(e) => {
        const { value } = e.detail;
        const color = get(data).getSelectedColor();
        get(data).getSelectedColor().a = String(value);
        sendData();
      }}
      on:change={() => dispatch("sync")}
    >
      <div class="w-full h-full bg-alpha" />
    </VerticalSlider>
  </div>

  <div class="grid grid-cols-4 w-full gap-2">
    {#each ["r", "g", "b", "a"] as channel}
      <MeltCombo
        title={" "}
        value={String($data.getSelectedColor()[channel])}
        validator={(e) => {
          return new Validator(e).NotEmpty().Result();
        }}
        suggestions={LocalDefinitions.getFrom({
          configs: $event.config,
          index: index,
        })}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
        on:input={(e) => {
          const value = Number(e.detail);
          const color = get(data).getSelectedColor().toHSL();
          color[channel] = value;
          data.updateSelectedLayer(color);
          sendData();
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    {/each}
  </div>

  <SendFeedback
    feedback_context="LedColor"
    class="mt-2 text-sm text-gray-500"
  />
</config-led-color>

<style>
  .bg-alpha {
    background: linear-gradient(to top, black, white);
  }
</style>
