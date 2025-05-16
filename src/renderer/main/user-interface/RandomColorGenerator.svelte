<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Grid } from "../../lib/_utils";

  const dispatch = createEventDispatcher();

  export let color: Grid.HSL;

  let preview: HTMLElement;

  function generateRandomColor() {
    let hsl = Grid.RGB.getRandom().toHSL();
    hsl.s = 100;
    hsl.l = 50;
    dispatch("generate", { color: hsl });
  }
</script>

<container>
  <button
    data-testid="random-color-generator"
    bind:this={preview}
    on:click={generateRandomColor}
    class="group flex h-14 w-14 border border-black"
    style="background-color: {color.toCSS()};"
  >
    <div
      class="preview w-full h-full items-center text-2xl justify-center flex group-hover:opacity-100 opacity-0 transition-opacity"
    />
  </button>
</container>

<style>
  @keyframes changeLetter {
    0% {
      content: "⚀";
      transform: rotate(0deg);
    }
    18% {
      content: "⚁";
      transform: rotate(20deg);
    }
    36% {
      content: "⚂";
      transform: rotate(30deg);
    }
    52% {
      content: "⚃";
      transform: rotate(20deg);
    }
    69% {
      content: "⚄";
      transform: rotate(0deg);
    }
    86% {
      content: "⚅";
      transform: rotate(-10deg);
    }
  }

  .preview:hover {
    cursor: pointer;
  }
  .preview::after {
    animation: changeLetter 1s linear infinite;
    content: "⚄";
    font-size: 150%;
  }
</style>
