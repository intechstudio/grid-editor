<script lang="ts">
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import {
    GridModule,
    GridPage,
    GridProfileData,
  } from "../../../../runtime/runtime.js";
  import { loadProfile } from "../../../../runtime/operations";
  import { user_input } from "../../../../runtime/user-input.store";
  import { get } from "svelte/store";

  export let device: GridModule;
  export let visible = false;

  enum LoadState {
    READY,
    BUSY,
    LOADED,
  }

  let state = LoadState.READY;

  $: {
    if ($selectedConfigStore) {
      state = LoadState.READY;
    }
  }

  function handleProfileLoad(e) {
    const page = device.findPage(get(user_input).pagenumber) as GridPage;
    const profile = GridProfileData.createFromCloudData($selectedConfigStore);

    state = LoadState.BUSY;
    loadProfile(profile, page)
      .then(() => {
        state = LoadState.LOADED;
      })
      .catch((e) => {
        console.log(e);
        state = LoadState.READY;
      });
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
      {#if device?.type === $selectedConfigStore?.type}
        <div class="w-fit relative">
          {#key state || $selectedConfigStore}
            <button
              on:click={handleProfileLoad}
              disabled={state === 1}
              class="flex flex-row px-4 py-2 rounded {state == 2
                ? 'loaded-element'
                : 'element'}"
            >
              {#if state === 0}
                <span class="text-white mr-2">Load Profile</span>
                <SvgIcon fill="#FFF" iconPath={"download"} />
              {:else if state === 1}
                <span class="text-white mr-2">Loading...</span>
                <SvgIcon fill="#FFF" iconPath={"download"} />
              {:else if state === 2}
                <span class="text-white">Loaded!</span>
                <SvgIcon fill="#FFF" iconPath={"tick"} />
              {/if}
            </button>
          {/key}
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
</style>
