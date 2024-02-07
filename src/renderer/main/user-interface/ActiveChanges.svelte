<script>
  import { get } from "svelte/store";
  import { logger } from "./../../runtime/runtime.store.js";
  import { configManager } from "./../panels/configuration/Configuration.store.js";
  import { setTooltip } from "./tooltip/Tooltip.ts";
  import { runtime, user_input } from "../../runtime/runtime.store";
  import { appSettings } from "../../runtime/app-helper.store";
  import { Analytics } from "../../runtime/analytics.js";
  import { fade, blur } from "svelte/transition";
  import { selectedConfigStore } from "../../runtime/config-helper.store";
  import MoltenPushButton from "../panels/preferences/MoltenPushButton.svelte";

  let isChanges = false;
  let changes = 0;
  $: if ($runtime) {
    changes = runtime.unsavedChangesCount();
    isChanges = changes > 0;
  }

  function clearOverlays() {
    const overlay = get(appSettings).displayedOverlay;
    if (
      overlay === "profile-load-overlay" ||
      overlay === "preset-load-overlay"
    ) {
      appSettings.update((s) => {
        s.displayedOverlay = undefined;
        return s;
      });
    }
    selectedConfigStore.set({});
  }

  function handleStore() {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "pagestore",
      message: `Store configurations on page...`,
    });
    Analytics.track({
      event: "Page Config",
      payload: {
        click: "Store",
      },
      mandatory: false,
    });

    const index = $user_input.pagenumber;
    runtime
      .storePage(index)
      .then((res) => {
        clearOverlays();
        selectedConfigStore.set({});
        logger.set({
          type: "success",
          mode: 0,
          classname: "pagestore",
          message: `Store complete!`,
        });
      })
      .catch((e) => {
        logger.set({
          type: "alert",
          mode: 0,
          classname: "pagestore",
          message: `Unsuccessful page store! Please retry!`,
        });
      });
  }

  function handleClear() {
    const ui = get(user_input);
    runtime
      .clearPage(ui.pagenumber)
      .then(() => {
        clearOverlays();
        configManager.refresh().then(() => {
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
          message: `Unsuccessful page clear! Please retry!`,
        });
      });

    Analytics.track({
      event: "Page Config",
      payload: {
        click: "Clear",
      },
      mandatory: false,
    });
  }

  function handleDiscard() {
    if (isChanges) {
      const ui = get(user_input);
      runtime
        .discardPage(ui.pagenumber)
        .then(() => {
          clearOverlays();
          configManager
            .refresh()
            .then(() => {
              logger.set({
                type: "success",
                mode: 0,
                classname: "pagediscard",
                message: `Discard complete!`,
              });
            })
            .catch((e) => {
              console.error(e);
              //TODO: make feedback for fail
            });
        })
        .catch((e) => {
          console.error(e);
          logger.set({
            type: "alert",
            mode: 0,
            classname: "pagediscard",
            message: `Unsuccessful page discard! Please retry!`,
          });
        });

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
    <div
      use:setTooltip={{
        key: "configuration_header_clear",
        placement: "top",
        class: "w-60 p-4 z-10",
      }}
    >
      <MoltenPushButton
        on:click={handleDiscard}
        disabled={!isChanges}
        text="Discard"
      />
    </div>
    <div
      use:setTooltip={{
        key: "configuration_header_store",
        placement: "top",
        class: "w-60 p-4",
      }}
    >
      <MoltenPushButton
        on:click={handleStore}
        disabled={!isChanges}
        text="Store"
        style="accept"
      />
    </div>

    <div
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
    >
      <MoltenPushButton text="Clear" />
    </div>
  </div>
</container>
