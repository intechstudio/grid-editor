<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Grid } from "../../lib/_utils";
  import ColorSlider from "./ColorSlider.svelte";

  const dispatch = createEventDispatcher();

  export let color: Grid.HSL;

  let value: Grid.HSL;

  $: handleColorChange(color);

  function handleColorChange(color: Grid.HSL) {
    if (typeof color === "undefined") {
      return;
    }

    if (typeof value === "undefined") {
      value = color;
      return;
    }

    const incoming = color.toRGB();
    const current = value.toRGB();

    if (
      incoming.r === current.r &&
      incoming.g === current.g &&
      incoming.b === current.b
    ) {
      return;
    }

    value = color;
  }

  enum Channel {
    HUE = "h",
    SATURATION = "s",
    BRIGHTNESS = "l",
  }

  type SliderData = {
    label: string;
    key: Channel;
    max: number;
  };

  const sliders: SliderData[] = [
    { label: "H", key: Channel.HUE, max: 360 },
    { label: "S", key: Channel.SATURATION, max: 100 },
    { label: "L", key: Channel.BRIGHTNESS, max: 100 },
  ];

  function handleInput(channel: Channel, inputValue: number) {
    value[channel] = inputValue;
    dispatch("input", { color: value });
  }

  function handleChange() {
    dispatch("change", { color: value });
  }

  function getGradient(color: Grid.HSL | undefined, channel: Channel) {
    if (typeof color === "undefined") {
      return "background-color: white;";
    }

    const stops = {
      h: [0, 60, 120, 180, 240, 360].map((h) =>
        new Grid.HSL(h, color.s, color.l).toHEX()
      ),
      s: [0, 100].map((s) => new Grid.HSL(color.h, s, color.l).toHEX()),
      l: [0, 50, 100].map((l) => new Grid.HSL(color.h, color.s, l).toHEX()),
    };
    return `background: linear-gradient(to right, ${stops[channel].join(
      ", "
    )});`;
  }
</script>

<div class="grid grid-cols-[auto_1fr] gap-2 items-center w-full">
  {#each sliders as { label, key, max }}
    <span class="text-white text-sm">{label}:</span>
    <ColorSlider
      value={value && color ? value[key] : undefined}
      {max}
      direction="horizontal"
      round={true}
      on:input={(e) => handleInput(key, e.detail.value)}
      on:change={handleChange}
    >
      <div class="w-full h-full" style={getGradient(value, key)} />
    </ColorSlider>
  {/each}
</div>
