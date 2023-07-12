<script>

import { appSettings } from "../../../runtime/app-helper.store";

</script>
<div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">
    <div class="flex flex-col">
      <div class="pb-2">Page Activator</div>
      <div class="flex py-2 text-white items-center">
        <input
          class="mr-1"
          type="checkbox"
          bind:checked={$appSettings.persistant.pageActivatorEnabled}
        />
        <div class="mx-1">Enable/Disable page activator</div>
      </div>
      <div class="flex py-2 text-white items-center">
        <div class="mx-1">Poll interval</div>
        <input
          class="bg-primary m-1"
          type="range"
          min="200"
          max="2000"
          step="50"
          bind:value={$appSettings.persistant.pageActivatorInterval}
        />
        <div class="mx-1">
          {$appSettings.persistant.pageActivatorInterval} ms
        </div>
      </div>

      <div class="text-gray-400 py-1 mt-1 text-sm">
        <b>Active window:</b>
        {$appSettings.persistant.pageActivatorEnabled
          ? $appSettings.activeWindowResult.owner.name
          : "N/A"}
      </div>

      <div class="text-gray-400 py-1 mt-1 text-sm">
        <b>Active title:</b>
        {$appSettings.persistant.pageActivatorEnabled
          ? $appSettings.activeWindowResult.title
          : "N/A"}
      </div>

      <input
        type="text"
        placeholder="Page 0 trigger application"
        class="bg-primary my-1"
        bind:value={$appSettings.persistant.pageActivatorCriteria_0}
      />
      <input
        type="text"
        placeholder="Page 1 trigger application"
        class="bg-primary my-1"
        bind:value={$appSettings.persistant.pageActivatorCriteria_1}
      />
      <input
        type="text"
        placeholder="Page 2 trigger application"
        class="bg-primary my-1"
        bind:value={$appSettings.persistant.pageActivatorCriteria_2}
      />
      <input
        type="text"
        placeholder="Page 3 trigger application"
        class="bg-primary my-1"
        bind:value={$appSettings.persistant.pageActivatorCriteria_3}
      />
    </div>
  </div>