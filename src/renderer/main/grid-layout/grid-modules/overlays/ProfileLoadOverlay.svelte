<script>
  import { selectedProfileStore } from "../../../../runtime/profile-helper.store";
  import { runtime, user_input } from "../../../../runtime/runtime.store";
  import { isActionButtonClickedStore } from "/runtime/profile-helper.store";
  import { appSettings } from "/runtime/app-helper.store";
  import mixpanel from "mixpanel-browser";
  export let id;

  let showOverlay = false;
  let selectedProfile = undefined;
  let isActionButtonClicked = false;

  $: {
    selectedProfile = $selectedProfileStore;
    showLoadProfileOverlay(id, $selectedProfileStore.type);
  }

  $: {
    isActionButtonClicked = $isActionButtonClickedStore;
    showLoadProfileOverlay(id, $isActionButtonClickedStore.type);
  }

  function showLoadProfileOverlay(moduleId, profileType) {
    let moduleType = moduleId.substr(0, 4);
    if (moduleType == profileType && isActionButtonClicked == false) {
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

    window.electron.analytics.google("profile-library", {
      value: "load start",
    });
    mixpanel.track("Profile Load Start", {});

    // to do.. if undefined configs

    runtime.whole_page_overwrite(selectedProfile.configs);

    window.electron.analytics.google("profile-library", {
      value: "load success",
    });
    mixpanel.track("Profile Load Success", {});
  }

  function cancelProfileOverlay() {
    selectedProfileStore.set({});

    window.electron.analytics.google("profile-library", {
      value: "cancel overlay",
    });
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
