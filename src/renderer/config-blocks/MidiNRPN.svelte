<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.js";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import MidiFourteenBitFace from "./headers/MidiFourteenBitFace.svelte";
  export const header = MidiFourteenBitFace;

  export const information: ActionBlockInformation = {
    short: "gmnp",
    name: "MidiNRPN",
    rendering: "standard",
    category: "deprecated",
    displayName: "MIDI NRPN",
    description: "Send an NRPN message",
    documentationUrl: "https://docs.intech.studio/wiki/actions/midi/nrpn-midi",
    color: categoryColors["deprecated"] as any,
    defaultLua: "gms(0,176,99,num//128) gms(0,176,98,num%128) gms(0,176,6,val)",

    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5"/><path d="m8.8 9.2 2.4 2.8-2.4 2.8M12.8 9.2l2.4 2.8-2.4 2.8"/></svg>`,
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

  <div class="mt-2"></div>
</action-midi>
