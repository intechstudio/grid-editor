<script lang="ts">
  import { tooltip } from "./../_actions/tooltip";
  import { get, writable } from "svelte/store";
  import { logger } from "./../../runtime/runtime.store";
  import { user_input } from "./../../runtime/user-input.store";
  import { ModuleOverlay, moduleOverlay } from "../../runtime/moduleOverlay";
  import { Analytics } from "../../runtime/analytics.js";
  import { fade, blur } from "svelte/transition";
  import { selectedConfigStore } from "../panels/profileCloud/ProfileCloud";
  import {
    Block,
    MoltenPushButton,
    MoltenPushButtonGroup,
  } from "@intechstudio/grid-uikit";
  import { runtime_manager } from "../../runtime/runtime-manager.store";
  import { GridRuntime } from "../../runtime/runtime";
  import { appSettings } from "../../runtime/app-helper.store";
  import { WriteBuffer } from "../../runtime/engine.store";
  import { ConfigTour, configTour } from "../panels/profileCloud/ConfigTour";
  import {
    availableProfileTypes,
    register_getting_started_profile,
  } from "../../runtime/getting-started-profile";
  import { profileLoadProgress } from "../../runtime/profileLoadProgress";

  /**
   * Formats a profile type string for display
   * @example "getting-started" => "Getting Started"
   */
  function formatProfileTypeTitle(type: string): string {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Load profiles from JSON files on component initialization
  const profileModules = import.meta.glob("../../../content/*.json", {
    eager: true,
    import: "default",
  });

  for (const path in profileModules) {
    // Extract profile type and module type from filename
    // Example: "../../../content/pressure-sensitive-defaults-bu16.json" -> profileType: "pressure-sensitive-defaults", moduleType: "BU16"
    const filename = path.split("/").pop();
    const lastHyphen = filename.lastIndexOf("-");
    const dotJson = filename.lastIndexOf(".json");
    if (lastHyphen > 0 && dotJson > lastHyphen) {
      const profileType = filename.slice(0, lastHyphen);
      const moduleType = filename.slice(lastHyphen + 1, dotJson).toUpperCase();
      const profileData = profileModules[path];

      // Register using the registration mechanism
      register_getting_started_profile(
        moduleType,
        profileType,
        "file",
        JSON.stringify(profileData),
      );
    }
  }

  let isChanges = false;
  let changes = 0;

  let runtime: GridRuntime;
  let buffer: WriteBuffer;
  $: {
    runtime = $runtime_manager.active.runtime;
    buffer = runtime.connection.buffer;
  }

  // Profile type selection for MeltSelect
  const selectedProfileType = writable("");

  // Options for MeltSelect — "Clear to Default" always first, then profile types
  const profileTypeOptions = [
    { value: "", title: "Clear to Default" },
    ...availableProfileTypes.map((type) => ({
      value: type,
      title: formatProfileTypeTitle(type),
    })),
  ];

  $: {
    if ($runtime) {
      changes = runtime.unsavedChangesCount();
      isChanges = changes > 0;
    }
  }

  $: noModules = $runtime.modules.length === 0;

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
    const profileType = $selectedProfileType;

    const finish = () => {
      logger.set({
        type: "success",
        mode: 0,
        classname: "pageclear",
        message: profileType
          ? `Succesfully loaded ${profileType}!`
          : `Page clear complete!`,
      });
      Analytics.track({
        event: "Page Config",
        payload: {
          click: "Clear",
          profileType: profileType || "none",
        },
        mandatory: false,
      });
    };

    const fail = (e) => {
      console.warn(e);
      logger.set({
        type: "alert",
        mode: 0,
        classname: "pageclear",
        message: `Unsuccessful page clear! Please retry!`,
      });
    };

    Promise.resolve()
      .then(() => {
        return import("../../runtime/getting-started-profile").then((m) => {
          m.initProfileLoadOverlay(runtime, profileType || undefined);
        });
      })
      .then(() => runtime.clearPage(ui.pagenumber))
      .then(() => {
        if (profileType) return;
        profileLoadProgress.update((map) => {
          if (!map) return map;
          for (const key in map) {
            map[key].operationTotal = 1;
            map[key].operationCompleted = 1;
          }
          return map;
        });
        return new Promise((r) => setTimeout(r, 1000));
      })
      .then(() => {
        clearOverlays();
        if (!profileType) {
          moduleOverlay.close();
          profileLoadProgress.set(undefined);
        }
      })
      .then(() => {
        if (!profileType) return;
        return import("../../runtime/getting-started-profile").then(
          ({ loadGettingStartedProfiles }) =>
            loadGettingStartedProfiles(runtime, profileType),
        );
      })
      .then(finish)
      .catch(fail);
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

  function handleWindowKeyDown(e: KeyboardEvent) {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "s") {
      return;
    }

    if (e.target instanceof Element && e.target.closest(".monaco-editor")) {
      return;
    }

    if (!isChanges || !$runtime.isValid()) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    handleStore();
  }
</script>

<svelte:window on:keydown={handleWindowKeyDown} />

<container
  in:fade={{ delay: 300, duration: 1000 }}
  out:blur={{ duration: 150 }}
  class="w-full"
>
  <div class="flex flex-row items-center h-full justify-center gap-2 w-full">
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
        text="Discard Changes"
        snap="wide"
      />
    </div>
    <MoltenPushButtonGroup
      options={profileTypeOptions}
      bind:target={$selectedProfileType}
      style="normal"
    >
      <div
        slot="button"
        let:closeDropdown
        let:selectedLabel
        data-testid="clear-load-button"
        use:tooltip={{
          key: "configuration_header_clear",
          placement: "top",
          class: "w-60 p-4",
          buttons: [
            {
              label: "Cancel",
              handler: undefined,
            },
            {
              label: "Confirm",
              handler: () => {
                handleClear();
                closeDropdown();
              },
            },
          ],
          triggerEvents: ["show-buttons", "hover"],
        }}
      >
        <MoltenPushButton
          text={selectedLabel}
          style="normal"
          click={() => {}}
          disabled={noModules}
          grouped={true}
          snap="wide"
        />
      </div>
    </MoltenPushButtonGroup>
    <div>
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
          snap="wide"
          style="accept"
        />
      </div>
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
