<script>
  import { selectedProfileStore } from "../../../../runtime/profile-helper.store";
  import { runtime, user_input } from "../../../../runtime/runtime.store";
  import { isActionButtonClickedStore } from "/runtime/profile-helper.store";

  export let id;

  let showOverlay = false;
  let selectedProfile = undefined;
  let isActionButtonClicked = false;

  selectedProfileStore.subscribe((store) => {
    selectedProfile = store;
    showLoadProfileOverlay(id, store.type);
  });

  isActionButtonClickedStore.subscribe((store) => {
    isActionButtonClicked = store;
    showLoadProfileOverlay(id, store.type);
  });

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
    window.electron.analytics.influx(
      "application",
      "profiles",
      "profile",
      "load start"
    );

    // to do.. if undefined configs

    runtime.whole_page_overwrite(selectedProfile.configs);

    window.electron.analytics.google("profile-library", {
      value: "load success",
    });
    window.electron.analytics.influx(
      "application",
      "profiles",
      "profile",
      "load success"
    );
  }
</script>

{#if showOverlay}
  <div
    class="text-white bg-black bg-opacity-25 w-full absolute flex flex-col
    items-center justify-center rounded h-full "
  >
    <div>
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

    <div>
      <button
        class="bg-select px-4 py-1 rounded hover:bg-select-saturate-20
        left-[53px] absolute bottom-0 opacity-60"
        on:click={() => {
          selectedProfileStore.set({});
        }}
      >
        Off Profile Overlay
      </button>
    </div>
  </div>
{/if}
