<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher();

  interface MoltenEnabledStyle {
    color?: string;
    fontSize?: number;
  }

  const defaultStyle = {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 12,
  };

  export let value: boolean = false;
  export let style: MoltenEnabledStyle = defaultStyle;

  let textElement: HTMLSpanElement;
  let gemElement: HTMLDivElement;

  let containerWidth: number = undefined;

  onMount(() => {
    containerWidth = textElement.offsetWidth + gemElement.offsetWidth;
    containerWidth = containerWidth * 1.3;
  });

  function handleClick(e: MouseEvent) {
    value = !value;
    dispatch("change", value);
  }
</script>

<container style="width: {containerWidth}px;">
  <button
    class="grid grid-cols-[1fr_auto] w-full items-center justify-items-start group px-2 py-1 hover:bg-white/10 rounded cursor-pointer"
    on:click={handleClick}
  >
    <span
      bind:this={textElement}
      class="py-auto"
      style="font-size: {style.fontSize}px; line-height: {style.fontSize *
        0.7}px; color: {style.color};">{value ? "Enabled" : "Disabled"}</span
    >

    <div
      bind:this={gemElement}
      class="w-4 h-4 rounded-full border relative"
      style="border-color: {style.color};  "
    >
      {#if value}
        <div
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-commit group-hover:bg-commit-desaturate-20 rounded-full"
        />
      {/if}
    </div>
  </button>
</container>
