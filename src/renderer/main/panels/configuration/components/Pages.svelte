<script>
  import { get } from "svelte/store";

  import {
    logger,
    unsaved_changes,
    runtime,
    user_input,
  } from "../../../../runtime/runtime.store.js";

  let selectedPage = undefined;
  function handleSelectPage(page) {
    if (get(unsaved_changes) == 0) {
      selectedPage = page;
      runtime.change_page(selectedPage);
    } else {
      logger.set({
        type: "alert",
        classname: "pagechange",
        mode: 0,
        message: "Store your config before switching pages!",
      });
    }
  }

  $: {
    try {
      selectedPage = $user_input.event.pagenumber;
    } catch (error) {
      console.log("Get page error", error);
    }
  }
</script>

<div class="{$$props.class} flex flex-row gap-2 mt-3 items-center">
  {#each Array(4).keys() as i}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <button
      on:click={() => {
        handleSelectPage(i);
      }}
      class="{selectedPage == i
        ? 'w-9 h-9 text-xl'
        : 'w-7 h-7 text-base'} bg-primary rounded font-bold border border-white border-opacity-30"
    >
      <div
        class="w-full h-full {selectedPage == i
          ? 'bg-white bg-opacity-10'
          : 'hover:bg-white hover:bg-opacity-5'} flex items-center justify-center"
      >
        <span class="text-white text-opacity-75">{i + 1}</span>
      </div>
    </button>
  {/each}
</div>
