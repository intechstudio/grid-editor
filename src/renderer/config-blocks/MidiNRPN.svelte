<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.js";
  // Component for the untoggled "header" of the component
  import MidiFourteenBitFace from "./headers/MidiFourteenBitFace.svelte";
  export const header = MidiFourteenBitFace;

  export const information: ActionBlockInformation = {
    short: "gmnp",
    name: "MidiNRPN",
    rendering: "standard",
    category: "deprecated",
    displayName: "MIDI NRPN",
    color: "#DA4167",
    defaultLua: "gms(0,176,99,num//128) gms(0,176,98,num%128) gms(0,176,6,val)",
    icon: `
      <svg width="100%" height="100%" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M0.5 12.5C0.5 5.87294 5.87285 0.5 12.5 0.5C19.1274 0.5 24.5 5.87295 24.5 12.5C24.5 19.1275 19.1273 24.5 12.5 24.5C5.87287 24.5 0.5 19.1275 0.5 12.5ZM14.2071 23.3683L14.1413 22.8877C14.0304 22.0784 13.3373 21.4554 12.5003 21.4554C11.6623 21.4554 10.9695 22.0782 10.8585 22.8874L10.7925 23.3683C11.3489 23.455 11.9192 23.5 12.5 23.5C13.0806 23.5 13.6508 23.455 14.2071 23.3683ZM12.5001 2.46309C6.95685 2.46309 2.46281 6.95713 2.46281 12.5C2.46281 17.1783 5.66475 21.11 9.99693 22.2218C10.3636 21.193 11.3442 20.4554 12.5003 20.4554C13.6558 20.4554 14.6363 21.1933 15.0029 22.2221C19.3352 21.11 22.5371 17.1783 22.5371 12.5C22.537 6.9571 18.0433 2.46309 12.5001 2.46309ZM10.5432 6.33504C10.543 5.2543 11.4194 4.37819 12.5 4.37819C13.5809 4.37819 14.4568 5.25461 14.4568 6.33522C14.4568 7.41632 13.5802 8.29231 12.5001 8.29231C11.4191 8.29231 10.543 7.41615 10.5432 6.33504ZM12.5 5.37819C11.9715 5.37819 11.543 5.80679 11.5432 6.33504C11.543 6.86363 11.9711 7.29231 12.5001 7.29231C13.028 7.29231 13.4568 6.86399 13.4568 6.33522C13.4568 5.80668 13.0284 5.37819 12.5 5.37819ZM6.75623 6.75671C7.52044 5.99251 8.75968 5.99254 9.52391 6.75707C10.2884 7.52134 10.2878 8.76052 9.52415 9.52427C8.75967 10.2887 7.52074 10.2889 6.75643 9.5242C5.99204 8.76001 5.99209 7.52083 6.75623 6.75671ZM8.81667 7.46404C8.44294 7.09017 7.83697 7.09019 7.46333 7.46382C7.0897 7.83745 7.0897 8.44344 7.46353 8.81708C7.83718 9.19091 8.44297 9.19122 8.81703 8.81717C9.19041 8.44374 9.19041 7.83758 8.81667 7.46404ZM15.476 6.75778C16.24 5.9935 17.4794 5.9935 18.2432 6.75767C19.0074 7.52177 19.0074 8.76092 18.243 9.52514C17.4786 10.2898 16.2394 10.2893 15.4755 9.5255C14.711 8.76103 14.7109 7.52204 15.476 6.75778ZM17.536 7.46467C17.1627 7.09118 16.5566 7.0911 16.1831 7.46493C15.8091 7.83848 15.8086 8.44435 16.1826 8.81839C16.556 9.1918 17.162 9.19202 17.5357 8.81817C17.9096 8.44445 17.9095 7.83822 17.536 7.46467ZM4.3767 12.4998C4.3767 11.4193 5.2531 10.5431 6.33377 10.543C7.41486 10.543 8.29092 11.4194 8.29092 12.4998C8.29092 13.5807 7.41486 14.4567 6.33381 14.4567C5.25315 14.4567 4.3767 13.581 4.3767 12.4998ZM6.33381 11.543C5.80519 11.5431 5.3767 11.9718 5.3767 12.4998C5.3767 13.0284 5.80516 13.4567 6.33381 13.4567C6.86264 13.4567 7.29092 13.0283 7.29092 12.4998C7.29092 11.9717 6.86259 11.543 6.33381 11.543ZM16.7091 12.4998C16.7091 11.4193 17.5853 10.5431 18.6661 10.543C19.7471 10.543 20.6231 11.4194 20.6231 12.4998C20.6231 13.5806 19.7473 14.4567 18.6661 14.4567C17.5855 14.4567 16.7091 13.581 16.7091 12.4998ZM18.6661 11.543C18.1375 11.5431 17.7091 11.9717 17.7091 12.4998C17.7091 13.0284 18.1375 13.4567 18.6661 13.4567C19.1949 13.4567 19.6231 13.0284 19.6231 12.4998C19.6231 11.9717 19.1948 11.543 18.6661 11.543Z" fill="black"/>
          <path d="M11.5432 6.33504C11.543 5.80679 11.9715 5.37819 12.5 5.37819C13.0284 5.37819 13.4568 5.80668 13.4568 6.33522C13.4568 6.86399 13.028 7.29231 12.5001 7.29231C11.9711 7.29231 11.543 6.86363 11.5432 6.33504Z" fill="black"/>
          <path d="M16.1831 7.46493C16.5566 7.0911 17.1627 7.09118 17.536 7.46467C17.9095 7.83822 17.9096 8.44445 17.5357 8.81817C17.162 9.19202 16.556 9.1918 16.1826 8.81839C15.8086 8.44435 15.8091 7.83848 16.1831 7.46493Z" fill="black"/>
          <path d="M17.7091 12.4998C17.7091 11.9717 18.1375 11.5431 18.6661 11.543C19.1948 11.543 19.6231 11.9717 19.6231 12.4998C19.6231 13.0284 19.1949 13.4567 18.6661 13.4567C18.1375 13.4567 17.7091 13.0284 17.7091 12.4998Z" fill="black"/>
          <path d="M5.3767 12.4998C5.3767 11.9718 5.80519 11.5431 6.33381 11.543C6.86259 11.543 7.29092 11.9717 7.29092 12.4998C7.29092 13.0283 6.86264 13.4567 6.33381 13.4567C5.80516 13.4567 5.3767 13.0284 5.3767 12.4998Z" fill="black"/>
          <path d="M7.46333 7.46382C7.83697 7.09019 8.44294 7.09017 8.81667 7.46404C9.19041 7.83758 9.19041 8.44374 8.81703 8.81717C8.44297 9.19122 7.83718 9.19091 7.46353 8.81708C7.0897 8.44344 7.0897 7.83745 7.46333 7.46382Z" fill="black"/>
          <path d="M14.1413 22.8877L14.2071 23.3683C13.6508 23.455 13.0806 23.5 12.5 23.5C11.9192 23.5 11.3489 23.455 10.7925 23.3683L10.8585 22.8874C10.9695 22.0782 11.6623 21.4554 12.5003 21.4554C13.3373 21.4554 14.0304 22.0784 14.1413 22.8877Z" fill="black"/>
      </svg>
    `,
    blockIcon: `
      <svg width="100%" height="100%" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M0.5 12.5C0.5 5.87294 5.87285 0.5 12.5 0.5C19.1274 0.5 24.5 5.87295 24.5 12.5C24.5 19.1275 19.1273 24.5 12.5 24.5C5.87287 24.5 0.5 19.1275 0.5 12.5ZM14.2071 23.3683L14.1413 22.8877C14.0304 22.0784 13.3373 21.4554 12.5003 21.4554C11.6623 21.4554 10.9695 22.0782 10.8585 22.8874L10.7925 23.3683C11.3489 23.455 11.9192 23.5 12.5 23.5C13.0806 23.5 13.6508 23.455 14.2071 23.3683ZM12.5001 2.46309C6.95685 2.46309 2.46281 6.95713 2.46281 12.5C2.46281 17.1783 5.66475 21.11 9.99693 22.2218C10.3636 21.193 11.3442 20.4554 12.5003 20.4554C13.6558 20.4554 14.6363 21.1933 15.0029 22.2221C19.3352 21.11 22.5371 17.1783 22.5371 12.5C22.537 6.9571 18.0433 2.46309 12.5001 2.46309ZM10.5432 6.33504C10.543 5.2543 11.4194 4.37819 12.5 4.37819C13.5809 4.37819 14.4568 5.25461 14.4568 6.33522C14.4568 7.41632 13.5802 8.29231 12.5001 8.29231C11.4191 8.29231 10.543 7.41615 10.5432 6.33504ZM12.5 5.37819C11.9715 5.37819 11.543 5.80679 11.5432 6.33504C11.543 6.86363 11.9711 7.29231 12.5001 7.29231C13.028 7.29231 13.4568 6.86399 13.4568 6.33522C13.4568 5.80668 13.0284 5.37819 12.5 5.37819ZM6.75623 6.75671C7.52044 5.99251 8.75968 5.99254 9.52391 6.75707C10.2884 7.52134 10.2878 8.76052 9.52415 9.52427C8.75967 10.2887 7.52074 10.2889 6.75643 9.5242C5.99204 8.76001 5.99209 7.52083 6.75623 6.75671ZM8.81667 7.46404C8.44294 7.09017 7.83697 7.09019 7.46333 7.46382C7.0897 7.83745 7.0897 8.44344 7.46353 8.81708C7.83718 9.19091 8.44297 9.19122 8.81703 8.81717C9.19041 8.44374 9.19041 7.83758 8.81667 7.46404ZM15.476 6.75778C16.24 5.9935 17.4794 5.9935 18.2432 6.75767C19.0074 7.52177 19.0074 8.76092 18.243 9.52514C17.4786 10.2898 16.2394 10.2893 15.4755 9.5255C14.711 8.76103 14.7109 7.52204 15.476 6.75778ZM17.536 7.46467C17.1627 7.09118 16.5566 7.0911 16.1831 7.46493C15.8091 7.83848 15.8086 8.44435 16.1826 8.81839C16.556 9.1918 17.162 9.19202 17.5357 8.81817C17.9096 8.44445 17.9095 7.83822 17.536 7.46467ZM4.3767 12.4998C4.3767 11.4193 5.2531 10.5431 6.33377 10.543C7.41486 10.543 8.29092 11.4194 8.29092 12.4998C8.29092 13.5807 7.41486 14.4567 6.33381 14.4567C5.25315 14.4567 4.3767 13.581 4.3767 12.4998ZM6.33381 11.543C5.80519 11.5431 5.3767 11.9718 5.3767 12.4998C5.3767 13.0284 5.80516 13.4567 6.33381 13.4567C6.86264 13.4567 7.29092 13.0283 7.29092 12.4998C7.29092 11.9717 6.86259 11.543 6.33381 11.543ZM16.7091 12.4998C16.7091 11.4193 17.5853 10.5431 18.6661 10.543C19.7471 10.543 20.6231 11.4194 20.6231 12.4998C20.6231 13.5806 19.7473 14.4567 18.6661 14.4567C17.5855 14.4567 16.7091 13.581 16.7091 12.4998ZM18.6661 11.543C18.1375 11.5431 17.7091 11.9717 17.7091 12.4998C17.7091 13.0284 18.1375 13.4567 18.6661 13.4567C19.1949 13.4567 19.6231 13.0284 19.6231 12.4998C19.6231 11.9717 19.1948 11.543 18.6661 11.543Z" fill="black"/>
          <path d="M11.5432 6.33504C11.543 5.80679 11.9715 5.37819 12.5 5.37819C13.0284 5.37819 13.4568 5.80668 13.4568 6.33522C13.4568 6.86399 13.028 7.29231 12.5001 7.29231C11.9711 7.29231 11.543 6.86363 11.5432 6.33504Z" fill="black"/>
          <path d="M16.1831 7.46493C16.5566 7.0911 17.1627 7.09118 17.536 7.46467C17.9095 7.83822 17.9096 8.44445 17.5357 8.81817C17.162 9.19202 16.556 9.1918 16.1826 8.81839C15.8086 8.44435 15.8091 7.83848 16.1831 7.46493Z" fill="black"/>
          <path d="M17.7091 12.4998C17.7091 11.9717 18.1375 11.5431 18.6661 11.543C19.1948 11.543 19.6231 11.9717 19.6231 12.4998C19.6231 13.0284 19.1949 13.4567 18.6661 13.4567C18.1375 13.4567 17.7091 13.0284 17.7091 12.4998Z" fill="black"/>
          <path d="M5.3767 12.4998C5.3767 11.9718 5.80519 11.5431 6.33381 11.543C6.86259 11.543 7.29092 11.9717 7.29092 12.4998C7.29092 13.0283 6.86264 13.4567 6.33381 13.4567C5.80516 13.4567 5.3767 13.0284 5.3767 12.4998Z" fill="black"/>
          <path d="M7.46333 7.46382C7.83697 7.09019 8.44294 7.09017 8.81667 7.46404C9.19041 7.83758 9.19041 8.44374 8.81703 8.81717C8.44297 9.19122 7.83718 9.19091 7.46353 8.81708C7.0897 8.44344 7.0897 7.83745 7.46333 7.46382Z" fill="black"/>
          <path d="M14.1413 22.8877L14.2071 23.3683C13.6508 23.455 13.0806 23.5 12.5 23.5C11.9192 23.5 11.3489 23.455 10.7925 23.3683L10.8585 22.8874C10.9695 22.0782 11.6623 21.4554 12.5003 21.4554C13.3373 21.4554 14.0304 22.0784 14.1413 22.8877Z" fill="black"/>
      </svg>
    `,
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
  import { createEventDispatcher } from "svelte";
  import { MeltCheckbox, MeltCombo } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { LocalDefinitions } from "../runtime/runtime.store";
  import { ActionData, GridAction, GridEvent } from "./../runtime/runtime";
  import SendFeedback from "../main/user-interface/SendFeedback.svelte";

  import { Script } from "./_script_parsers.js";
  import { Validator } from "./validators";

  export let action: GridAction;

  const dispatch = createEventDispatcher();
  let event = action.parent as GridEvent;

  const validators = [
    {
      value: true,
      func: (e: string) => {
        return new Validator(e).isLuaValue().Result();
      },
    },
    {
      value: true,
      func: (e: string) => {
        return new Validator(e).isLuaValue().Result();
      },
    },
    {
      value: true,
      func: (e: string) => {
        return new Validator(e).isLuaValue().Result();
      },
    },
    {
      value: true,
      func: (e: string) => {
        return new Validator(e).isLuaValue().Result();
      },
    },
    {
      value: true,
      func: (e: string) => {
        return new Validator(e).isLuaValue().Result();
      },
    },
  ];

  let channel: string;
  let msb: string;
  let lsb: string;
  let nrpnCC: string;
  let value: string;
  let hiRes: boolean;

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    // Extract all contents
    const matches = [];
    const regex = /gms\((.*?[^)])\)(?=\s|gms|$)/g;

    let match;
    while ((match = regex.exec(data.script)) !== null) {
      matches.push(`gms(${match[1].trim()})`); // trim to remove any extra spaces
    }

    let midiLSB = [];
    let midiMSB = [];

    for (let i = 0; i < matches.length; ++i) {
      let part = Script.toSegments({ short: "gms", script: matches[i] });
      if (i % 2 === 0) {
        midiMSB.push(part[3]);
      } else {
        midiLSB.push(part[3]);
      }
    }

    if (midiMSB.length < 2 || midiLSB.length < 1) return;

    value = midiMSB[1].split("//")[0];
    if (value.startsWith("(") && value.endsWith(")")) {
      value = value.slice(1, -1);
    }

    channel = Script.toSegments({ short: "gms", script: matches[0] })[0];
    msb = midiMSB[0];
    lsb = midiLSB[0];
    nrpnCC = calculateNRPNCC(midiMSB[0], midiLSB[0]);
    hiRes = midiLSB.length > 1 ? true : false;
  }

  function sendData() {
    let script = [
      `gms(${channel},176,99,${msb})`,
      `gms(${channel},176,98,${lsb})`,
      `gms(${channel},176,6,${hiRes ? `(${value})//128` : value})`,
    ];
    if (hiRes) {
      script.push(`gms(${channel},176,38,(${value})%128)`);
    }
    dispatch("update-action", {
      short: action.short,
      script: script.join(" "),
      validationError: validators.some((e) => e.value === false),
    });
  }

  $: handleHighResValueChange(hiRes);

  function handleHighResValueChange(hiRes: boolean) {
    sendData();
    dispatch("sync");
  }

  const channels = (length) => {
    let arr = [];
    for (let i = 0; i < length; i++) {
      arr[i] = { value: i, info: `Channel ${i + 1}` };
    }
    return arr;
  };

  const _suggestions = [
    // Channels
    [...channels(16)],
    // MSB
    [],
    // LSB
    [],
    // Value,
    [],
  ];

  let suggestions = [];

  function renderSuggestions() {
    const actions = $event.config;
    const index = actions.findIndex((e) => e.id === action.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index: index,
    });

    suggestions[0] = _suggestions[0];
    suggestions[1] = [...localDefinitions];
    suggestions[2] = [...localDefinitions];
    suggestions[3] = [...localDefinitions];
  }

  $: if ($event) {
    renderSuggestions();
  }

  function calculateNRPNCC(msb: string, lsb: string) {
    if (
      msb.endsWith("//128") &&
      lsb.endsWith("%128") &&
      msb.slice(0, -5) === lsb.slice(0, -4)
    ) {
      const msbValue = msb.slice(0, -5);
      let nrpnCC = msbValue;
      if (nrpnCC.startsWith("(") && nrpnCC.endsWith(")")) {
        nrpnCC = nrpnCC.slice(1, -1);
      }
      return nrpnCC;
    } else {
      return `(${msb})*128+${lsb}`;
    }
  }
</script>

<action-midi class="flex flex-col w-full pb-2 px-2 pointer-events-auto">
  <div class="w-full text-yellow-400 text-xs px-1 py-2">
    This block is deprecated. Use the MIDI block with NRPN mode instead.
  </div>
  <MeltCombo
    title={"Channel"}
    value={channel}
    suggestions={suggestions[0]}
    validator={validators[0].func}
    on:input={(e) => {
      const { value, validationError } = e.detail;
      channel = value;
      validators[0].value = !validationError;
      sendData();
    }}
    on:change={() => dispatch("sync")}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />

  <div class="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-2">
    <div class="flex flex-col">
      <MeltCombo
        title={"MSB"}
        value={msb}
        suggestions={suggestions[1]}
        validator={validators[1].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          msb = value;
          validators[1].value = !validationError;
          nrpnCC = calculateNRPNCC(msb, lsb);
          sendData();
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />

      <MeltCombo
        title={"LSB"}
        value={lsb}
        suggestions={suggestions[2]}
        validator={validators[2].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          lsb = value;
          validators[2].value = !validationError;
          nrpnCC = calculateNRPNCC(msb, lsb);
          sendData();
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    </div>
    <div class="w-7 h-7 fill-white">
      <svg
        version="1.1"
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        xml:space="preserve"
        viewBox="0 47.52 477.43 382.39"
        ><g id="SVGRepo_bgCarrier" stroke-width="0" /><g
          id="SVGRepo_tracerCarrier"
          stroke-linecap="round"
          stroke-linejoin="round"
        /><g id="SVGRepo_iconCarrier">
          <g>
            <polygon
              points="101.82,187.52 57.673,143.372 476.213,143.372 476.213,113.372 57.181,113.372 101.82,68.733 80.607,47.519 0,128.126 80.607,208.733 "
            />
            <polygon
              points="396.82,268.694 375.607,289.907 420,334.301 1.213,334.301 1.213,364.301 420,364.301 375.607,408.694 396.82,429.907 477.427,349.301 "
            />
          </g>
        </g></svg
      >
    </div>

    <MeltCombo
      title={"NRPN CC"}
      value={nrpnCC}
      suggestions={suggestions[1]}
      validator={validators[3].func}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        nrpnCC = value;
        validators[3].value = !validationError;
        dispatch("validation", { value: validationError });
        msb = `(${value})//128`;
        lsb = `(${value})%128`;
        sendData();
      }}
      on:change={() => dispatch("sync")}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />
  </div>

  <div class="w-full grid grid-cols-2 gap-2 items-center">
    <MeltCombo
      title={"Value"}
      bind:value
      suggestions={suggestions[3]}
      validator={validators[4].func}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        validators[4].value = !validationError;
        sendData();
      }}
      on:change={() => dispatch("sync")}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />
    <MeltCheckbox bind:target={hiRes} title="14bit Resolution" />
  </div>

  <div class="mt-2">
    <SendFeedback feedback_context="MidiFourteenBit" />
  </div>
</action-midi>
