<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "gks",
    name: "Macro",
    rendering: "standard",
    category: "hid",
    color: "#9D95AD",
    displayName: "Keyboard",
    defaultLua: "gks()",
    icon: `
      <svg width="100%" height="100%" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1 0H16C16.5523 0 17 0.447715 17 1V16C17 16.5523 16.5523 17 16 17H1C0.447715 17 0 16.5523 0 16V1C0 0.447715 0.447715 0 1 0ZM14 1H3C2.44772 1 2 1.44772 2 2V13C2 13.5523 2.44772 14 3 14H14C14.5523 14 15 13.5523 15 13V2C15 1.44772 14.5523 1 14 1Z" fill="black"/>
        <path d="M4.5 12C4.22386 12 4 12.2239 4 12.5C4 12.7761 4.22386 13 4.5 13H12.5C12.7761 13 13 12.7761 13 12.5C13 12.2239 12.7761 12 12.5 12H4.5Z" fill="black"/>
        <path d="M4.66667 10.318V8.49984H3L5.5 5.31802L8 8.49984H6.33333V10.318H4.66667Z" fill="black"/>
      </svg>
    `,
    blockIcon: `
      <svg width="100%" height="100%" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1 0H16C16.5523 0 17 0.447715 17 1V16C17 16.5523 16.5523 17 16 17H1C0.447715 17 0 16.5523 0 16V1C0 0.447715 0.447715 0 1 0ZM14 1H3C2.44772 1 2 1.44772 2 2V13C2 13.5523 2.44772 14 3 14H14C14.5523 14 15 13.5523 15 13V2C15 1.44772 14.5523 1 14 1Z" fill="black"/>
        <path d="M4.5 12C4.22386 12 4 12.2239 4 12.5C4 12.7761 4.22386 13 4.5 13H12.5C12.7761 13 13 12.7761 13 12.5C13 12.2239 12.7761 12 12.5 12H4.5Z" fill="black"/>
        <path d="M4.66667 10.318V8.49984H3L5.5 5.31802L8 8.49984H6.33333V10.318H4.66667Z" fill="black"/>
      </svg>
    `,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script>
  /* ========== Macro block documentation ==========
  1. Detect key press
  2. Display the key assuming layout is English-US
  3. Assembly the grid command parameters
  4. Send changes to grid
  */

  import { runtime } from "../runtime/runtime.store";

  import { createEventDispatcher, onDestroy, onMount } from "svelte";

  import { clickOutside } from "../main/_actions/click-outside.action";

  const dispatch = createEventDispatcher();

  //import { check_for_matching_value, parameter_parser } from './action-helper';

  import { appSettings } from "../runtime/app-helper.store";

  import * as keyMap from "../../external/macro/map.json";
  import * as keyMap_en from "../../external/macro/map-en.json";
  import * as keyMap_hu from "../../external/macro/map-hu.json";
  import * as keyMap_de from "../../external/macro/map-de.json";

  import MoltenPushButton, {
    ButtonStyle,
  } from "../main/panels/preferences/MoltenPushButton.svelte";

  const layouts = [
    { name: "En", lookup: keyMap_en.default },
    { name: "Hu", lookup: keyMap_hu.default },
    { name: "De", lookup: keyMap_de.default },
  ];

  let layout = layouts[0];

  export let config;
  export let index;
  export let eventInfo;
  export let elementInfo;

  let loaded = false;
  let macroInputField;

  let isChanges = false;
  $: if ($runtime) {
    isChanges = runtime.unsavedChangesCount() > 0;
  }

  onMount(() => {
    selectedLayout = $appSettings.persistent.keyboardLayout;
    change_layout();
    lastKeyDivList = keyDivList;
  });

  $: if (config.script && !loaded) {
    scriptToKeyList({ script: config.script });
  }

  function change_layout() {
    layout = layouts.find((e) => {
      return e.name === selectedLayout;
    });

    if (layout === undefined) {
      layout = layouts[0];
      selectedLayout = layout.name;
    } else {
    }

    if ($appSettings.persistent.keyboardLayout !== selectedLayout) {
      $appSettings.persistent.keyboardLayout = selectedLayout;
    }

    scriptToKeyList({ script: config.script });
  }

  onDestroy(() => {
    loaded = false;
  });

  function scriptToKeyList({ script }) {
    let array = [];
    let _keys = [];
    try {
      const text = script.split("gks(")[1].slice(0, -1);
      array = text.split(",");
      defaultDelay = array[0] ? array[0] : defaultDelay;
      array = array.slice(1);
      if (array[0] != "") {
        for (let i = 0; i < array.length; i += 3) {
          if (array[i] != 15) {
            const val =
              "0x" +
              Number(array[i + 2])
                .toString(16)
                .padStart(2, "0")
                .toLowerCase();
            let f_key = keyMap.default.find(
              (k) => k.value == val && array[i] == k.is_modifier
            );
            _keys.push({
              ...f_key,
              type:
                array[i + 1] == 0
                  ? "keyup"
                  : array[i + 1] == 1
                  ? "keydown"
                  : array[i + 1] == 2
                  ? "keydownup"
                  : undefined,
            });
          } else {
            _keys.push({
              value: array[i + 2],
              info: "delay",
              js_value: -1,
              is_modifier: 15,
              type: "delay",
            });
          }
        }
        keyBuffer = _keys;
        caretPos = keyBuffer.length;
        keyDivList = colorize(_keys);
        loaded = true;
      }
    } catch (error) {
      console.warn("gsk can't be turned to config", script, error);
    }
  }

  function sendData(parameters) {
    let script = `gks(${defaultDelay}${
      parameters.length > 0 ? "," + parameters.join(",") : ""
    })`;
    console.log("Dispatch", script);
    dispatch("output", { short: "gks", script: script });
  }

  let keyDivList = "";
  let lastKeyDivList = "";
  let caretKeyBuffer = [];
  let keyBuffer = [];

  let caretFocus = false;

  let caretPos = 0;

  let selectedKey;
  let selectedLayout;
  let addonKeyType = "keydownup";
  let delayKey = 100; // ms
  let defaultDelay = 25; // ms

  function handleKeyboardInput(e) {
    // delete on backspace
    if (e.keyCode == 8 && e.type == "keydown") {
      if (caretPos !== 0) {
        keyBuffer.splice(caretPos - 1, 1);
        caretPos -= 1;
      }

      keyDivList = colorize(keyBuffer);

      return;
    }

    // filter same keypress type
    if (e.repeat || e.keyCode == 8) {
      return;
    }

    let key = keyMap.default.find((key) => key.info == e.code);
    keyBuffer.splice(caretPos, 0, { ...key, type: e.type });

    caretPos++;
    caretKeyBuffer = [];

    keyBuffer = cutQuickDownUp(keyBuffer);
    keyDivList = colorize(keyBuffer);

    // update last key...
  }

  function addKeyManually() {
    let added_key = keyMap.default.find((e) => {
      return e.info === selectedKey.info;
    });

    keyBuffer.splice(caretPos, 0, { ...added_key, type: addonKeyType });
    caretPos += 1;

    keyBuffer = cutQuickDownUp(keyBuffer);
    keyDivList = colorize(keyBuffer);
    keyListToScript();
  }

  function addDelayManually() {
    keyBuffer.splice(caretPos, 0, {
      value: delayKey,
      info: "delay",
      js_value: -1,
      is_modifier: 15,
      type: "delay",
    });

    keyDivList = colorize(keyBuffer);
    caretPos += 1;
    keyListToScript();
  }

  function cutQuickDownUp(args) {
    // identify if the following element is a pair key, set type and cut point accordingly
    let cuts = [];
    args.forEach((arg, i) => {
      if (args[i + 1]) {
        if (
          arg.info == args[i + 1].info &&
          arg.type == "keydown" &&
          args[i + 1].type == "keyup"
        ) {
          arg.type = "keydownup";
          cuts.push(i + 1);
        }
      }
    });

    // make the cuts, remove double elements from keydown-keyup pairs (remove the second, first contains 'keydownup' type for color)
    cuts.forEach((cut) => {
      args.splice(cut, 1);
      caretPos--;
    });

    //console.log(cuts, args )

    return args;
  }

  function colorize(args) {
    let svg = `
              <svg viewBox="0 0 95 95" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M48.5 0L8 32.5L8 52.5L48.5 20L48.5 0Z" fill="#C4C4C4"/>
                <path d="M48 0L88.5 32.5L88.5 52.5L48 20L48 0Z" fill="#C4C4C4"/>
                <rect x="40" y="14" width="16" height="81" fill="#C4C4C4"/>
              </svg>
              `;

    // down = red
    // up = yellow
    // down-up = green

    let coloredKeys = [];

    // set a caret 0
    coloredKeys.push(`<div data-caret="0" class="px-1 h-6"></div>`);

    args.forEach((arg, i) => {
      let translator = layout.lookup.find((e) => {
        return e.info == arg.info;
      });

      let displayname = arg.info;
      if (translator !== undefined) {
        displayname = translator.display;
      }

      if (arg.type == "keydownup") {
        coloredKeys.push(
          `<div class="text-green-500 px-2 m-0.5 text-sm bg-primary flex items-center border cursor-default border-green-500 rounded-md">${displayname}</div>`
        );
      } else if (arg.type == "keydown") {
        coloredKeys.push(
          `<div class="text-red-500 px-2 m-0.5 text-sm bg-primary flex items-center border cursor-default border-red-500 rounded-md">${displayname} <span style="transform:rotate(180deg)" class="h-4 w-4 ml-1">${svg}</span></div>` +
            "  "
        );
      } else if (arg.type == "keyup") {
        coloredKeys.push(
          `<div class="text-yellow-500 px-2 m-0.5 text-sm bg-primary flex items-center border cursor-default border-yellow-500  rounded-md">${displayname} <span class="h-4 w-4 ml-1">${svg}</span></div>` +
            "  "
        );
      } else if (arg.type == "delay") {
        coloredKeys.push(
          `<div class="text-purple-500 px-2 m-0.5 text-sm bg-primary flex items-center border cursor-default border-purple-500 rounded-md">${
            arg.info + ": " + arg.value
          }</div>` + "  "
        );
      }

      // add a caret pos after each key
      coloredKeys.push(`<div data-caret="${i + 1}" class="px-1 h-6"></div>`);
    });

    return coloredKeys;
  }

  function setCaret(e) {
    if (e.target.getAttribute("data-caret") !== null) {
      keyBuffer.splice(caretPos, 0, ...caretKeyBuffer);
      caretKeyBuffer = [];
      // this is the caret pos used to add new keys in the array
      caretPos = +e.target.getAttribute("data-caret");
      // this caret for the blinking cursor
    } else {
      if (caretKeyBuffer.length == 0 && caretFocus == false) {
        keyDivList = [`<div data-caret="0" class="px-1 h-6"></div>`];
        caretPos = 0;
      }
    }
  }

  function clearMacro() {
    keyBuffer = [];
    caretKeyBuffer = [];
    caretPos = 0;
    keyDivList = [`<div data-caret="0" class="px-1 h-6"></div>`];
    keyListToScript();
  }

  function keyListToScript() {
    let tempKeyBuff = Array.from(keyBuffer);

    console.log(
      "manage...",
      JSON.stringify(keyBuffer),
      caretPos,
      JSON.stringify(caretKeyBuffer)
    );

    if (caretPos != -1) {
      tempKeyBuff.splice(caretPos, 0, ...caretKeyBuffer);
    }

    let parameters = [];

    tempKeyBuff.forEach((key, i) => {
      let code = [];

      if (key.type !== "delay") {
        code = [
          key.is_modifier ? 1 : 0,
          key.type == "keydown"
            ? 1
            : key.type == "keyup"
            ? 0
            : key.type == "keydownup"
            ? 2
            : undefined,
          parseInt(key.value),
        ];
      } else {
        code = [15, 0, key.value];
      }

      parameters.push(code);
    });

    sendData(parameters);
  }

  function onBlur(e) {
    if (lastKeyDivList !== keyDivList) {
      console.log("blur");
      keyListToScript();
    }
    lastKeyDivList = keyDivList;
  }
</script>

<div
  class="{$$props.class} flex w-full flex-col px-4 py-2 gap-2 pointer-events-auto"
>
  <div class="flex flex-col">
    <div class="flex flex-row justify-between mb-2">
      <div class="text-gray-500 text-sm truncate">Macro Input Field</div>

      <!-- Layout Selector -->
      <div class="flex flex-row gap-2">
        <div class="text-gray-500 text-sm">Layout:</div>
        <select
          class="rounded bg-secondary text-white focus:outline-none border-select"
          bind:value={selectedLayout}
          on:change={change_layout}
        >
          {#each layouts as layout}
            <option value={layout.name} class="text-white bg-secondary py-1"
              >{layout.name}</option
            >
          {/each}
        </select>
      </div>
    </div>
    <!-- Keyboard Input Field -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      use:clickOutside={{ useCapture: true }}
      on:click-outside={(e) => {
        caretFocus = false;
      }}
      bind:this={macroInputField}
      class="
        focus:border-select-desaturate-20 border-select editableDiv rounded secondary border text-white p-2 flex flex-row flex-wrap focus:outline-none"
      on:keydown|preventDefault={handleKeyboardInput}
      on:keyup|preventDefault={handleKeyboardInput}
      on:blur={onBlur}
      contenteditable="true"
      on:click={(e) => {
        caretFocus = true;
        setCaret(e);
      }}
    >
      {#each keyDivList as key, i}
        {@const isCarret = i % 2 == 0}
        {@const isActiveCarret = caretPos * 2 === i}
        <div
          data-index={i}
          class:caret={isActiveCarret}
          class:focus={caretFocus && isActiveCarret}
          class="{i + (i % 2) == i
            ? 'hover:bg-pick-complementer cursor-pointer'
            : 'cursor-default'} "
        >
          {@html key}
        </div>
      {/each}
    </div>

    <div class="text-sm text-warning truncate" class:hidden={!isChanges}>
      Warning: Store your changes to enable Macros!
    </div>
  </div>

  <span class="text-gray-500 text-sm col-span-4">Add Key</span>

  <div class="grid grid-cols-[auto_1fr] w-full h-fit gap-x-2">
    <div class="grid grid-cols-3 gap-y-1 gap-x-2">
      <select
        bind:value={selectedKey}
        class="text-white focus:outline-none border-select bg-primary flex col-span-3"
      >
        {#each layout.lookup as key}
          <option value={key} class="text-white bg-secondary py-1"
            >{key.display}</option
          >
        {/each}
      </select>
      <button
        on:click={() => {
          addonKeyType = "keyup";
        }}
        class="truncate text-sm text-center border rounded-md px-1
          {addonKeyType == 'keyup'
          ? 'border-yellow-500 text-yellow-500'
          : 'text-select-desaturate-20 border-select-desaturate-20'} "
      >
        keyup
      </button>
      <button
        on:click={() => {
          addonKeyType = "keydown";
        }}
        class="truncate text-sm text-center border rounded-md px-1
          {addonKeyType == 'keydown'
          ? 'border-red-500 text-red-500'
          : 'text-select-desaturate-20 border-select-desaturate-20'}"
      >
        keydown
      </button>
      <button
        on:click={() => {
          addonKeyType = "keydownup";
        }}
        class="truncate text-sm text-center border rounded-md px-1
          {addonKeyType == 'keydownup'
          ? 'border-green-500 text-green-500'
          : 'text-select-desaturate-20 border-select-desaturate-20'}"
      >
        keydownup
      </button>
    </div>
    <MoltenPushButton
      on:click={addKeyManually}
      text={"Add Key"}
      style={ButtonStyle.ACCEPT}
    />
  </div>
  <div class="flex flex-col">
    <div class="text-gray-500 text-sm">Delay Key</div>
    <div class="flex flex-row gap-2">
      <input
        bind:value={delayKey}
        type="number"
        min="5"
        max="4000"
        class="bg-secondary flex flex-grow text-white focus:outline-none border-select px-2 py-1"
      />

      <MoltenPushButton
        on:click={addDelayManually}
        text={"Add Delay"}
        style={ButtonStyle.ACCEPT}
      />
    </div>
  </div>
  <div class="flex flex-col">
    <div class="text-gray-500 text-sm">Default Delay</div>

    <input
      bind:value={defaultDelay}
      on:input={(e) => {
        keyListToScript();
      }}
      type="number"
      min="5"
      max="4000"
      class="bg-secondary flex text-white focus:outline-none border-select px-2 py-1"
    />
  </div>

  <MoltenPushButton
    on:click={clearMacro}
    text={"Clear All"}
    style={ButtonStyle.ACCEPT}
  />
</div>

<style>
  .editableDiv div:last-child {
    margin-right: 0;
  }

  .editableDiv div:first-child {
    margin-left: 0;
  }

  .editableDiv {
    caret-color: transparent;
  }

  @keyframes blink {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }

  @-webkit-keyframes blink {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0 !important;
    }
  }

  .caret {
    opacity: 0.5;
    background-color: white;
  }

  .focus {
    opacity: 1;
    animation: blink 1s step-start 0s infinite;
    -webkit-animation: blink 1s step-start 0s infinite;
  }
</style>
