<script>
  import { appSettings } from "../../runtime/app-helper.store";
  import { Analytics } from "../../runtime/analytics.js";
  import PushButton from "./PushButton.svelte";

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
  <div class="flex items-center bg-primary py-2 px-3 rounded-lg">
    <span class="text-white mr-4">Interaction Tracking:</span>
    <div class="grid grid-cols-[1fr_0px_1fr_0px_1fr_0px] gap-1">
      {#each options as { value, label, tooltip_key }}
        <PushButton
          tooltip={{
            key: tooltip_key,
            placement: "top",
            class: "w-60 p-4",
          }}
          selected={value === $appSettings.changeOnEvent}
          on:click={() => handleClick(value)}
          text={label}
        />
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
