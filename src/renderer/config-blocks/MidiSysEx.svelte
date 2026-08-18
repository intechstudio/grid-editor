<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import MidiSysExFace from "./headers/MidiSysExFace.svelte";
  export const header = MidiSysExFace;

  export const information: ActionBlockInformation = {
    short: "gmss",
    name: "MidiSysEx",
    rendering: "standard",
    category: "midi",
    displayName: "SysEX",
    description: "Send a raw SysEx message",
    documentationUrl: "https://docs.intech.studio/wiki/actions/midi/midi-sysex",
    color: categoryColors["midi"],
    defaultLua: "gmss(0xF0, 0x41, 0x10, val, 0xF7)",

    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5"/><path d="m10 9.4-2.4 2.6L10 14.6M14 9.4l2.4 2.6L14 14.6"/></svg>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
    editName: true,
    version: "2.0",
  };
</script>

<script lang="ts">
  import { fly } from "svelte/transition";
  import { createEventDispatcher } from "svelte";

  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { ActionData, GridAction } from "../runtime/runtime.js";

  export let action: GridAction;

  const whatsInParenthesis = /\(([^)]+)\)/;

  let commitState = 0;

  const dispatch = createEventDispatcher();

  let value;

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    let textdata = whatsInParenthesis.exec(data.script);

    if (textdata !== null) {
      if (textdata.length > 0) {
        value = textdata[1];
      }
    }
  }

  function sendData(e) {
    commitState = 0;
    dispatch("update-action", {
      short: action.short,
      script: "gmss(" + value + ")",
      validationError: false,
    });
    dispatch("sync");
  }
</script>

<action-midi class="flex flex-col w-full pb-2 px-2 pointer-events-auto">
  <div class="w-full flex flex-col">
    <div class="text-gray-500 text-sm pb-1 font-bold">
      Enter comma separated sysex bytes or variables.
    </div>
    <div class="text-gray-500 text-sm pb-1">
      Example: 0xF0, 0x41, 0x10, val, 0xF7
    </div>

    <div
      class="w-full px-2 py-1 text-white bg-black/25"
      contenteditable="true"
      bind:innerText={value}
      on:input={() => {
        commitState = 1;
      }}
    />
  </div>

  <div class="flex justify-between items-center mt-2">
    {#key commitState}
      <div
        in:fly|global={{ x: -5, duration: 200 }}
        class="{commitState ? 'text-yellow-600' : 'text-green-500'} text-sm"
      >
        {commitState ? "Unsaved changes!" : "Synced with Grid!"}
      </div>
    {/key}
    <MoltenPushButton
      click={sendData}
      disabled={!commitState}
      text={"Commit"}
      style={"accept"}
    />
  </div>

  <div class="mt-2"></div>
</action-midi>
