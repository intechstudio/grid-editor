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

<page-controller class="{$$props.class} grid-last-auto bg-primary">
  {#each [0, 1, 2, 3] as page}
    <button
      on:click={() => {
        handleSelectPage(page);
      }}
      class="{selectedPage == page
        ? 'bg-secondary rounded-t'
        : 'hover:bg-secondary hover:bg-opacity-50 transition-colors duration-75'} py-1 px-8 group"
    >
      <span
        class="{selectedPage == page
          ? 'text-white'
          : 'text-gray-300 group-hover:text-white transition-colors duration-100'} "
        >Page {page + 1}</span
      >
    </button>
  {/each}
</page-controller>

<style>
  .grid-last-auto {
    display: grid;
    grid-auto-flow: column;
    /* Define the columns to take up as much as their content */
    grid-template-columns: repeat(auto-fit, minmax(0, max-content));
  }

  .grid-last-auto > :last-child {
    /* The last grid cell will take up all the remaining space */
    grid-column: span 1;
  }
</style>
