<script context="module">
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information = {
    short: "gks",
    name: "Macro",
    rendering: "standard",
    category: "keyboard",
    color: "#9D95AD",
    desc: "Keyboard",
    blockTitle: "Keyboard",
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

  import { unsaved_changes } from "../runtime/runtime.store";

  import { createEventDispatcher, onDestroy, onMount } from "svelte";

  import { clickOutside } from "../main/_actions/click-outside.action";

  const dispatch = createEventDispatcher();

  //import { check_for_matching_value, parameter_parser } from './action-helper';

  import { appSettings } from "../runtime/app-helper.store";

  import * as keyMap from "../../external/macro/map.json";
  import * as keyMap_en from "../../external/macro/map-en.json";
  import * as keyMap_hu from "../../external/macro/map-hu.json";
  import * as keyMap_de from "../../external/macro/map-de.json";

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

  let isStored = true;
  let storedScript = undefined;

  $: isStored = config.script === storedScript;

  $: if ($unsaved_changes.length === 0) {
    storedScript = config.script;
  }

  onMount(() => {
    selectedLayout = $appSettings.persistent.keyboardLayout;
    change_layout();
    keys_buffer = keys;
  });

  $: if (config.script && !loaded) {
    macrosToConfig({ script: config.script });
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

    macrosToConfig({ script: config.script });
  }

  onDestroy(() => {
    loaded = false;
  });

  function macrosToConfig({ script }) {
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
        keys = colorize(_keys);
        loaded = true;
      }
    } catch (error) {
      console.warn("gsk can't be turned to config", script, error);
    }
  }

  function sendData(parameters) {
    let script = "gks(" + defaultDelay + "," + parameters.join(",") + ")";
    dispatch("output", { short: "gks", script: script });
  }

  let keys = "";
  let keys_buffer = "";
  let parameters = [];
  let caretKeyBuffer = [];
  let keyBuffer = [];
  let visibleCaretPos = -1;
  let last_key = undefined;

  let caretFocus = false;

  let caretPos = -1;

  let selectedKey;
  let selectedLayout;
  let addonKeyType = "keydownup";
  let delayKey = 100; // ms
  let defaultDelay = 25; // ms

  function identifyKey(e) {
    // delete on backspace
    if (e.keyCode == 8 && e.type == "keydown") {
      let tempKeyBuffer = Array.from(keyBuffer);

      if (caretPos !== -1) {
        //console.log(tempKeyBuffer, caretPos, caretKeyBuffer.length)
        if (last_key != 8) {
          tempKeyBuffer.splice(caretPos, 0, ...caretKeyBuffer);
          caretPos = caretPos + caretKeyBuffer.length;
          caretKeyBuffer = [];
        }

        if (caretPos !== 0) {
          tempKeyBuffer.splice(caretPos - 1, 1);
        }

        if (caretPos != 0) {
          caretPos -= 1;
          visibleCaretPos = caretPos;
        }
      } else {
        if (caretPos != 0) {
          tempKeyBuffer.splice(tempKeyBuffer.length - 1, 1);
          visibleCaretPos = tempKeyBuffer.length;
        }
      }

      keyBuffer = tempKeyBuffer;

      keys = colorize(tempKeyBuffer);
    }

    // filter same keypress type
    if (!e.repeat && e.keyCode != 8) {
      if (caretPos !== -1) {
        let key = keyMap.default.find((key) => key.info == e.code);
        const f_key = [...caretKeyBuffer]
          .reverse()
          .find((key) => key.info == e.code);
        if (!f_key) {
          caretKeyBuffer.push({ ...key, type: e.type });
        } else if (f_key.type !== e.type) {
          caretKeyBuffer.push({ ...key, type: e.type });
        }
        caretKeyBuffer = cutQuickDownUp(caretKeyBuffer);
      } else {
        let key = keyMap.default.find((key) => key.info == e.code);
        const f_key = [...keyBuffer]
          .reverse()
          .find((key) => key.info == e.code);
        if (!f_key) {
          keyBuffer.push({ ...key, type: e.type });
        } else if (f_key.type !== e.type) {
          keyBuffer.push({ ...key, type: e.type });
        }
        keyBuffer = cutQuickDownUp(keyBuffer);
      }

      // deep copy to create the needed keys from caret and standard array
      let tempKeyBuffer = Array.from(keyBuffer);

      if (caretKeyBuffer.length > 0) {
        // merge caretbuffer with keybuffer
        tempKeyBuffer.splice(caretPos, 0, ...caretKeyBuffer);
        // set visible caret when we write between keys
        visibleCaretPos = caretPos + caretKeyBuffer.length;
      } else {
        // visible caret when we append to the end of keys
        visibleCaretPos = tempKeyBuffer.length;
      }

      keys = colorize(tempKeyBuffer);
    }

    // update last key...
    last_key = e.keyCode;
  }

  function addKey() {
    let added_key = keyMap.default.find((e) => {
      return e.info === selectedKey.info;
    });

    if (caretPos == -1) {
      keyBuffer.splice(keyBuffer.length, 0, {
        ...added_key,
        type: addonKeyType,
      });
    } else {
      keyBuffer.splice(caretPos, 0, { ...added_key, type: addonKeyType });
    }
    keys = colorize(keyBuffer);
    visibleCaretPos += 1;
    caretPos += 1;
    manageMacro();
  }

  function addDelay() {
    if (caretPos == -1) {
      keyBuffer.splice(keyBuffer.length, 0, {
        value: delayKey,
        info: "delay",
        js_value: -1,
        is_modifier: 15,
        type: "delay",
      });
    } else {
      keyBuffer.splice(caretPos, 0, {
        value: delayKey,
        info: "delay",
        js_value: -1,
        is_modifier: 15,
        type: "delay",
      });
    }
    keys = colorize(keyBuffer);
    visibleCaretPos += 1;
    caretPos += 1;
    manageMacro();
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
      visibleCaretPos = caretPos;
    } else {
      if (caretKeyBuffer.length == 0 && caretFocus == false) {
        keys = [`<div data-caret="0" class="px-1 h-6"></div>`];
        visibleCaretPos = 0;
        caretPos = -1;
      }
    }
  }

  function clearMacro() {
    keyBuffer = [];
    caretKeyBuffer = [];
    caretPos = -1;
    visibleCaretPos = 0;
    keys = [`<div data-caret="0" class="px-1 h-6"></div>`];
    manageMacro();
  }

  function manageMacro() {
    parameters = [];

    let tempKeyBuffer = Array.from(keyBuffer);

    //console.log('manage...', keyBuffer, caretPos, caretKeyBuffer )

    if (caretPos != -1) {
      tempKeyBuffer.splice(caretPos, 0, ...caretKeyBuffer);
    }

    tempKeyBuffer.forEach((key, i) => {
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
    if (keys_buffer !== keys) {
      manageMacro();
    }
    keys_buffer = keys;
  }
</script>

<div
  use:clickOutside={{ useCapture: true }}
  on:click-outside={(e) => {
    caretFocus = false;
    visibleCaretPos = -1;
    caretPos = -1;
  }}
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
      bind:this={macroInputField}
      class="{!isStored
        ? 'focus:border-warning-desaturate-20 border-warning'
        : 'focus:border-select-desaturate-20 border-select'} editableDiv rounded secondary border text-white p-2 flex flex-row flex-wrap focus:outline-none"
      on:keydown|preventDefault={identifyKey}
      on:keyup|preventDefault={identifyKey}
      on:blur={onBlur}
      contenteditable="true"
      on:click={(e) => {
        caretFocus = true;
        setCaret(e);
      }}
    >
      {#each keys as key, i}
        <div
          data-index={i}
          class:blink={visibleCaretPos * 2 === i}
          class="{i + (i % 2) == i
            ? 'hover:bg-pick-complementer cursor-pointer'
            : 'cursor-default'} "
        >
          {@html key}
        </div>
      {/each}
    </div>

    <div class="text-sm text-warning truncate" class:hidden={isStored}>
      Macros will take effect after storing
    </div>
  </div>

  <div class="grid grid-cols-4 grid-rows-[auto_auto_auto] gap-x-2 gap-y-1">
    <span class="text-gray-500 text-sm col-span-4">Add Key</span>
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
      on:click={addKey}
      class="text-center rounded bg-commit hover:bg-commit-saturate-20 text-white px-2 py-1 truncate"
      >Add Key</button
    >

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      on:click={() => {
        addonKeyType = "keyup";
      }}
      class="truncate text-sm text-center border rounded-md px-1
          {addonKeyType == 'keyup'
        ? 'border-yellow-500 text-yellow-500'
        : 'text-select-desaturate-20 border-select-desaturate-20'} "
    >
      keyup
    </div>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      on:click={() => {
        addonKeyType = "keydown";
      }}
      class="truncate text-sm text-center border rounded-md px-1
          {addonKeyType == 'keydown'
        ? 'border-red-500 text-red-500'
        : 'text-select-desaturate-20 border-select-desaturate-20'}"
    >
      keydown
    </div>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      on:click={() => {
        addonKeyType = "keydownup";
      }}
      class="truncate text-sm text-center border rounded-md px-1
          {addonKeyType == 'keydownup'
        ? 'border-green-500 text-green-500'
        : 'text-select-desaturate-20 border-select-desaturate-20'}"
    >
      keydownup
    </div>
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
      <button
        on:click={addDelay}
        class="text-center rounded bg-commit hover:bg-commit-saturate-20 text-white px-2 py-1 truncate"
      >
        Add Delay
      </button>
    </div>
  </div>
  <div class="flex flex-col">
    <div class="text-gray-500 text-sm">Default Delay</div>

    <input
      bind:value={defaultDelay}
      on:input={(e) => {
        manageMacro();
      }}
      type="number"
      min="5"
      max="4000"
      class="bg-secondary flex text-white focus:outline-none border-select px-2 py-1"
    />
  </div>

  <button
    on:click={clearMacro}
    class="text-center rounded bg-select hover:bg-red-500 text-white px-2 py-1 my-2"
  >
    Clear All
  </button>
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
    50% {
      opacity: 0;
    }
  }

  @-webkit-keyframes blink {
    50% {
      opacity: 0;
    }
  }

  .blink {
    background-color: white;
    animation: blink 1s step-start 0s infinite;
    -webkit-animation: blink 1s step-start 0s infinite;
  }
</style>
