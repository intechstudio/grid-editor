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
    <svg
      class="w-full h-full p-2 text-white fill-current"
      version="1.1"
      id="Réteg_3"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      viewBox="0 0 22.4 24"
      style="enable-background:new 0 0 22.4 24;"
      xml:space="preserve"
    >
      <path
        class="st0"
        d="M12.4,24h-2.3c-1,0-1.8-0.7-2.1-1.7c-0.4-1.5-1.7-2.6-3.2-2.6c-0.3,0-0.6,0-1,0.1c-1,0.3-2-0.1-2.5-1L0.3,17
  l0,0c-0.5-0.9-0.3-1.9,0.4-2.6c0.7-0.6,1-1.5,1-2.4c0-0.9-0.4-1.8-1-2.4C0,8.9-0.2,7.8,0.3,7L1.4,5c0.5-0.9,1.5-1.3,2.5-1
  c0.3,0.1,0.6,0.1,1,0.1c1.5,0,2.9-1,3.2-2.6C8.3,0.7,9.1,0,10.1,0h2.2c1,0,1.8,0.7,2.1,1.7c0.3,1.5,1.7,2.6,3.2,2.6
  c0.3,0,0.6,0,0.9-0.1c1-0.3,2,0.2,2.6,1.2l1,1.7c0.5,0.9,0.3,1.9-0.4,2.6c-0.7,0.6-1,1.5-1,2.4c0,0.9,0.4,1.8,1,2.4
  c0.7,0.7,0.9,1.8,0.4,2.6L21.1,19c-0.5,0.9-1.5,1.2-2.5,1c-0.3-0.1-0.6-0.1-0.9-0.1c-1.5,0-2.9,1-3.2,2.6C14.2,23.3,13.4,24,12.4,24
  z M4.8,18c2.4,0,4.4,1.6,5,3.9c0,0.2,0.2,0.3,0.3,0.3h2.3c0.2,0,0.3-0.1,0.3-0.3c0.5-2.3,2.6-3.9,5-3.9c0.5,0,1,0.1,1.4,0.2
  c0.2,0.1,0.3,0,0.4-0.1l1.1-1.9c0.1-0.1,0-0.3-0.1-0.4c-1-1-1.6-2.3-1.6-3.7c0-1.4,0.6-2.8,1.6-3.7c0.1-0.1,0.2-0.3,0.1-0.4l-1-1.7
  c-0.3-0.4-0.5-0.4-0.5-0.4c-0.5,0.1-1,0.2-1.5,0.2c-2.4,0-4.4-1.6-5-3.9c0-0.2-0.2-0.3-0.3-0.3h-2.2c-0.2,0-0.3,0.1-0.3,0.3
  C9.3,4.4,7.2,6,4.8,6c-0.5,0-1-0.1-1.5-0.2C3.2,5.7,3,5.8,3,5.9L1.8,7.9C1.8,8,1.8,8.2,1.9,8.3c1,1,1.6,2.3,1.6,3.7
  c0,1.4-0.6,2.8-1.6,3.7c-0.1,0.1-0.2,0.3-0.1,0.4L3,18.1c0.1,0.1,0.2,0.2,0.4,0.1C3.8,18.1,4.3,18,4.8,18z"
      />
      <path
        class="st0"
        d="M11.2,18.4c-3.5,0-6.4-2.9-6.4-6.4c0-3.5,2.9-6.4,6.4-6.4s6.4,2.9,6.4,6.4C17.6,15.5,14.8,18.4,11.2,18.4z
  M11.2,7.4c-2.5,0-4.6,2.1-4.6,4.6c0,2.5,2.1,4.6,4.6,4.6s4.6-2.1,4.6-4.6C15.8,9.5,13.8,7.4,11.2,7.4z"
      />
    </svg>
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
      <svg
        class="w-full h-full p-2 text-white fill-current"
        version="1.1"
        id="Réteg_2"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 22.3 23.9"
      >
        <path
          d="M12.2,23.1c-0.2,0-0.3,0-0.5-0.1c-0.3-0.2-0.4-0.5-0.4-0.8V12.1l-8.7-5C2.3,6.9,2.1,6.6,2.1,6.3
      s0.2-0.6,0.4-0.8l9.2-5.3C12,0,12.4,0,12.7,0.2l9.2,5.3c0.3,0.2,0.5,0.5,0.5,0.8v10.6c0,0.3-0.2,0.6-0.5,0.8L12.7,23
      C12.5,23.1,12.4,23.1,12.2,23.1z M13.1,12.1v8.5l7.4-4.3V7.8L13.1,12.1z M4.8,6.3l7.4,4.3l7.4-4.3L12.2,2L4.8,6.3z"
        />
        <path
          d="M9.1,23.8c-0.2,0-0.3,0-0.5-0.1L0.4,19C0.2,18.8,0,18.5,0,18.2V8.8C0,8.4,0.2,8.1,0.4,8c0.3-0.2,0.6-0.2,0.9,0
      l8.2,4.7c0.3,0.2,0.4,0.5,0.4,0.8v9.4c0,0.3-0.2,0.6-0.4,0.8C9.4,23.8,9.2,23.8,9.1,23.8z M1.8,17.7l6.4,3.7V14l-6.4-3.7V17.7z"
        />
      </svg>

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
