<script lang="ts">
  import Button from "./Button.svelte";

  export let elementNumberList;
  export let elementposition_array;
</script>

<container
  class="w-full h-full flex flex-col items-center justify-center relative col-span-2 row-span-2 p-3"
>
  <lcd class="flex-col w-full relative">
    <div class="normal-cell-underlay-container">
      <slot name="cell-underlay-4" />
    </div>

    <div
      class="flex w-full aspect-[320/240] bg-black/10 text-white/20 items-center justify-center"
    >
      {"Element: " + elementNumberList[4]}<br />
      320x240
    </div>
    <div class="normal-cell-overlay-container">
      <slot name="cell-overlay-4" />
    </div>
  </lcd>
  <div class="flex flex_col items-center justify-center w-full mt-1">
    {#each elementNumberList.slice(0, 4) as elementNumber}
      <cell
        class="flex items-center justify-center w-12 h-10 relative -mx-2 -my-4"
      >
        <div class="normal-cell-underlay-container">
          {#if elementNumber == Math.min(...elementNumberList)}
            <slot name="cell-underlay-0" />
          {:else if elementNumber == Math.min(...elementNumberList) + 1}
            <slot name="cell-underlay-1" />
          {:else if elementNumber == Math.min(...elementNumberList) + 2}
            <slot name="cell-underlay-2" />
          {:else if elementNumber == Math.min(...elementNumberList) + 3}
            <slot name="cell-underlay-3" />
          {/if}
        </div>
        <button class="normal-cell-ui-container opacity-70">
          <Button
            {elementNumber}
            position={elementposition_array[elementNumber][0]}
            size={1.0}
          />
        </button>
        <div class="normal-cell-overlay-container">
          {#if elementNumber == Math.min(...elementNumberList)}
            <slot name="cell-overlay-0" />
          {:else if elementNumber == Math.min(...elementNumberList) + 1}
            <slot name="cell-overlay-1" />
          {:else if elementNumber == Math.min(...elementNumberList) + 2}
            <slot name="cell-overlay-2" />
          {:else if elementNumber == Math.min(...elementNumberList) + 3}
            <slot name="cell-overlay-3" />
          {/if}
        </div>
      </cell>
    {/each}
  </div>
</container>
