<script lang="ts">
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { MoltenPushButton, SvgIcon } from "@intechstudio/grid-uikit";
  import { ModuleType } from "@intechstudio/grid-protocol";
  import {
    GridModule,
    GridPage,
    GridProfileData,
    ProfileLoad,
  } from "../../../../runtime/runtime.js";
  import { loadProfile } from "../../../../runtime/operations";
  import { user_input } from "../../../../runtime/user-input.store";
  import { derived, get } from "svelte/store";
  import {
    ConfigTour,
    configTour,
  } from "../../../panels/profileCloud/ConfigTour";
  import { moduleOverlay } from "../../../../runtime/moduleOverlay";
  import { Grid } from "../../../../lib/_utils";

  export let device: GridModule;
  export let visible = false;

  let state = ProfileLoad.State.READY;
  let page = derived([device, user_input], ([$device, $user_input]) =>
    $device.pages.find((e) => e.pageNumber === $user_input.pagenumber),
  );
  let tour: ConfigTour.TourData | undefined;

  $: {
    if (visible) {
      updateState($page, $selectedConfigStore);
    }
  }

  $: fetchPage($page, $selectedConfigStore);

  function updateState(page: GridPage, selected: any) {
    if ($selectedConfigStore?.configType !== "profile") {
      return;
    }

    if (state === ProfileLoad.State.BUSY) {
      return;
    }

    if (typeof selected === "undefined") {
      state = ProfileLoad.State.ERROR;
      return;
    }

    const profile = GridProfileData.createFromCloudData(selected);
    const loaded = page.isProfileLoaded(profile);

    state = loaded ? ProfileLoad.State.LOADED : ProfileLoad.State.READY;
  }

  function handleProfileLoad(e) {
    const page = device.findPage(get(user_input).pagenumber);
    const profile = GridProfileData.createFromCloudData($selectedConfigStore);
    loadProfile(profile, page, (status) => {
      state = status.step;
    }).catch((e) => {
      console.warn(e);
    });
  }

  function isCompatible(a: ModuleType, b: ModuleType) {
    let vsn1Modules = [ModuleType.VSN1L, ModuleType.VSN1R];
    if (vsn1Modules.includes(a)) {
      return vsn1Modules.includes(b);
    } else {
      return a === b;
    }
  }

  async function fetchPage(page: GridPage, config: any) {
    if (typeof config === "undefined") {
      return;
    }

    const module = page.parent as GridModule;
    if (!isCompatible(module.type, config.type)) {
      return;
    }

    if (!page.isLoaded()) {
      await page.load();
    }
  }

  function handleStartTour() {
    configTour.set(tour);
    configTour.start();
    handleCloseOverlay();
  }

  function handleCloseOverlay() {
    selectedConfigStore.set(undefined);
    moduleOverlay.close();
  }

  function isTourAvailable(page: GridPage, config: any) {
    const module = page.parent as GridModule;
    if (config.configType !== "profile") {
      return false;
    }

    if (module.type !== config.type) {
      return false;
    }

    if (!page.isLoaded()) {
      return false;
    }

    const profile = GridProfileData.createFromCloudData(config);

    const actions = page.control_elements.flatMap((e) =>
      e.events.flatMap((e) =>
        e.config.filter((e) => {
          return e.isTourStep();
        }),
      ),
    );

    tour = ConfigTour.Tour.createTourFrom(profile, actions);

    if (typeof tour === "undefined") {
      return false;
    }

    return true;
  }
</script>

<container>
  {#if visible}
    <div
      class="text-white w-full flex flex-col
    items-center justify-center rounded h-full absolute pointer-events-auto bg-overlay"
      style="transform: rotate({-$appSettings.persistent.moduleRotation +
        Grid.Rotation.R90 *
          device?.rot}deg); border-radius: var(--grid-rounding);"
    >
      {#if typeof $selectedConfigStore !== "undefined" && isCompatible(device.type, $selectedConfigStore.type)}
        {#if $page.isLoaded()}
          <div class="w-fit relative flex flex-col gap-2 items-center">
            <button
              on:click={handleProfileLoad}
              disabled={[
                ProfileLoad.State.READY,
                ProfileLoad.State.LOADED,
              ].includes(state) === false}
              class="flex flex-row px-4 py-2 rounded"
              class:loaded-element={state == ProfileLoad.State.LOADED}
              class:element={[
                ProfileLoad.State.READY,
                ProfileLoad.State.BUSY,
              ].includes(state)}
              class:error-element={state == ProfileLoad.State.ERROR}
            >
              {#if state === ProfileLoad.State.READY}
                <span class="text-white mr-2">Load Profile</span>
                <SvgIcon fill="#FFF" iconPath={"download"} />
              {:else if state === ProfileLoad.State.BUSY}
                <span class="text-white mr-2">Loading...</span>
              {:else if state === ProfileLoad.State.LOADED}
                <span class="text-white mr-2">Re-Load Profile</span>
                <SvgIcon fill="#FFF" iconPath={"download"} />
              {:else if state === ProfileLoad.State.ERROR}
                <span class="text-white">Error!</span>
              {/if}
            </button>

            {#if isTourAvailable($page, $selectedConfigStore) && state !== ProfileLoad.State.BUSY}
              <MoltenPushButton
                text="Start Tour!"
                style="accept"
                click={handleStartTour}
              />
            {/if}
          </div>
        {:else}
          <div class="flex flex-row gap-2 items-center">
            <span class="text-white">Fetching</span>

            <div class="fill-white opacity-75 animate-spin h-5 w-5">
              <svg
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="2 2 20 20"
              >
                <path
                  opacity="0.2"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19ZM12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M2 12C2 6.47715 6.47715 2 12 2V5C8.13401 5 5 8.13401 5 12H2Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
          </div>
        {/if}
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
