<script lang="ts">
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { MoltenPushButton, SvgIcon } from "@intechstudio/grid-uikit";
  import { ModuleType } from "@intechstudio/grid-protocol";
  import {
    GridModule,
    GridPage,
    GridProfileData,
  } from "../../../../runtime/runtime.js";
  import { loadProfile } from "../../../../runtime/operations";
  import {
    user_input,
    UserInputValue,
  } from "../../../../runtime/user-input.store";
  import { get } from "svelte/store";
  import {
    ConfigTour,
    configTour,
  } from "../../../panels/profileCloud/ConfigTour";
  import { moduleOverlay } from "../../../../runtime/moduleOverlay";
  import { ProfileLoadOverlay } from "./ProfileLoadOverlay";

  export let device: GridModule;
  export let visible = false;

  const state = ProfileLoadOverlay.state;

  $: {
    if (visible) {
      const page = device.findPage($user_input.pagenumber);
      updateState(page, $selectedConfigStore);
    }
  }

  function updateState(page: GridPage, selected: any) {
    if (get(state) === ProfileLoadOverlay.State.BUSY) {
      return;
    }

    if (typeof selected === "undefined") {
      state.set(ProfileLoadOverlay.State.ERROR);
      return;
    }

    const profile = GridProfileData.createFromCloudData(selected);
    const loaded = page.isProfileLoaded(profile);

    if (loaded) {
      state.set(ProfileLoadOverlay.State.LOADED);
    } else {
      state.set(ProfileLoadOverlay.State.READY);
    }
  }

  function handleProfileLoad(e) {
    const page = device.findPage(get(user_input).pagenumber);
    const profile = GridProfileData.createFromCloudData($selectedConfigStore);
    loadProfile(profile, page).catch((e) => {
      console.warn(e);
    });
  }

  $: compatible = (() => {
    let vsn1Modules = [ModuleType.VSN1L, ModuleType.VSN1R];
    if (vsn1Modules.includes(device?.type)) {
      return vsn1Modules.includes($selectedConfigStore?.type);
    } else {
      return device?.type === $selectedConfigStore?.type;
    }
  })();

  function handleStartTour() {
    configTour.start();
    handleCloseOverlay();
  }

  function handleCloseOverlay() {
    selectedConfigStore.set(undefined);
    moduleOverlay.close();
  }

  function isTourAvailable(tour: ConfigTour.TourData) {
    if (tour.steps.length === 0) {
      return false;
    }

    const result = device
      .findPage($user_input.pagenumber)
      .isProfileLoaded(tour.profile);
    return result;
  }
</script>

<container>
  {#if visible}
    <div
      class="text-white w-full flex flex-col
    items-center justify-center rounded h-full absolute pointer-events-auto bg-overlay"
      style="transform: rotate({-$appSettings.persistent.moduleRotation +
        90 * device?.rot}deg); border-radius: var(--grid-rounding);"
    >
      {#if compatible}
        <div class="w-fit relative flex flex-col gap-2 items-center">
          <button
            on:click={handleProfileLoad}
            disabled={$state !== ProfileLoadOverlay.State.READY}
            class="flex flex-row px-4 py-2 rounded"
            class:loaded-element={$state == ProfileLoadOverlay.State.LOADED}
            class:element={[
              ProfileLoadOverlay.State.READY,
              ProfileLoadOverlay.State.BUSY,
            ].includes($state)}
            class:error-element={$state == ProfileLoadOverlay.State.ERROR}
          >
            {#if $state === ProfileLoadOverlay.State.READY}
              <span class="text-white mr-2">Load Profile</span>
              <SvgIcon fill="#FFF" iconPath={"download"} />
            {:else if $state === ProfileLoadOverlay.State.BUSY}
              <span class="text-white mr-2">Loading...</span>
            {:else if $state === ProfileLoadOverlay.State.LOADED}
              <span class="text-white">Loaded!</span>
              <SvgIcon fill="#FFF" iconPath={"tick"} />
            {:else if $state === ProfileLoadOverlay.State.ERROR}
              <span class="text-white">Error!</span>
            {/if}
          </button>

          {#if $device && isTourAvailable($configTour) && $configTour.id === $selectedConfigStore?.id}
            <MoltenPushButton
              text="Start Tour!"
              style="accept"
              click={handleStartTour}
            />
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</container>

<style>
  :root {
    --profile-load-color: rgb(28, 138, 114);
    --profile-load-hover-color: rgba(11, 164, 132, 1);
    --profile-load-success-color: rgba(100, 100, 100, 1);
    --profile-load-error-color: #dc2626;
  }

  .element {
    background-color: var(--profile-load-color);
  }

  .element:hover {
    background-color: var(--profile-load-hover-color);
  }

  .loaded-element {
    background-color: var(--profile-load-success-color);
  }

  .error-element {
    background-color: var(--profile-load-error-color);
  }
</style>
