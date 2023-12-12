<script>
  import MeltSelect from "./../preferences/MeltSelect.svelte";
  import { ConfigTarget } from "./Configuration.store.js";
  import { appSettings } from "../../../runtime/app-helper.store.js";
  import TooltipQuestion from "../../user-interface/tooltip/TooltipQuestion.svelte";
  import {
    elementNameStore,
    runtime,
    user_input,
  } from "../../../runtime/runtime.store.js";

  function showControlElementNameOverlay() {
    if ($appSettings.displayedOverlay === "control-name-overlay") {
      $appSettings.displayedOverlay =
        typeof $appSettings.displayedOverlay === "undefined"
          ? "control-name-overlay"
          : undefined;
    } else {
      $appSettings.displayedOverlay = "control-name-overlay";
    }
  }

  function getElementName(ui, es) {
    try {
      const { dx, dy } = ui.brc;
      const obj = es[dx][dy];

      if (obj[ui.event.elementnumber] === "") {
        return undefined;
      }

      return obj[ui.event.elementnumber];
    } catch (e) {
      return undefined;
    }
  }

  let selected = -1;
  let elements = [{ title: "No Device", value: -1 }];

  $: handleSelectionChange(selected);

  function handleSelectionChange(value) {
    if (value === -1) {
      return;
    } else {
      user_input.update((ui) => {
        ui.event.elementnumber = value;
        return ui;
      });
    }
  }

  $: handleUserInputChange($user_input);

  function handleUserInputChange(ui) {
    const device = $runtime.find(
      (device) => device.dx === ui.brc.dx && device.dy === ui.brc.dy
    );
    if (typeof device === "undefined") {
      elements = [{ title: "No Device", value: -1 }];
      selected = -1;
      return;
    }

    elements = device.pages
      .find((page) => page.pageNumber === ui.event.pagenumber)
      ?.control_elements.map((e) => {
        const stringName = getElementName($user_input, $elementNameStore);
        if (typeof stringName !== "undefined") {
          return { title: stringName, value: e.controlElementNumber };
        } else {
          return {
            title: `Element ${e.controlElementNumber} (${
              e.controlElementType[0].toUpperCase() +
              e.controlElementType.slice(1).toLowerCase()
            })`,
            value: e.controlElementNumber,
          };
        }
      });
    selected = ui.event.elementnumber;
  }
</script>

<div class="flex flex-col">
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
    <TooltipQuestion
      key={"configuration_element_name"}
      class="ml-2 text-white "
    />
  </div>
  {#key elements}
    <MeltSelect class="text-white" bind:target={selected} options={elements} />
  {/key}
</div>
