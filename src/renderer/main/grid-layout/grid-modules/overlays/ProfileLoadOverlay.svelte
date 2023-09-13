<script>
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { runtime, user_input } from "../../../../runtime/runtime.store";
  import { isActionButtonClickedStore } from "/runtime/config-helper.store";
  import { appSettings } from "/runtime/app-helper.store";
  import { Analytics } from "../../../../runtime/analytics.js";
  export let id;

  let showOverlay = false;
  let selectedConfig = undefined;
  let isActionButtonClicked = false;

  //TODO: isActionButtonClicked didn't seem right, check if rewrite is correct

  $: {
    selectedConfig = $selectedConfigStore;
    showLoadProfileOverlay();
  }

  $: {
    isActionButtonClicked = $isActionButtonClickedStore;
    showLoadProfileOverlay();
  }

  function showLoadProfileOverlay() {
    let moduleId = id;
    let profileType = selectedConfig.type;
    let moduleType = moduleId.substr(0, 4);
    if (
      selectedConfig.configType === "profile" &&
      moduleType === profileType &&
      isActionButtonClicked === false
    ) {
      showOverlay = true;
    } else {
      showOverlay = false;
    }
  }

  function selectModuleWhereProfileIsLoaded() {
    const dx = id.split(";")[0].split(":").pop();
    const dy = id.split(";")[1].split(":").pop();

    user_input.update((store) => {
      store.brc.dx = +dx;
      store.brc.dy = +dy;
      return store;
    });
  }

  function loadProfileToThisModule() {
    selectModuleWhereProfileIsLoaded();

    Analytics.track({
      event: "Profile Load Start",
      payload: {},
      mandatory: false,
    });

    // to do.. if undefined configs
    runtime.whole_page_overwrite(selectedConfig.configs);

    Analytics.track({
      event: "Profile Load Success",
      payload: {},
      mandatory: false,
    });
  }

  function cancelProfileOverlay() {
    selectedConfigStore.set({});
  }
</script>

{#if showOverlay}
  <div
    class="text-white bg-black bg-opacity-30 z-[1] w-full flex flex-col
    items-center justify-center rounded h-full absolute"
    style="transform: rotate({$appSettings.persistant.moduleRotation + 'deg'})"
  >
    <div class="w-fit relative">
      <button
        on:click={() => {
          loadProfileToThisModule();
        }}
        class="px-4 py-2 rounded bg-commit hover:bg-commit-saturate-20
        opacity-80 block"
      >
        Load Profile
      </button>
    </div>

    <div class="w-fit">
      <button
        class="bg-select px-4 py-1 rounded hover:bg-select-saturate-20
        left-[37%] absolute bottom-[22%] opacity-60"
        on:click={() => {
          cancelProfileOverlay();
        }}
      >
        Cancel
      </button>
    </div>
  </div>
{/if}
