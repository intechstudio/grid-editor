<script>
  import { get } from "svelte/store";
  import { user_input } from "./../../../../runtime/runtime.store.js";
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { createEventDispatcher } from "svelte";
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";
  import { ConfigTarget } from "../../../panels/configuration/Configuration.store";

  export let device = undefined;
  export let visible = false;

  let loadedState = 0;
  let container;

  const dispatch = createEventDispatcher();

  function handleLoadClicked(e) {
    loadedState = 1;
    dispatch("click", {
      sender: container,
      device: { dx: device.dx, dy: device.dy },
    });
  }

  $: {
    if ($selectedConfigStore) {
      loadedState = 0;
    }
  }

  function handleProfileLoad(e) {
    const { success } = e.detail;
    loadedState = success ? 2 : 0;

    if (!success) {
      return;
    }

    const { dx, dy } = ConfigTarget.getCurrent().device;
    if (dx !== device.dx || dy !== device.dy) {
      const ui = get(user_input);
      user_input.set({
        dx: device.dx,
        dy: device.dy,
        pagenumber: ui.pagenumber,
        elementnumber: ui.elementnumber,
        eventtype: ui.eventtype,
      });
    }
  }
</script>

<container bind:this={container} on:profile-load={handleProfileLoad}>
  {#if visible}
    <div
      class="text-white w-full flex flex-col
    items-center justify-center rounded h-full absolute pointer-events-auto bg-overlay"
      style="transform: rotate({-$appSettings.persistent.moduleRotation +
        90 * device?.rot}deg); border-radius: var(--grid-rounding);"
    >
      {#if device?.type === $selectedConfigStore?.type}
        <div class="w-fit relative">
          {#key loadedState || $selectedConfigStore}
            <button
              on:click={handleLoadClicked}
              disabled={loadedState === 1}
              class="flex flex-row px-4 py-2 rounded {loadedState == 2
                ? 'loaded-element'
                : 'element'}"
            >
              {#if loadedState === 0}
                <span class="text-white mr-2">Load Profile</span>
                <SvgIcon
                  class="text-white"
                  iconPath={"download"}
                  displayMode={"static"}
                />
              {:else if loadedState === 1}
                <span class="text-white mr-2">Loading...</span>
                <SvgIcon
                  class="text-white"
                  iconPath={"download"}
                  displayMode={"static"}
                />
              {:else if loadedState === 2}
                <span class="text-white">Loaded!</span>
                <SvgIcon
                  class="text-white"
                  iconPath={"tick"}
                  displayMode={"static"}
                />
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
