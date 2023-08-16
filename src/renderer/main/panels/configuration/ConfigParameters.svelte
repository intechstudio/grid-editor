<script>
  import { appSettings } from "../../../runtime/app-helper.store.js";

  import { get } from "svelte/store";
  import {
    runtime,
    elementNameStore,
    engine,
    logger,
    user_input,
    controlElementClipboard,
  } from "../../../runtime/runtime.store.js";
  import { onDestroy, onMount } from "svelte";

  import TooltipSetter from "../../user-interface/tooltip/TooltipSetter.svelte";
  import TooltipQuestion from "../../user-interface/tooltip/TooltipQuestion.svelte";
  import SvgIcon from "../../user-interface/SvgIcon.svelte";

  import { Analytics } from "../../../runtime/analytics.js";

  export let events;

  let stringname;

  $: {
    try {
      stringname =
        $elementNameStore[$user_input.brc.dx][$user_input.brc.dy][
          $user_input.event.elementnumber
        ];
    } catch (error) {}
  }

  let selectedEvent;

  $: selectedEvent = events.selected;

  let loaded;

  onMount(() => {});

  onDestroy(() => {
    loaded = false;
  });

  function handleSelectEvent(event) {
    selectedEvent = event;
    user_input.update_eventtype(event.value);
  }

  function handleSelectElement(element) {
    user_input.update_elementnumber(element);
  }

  function copyAllEventConfigsFromSelf() {
    let callback = function () {
      const li = get(user_input);
      const rt = get(runtime);

      const device = rt.find(
        (device) => device.dx == li.brc.dx && device.dy == li.brc.dy
      );
      const pageIndex = device.pages.findIndex(
        (x) => x.pageNumber == li.event.pagenumber
      );
      const elementIndex = device.pages[pageIndex].control_elements.findIndex(
        (x) => x.controlElementNumber == li.event.elementnumber
      );

      const events =
        device.pages[pageIndex].control_elements[elementIndex].events;
      const controlElementType =
        device.pages[pageIndex].control_elements[elementIndex]
          .controlElementType;

      logger.set({
        type: "success",
        mode: 0,
        classname: "elementcopy",
        message: `Events are copied!`,
      });
      engine.set("ENABLED");
      controlElementClipboard.set({ controlElementType, events });
    };

    engine.set("DISABLED");
    logger.set({
      type: "progress",
      mode: 0,
      classname: "elementcopy",
      message: `Copy events from element...`,
    });

    runtime.fetch_element_configuration_from_grid(callback);

    Analytics.track({
      event: "Config Action",
      payload: { click: "Whole Element Copy" },
      mandatory: false,
    });
  }

  function overwriteAllEventConfigs() {
    let clipboard = get(controlElementClipboard);
    runtime.whole_element_overwrite(clipboard);

    Analytics.track({
      event: "Config Action",
      payload: { click: "Whole Element Overwrite" },
      mandatory: false,
    });
  }

  function updateStringName(e) {
    const name = e.target.value;
    console.error("SORRY");
  }

  function showControlElementNameOverlay() {
    $appSettings.overlays.controlElementName =
      !$appSettings.overlays.controlElementName;
  }
</script>

<div
  class="{selectedEvent ||
    'pointer-events-none'} flex flex-col bg-primary w-full p-4"
>
  <div
    class="pb-2 {$appSettings.configType == 'uiEvents'
      ? 'block'
      : 'hidden'} flex"
  >
    <div class="w-3/4 p-1">
      <div class="flex items-center py-1">
        <div class="text-gray-500 text-sm">Element Name</div>
        <button
          on:click={showControlElementNameOverlay}
          class="border-none focus:outline-none ml-1"
        >
          <svg
            class="w-5 h-5 p-0.5 fill-current text-gray-400"
            viewBox="0 0 512 328"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M508.745 154.041C504.171 147.784 395.188 0.834961 255.997 0.834961C116.806 0.834961 7.818 147.784 3.249 154.035C-1.083 159.971 -1.083 168.022 3.249 173.958C7.818 180.215 116.806 327.164 255.997 327.164C395.188 327.164 504.171 180.214 508.745 173.963C513.083 168.028 513.083 159.971 508.745 154.041ZM255.997 293.406C153.468 293.406 64.667 195.873 38.38 163.988C64.633 132.075 153.248 34.593 255.997 34.593C358.521 34.593 447.316 132.109 473.614 164.011C447.361 195.923 358.746 293.406 255.997 293.406Z"
            />
            <path
              d="M255.997 62.725C200.155 62.725 154.722 108.158 154.722 164C154.722 219.842 200.155 265.275 255.997 265.275C311.839 265.275 357.272 219.842 357.272 164C357.272 108.158 311.839 62.725 255.997 62.725ZM255.997 231.516C218.767 231.516 188.481 201.229 188.481 164C188.481 126.771 218.768 96.484 255.997 96.484C293.226 96.484 323.513 126.771 323.513 164C323.513 201.229 293.227 231.516 255.997 231.516Z"
            />
          </svg>
        </button>
      </div>
      <div class="text-white flex">
        {#if stringname}
          <div>{stringname}</div>
        {/if}
        {#if !stringname}
          <div>Name your element</div>
        {/if}

        <TooltipQuestion key={"configuration_element_name"} />
      </div>

      <!--       <input
        disabled
        type="text"
        bind:value={stringname}
        on:input={updateStringName}
        class="w-full bg-secondary border-none text-white py-1.5 pl-2 rounded-none"
      /> -->
    </div>

    <!--     <div class="w-1/2 p-1">
      <div class="text-gray-500 py-1 text-sm">Selected Element</div>

      <div class="flex flex-col relative  font-bold text-white">

        <select
          bind:value={elements.selected}
          on:change={(e) => {
            handleSelectElement(elements.selected);
          }}
          class="bg-secondary border-none flex-grow text-white p-2 shadow"
        >
          {#each elements.options.slice(0, -1) as element}
            <option
              value={element}
              class="text-white bg-secondary py-1 border-none"
              >Element {element}</option
            >
          {/each}
        </select>
      </div>
    </div> -->
  </div>

  <div class="pb-2 flex flex-col justify-center">
    <!--     <div class="  flex justify-center items-center">
      <hr class="w-[90%] my-6 border-white border-opacity-10 " />
    </div> -->
    <div class="py-2 text-sm flex justify-between items-center">
      <div class="text-gray-500">Events</div>

      <div class="flex text-gray-400">
        <button
          class="relative px-2 py-1 rounded-md group cursor-pointer bg-secondary mx-1 border border-white border-opacity-5 hover:border-opacity-25"
          on:click={() => {
            copyAllEventConfigsFromSelf();
          }}
        >
          <SvgIcon displayMode="button" iconPath={"copy_all"} />

          <TooltipSetter key={"configuration_copy_all"} />
        </button>

        <button
          class="relative px-2 py-1 rounded-md group cursor-pointer bg-secondary ml-1 border border-white border-opacity-5 hover:border-opacity-25"
          on:click={() => {
            overwriteAllEventConfigs();
          }}
        >
          <SvgIcon displayMode="button" iconPath={"paste_all"} />

          <TooltipSetter key={"configuration_overwrite"} />
        </button>
      </div>
    </div>

    <div class="flex flex-col justify-center items-center">
      <div class="flex overflow-x-auto w-full">
        {#each events.options as event}
          <button
            on:click={() => {
              handleSelectEvent(event);
            }}
            class:dummy={event.desc == undefined}
            class="{selectedEvent === event && event.desc !== undefined
              ? 'shadow-md bg-pick text-white'
              : 'hover:bg-pick-desaturate-10 text-gray-50'} relative m-2 first:ml-0 last:mr-0 p-1 flex-grow border-0 rounded focus:outline-none bg-secondary"
          >
            {@html event.desc
              ? event.desc
              : `<span class="invisible">null</span>`}
            {#if event.desc != undefined}
              <TooltipSetter key={`event_${event.desc}`} />
            {/if}
          </button>
        {/each}
      </div>
      <!-- <hr class="w-[90%] my-6 border-white border-opacity-10 " /> -->
    </div>
  </div>
</div>

<style>
  .dummy {
    @apply bg-select;
    @apply bg-opacity-50;
  }
</style>
