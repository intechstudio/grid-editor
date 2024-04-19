<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "cb",
    name: "CodeBlock",
    rendering: "standard",
    category: "code",
    displayName: "Code Block",
    color: "#887880",
    defaultLua: 'print("hello")',
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 333 265" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M329.594 123.925L252.587 42.2591C247.854 37.2344 239.954 37.0052 234.934 41.7467C229.922 46.4843 229.689 54.3964 234.426 59.4172L303.345 132.5L234.426 205.591C229.689 210.612 229.922 218.52 234.934 223.262C237.349 225.541 240.433 226.67 243.505 226.67C246.823 226.67 250.136 225.354 252.588 222.757L329.595 141.087C334.135 136.267 334.135 128.742 329.594 123.925Z" fill="black"/>
      <path d="M98.5775 205.588L29.6629 132.5L98.5775 59.4133C103.31 54.3925 103.082 46.4798 98.0657 41.7428C93.0537 37.0052 85.1449 37.2344 80.4126 42.2552L3.4058 123.921C-1.13527 128.738 -1.13527 136.267 3.4058 141.084L80.4165 222.754C82.8724 225.358 86.1816 226.671 89.4993 226.671C92.5711 226.671 95.656 225.537 98.0657 223.258C103.086 218.52 103.31 210.608 98.5775 205.588Z" fill="black"/>
      <path d="M186.703 0.142824C179.889 -0.890373 173.512 3.79254 172.471 10.6135L135.841 250.612C134.8 257.437 139.483 263.816 146.301 264.858C146.942 264.954 147.574 265 148.203 265C154.268 265 159.588 260.571 160.533 254.387L197.163 14.3888C198.204 7.56336 193.521 1.18448 186.703 0.142824Z" fill="black"/>
    </svg>
    `,
    blockIcon: `
    <svg width="100%" height="100%" viewBox="0 0 333 265" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M329.594 123.925L252.587 42.2591C247.854 37.2344 239.954 37.0052 234.934 41.7467C229.922 46.4843 229.689 54.3964 234.426 59.4172L303.345 132.5L234.426 205.591C229.689 210.612 229.922 218.52 234.934 223.262C237.349 225.541 240.433 226.67 243.505 226.67C246.823 226.67 250.136 225.354 252.588 222.757L329.595 141.087C334.135 136.267 334.135 128.742 329.594 123.925Z" fill="black"/>
      <path d="M98.5775 205.588L29.6629 132.5L98.5775 59.4133C103.31 54.3925 103.082 46.4798 98.0657 41.7428C93.0537 37.0052 85.1449 37.2344 80.4126 42.2552L3.4058 123.921C-1.13527 128.738 -1.13527 136.267 3.4058 141.084L80.4165 222.754C82.8724 225.358 86.1816 226.671 89.4993 226.671C92.5711 226.671 95.656 225.537 98.0657 223.258C103.086 218.52 103.31 210.608 98.5775 205.588Z" fill="black"/>
      <path d="M186.703 0.142824C179.889 -0.890373 173.512 3.79254 172.471 10.6135L135.841 250.612C134.8 257.437 139.483 263.816 146.301 264.858C146.942 264.954 147.574 265 148.203 265C154.268 265 159.588 260.571 160.533 254.387L197.163 14.3888C198.204 7.56336 193.521 1.18448 186.703 0.142824Z" fill="black"/>
    </svg>
    `,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
    syntaxPreprocessor: new SyntaxPreprocessor(""),
  };
</script>

<script>
  import * as luamin from "lua-format";
  import { stringManipulation } from "../main/user-interface/_string-operations";

  import { createEventDispatcher, onMount, onDestroy } from "svelte";

  import SendFeedback from "../main/user-interface/SendFeedback.svelte";

  import MoltenPushButton, {
    ButtonStyle,
  } from "../main/panels/preferences/MoltenPushButton.svelte";
  import { monaco_store } from "../main/modals/Monaco.store";
  import { monaco_elementtype } from "../lib/CustomMonaco";

  import { monaco_editor } from "$lib/CustomMonaco";
  import { committed_code_store } from "./Committed_Code.store";
  import { modal } from "../main/modals/modal.store";
  import Monaco from "../main/modals/Monaco.svelte";

  const dispatch = createEventDispatcher();

  export let config;
  export let access_tree;
  export let index;

  let codePreview;

  const lualogo_foreground = "#808080";
  const lualogo_background = "#212a2c";

  const lualogo = `<svg version="1.0" id="Ebene_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 width="100%" height="100%" viewBox="0 0 947 947" enable-background="new 0 0 947 947" xml:space="preserve">
<g>
	<path fill="${lualogo_foreground}" d="M835.5,473.6c0-199.8-162.2-362-362-362s-362,162.2-362,362c0,199.8,162.2,362,362,362
		S835.5,673.4,835.5,473.6"/>
	<path fill="${lualogo_background}" d="M729.5,323.6c0-58.5-47.5-106-106-106s-106,47.5-106,106c0,58.5,47.5,106,106,106S729.5,382.1,729.5,323.6"
		/>
	<path fill="${lualogo_foreground}" d="M941.5,111.5c0-58.5-47.5-106-106-106s-106,47.5-106,106c0,58.5,47.5,106,106,106S941.5,170.1,941.5,111.5"
		/>
	<g>
		<path fill="${lualogo_background}" d="M258.1,627.8h117.3v26.7H227.8V417h30.3V627.8z"/>
		<path fill="${lualogo_background}" d="M515.5,654.5v-23.8c-16,22.5-31.9,31.3-57,31.3c-33.2,0-54.4-18.2-54.4-46.6V483.8h27v120.9
			c0,20.5,13.7,33.6,35.2,33.6c28.3,0,46.6-22.8,46.6-57.7v-96.8h27v170.7H515.5z"/>
		<path fill="${lualogo_background}" d="M738.4,659.1c-8.8,2.3-13,2.9-18.6,2.9c-17.6,0-26.1-7.8-28-25.1c-19.2,17.6-36.5,25.1-58,25.1
			c-34.5,0-56-19.5-56-50.5c0-22.2,10.1-37.5,30-45.6c10.4-4.2,16.3-5.5,54.7-10.4c21.5-2.6,28.3-7.5,28.3-18.9v-7.2
			c0-16.3-13.7-25.4-38.1-25.4c-25.4,0-37.8,9.4-40.1,30.3h-27.4c0.7-16.9,3.9-26.7,11.7-35.5c11.4-12.7,31.9-19.9,56.7-19.9
			c42,0,64.2,16.3,64.2,46.6v100.4c0,8.5,5.2,13.4,14.7,13.4c1.6,0,2.9,0,5.9-0.7V659.1z M690.8,570.1c-9.1,4.2-15,5.5-43.7,9.4
			c-29,4.2-41.1,13.4-41.1,31.3c0,17.3,12.4,27.4,33.6,27.4c16,0,29.3-5.2,40.4-15.3c8.1-7.5,10.8-13,10.8-22.2V570.1z"/>
	</g>
	<path fill="none" stroke="${lualogo_foreground}" stroke-width="10.8612" stroke-miterlimit="10" stroke-dasharray="40.8475" d="M890.6,261
		c33.5,65.8,51,138.6,51,212.5c0,258.4-209.7,468.1-468.1,468.1S5.4,731.9,5.4,473.5C5.4,215.1,215.1,5.4,473.5,5.4
		c83.1,0,164.6,22.1,236.2,63.9"/>
</g>
</svg>`;

  onDestroy(() => {
    codePreview.removeEventListener("wheel", (evt) => {
      evt.preventDefault();
      codePreview.scrollLeft += evt.deltaY;
    });
  });

  function displayConfigScript(script) {
    codePreview.innerHTML = stringManipulation.expandScript(script);
    monaco_editor.colorizeElement(codePreview, {
      theme: "my-theme",
      tabSize: 2,
    });
  }

  onMount(() => {
    codePreview.addEventListener("wheel", (evt) => {
      //evt.preventDefault();
      //codePreview.scrollLeft += evt.deltaY;
    });
    displayConfigScript(config.script);
  });

  $: if (typeof $committed_code_store !== "undefined") {
    if ($committed_code_store.index == index) {
      dispatch("output", {
        short: "cb",
        script: $committed_code_store.script,
      });
      displayConfigScript($committed_code_store.script);
    }
  }

  function open_monaco() {
    $monaco_store = { config: config.makeCopy(), index: index };
    $monaco_elementtype = access_tree.elementtype;
    modal.show({
      component: Monaco,
      options: { snap: "middle", disableClickOutside: true },
    });
  }
</script>

<code-block
  class="{$$props.class} w-full flex flex-col p-4 pb-2 pointer-events-auto"
>
  <div class="w-full flex flex-col">
    <div class="text-gray-500 text-sm font-bold">Code preview:</div>

    <div class="grid w-full">
      <pre
        on:dblclick={open_monaco}
        class="bg-secondary opacity-80 my-4 p-2 w-full overflow-x-auto"
        bind:this={codePreview}
        data-lang="intech_lua"
      />
    </div>

    <MoltenPushButton
      on:click={open_monaco}
      text={"Edit Code"}
      style={ButtonStyle.ACCEPT}
    />
  </div>

  <div class="flex flex-row mt-4">
    <div class="w-full flex flex-col">
      <div class="text-gray-500 font-bold -mb-2">Powered by Lua</div>
      <SendFeedback
        feedback_context="CodeBlock"
        class="mt-2 text-sm text-gray-500"
      />
    </div>

    <div class="h-12 w-12">
      {@html lualogo}
    </div>
  </div>
</code-block>
