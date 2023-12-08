<script>
  import { setTooltip } from "./tooltip/Tooltip.js";
  import { runtime, user_input } from "../../runtime/runtime.store";
  import { writeBuffer } from "../../runtime/engine.store.js";
  import { Analytics } from "../../runtime/analytics.js";
  import instructions from "../../serialport/instructions";
  import { fade, blur } from "svelte/transition";

  let isStoreEnabled = false;
  let changes = 0;
  $: if ($runtime) {
    changes = runtime.unsavedChangesCount();
    isStoreEnabled = $writeBuffer.length == 0 && changes > 0;
  }

  function handleStore() {
    if (isStoreEnabled) {
      Analytics.track({
        event: "Page Config",
        payload: {
          click: "Store",
        },
        mandatory: false,
      });

      const index = $user_input.event.pagenumber;
      runtime.storePage(index);
    }
  }

  function handleClear() {
    instructions.sendPageClearToGrid();

    Analytics.track({
      event: "Page Config",
      payload: {
        click: "Clear",
      },
      mandatory: false,
    });
  }

  function handleDiscard() {
    if (isStoreEnabled) {
      instructions.sendPageDiscardToGrid();

      Analytics.track({
        event: "Page Config",
        payload: {
          click: "Discard",
        },
        mandatory: false,
      });
    }
  }
</script>

<container
  in:fade={{ delay: 300, duration: 1000 }}
  out:blur={{ duration: 150 }}
  class={$$props.class}
>
  <div class="flex flex-row justify-center items-center gap-2">
    <div class="mx-4 text-white font-medium">
      {changes} active changes
    </div>
    <button
      use:setTooltip={{
        key: "configuration_header_clear",
        placement: "top",
        class: "w-60 p-4 z-10",
      }}
      on:click={handleDiscard}
      class="relative items-center justify-center focus:outline-none bg-select
      rounded text-white py-1 w-24 {isStoreEnabled
        ? 'hover:bg-yellow-600'
        : 'opacity-75'}"
    >
      <div>Discard</div>
    </button>
    <button
      use:setTooltip={{
        key: "configuration_header_store",
        placement: "top",
        class: "w-60 p-4",
      }}
      on:click={handleStore}
      class="relative items-center justify-center rounded
          focus:outline-none text-white py-1 w-24 bg-commit {isStoreEnabled
        ? 'hover:bg-commit-saturate-20'
        : 'opacity-75'}"
    >
      <div>Store</div>
    </button>

    <button
      use:setTooltip={{
        key: "configuration_header_clear",
        placement: "top",
        class: "w-60 p-4",
        buttons: [
          {
            label: "Cancel",
            handler: undefined,
          },
          { label: "Confirm", handler: handleClear },
        ],
        triggerEvents: ["show-buttons", "hover"],
      }}
      disabled={$writeBuffer.length > 0}
      class="{$writeBuffer.length == 0 ? 'hover:bg-red-500' : 'opacity-75'}
      relative flex items-center focus:outline-none justify-center rounded
        bg-select text-white py-1 w-24"
    >
      <div>Clear</div>
    </button>
  </div>
</container>
