<script>
  import { appSettings } from "../../runtime/app-helper.store";
  import mixpanel from "mixpanel-browser";
  import TooltipSetter from "../user-interface/tooltip/TooltipSetter.svelte";
  import { fly } from "svelte/transition";

  let classProps;
  export { classProps as class };
  export let visible = true;

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
    mixpanel.track("Tracking Changed", { click: value });
    $appSettings.changeOnEvent = value;
  }
</script>

{#if visible}
  <div
    in:fly={{ x: -10, delay: 100 }}
    out:fly={{ x: 10, delay: 0 }}
    class="{classProps} flex flex-row gap-4 items-center bg-primary py-2 px-3 flex-wrap justify-center rounded-lg"
  >
    <span class="text-white">Interaction Tracking:</span>
    <div class="flex flex-row gap-2 items-center">
      {#each options as { value, label, tooltip_key }}
        <button
          class:selected={value === $appSettings.changeOnEvent}
          on:click={() => handleClick(value)}
          class="w-24 rounded bg-select text-white hover:bg-select-saturate-10 relative py-1"
        >
          <span>{label}</span>
          <TooltipSetter key={tooltip_key} />
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  button.selected {
    font-weight: bold;
    box-shadow: inset 0 0 100px #ffffff60;
  }
</style>
