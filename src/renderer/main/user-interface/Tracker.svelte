<script>
  import { appSettings } from "../../runtime/app-helper.store";
  import { Analytics } from "../../runtime/analytics.js";
  import { MeltSelect } from "@intechstudio/grid-uikit";

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
</container>
