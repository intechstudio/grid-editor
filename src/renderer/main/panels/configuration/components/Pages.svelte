<script>
  import { get } from "svelte/store";

  import {
    logger,
    unsaved_changes,
    runtime,
    user_input,
  } from "../../../../runtime/runtime.store.js";

  import TooltipQuestion from "../../../user-interface/tooltip/TooltipQuestion.svelte";

  let alert = false;

  let manage = false;
  function managePages() {
    manage = !manage;
  }

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

  let lol = 0;

  const design = (page) => {
    let style = "";
    if (page !== "") {
      if (selectedPage == page) {
        style = `shadow-md bg-pick text-white `;
      } else {
        style = `hover:bg-pick-desaturate-10 text-gray-50 `;
      }
    } /* else {
      style = "dummy ";
    } */

    return style;
  };

  user_input.subscribe((ui) => {
    try {
      selectedPage = ui.event.pagenumber;
    } catch (error) {
      console.log("Get page error", error);
    }
  });
</script>

<page-controller class=" relative flex flex-col w-full bg-primary">
  <!--   <div class="text-gray-500 flex items-center py-1 text-sm">
    <div>Pages</div>
    <TooltipQuestion key={"configuration_pages"} />
  </div> -->

  <div class="flex bg-primary w-fit gap-2">
    {#each [0, 1, 2, 3] as page}
      <button
        on:click={() => {
          handleSelectPage(page);
        }}
        class=" {selectedPage == page
        ? 'bg-secondary  text-white'
        : 'hover:bg-secondary hover:opacity-50 text-gray-50'} relative p-1 flex-grow border-0 focus:outline-none  flex-grow border-0 text-gray-50  w-[100px]"

      >
        Page {@html page !== ""
          ? page + 1
          : `<span class="invisible">null</span>`}
      </button>

      <!--       {#if manage}
        <button
          class="text-sm py-0.5 px-4 text-white rounded-full hover:bg-select focus:ring-0 focus:outline-none border border-select-saturate-10 shadow hover:border-purple-500"
        >
          <svg
            class="w-5 h-5 p-1 fill-current text-white"
            viewBox="0 0 29 29"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z"
            />
            <path
              d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z"
            />
          </svg>
        </button>
      {/if} -->

      <!-- <button
        class="{manage
          ? 'flex'
          : 'invisible'} h-5 w-5 rounded-full text-center  items-center justify-center bg-pick"
      >
        <svg
          class="w-5 h-5 p-1"
          viewBox="0 0 7 7"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M3.5 0.5C3.77614 0.5 4 0.723858 4 1V3H6C6.27614 3 6.5 3.22386 6.5 3.5C6.5 3.77614 6.27614 4 6 4H4V6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6V4H1C0.723858 4 0.5 3.77614 0.5 3.5C0.5 3.22386 0.723858 3 1 3H3V1C3 0.723858 3.22386 0.5 3.5 0.5Z"
            fill="white"
          />
        </svg>
      </button> -->
    {/each}
  </div>
</page-controller>

<!-- <script>
  import { get } from "svelte/store";

  import {
    logger,
    unsaved_changes,
    runtime,
  } from "../../../../runtime/runtime.store.js";

  import TooltipQuestion from "../../../user-interface/tooltip/TooltipQuestion.svelte";

  export let pages;

  let alert = false;

  let manage = false;
  function managePages() {
    manage = !manage;
  }

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

  const design = (page) => {
    let style = "";
    if (page !== "") {
      if (selectedPage == page) {
        style = "shadow-md bg-pick text-white";
      } else {
        style = "hover:bg-pick-desaturate-10 text-gray-50";
      }
    } else {
      style = "dummy";
    }

    return style;
  };

  $: selectedPage = pages.selected;
</script>

<page-controller
  class="{pages.options.includes('') &&
    'pointer-events-none'} relative  px-4 pb-4 pt-2 flex flex-col w-full bg-primary"
>
  <div class="text-gray-500 flex items-center py-1 text-sm">
    <div>Pages</div>
    <TooltipQuestion key={"configuration_pages"} />
  </div>

  <div class="flex bg-secondary shadow">
    {#each pages.options as page}
      <button
        on:click={() => {
          handleSelectPage(page);
        }}
        class="{design(
          page
        )} m-2 p-1 flex-grow border-0 rounded focus:outline-none"
      >
        {@html page !== "" ? page : `<span class="invisible">null</span>`}
      </button>

      {#if manage}
        <button
          class="text-sm py-0.5 px-4 text-white rounded-full hover:bg-select focus:ring-0 focus:outline-none border border-select-saturate-10 shadow hover:border-purple-500"
        >
          <svg
            class="w-5 h-5 p-1 fill-current text-white"
            viewBox="0 0 29 29"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z"
            />
            <path
              d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z"
            />
          </svg>
        </button>
      {/if}

      <button
        class="{manage
          ? 'flex'
          : 'invisible'} h-5 w-5 rounded-full text-center  items-center justify-center bg-pick"
      >
        <svg
          class="w-5 h-5 p-1"
          viewBox="0 0 7 7"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M3.5 0.5C3.77614 0.5 4 0.723858 4 1V3H6C6.27614 3 6.5 3.22386 6.5 3.5C6.5 3.77614 6.27614 4 6 4H4V6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6V4H1C0.723858 4 0.5 3.77614 0.5 3.5C0.5 3.22386 0.723858 3 1 3H3V1C3 0.723858 3.22386 0.5 3.5 0.5Z"
            fill="white"
          />
        </svg>
      </button>
    {/each}
  </div>
</page-controller>

<style>
  .dummy {
    @apply bg-select;
    @apply bg-opacity-50;
  }

  .triangle-right {
    width: 0px;
    height: 0px;
    border: 10px solid;
    border-top-color: transparent;
    border-left-color: green;
    border-right-color: transparent;
    border-bottom-color: transparent;
  }
</style>
 -->
<style>
  /*   .dummy {
    @apply bg-select;
    @apply bg-opacity-50;
  } */

  .triangle-right {
    width: 0px;
    height: 0px;
    border: 10px solid;
    border-top-color: transparent;
    border-left-color: green;
    border-right-color: transparent;
    border-bottom-color: transparent;
  }
</style>
