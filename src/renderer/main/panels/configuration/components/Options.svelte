<script>
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let index = undefined;
  export let isSelected = false;

  function handleClick(e) {
    isSelected = !isSelected;
    dispatch("selection-change", {
      value: isSelected,
      index: index,
    });
  }
</script>

<select-box class="flex pl-2 justify-center items-center bg-transparent">
  <button
    on:click={handleClick}
    class="{isSelected ? ' border-opacity-80 bg-secondary' : ''} {!isSelected
      ? 'h-[18px] w-[18px] border-opacity-20 hover:border-opacity-100'
      : ''} cursor-pointer border-white justify-center border transition-opacity rounded-md"
  >
    {#if isSelected}
      <SvgIcon
        displayMode="button"
        class="h-[16px] w-[16px]"
        activeState={isSelected}
        iconPath={"tick"}
      />
    {/if}
  </button>
</select-box>
