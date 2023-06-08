<script>
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let selected = false;

  function handleClick(e) {
    selected = !selected;
    dispatch("selection-change", {
      value: selected,
    });
  }
</script>

<select-box class="flex pl-2 justify-center items-center bg-transparent">
  <button
    on:click={handleClick}
    class="{selected ? ' border-opacity-80 bg-secondary' : ''} {!selected
      ? 'h-[18px] w-[18px] border-opacity-20 hover:border-opacity-100'
      : ''} cursor-pointer border-white justify-center border transition-opacity rounded-md"
  >
    {#if selected}
      <SvgIcon
        displayMode="button"
        class="h-[16px] w-[16px]"
        activeState={selected}
        iconPath={"tick"}
      />
    {/if}
  </button>
</select-box>
