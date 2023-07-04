<script>
  import { fade } from "svelte/transition";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let btnStyle = "";
  export let popStyle = "";
  export let enabled = true;

  let show = false;
  function handleClicked() {
    if (!enabled) return;
    dispatch("clicked");
    show = true;
    setTimeout(() => {
      show = false;
    }, 1000);
  }
</script>

<div class="relative flex justify-center">
  {#if show}
    <app-popup
      in:fade={{ duration: 50 }}
      out:fade
      class="absolute {popStyle} rounded px-4 py-1 text-sm text-white -mt-12 z-10"
    >
      <slot name="popup" />
    </app-popup>
  {/if}
  <button
    on:click={handleClicked}
    disabled={!enabled}
    class:opacity-50={!enabled}
    class="{btnStyle} text-sm py-1 px-2 text-white focus:ring-1 focus:outline-none shadow border border-white border-opacity-5 hover:border-opacity-25"
  >
    <slot name="button" />
  </button>
  <slot class="opacity-100" />
</div>

<style>
  app-popup:before {
    content: "";
    position: absolute;
    top: 100%;
    left: 16px;
    width: 0;
    border-top: 4px solid white;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
  }
</style>
