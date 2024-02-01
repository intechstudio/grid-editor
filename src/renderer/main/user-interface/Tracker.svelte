<script>
  import { appSettings } from "../../runtime/app-helper.store";
  import { Analytics } from "../../runtime/analytics.js";
  import MeltSelect from "../panels/preferences/MeltSelect.svelte";
  import MeltSlider from "../panels/preferences/MeltSlider.svelte";
  import MoltenButton from "../panels/preferences/MoltenButton.svelte";

  const options = [
    {
      value: "none",
      title: "OFF",
      tooltip_key: "tracker_none",
    },
    {
      value: "element",
      title: "Element",
      tooltip_key: "tracker_element",
    },
    {
      value: "event",
      title: "Event",
      tooltip_key: "tracker_event",
    },
  ];
</script>

<container class={$$props.class}>
  <div class="flex items-center bg-primary py-2 px-3 rounded-lg">
    <span class="text-white mr-4">Interaction Tracking:</span>
    <div class="w-24 h-fit text-white">
      <MeltSelect
        bind:target={$appSettings.persistent.changeOnEvent}
        {options}
      />
    </div>
  </div>

  <MeltSlider
    bind:target={$appSettings.persistent.fontSize}
    min={8}
    max={30}
    step={0.1}
  />
  <MoltenButton
    title={"Reset"}
    click={() => {
      $appSettings.persistent.fontSize = 12;
    }}
  />
</container>

<style>
  button.selected {
    font-weight: bold;
    box-shadow: inset 0 0 100px #ffffff60;
  }
</style>
