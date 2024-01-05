<script>
  import { get } from "svelte/store";
  import { logger } from "./../../runtime/runtime.store.js";
  import {
    ConfigList,
    ConfigTarget,
    configManager,
  } from "./../panels/configuration/Configuration.store.js";
  import { setTooltip } from "./tooltip/Tooltip.js";
  import { runtime, user_input } from "../../runtime/runtime.store";
  import { appSettings } from "../../runtime/app-helper.store";
  import { writeBuffer } from "../../runtime/engine.store.js";
  import { Analytics } from "../../runtime/analytics.js";
  import { fade, blur } from "svelte/transition";
  import { selectedConfigStore } from "../../runtime/config-helper.store";

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

      const index = $user_input.pagenumber;
      runtime.storePage(index);
      if (
        $appSettings.displayedOverlay === "profile-load-overlay" ||
        $appSettings.displayedOverlay === "preset-load-overlay"
      ) {
        $appSettings.displayedOverlay = undefined;
      }
      selectedConfigStore.set({});
    }
  }

  function handleClear() {
    const ui = get(user_input);
    runtime
      .clearPage(ui.pagenumber)
      .then(() => {
        //Update displayed config
        const current = ConfigTarget.getCurrent();
        ConfigList.createFromTarget(current).then((list) => {
          configManager.set(list);

          logger.set({
            type: "success",
            mode: 0,
            classname: "pageclear",
            message: `Page clear complete!`,
          });
        });
      })
      .catch((e) => {
        console.error(e);
        logger.set({
          type: "alert",
          mode: 0,
          classname: "pageclear",
          message: `Retry clear page...`,
        });
      });
    if (
      $appSettings.displayedOverlay === "profile-load-overlay" ||
      $appSettings.displayedOverlay === "preset-load-overlay"
    ) {
      $appSettings.displayedOverlay = undefined;
    }
    selectedConfigStore.set({});

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
      const ui = get(user_input);
      runtime
        .discardPage(ui.pagenumber)
        .then(() => {
          //Update displayed config
          const current = ConfigTarget.getCurrent();
          ConfigList.createFromTarget(current).then((list) => {
            configManager.set(list);

            logger.set({
              type: "success",
              mode: 0,
              classname: "pagediscard",
              message: `Discard complete!`,
            });
          });
        })
        .catch((e) => {
          console.error(e);
          logger.set({
            type: "alert",
            mode: 0,
            classname: "pagediscard",
            message: `Retry configuration discard...`,
          });
        });
      if (
        $appSettings.displayedOverlay === "profile-load-overlay" ||
        $appSettings.displayedOverlay === "preset-load-overlay"
      ) {
        $appSettings.displayedOverlay = undefined;
      }
      selectedConfigStore.set({});

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
