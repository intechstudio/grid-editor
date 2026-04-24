<script lang="ts">
  import { tooltip } from "./../_actions/tooltip";
  import { get } from "svelte/store";
  import { logger } from "./../../runtime/runtime.store";
  import { user_input } from "./../../runtime/user-input.store";
  import { ModuleOverlay, moduleOverlay } from "../../runtime/moduleOverlay";
  import { Analytics } from "../../runtime/analytics.js";
  import { fade, blur } from "svelte/transition";
  import { selectedConfigStore } from "../panels/profileCloud/ProfileCloud";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { runtime_manager } from "../../runtime/runtime-manager.store";
  import { GridRuntime } from "../../runtime/runtime";
  import { appSettings } from "../../runtime/app-helper.store";
  import { WriteBuffer } from "../../runtime/engine.store";
  import { ConfigTour, configTour } from "../panels/profileCloud/ConfigTour";

  let isChanges = false;
  let changes = 0;

  let runtime: GridRuntime;
  let buffer: WriteBuffer;
  $: {
    runtime = $runtime_manager.active.runtime;
    buffer = runtime.connection.buffer;
  }

  $: {
    if ($runtime) {
      changes = runtime.unsavedChangesCount();
      isChanges = changes > 0;
    }
  }

  function clearOverlays() {
    if (
      [
        ModuleOverlay.Types.PROFILE_LOAD,
        ModuleOverlay.Types.PRESET_LOAD,
      ].includes(get(moduleOverlay))
    ) {
      moduleOverlay.close();
    }
    selectedConfigStore.set(undefined);
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
        selectedConfigStore.set(undefined);
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
        logger.set({
          type: "success",
          mode: 0,
          classname: "pageclear",
          message: `Page clear complete!`,
        });
      })
      .catch((e) => {
        console.warn(e);
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
          logger.set({
            type: "success",
            mode: 0,
            classname: "pagediscard",
            message: `Discard complete!`,
          });
        })
        .catch((e) => {
          console.warn(e);
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

  function handleConnectModules(e) {
    navigator.tryConnectGrid().catch((e) => {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "serialerror",
        message: `Serial connect failed, your browser is not supperted yet.`,
      });
    });
  }
</script>

<container
  in:fade={{ delay: 300, duration: 1000 }}
  out:blur={{ duration: 150 }}
>
  <div class="flex flex-row justify-center items-center gap-2">
    <div class="flex flex-col">
      <div class="mx-4 font-medium">
        {changes} active changes
      </div>
      {#if $appSettings.persistent.writeBufferDebugEnabled}
        <div class="mx-4 font-medium">
          writeBuffer: {$buffer?.array.length}
        </div>
        <div class="mx-4 font-medium">
          retryCount: {$buffer?.retryCount}
        </div>
      {/if}
    </div>

    <div
      use:tooltip={{
        key: "configuration_header_discard",
        placement: "top",
        class: "w-60 p-4 z-10",
        buttons: [
          {
            label: "Cancel",
            handler: undefined,
          },
          { label: "Confirm", handler: handleDiscard },
        ],
        triggerEvents: ["show-buttons", "hover"],
      }}
    >
      <MoltenPushButton
        click={() => {}}
        disabled={!isChanges}
        text="Discard All"
      />
    </div>
    <div
      use:tooltip={{
        key: "configuration_header_store",
        placement: "top",
        class: "w-60 p-4",
      }}
      use:configTour.registerStaticTarget={ConfigTour.Target
        .StaticElementIdentifier.STORE}
    >
      <MoltenPushButton
        click={handleStore}
        disabled={!isChanges || !$runtime.isValid()}
        text="Store"
        style="accept"
      />
    </div>

    <div
      use:tooltip={{
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
      <MoltenPushButton text="Clear" click={() => {}} />
    </div>
    {#if import.meta.env.VITE_BUILD_TARGET === "web"}
      <MoltenPushButton
        text="Connect"
        style={"outlined"}
        click={handleConnectModules}
      />
    {/if}
  </div>
</container>
