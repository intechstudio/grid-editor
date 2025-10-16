<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { ActionData, GridAction } from "../../runtime/runtime";
  import { InfoBox } from "@intechstudio/grid-uikit";

  const dispatch = createEventDispatcher();

  export let action: GridAction;

  let scriptSegments = ["", "", ""];

  const whatsInParenthesis = /\(([^)]+)\)/;
  let midiLSB = ""; // local script part
  let midiMSB = "";

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    const arr = data.script.split(" gms");

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
  class="flex items-center flex-row w-full pr-2"
  style="background-color: {action.information.color}"
  on:click={handleClick}
>
  <div
    class="grid grid-cols-[auto_1fr_auto] gap-2 justify-center items-center h-full w-full my-1"
  >
    <slot name="name" />
    <InfoBox value={`(${scriptSegments.join(", ")})`} />
    <slot name="edit-name-trigger" />
  </div>
</div>
