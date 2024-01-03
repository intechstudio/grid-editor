<script>
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { appSettings } from "/runtime/app-helper.store";
  import { createEventDispatcher } from "svelte";
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";
  import { scale } from "svelte/transition";
  import { elasticOut } from "svelte/easing";

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
  {#if visible && device?.type === $selectedConfigStore.type}
    <div
      class="text-white w-full flex flex-col
    items-center justify-center rounded h-full absolute pointer-events-auto bg-overlay"
      style="transform: rotate({-$appSettings.persistent.moduleRotation +
        90 * device?.rot}deg); border-radius: var(--grid-rounding);"
    >
      <div class="w-fit relative">
        {#key loaded || $selectedConfigStore}
          <button
            in:scale={{ duration: 800, start: 0.8, easing: elasticOut }}
            on:click={handleLoadClicked}
            class="flex flex-row px-4 py-2 rounded bg-commit"
            class:hover:bg-commit-saturate-20={!loaded}
            disabled={loaded}
          >
            {#if !loaded}
              <span class="text-black mr-2">Load Profile</span>
              <SvgIcon
                class="text-black"
                iconPath={"download"}
                displayMode={"static"}
              />
            {:else}
              <span class="text-black">Loaded!</span>
              <SvgIcon
                class="text-black"
                iconPath={"tick"}
                displayMode={"static"}
              />
            {/if}
          </button>
        {/key}
      </div>
    </div>
  {/if}
</container>
