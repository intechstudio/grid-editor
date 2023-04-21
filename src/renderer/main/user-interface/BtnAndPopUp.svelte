<script>
  import { fade } from "svelte/transition";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let btnStyle = "";
  export let popStyle = "";

  let show = false;
  function clicked() {
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
    on:click={clicked}
    class="{btnStyle} text-sm py-1 px-2 text-white focus:ring-1 focus:outline-none border border-select-saturate-10 shadow hover:border-purple-500"
  >
    <slot name="button" />
  </button>
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
