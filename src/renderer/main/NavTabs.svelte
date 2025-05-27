<script>
  import { tooltip } from "./_actions/tooltip.ts";
  import { appSettings, splitpanes } from "../runtime/app-helper.store";
  import menuIcons from "$lib/menu.icons";

  let selectedLeftTab = "ProfileCloud";

  $: {
    selectedLeftTab =
      $appSettings.leftPanel ??
      ($appSettings.persistent.enabledPackages.includes("profile-cloud")
        ? "profile-cloud"
        : "Packages");
  }

  function toggleLeftTab() {
    // Update store and global variables
    $appSettings.leftPanelVisible = !$appSettings.leftPanelVisible;
    splitpanes.update((store) => {
      store.left.size =
        $appSettings.leftPanelVisible == true ? store.left.default : 0;
      return store;
    });
  }
  function changeLeftTab(tab) {
    // When same tab is clicked, toggle the visibility of the panel
    // Untoggle  when a new selection happened
    if (selectedLeftTab == tab || $appSettings.leftPanelVisible == false) {
      toggleLeftTab();
    }
    // update local leftPanel
    selectedLeftTab = tab;
    appSettings.update((store) => {
      store.leftPanel = tab;
      return store;
    });
  }
</script>

<nav-tab
  style="background-color:rgb(25, 26, 32)"
  class=" flex px-1 flex-col items-center h-full overflow-y-auto"
>
  <button
    data-testid="nav-preferences"
    use:tooltip={{
      nowrap: true,
      placement: "right",
      duration: 75,
      instant: true,
      class: "px-2 py-1",
      key: "sidebar_preferences_icon",
      triggerEvents: ["focus", "click"],
    }}
    on:click={() => {
      changeLeftTab("Preferences");
    }}
    class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg
    {selectedLeftTab == 'Preferences' && $appSettings.leftPanelVisible
      ? 'bg-opacity-100 '
      : 'bg-opacity-40 '} bg-secondary activator-button"
  >
    {@html menuIcons["menu_preferences"]}
    <div
      class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
        'Preferences' && $appSettings.leftPanelVisible
        ? 'h-8'
        : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
    />
  </button>

  {#if import.meta.env.VITE_BUILD_TARGET !== "web"}
    <button
      use:tooltip={{
        nowrap: true,
        placement: "right",
        instant: true,
        class: "px-2 py-1",
        key: "sidebar_packages_icon",
        triggerEvents: ["focus", "click"],
      }}
      on:click={() => {
        changeLeftTab("Packages");
      }}
      class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg {selectedLeftTab ==
        'Packages' && $splitpanes.left.size != 0
        ? 'bg-opacity-100 '
        : 'bg-opacity-40 '} bg-secondary activator-button"
    >
      {@html menuIcons["menu_packages"]}

      <div
        class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
          'Packages' && $splitpanes.left.size != 0
          ? 'h-8'
          : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
      />
    </button>
    {#each $appSettings.persistent.enabledPackages as packageId}
      {@const packageData = $appSettings.packageList.find(
        (e) => e.id == packageId,
      )}
      {#if packageData?.preferenceComponent || packageData?.svgIcon}
        <button
          use:tooltip={{
            nowrap: true,
            placement: "right",
            duration: 75,
            instant: true,
            class: "px-2 py-1",
            text: packageData.name,
            triggerEvents: ["focus", "click"],
          }}
          on:click={() => {
            changeLeftTab(packageId);
          }}
          class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg {selectedLeftTab ==
            packageId && $splitpanes.left.size != 0
            ? 'bg-opacity-100 '
            : 'bg-opacity-40 '} bg-secondary activator-button"
        >
          <div class="w-full h-full p-1.5 text-white fill-current">
            {#if packageData.svgIcon}
              {@html menuIcons[packageData.svgIcon]}
            {:else}
              {@html menuIcons["menu_package_general"]}
            {/if}
          </div>

          <div
            class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
              packageId && $splitpanes.left.size != 0
              ? 'h-8'
              : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
          />
        </button>
      {/if}
    {/each}
  {:else}
    <button
      data-testid="nav-profile-cloud"
      use:tooltip={{
        nowrap: true,
        placement: "right",
        duration: 75,
        instant: true,
        class: "px-2 py-1",
        key: "sidebar_profile_cloud_icon",
        triggerEvents: ["focus", "click"],
      }}
      on:click={() => {
        changeLeftTab("profile-cloud");
      }}
      class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg {selectedLeftTab ==
        'ProfileCloud' && $splitpanes.left.size != 0
        ? 'bg-opacity-100 '
        : 'bg-opacity-40 '} bg-secondary activator-button"
    >
      <div class="w-full h-full p-1.5 text-white fill-current">
        {@html menuIcons["menu_profile_cloud"]}
      </div>
      <div
        class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
          'ProfileCloud' && $splitpanes.left.size != 0
          ? 'h-8'
          : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
      />
    </button>

    <button
      data-testid="nav-debug-monitor"
      use:tooltip={{
        nowrap: true,
        placement: "right",
        duration: 75,
        instant: true,
        class: "px-2 py-1",
        key: "sidebar_debugger_icon",
        triggerEvents: ["focus", "click"],
      }}
      on:click={() => {
        changeLeftTab("debug-monitor");
      }}
      class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group rounded-lg transition hover:bg-opacity-100 {selectedLeftTab ==
        'Debug' && $splitpanes.left.size != 0
        ? 'bg-opacity-100'
        : 'bg-opacity-40'} bg-secondary activator-button"
    >
      <div class="w-full h-full p-1.5 text-white fill-current">
        {@html menuIcons["menu_debug_monitor"]}
      </div>
      <div
        class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
          'Debug' && $splitpanes.left.size != 0
          ? 'h-8'
          : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
      />
    </button>

    <button
      data-testid="nav-midi-monitor"
      use:tooltip={{
        nowrap: true,
        placement: "right",
        duration: 75,
        instant: true,
        class: "px-2 py-1",
        key: "sidebar_midi_monitor_icon",
        triggerEvents: ["focus", "click"],
      }}
      on:click={() => {
        changeLeftTab("midi-monitor");
      }}
      class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg {selectedLeftTab ==
        'MIDI Monitor' && $splitpanes.left.size != 0
        ? 'bg-opacity-100 '
        : 'bg-opacity-40 '} bg-secondary activator-button"
    >
      <div class="w-full h-full p-1.5 text-white fill-current">
        {@html menuIcons["menu_midi_monitor"]}
      </div>
      <div
        class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
          'MIDI Monitor' && $splitpanes.left.size != 0
          ? 'h-8'
          : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
      />
    </button>

    <button
      use:tooltip={{
        nowrap: true,
        placement: "right",
        duration: 75,
        instant: true,
        class: "px-2 py-1",
        key: "sidebar_websocket_monitor_icon",
        triggerEvents: ["focus", "click"],
      }}
      on:click={() => {
        changeLeftTab("websocket-monitor");
      }}
      class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group rounded-lg transition hover:bg-opacity-100 {selectedLeftTab ==
        'Websocket' && $splitpanes.left.size != 0
        ? 'bg-opacity-100'
        : 'bg-opacity-40'} bg-secondary activator-button"
    >
      <div class="w-full h-full p-1.5 text-white fill-current">
        {@html menuIcons["menu_websocket_monitor"]}
      </div>

      <div
        class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
          'Websocket' && $splitpanes.left.size != 0
          ? 'h-8'
          : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
      />
    </button>
  {/if}
</nav-tab>
