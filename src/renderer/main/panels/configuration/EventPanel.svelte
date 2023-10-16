<script>
  import { appSettings } from "../../../runtime/app-helper.store.js";

  import {
    elementNameStore,
    user_input,
  } from "../../../runtime/runtime.store.js";

  import { setTooltip } from "../../user-interface/tooltip/Tooltip.js";
  import TooltipQuestion from "../../user-interface/tooltip/TooltipQuestion.svelte";
  import SvgIcon from "../../user-interface/SvgIcon.svelte";
  import { createEventDispatcher } from "svelte";
  import { ConfigTarget } from "./Configuration.store.js";

  const dispatch = createEventDispatcher();

  class Event {
    constructor({ label = "", value = null, selected = false }) {
      this.label = label;
      this.value = value;
      this.selected = selected;
    }
  }

  let events = [];
  let selectedElement = undefined;
  let stringname = undefined;

  $: handleElementNameUpdate($elementNameStore);

  $: handleUserInputChange($user_input);

  function handleElementNameUpdate(store) {
    try {
      stringname =
        store[$user_input.brc.dx][$user_input.brc.dy][
          $user_input.event.elementnumber
        ];
    } catch (error) {}
  }

  function handleUserInputChange(ui) {
    const target = ConfigTarget.createFrom({ userInput: ui });

    if (typeof target === "undefined") {
      return;
    }

    //Get events
    events = target.events.map((e) => {
      return new Event({
        label: String(e.event.desc),
        value: Number(e.event.value),
        selected: target.eventType == e.event.value,
      });
    });

    selectedElement = target.element;
  }

  function handleSelectEvent(event) {
    user_input.update_eventtype(event.value);
  }

  function showControlElementNameOverlay() {
    $appSettings.overlays.controlElementName =
      !$appSettings.overlays.controlElementName;
  }

  function handleCopyAll(e) {
    dispatch("copy-all");
  }

  function handleOverwriteAll(e) {
    dispatch("overwrite-all");
  }
</script>

<div class="flex flex-col w-full p-4">
  <div class="pb-2 flex" class:hidden={selectedElement == 255}>
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
        {:else}
          <div>Name your element</div>
        {/if}

        <TooltipQuestion key={"configuration_element_name"} />
      </div>
    </div>
  </div>

  <div class="pb-2 flex flex-col justify-center">
    <div class="py-2 text-sm flex justify-between items-center">
      <div class="text-gray-500">Events</div>

      <div class="flex text-gray-400">
        <button
          use:setTooltip={{
            key: "configuration_copy_all",
            nowrap: true,
            instant: true,
            placement: "top",
            class: "p-4",
          }}
          class="relative px-2 py-1 rounded-md group cursor-pointer bg-secondary mx-1 border border-white border-opacity-5 hover:border-opacity-25"
          on:click={handleCopyAll}
        >
          <SvgIcon displayMode="button" iconPath={"copy_all"} />
        </button>

        <button
          use:setTooltip={{
            key: "configuration_overwrite",
            nowrap: true,
            instant: true,
            placement: "top",
            class: "p-4",
          }}
          class="relative px-2 py-1 rounded-md group cursor-pointer bg-secondary ml-1 border border-white border-opacity-5 hover:border-opacity-25"
          on:click={handleOverwriteAll}
        >
          <SvgIcon displayMode="button" iconPath={"paste_all"} />
        </button>
      </div>
    </div>

    <div class="flex flex-col justify-center items-center">
      <div class="flex w-full">
        {#if events.length > 0}
          {#each events as event}
            <button
              use:setTooltip={{
                key: `event_${event.label}`,
                placement: "top",
                class: "w-80 p-4",
              }}
              on:click={() => {
                handleSelectEvent(event);
              }}
              class="{event.selected
                ? 'shadow-md text-white bg-pick'
                : 'hover:bg-pick-desaturate-10 text-gray-50 bg-secondary'} relative m-2 first:ml-0 last:mr-0 p-1 flex-grow border-0 rounded focus:outline-none"
            >
              <span
                >{event.label.charAt(0).toUpperCase() +
                  event.label.slice(1)}</span
              >
            </button>
          {/each}
        {:else}
          {#each Array(3) as n}
            <div
              class=" bg-secondary relative m-2 first:ml-0 last:mr-0 p-1 flex-grow border-0 rounded focus:outline-none"
            >
              <span class="invisible">null</span>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</div>
