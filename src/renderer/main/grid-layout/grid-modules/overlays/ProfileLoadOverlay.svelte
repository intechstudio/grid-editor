<script lang="ts" context="module">
  export namespace ProfileLoadOverlay {
    export interface ViewModel extends ProfileCloudLoad.Status {
      target: GridPage | undefined;
      config: SelectedProfileCloudConfig;
    }

    export const viewModel: Writable<ViewModel> = writable({
      step: ProfileCloudLoad.State.READY,
      target: undefined,
      config: undefined,
    });
  }
</script>

<script lang="ts">
  import {
    selectedConfigStore,
    SelectedProfileCloudConfig,
  } from "../../../panels/profileCloud/ProfileCloud";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { MoltenPushButton, SvgIcon } from "@intechstudio/grid-uikit";
  import { ModuleType } from "@intechstudio/grid-protocol";
  import {
    GridModule,
    GridPage,
    GridProfileData,
    ProfileCloudLoad,
  } from "../../../../runtime/runtime.js";
  import { loadProfile } from "../../../../runtime/operations";
  import { user_input } from "../../../../runtime/user-input.store";
  import { derived, get, writable, Writable } from "svelte/store";
  import {
    ConfigTour,
    configTour,
  } from "../../../panels/profileCloud/ConfigTour";
  import { moduleOverlay } from "../../../../runtime/moduleOverlay";
  import { Grid } from "../../../../lib/_utils";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  const model = ProfileLoadOverlay.viewModel;

  export let device: GridModule;
  export let visible = false;

  let page = derived([device, user_input], ([$device, $user_input]) =>
    device.findPage($user_input.pagenumber),
  );

  let tour: ConfigTour.TourData | undefined;
  const totalEventCount = get(page).control_elements.reduce(
    (a, c) => a + c.events.length,
    0,
  );
  const loadedEventCount = derived(page, ($page) =>
    $page.control_elements.reduce(
      (a, c) => a + c.events.reduce((a, c) => a + (c.isLoaded() ? 1 : 0), 0),
      0,
    ),
  );

  $: {
    model.update((s) => {
      s.target = $page;
      s.config = $selectedConfigStore;
      return s;
    });
  }

  $: {
    if ($selectedConfigStore) {
      model.update((s) => {
        s.step = ProfileCloudLoad.State.READY;
        return s;
      });
    }
  }

  $: handleViewModelChange($model);

  async function handleViewModelChange(data: ProfileLoadOverlay.ViewModel) {
    const { config, target } = data;
    if (typeof config === "undefined") {
      return;
    }

    const module = target.parent as GridModule;
    if (!isCompatible(module.type, config.type)) {
      return;
    }

    if (!target.isLoaded()) {
      await target.load();
    }
  }

  function handleProfileLoad() {
    const page = device.findPage(get(user_input).pagenumber);
    const profile = GridProfileData.createFromCloudData($selectedConfigStore);
    loadProfile(profile, page, (e) => {
      ProfileLoadOverlay.viewModel.update((s) => ({ ...s, ...e }));
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
          {@const loaded = $page.isProfileLoaded(
            GridProfileData.createFromCloudData($selectedConfigStore),
          )}
          <div class="w-fit relative flex flex-col gap-2 items-center">
            <button
              on:click={handleProfileLoad}
              disabled={[
                ProfileCloudLoad.State.READY,
                ProfileCloudLoad.State.LOADED,
              ].includes($model.step) === false}
              class="flex flex-row px-4 py-2 rounded gap-2"
              class:loaded-element={loaded}
              class:element={[
                ProfileCloudLoad.State.READY,
                ProfileCloudLoad.State.BUSY,
              ].includes($model.step)}
              class:error-element={$model.step == ProfileCloudLoad.State.ERROR}
            >
              {#if [ProfileCloudLoad.State.READY, ProfileCloudLoad.State.LOADED].includes($model.step)}
                {#if loaded}
                  <span class="text-white mr-2">Re-Load Profile</span>
                  <SvgIcon fill="#FFF" iconPath={"download"} />
                {:else}
                  <span class="text-white mr-2">Load Profile</span>
                  <SvgIcon fill="#FFF" iconPath={"download"} />
                {/if}
              {:else if $model.step === ProfileCloudLoad.State.BUSY}
                <span
                  >{Math.round(($model.completed / $model.total) * 100)}%</span
                >
                <span class="text-white mr-2">Loading...</span>
              {:else if $model.step === ProfileCloudLoad.State.ERROR}
                <span class="text-white">Error!</span>
              {/if}
            </button>

            {#if isTourAvailable($page, $selectedConfigStore) && $model.step !== ProfileCloudLoad.State.BUSY}
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
            <div class="flex flex-row">
              <span
                >{Math.round(
                  ($loadedEventCount / totalEventCount) * 100,
                )}%</span
              >
            </div>
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
