<script>
  import { tooltip } from "./_actions/tooltip.ts";
  import { appSettings, splitpanes } from "../runtime/app-helper.store";
  import menuIcons from "$lib/menu.icons";
  import CircularBar from "./user-interface/CircularBar.svelte";

  $: selectedLeftTab = $appSettings.leftPanel ?? "profile-cloud";
  $: enabledPackages = $appSettings.persistent.enabledPackages;
  $: menuItems = $appSettings.packageList
    .sort((p1, p2) => p1.name.localeCompare(p2.name))
    .filter((p) => p.installProgress !== undefined || p.isEnabled);

  function toggleLeftTab() {
    splitpanes.update((store) => {
      store.left.size = store.left.size === 0 ? store.left.default : 0;
      return store;
    });
  }
  function changeLeftTab(tab) {
    // When same tab is clicked, toggle the visibility of the panel
    // Untoggle  when a new selection happened
    if ($splitpanes.left.component == tab || $splitpanes.left.size == false) {
      toggleLeftTab();
    }

    splitpanes.update((store) => {
      store.left.component = tab;
      return store;
    });
  }
</script>

<nav-tab
  style="background-color: var(--background-soft)"
  class=" flex px-1 flex-col items-center h-full overflow-y-auto overflow-x-hidden"
>
  <button
    data-testid="nav-profile-cloud"
    use:tooltip={{
      nowrap: true,
      placement: "right",
      delay: 100,
      class: "px-2 py-1",
      key: "sidebar_profile_cloud_icon",
      triggerEvents: ["focus", "click", "hover"],
    }}
    on:click={() => {
      changeLeftTab("profile-cloud");
    }}
    class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg {selectedLeftTab ==
      'profile-cloud' && $splitpanes.left.size != 0
      ? 'selected '
      : 'bg-opacity-40 '} tabButtonElement activator-button"
  >
    <div class="tabButtonIcon">
      {@html menuIcons["menu_profile_cloud"]}
    </div>
    <div
      class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
        'profile-cloud' && $splitpanes.left.size != 0
        ? 'h-8'
        : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
    />
  </button>

  {#if import.meta.env.VITE_BUILD_TARGET !== "web"}
    {#each menuItems as packageData}
      {#if packageData?.preferenceComponent || packageData?.svgIcon || packageData?.menuIconPath}
        {#key packageData.id}
          <button
            disabled={!packageData.isEnabled}
            use:tooltip={{
              nowrap: true,
              placement: "right",
              delay: 100,
              class: "px-2 py-1",
              text: packageData.name,
              triggerEvents: ["focus", "click", "hover"],
            }}
            on:click={() => {
              changeLeftTab(packageData.id);
            }}
            class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg {selectedLeftTab ==
              packageData.id && $splitpanes.left.size != 0
              ? 'selected '
              : 'bg-opacity-40 '} tabButtonElement activator-button"
          >
            <div class="tabButtonIcon">
              {#if packageData.svgIcon}
                {@html menuIcons[packageData.svgIcon]}
              {:else if packageData.menuIconPath}
                <img src={packageData.menuIconPath} alt={packageData.name} />
              {:else}
                {@html menuIcons["menu_package_general"]}
              {/if}
            </div>

            {#if packageData.installProgress !== undefined}
              <div
                class="left-0 top-0 w-full h-full p-1 absolute flex items-center content-center"
                style="background-color: #1e262870;"
              >
                <CircularBar
                  value={packageData.installProgress * 100}
                  color="#fff"
                  thickness="10%"
                />
              </div>
            {/if}

            <div
              class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
                packageData.id && $splitpanes.left.size != 0
                ? 'h-8'
                : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
            />
          </button>
        {/key}
      {/if}
    {/each}
  {:else}
    <button
      data-testid="nav-debug-monitor"
      use:tooltip={{
        nowrap: true,
        placement: "right",
        delay: 100,
        class: "px-2 py-1",
        key: "sidebar_debugger_icon",
        triggerEvents: ["focus", "click", "hover"],
      }}
      on:click={() => {
        changeLeftTab("debug-monitor");
      }}
      class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group rounded-lg transition hover:bg-opacity-100 {selectedLeftTab ==
        'debug-monitor' && $splitpanes.left.size != 0
        ? 'selected'
        : 'bg-opacity-40'} tabButtonElement activator-button"
    >
      <div class="tabButtonIcon">
        {@html menuIcons["menu_debug_monitor"]}
      </div>
      <div
        class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
          'debug-monitor' && $splitpanes.left.size != 0
          ? 'h-8'
          : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
      />
    </button>

    <button
      data-testid="nav-midi-monitor"
      use:tooltip={{
        nowrap: true,
        placement: "right",
        delay: 100,
        class: "px-2 py-1",
        key: "sidebar_midi_monitor_icon",
        triggerEvents: ["focus", "click", "hover"],
      }}
      on:click={() => {
        changeLeftTab("midi-monitor");
      }}
      class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg {selectedLeftTab ==
        'midi-monitor' && $splitpanes.left.size != 0
        ? 'selected '
        : 'bg-opacity-40 '} tabButtonElement activator-button"
    >
      <div class="tabButtonIcon">
        {@html menuIcons["menu_midi_monitor"]}
      </div>
      <div
        class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
          'midi-monitor' && $splitpanes.left.size != 0
          ? 'h-8'
          : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
      />
    </button>

    <button
      use:tooltip={{
        nowrap: true,
        placement: "right",
        delay: 100,
        class: "px-2 py-1",
        key: "sidebar_websocket_monitor_icon",
        triggerEvents: ["focus", "click", "hover"],
      }}
      on:click={() => {
        changeLeftTab("websocket-monitor");
      }}
      class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group rounded-lg transition hover:bg-opacity-100 {selectedLeftTab ==
        'websocket-monitor' && $splitpanes.left.size != 0
        ? 'selected'
        : 'bg-opacity-40'} tabButtonElement activator-button"
    >
      <div class="tabButtonIcon">
        {@html menuIcons["menu_websocket_monitor"]}
      </div>

      <div
        class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
          'websocket-monitor' && $splitpanes.left.size != 0
          ? 'h-8'
          : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
      />
    </button>
  {/if}
  <div class="grow" />
  <button
    use:tooltip={{
      nowrap: true,
      placement: "right",
      delay: 100,
      class: "px-2 py-1",
      key: "sidebar_packages_icon",
      triggerEvents: ["focus", "click", "hover"],
    }}
    on:click={() => {
      changeLeftTab("Packages");
    }}
    class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg {selectedLeftTab ==
      'Packages' && $splitpanes.left.size != 0
      ? 'selected '
      : 'bg-opacity-40 '} tabButtonElement activator-button"
  >
    <div class="tabButtonIcon">
      {@html menuIcons["menu_packages"]}
    </div>
    <div
      class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
        'Packages' && $splitpanes.left.size != 0
        ? 'h-8'
        : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
    />
  </button>
  <button
    data-testid="nav-preferences"
    use:tooltip={{
      nowrap: true,
      placement: "right",
      delay: 100,
      class: "px-2 py-1",
      key: "sidebar_preferences_icon",
      triggerEvents: ["focus", "click", "hover"],
    }}
    on:click={() => {
      changeLeftTab("Preferences");
    }}
    class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg
    {selectedLeftTab == 'Preferences' && $appSettings.leftPanelVisible
      ? 'selected '
      : 'bg-opacity-40 '} tabButtonElement activator-button"
  >
    <div class="tabButtonIcon">
      {@html menuIcons["menu_preferences"]}
    </div>
    <div
      class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
        'Preferences' && $appSettings.leftPanelVisible
        ? 'h-8'
        : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
    />
  </button>
</nav-tab>

<style>
  .tabButtonIcon {
    width: 100%;
    height: 100%;
    padding: 0.375rem; /* or 6px */
  }

  .tabButtonElement {
    background-color: var(--background-muted);
    color: var(--foreground-muted);
    fill: var(--foreground-muted);
  }

  .tabButtonElement:hover {
    background-color: var(--background);
    color: var(--foreground);
    fill: var(--foreground);
  }

  .tabButtonElement.selected {
    background-color: var(--background);
    color: var(--foreground);
    fill: var(--foreground);
  }
</style>
