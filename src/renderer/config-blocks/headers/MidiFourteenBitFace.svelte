<script>
  import { createEventDispatcher } from "svelte";
  import { Script } from "../_script_parsers.js";

  const dispatch = createEventDispatcher();

  export let access_tree;
  export let config = undefined;

  let scriptSegments = ["", "", ""];
  let labels = ["CH:", "CC:", "VAL:"];

  const whatsInParenthesis = /\(([^)]+)\)/;
  let midiLSB = ""; // local script part
  let midiMSB = "";

  $: handleConfigChange(config);

  function handleConfigChange(config) {
    const arr = config.script.split(" gms");

    let lsb = whatsInParenthesis.exec(arr[0]);

    if (lsb !== null) {
      if (lsb.length > 0) {
        midiLSB = lsb[1];
      }
    }

    let msb = whatsInParenthesis.exec(arr[1]);

    if (msb !== null) {
      if (msb.length > 0) {
        midiMSB = msb[1];
      }
    }

    let param_array = midiLSB.split(",").map((c) => c.trim());

    let value = param_array[3].split("//").slice(0, -1).join("//");

    let param_object = {
      channel: param_array[0],
      base: param_array[2],
      value: value,
    };

    scriptSegments = [
      param_object.channel,
      param_object.base,
      param_object.value,
    ];
  }

  function handleClick(e) {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class="{$$props.class} text-white flex items-center flex-row w-full px-2"
  on:click={handleClick}
>
  <div class="flex flex-row items-center flex-grow h-full w-full">
    <span class="mr-2">{config.information.blockTitle}</span>
    <div
      class="bg-primary p-1 my-auto rounded items-center flex flex-grow"
      on:click|stopPropagation
    >
      {#each Array(scriptSegments.length).keys() as i}
        <!-- <span class="text-center truncate mx-1">{labels[i]}</span> -->

        <span class="mr-2">
          {scriptSegments[i]}
        </span>
      {/each}
    </div>
  </div>
</div>
