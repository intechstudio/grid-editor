<script lang="ts">
  import { run } from 'svelte/legacy';

  import { createEventDispatcher } from "svelte";
  import { GridAction } from "../../runtime/runtime";
  import { InfoBox } from "@intechstudio/grid-uikit";

  const dispatch = createEventDispatcher();

  interface Props {
    config: GridAction;
  }

  let { config }: Props = $props();

  let scriptSegments = $state(["", "", ""]);
  let labels = ["CH:", "CC:", "VAL:"];

  const whatsInParenthesis = /\(([^)]+)\)/;
  let midiLSB = ""; // local script part
  let midiMSB = "";


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
  run(() => {
    if (!$config.invalid) {
      handleConfigChange($config);
    }
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<div
  class="flex items-center flex-row w-full px-2 bg-background-muted"
  onclick={handleClick}
>
  <div class="grid grid-cols-[auto_1fr] items-center h-full w-full my-1">
    <span class="mr-2 w-fit whitespace-nowrap"
      >{config.information.displayName}</span
    >
    <InfoBox value={`(${scriptSegments.join(", ")})`} />
  </div>
</div>
