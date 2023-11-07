<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { onDestroy } from "svelte";

  const dispatch = createEventDispatcher();

  export let type = undefined;
  export let count = 1;
  export let message = "";

  function handleClick(e) {
    dispatch("click");
  }

  onDestroy(() => {
    dispatch("destroy");
  });

  onMount(() => {
    dispatch("creation");
  });
</script>

<button on:click={handleClick} class="w-full">
  <div class="relative flex flex-row items-center">
    {#if count > 1}
      <div
        class="absolute -left-12 grid rounded-full w-10 h-8 bg-slate-500 content-center mr-4 text-white"
      >
        <div class="text-center">{count}x</div>
      </div>
    {/if}
    <div class="flex bg-secondary my-1 rounded-md bg-opacity-70 w-full">
      <div
        class="flex flex-row items-center p-2 bg-primary rounded-md border border-opacity-0 hover:border-opacity-60 border-primary-800 hover:bg-primary-700 hover:bg-opacity-80 bg-opacity-50 w-full shadow-md transition-color duration-[30ms]"
      >
        <div class="px-2 py-1 bg-primary rounded mr-2 text-white">
          {type == "success"
            ? "✔️"
            : type == "alert"
            ? "⚠️"
            : type == "progress"
            ? "⏳"
            : type == "fail"
            ? "❌"
            : null}
        </div>
        <div class="w-full flex flex-col">
          <span class="text-white">{message}</span>
          <span class="text-sm text-gray-400">(Click to Dismiss!)</span>
        </div>
      </div>
    </div>
  </div>
</button>
