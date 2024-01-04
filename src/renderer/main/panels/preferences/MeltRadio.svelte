<script lang="ts">
  import { createRadioGroup, melt } from "@melt-ui/svelte";
  import { writable } from "svelte/store";

  interface option_t {
    title: string;
    value: string | boolean | number; // melt uses string values internally
  }

  export let options: option_t[];
  export let target;
  export let orientation: "vertical" | "horizontal" = "vertical";
  export let style: "button" | "radio" = "radio";
  export let size: "auto" | "full" = "auto";

  const {
    elements: { root, item },
    helpers: { isChecked },
    states: { value },
  } = createRadioGroup({
    defaultValue: target,
    orientation: orientation,
  });

  let oldTarget;

  $: {
    if (target.toString() !== oldTarget) {
      $value = target.toString();
      oldTarget = target.toString();
    }

    if (target.toString() !== $value) {
      oldTarget = $value;

      if ($value === "true") {
        // Convert back to boolean automatically
        target = true;
      } else if ($value === "false") {
        // Convert back to boolean automatically
        target = false;
      } else if ($value !== "" && !isNaN(Number($value))) {
        // Convert back to number automatically
        target = Number($value);
      } else {
        target = $value;
      }
    }
  }
</script>

<div
  {...$root}
  use:root
  class="text-white overflow-auto
    {size == 'full' && orientation == 'horizontal' ? 'w-full' : ''}
    {orientation === 'vertical'
    ? 'grid grid-flow-row my-2 gap-4'
    : 'grid grid-flow-col'}
    {style === 'button' ? 'gap-4' : ''}
    {style !== 'button' && orientation !== 'vertical'
    ? 'border border-black border-opacity-20 bg-black bg-opacity-10'
    : ''} py-2"
>
  {#each options as option}
    <!-- Convert value to string in case it was originally boolean -->
    {@const value = option.value.toString()}
    {@const title = option.title}
    <label
      class="
    {orientation === 'vertical'
        ? 'border border-black border-opacity-20 bg-black bg-opacity-10 py-2'
        : ''} 
      group cursor-pointer flex items-center {style !== 'button' ? 'px-2' : ''}"
    >
      {#if style === "radio"}
        <button {...$item(value)} use:item id={title}>
          <div
            class="relative flex items-center justify-center rounded-full border w-6 h-6 mr-3"
          >
            <div
              class="{$isChecked(value)
                ? 'block'
                : 'hidden'} absolute rounded-full bg-white h-3 w-3"
            />
          </div>
        </button>

        <span id="{title}-label">{title}</span>
      {/if}
      {#if style === "button"}
        <button
          {...$item(value)}
          use:item
          id={title}
          class="relative px-2 py-1 w-full rounded bg-black bg-opacity-10 border border-black border-opacity-40"
          class:bg-opacity-60={$isChecked(value)}
          class:hover:bg-opacity-40={!$isChecked(value)}
        >
          {#if typeof title !== "undefined"}
            <span id="{title}-label">{title}</span>
          {:else}
            <span class="invisible">N/A</span>
          {/if}
          <slot name="item" {value} />
        </button>
      {/if}
    </label>
  {/each}
</div>
