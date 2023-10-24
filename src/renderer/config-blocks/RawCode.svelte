<script context="module">
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = undefined;

  // config descriptor parameters
  export const information = {
    short: "raw",
    name: "CodeBlock",
    rendering: "standard",
    category: null,
    desc: "RAW code",
    blockTitle: "RAW code",
    color: "#f0f5f7",
    defaultLua: undefined,
    icon: undefined,
    blockIcon: `
    <svg xmlns="http://www.w3.org/2000/svg" version="1.0" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">
      <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#f5113f" stroke="none">
        <path d="M1180 5105 c-163 -33 -310 -115 -427 -239 -115 -121 -186 -262 -212 -426 -7 -42 -11 -412 -11 -1061 l0 -995 25 -50 c28 -57 63 -87 122 -104 89 -27 191 18 232 102 l21 44 0 990 c0 1063 -1 1044 51 1146 32 63 111 135 187 171 l67 32 1000 3 c725 2 1011 0 1040 -8 33 -10 108 -79 458 -428 230 -230 426 -430 435 -447 15 -27 17 -100 22 -756 l5 -725 27 -41 c41 -63 90 -88 169 -88 54 0 72 5 106 27 22 15 51 44 64 65 l24 38 3 715 c3 745 1 791 -40 891 -46 113 -90 163 -512 587 -445 447 -498 493 -629 541 l-72 26 -1045 2 c-830 1 -1058 -1 -1110 -12z" />
        <path d="M2010 1804 c-179 -38 -357 -177 -439 -344 -71 -145 -72 -159 -69 -779 l3 -547 27 -41 c41 -62 90 -88 168 -88 78 0 127 26 168 88 26 39 27 45 30 214 l4 173 248 0 248 0 4 -173 c3 -169 4 -175 30 -214 41 -62 90 -88 168 -88 78 0 127 26 168 88 l27 41 3 547 c3 620 2 634 -69 779 -59 119 -170 230 -289 289 -139 68 -284 87 -430 55z m225 -401 c63 -21 127 -85 148 -148 13 -37 17 -86 17 -212 l0 -163 -250 0 -250 0 0 163 c0 194 11 239 75 302 69 70 164 91 260 58z"/>
        <path d="M3252 1809 c-45 -13 -108 -80 -121 -126 -7 -25 -11 -233 -11 -594 0 -521 1 -561 20 -633 29 -113 73 -190 160 -276 86 -87 163 -131 276 -160 169 -43 351 -8 495 95 l49 35 49 -35 c100 -72 232 -114 357 -115 79 0 199 31 277 72 89 47 204 165 249 255 68 136 69 149 66 788 l-3 570 -24 38 c-13 21 -42 50 -64 65 -34 23 -52 27 -107 27 -55 0 -73 -4 -107 -27 -22 -15 -51 -44 -64 -65 l-24 -38 -5 -576 -5 -575 -27 -41 c-41 -62 -90 -88 -168 -88 -78 0 -127 26 -168 88 l-27 41 -5 570 -5 571 -23 40 c-76 132 -264 135 -340 5 l-27 -45 -5 -571 -5 -570 -27 -41 c-41 -62 -90 -88 -168 -88 -78 0 -127 26 -168 88 l-27 41 -5 575 -5 576 -24 38 c-47 76 -151 113 -239 86z" />
        <path d="M132 1799 c-46 -14 -109 -80 -122 -128 -7 -27 -10 -277 -8 -789 l3 -748 27 -41 c41 -62 90 -88 168 -88 78 0 127 26 168 88 27 40 27 41 30 259 l3 219 56 -3 56 -3 173 -250 c201 -290 221 -310 317 -310 78 0 131 26 172 84 26 37 30 51 30 111 l0 68 -78 114 c-43 62 -106 153 -139 202 -58 82 -60 89 -42 99 39 22 116 103 159 167 209 315 86 745 -260 904 -102 47 -119 49 -405 52 -162 2 -289 -1 -308 -7z m559 -417 c130 -68 158 -238 56 -342 -55 -57 -97 -70 -229 -70 l-118 0 0 220 0 220 119 0 c111 0 122 -2 172 -28z" />
      </g>
    </svg>
    `,
    selectable: false,
    movable: false,
    hideIcon: false,
    type: "single",
    toggleable: false,
  };
</script>

<script>
  import * as luamin from "lua-format";
  import stringManipulation from "../main/user-interface/_string-operations";

  import { createEventDispatcher, onMount, onDestroy } from "svelte";

  import SendFeedback from "../main/user-interface/SendFeedback.svelte";

  import { setPopover } from "../../renderer/main/user-interface/tooltip/Tooltip";
  import TooltipQuestion from "../../renderer/main/user-interface/tooltip/TooltipQuestion.svelte";
  import SelectList from "./components/RawCode_SelectList.svelte";
  import {
    getComponentInformation,
    config_components,
    init_config_block_library,
  } from "../../renderer/lib/_configs";

  const dispatch = createEventDispatcher();

  export let config;
  export let access_tree;
  export let index;

  let codePreview;
  let listOptions = [];

  onDestroy(() => {
    codePreview.removeEventListener("wheel", (evt) => {
      evt.preventDefault();
      codePreview.scrollLeft += evt.deltaY;
    });
  });

  function displayConfigScript(script) {
    if (typeof codePreview === "undefined") return;
    codePreview.innerHTML = stringManipulation.noCommentToLineComment(script);
  }

  onMount(() => {
    codePreview.addEventListener("wheel", (evt) => {
      evt.preventDefault();
      codePreview.scrollLeft += evt.deltaY;
    });
    displayConfigScript(config.script);
    listOptions = getCompatibleBlocks(config.script);
  });

  function getCompatibleBlocks(script) {
    const blocks = [];

    const compatibility_map = new Map([
      ["elseif (self:bst()>0 and self:est()>63) then", "eprlrei1"],
      ["elseif (self:bst()==0 and self:est()<64) then", "eprlrei2"],
    ]);

    for (const [key, value] of compatibility_map.entries()) {
      if (key !== config.script) {
        continue;
      }

      const obj = getComponentInformation({ short: value });
      //Can not replace for RAW code
      if (
        typeof obj !== "undefined" &&
        obj.information.short !== information.short
      ) {
        blocks.push(obj);
      }
    }

    //Fallback logic, everything can be converted to codeblock
    const cb = getComponentInformation({ short: "cb" });
    blocks.push(cb);
    return blocks.map((e) => {
      return { title: e.information.blockTitle, value: e.information.short };
    });
  }

  function handleReplace(e) {
    const { short } = e.detail;
    dispatch("replace", { short: short, script: config.script });
  }
</script>

<code-block
  class="{$$props.class} w-full flex flex-col pointer-events-auto p-2"
>
  <div class="w-full flex flex-col">
    <div class="flex items-center pb-2 w-full">
      <div class="text-gray-500 text-sm font-bold">RAW Code:</div>
      <div class="flex flex-row gap-1 ml-auto items-center">
        <span class="text-sm text-gray-500">What happened</span>
        <TooltipQuestion
          key={"configuration_element_name"}
          class="text-white"
        />
      </div>
    </div>

    <div class="grid gap-1">
      <div
        bind:this={codePreview}
        class="bg-secondary opacity-80 px-2 py-1 text-gray-500 font-mono border border-gray-500 whitespace-nowrap overflow-x-auto"
      />
      {#key listOptions}
        <button
          on:replace={handleReplace}
          use:setPopover={{
            placement: "left",
            triggerEvents: ["click"],
            class: "w-full p-4",
            component: {
              object: SelectList,
              props: {
                options: listOptions,
              },
            },
          }}
          class="bg-commit hover:bg-commit-saturate-20 text-white rounded text-sm focus:outline-none px-2 py-0.5"
          >Restore</button
        >
      {/key}
    </div>
  </div>

  <SendFeedback
    feedback_context="CodeBlock"
    class="mt-2 text-sm text-gray-500"
  />
</code-block>
