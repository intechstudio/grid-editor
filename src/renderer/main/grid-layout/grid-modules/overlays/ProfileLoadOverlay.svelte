<script>
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { createEventDispatcher } from "svelte";
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";
  import { appSettings } from "../../../../runtime/app-helper.store";

  export let device = undefined;
  export let visible = false;

  let loaded = false;
  let container;

  const dispatch = createEventDispatcher();

  function handleLoadClicked(e) {
    loaded = !loaded;
    dispatch("click", {
      sender: container,
      device: { dx: device.dx, dy: device.dy },
    });
  }

  $: {
    if ($selectedConfigStore) {
      loaded = false;
    }
  }

  function handleProfileLoad(e) {
    const { success } = e.detail;
    loaded = success;
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
          {#key loaded || $selectedConfigStore}
            <button
              on:click={handleLoadClicked}
              class="flex flex-row px-4 py-2 rounded {loaded
                ? 'loaded-element'
                : 'element'}"
            >
              {#if !loaded}
                <span class="text-white mr-2">Load Profile</span>
                <SvgIcon
                  class="text-white"
                  iconPath={"download"}
                  displayMode={"static"}
                />
              {:else}
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
