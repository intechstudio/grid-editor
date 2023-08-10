<script>
  import { appSettings } from "../../runtime/app-helper.store";
  import { Analytics } from "../../runtime/analytics.js";
  import Tooltip from "./tooltip/Tooltip.svelte";

  const options = [
    {
      value: "none",
      label: "OFF",
      tooltip_key: "tracker_none",
    },
    {
      value: "element",
      label: "Element",
      tooltip_key: "tracker_element",
    },
    {
      value: "event",
      label: "Event",
      tooltip_key: "tracker_event",
    },
  ];

  function handleClick(value) {
    Analytics.track({
      event: "Tracking Changed",
      payload: { click: value },
      mandatory: false,
    });
    $appSettings.changeOnEvent = value;
  }
</script>

<container class={$$props.class}>
  <div class="flex flex-row gap-4 items-center bg-primary py-2 px-3 rounded-lg">
    <span class="text-white">Interaction Tracking:</span>
    <div class="flex flex-row gap-2 items-center">
      {#each options as { value, label, tooltip_key }}
        <button
          class:selected={value === $appSettings.changeOnEvent}
          on:click={() => handleClick(value)}
          class="relative w-24 rounded bg-select text-white hover:bg-select-saturate-10 py-1"
        >
          <span>{label}</span>
          <Tooltip key={tooltip_key} placement="bottom" class="w-60 p-4" />
        </button>
      {/each}
    </div>
  </div>
</container>

<style>
  button.selected {
    font-weight: bold;
    box-shadow: inset 0 0 100px #ffffff60;
  }
</style>
