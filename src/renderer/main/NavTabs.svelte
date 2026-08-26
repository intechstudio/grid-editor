<script>
  import { tooltip } from "./_actions/tooltip.ts";
  import { appSettings, splitpanes } from "../runtime/app-helper.store";
  import menuIcons from "$lib/menu.icons";
  import NavTabsButton from "./user-interface/NavTabsButton.svelte";

  import CircularBar from "./user-interface/CircularBar.svelte";

  let leftSize = 0;
  $: leftSize = $splitpanes.left.size;
  $: selectedLeftTab = $splitpanes.left.component ?? "profile-cloud";
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
  class=" flex px-1 flex-col items-center h-full overflow-y-auto overflow-x-hidden shrink-0"
>
  <NavTabsButton
    {selectedLeftTab}
    {leftSize}
    tooltipKey="sidebar_profile_cloud_icon"
    tabName="profile-cloud"
    menuIcon="menu_profile_cloud"
    clickHandler={changeLeftTab}
  />

  {#if import.meta.env.VITE_BUILD_TARGET !== "web"}
    {#if !$appSettings.packageManagerRunning}
      <div
        use:tooltip={{
          nowrap: true,
          placement: "right",
          delay: 100,
          class: "px-2 py-1",
          text: "Package manager starting…",
          triggerEvents: ["focus", "click", "hover"],
        }}
        class="m-1 my-2 w-14 h-14 rounded-lg flex justify-center items-center bg-background-muted"
      >
        <div class="fill-foreground-muted opacity-75 animate-spin h-5 w-5">
          <svg
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="2 2 20 20"
          >
            <path
              opacity="0.2"
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19ZM12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              fill="currentColor"
            ></path>
            <path
              d="M2 12C2 6.47715 6.47715 2 12 2V5C8.13401 5 5 8.13401 5 12H2Z"
              fill="currentColor"
            ></path>
          </svg>
        </div>
      </div>
    {/if}
    {#each menuItems as packageData}
      {#if packageData?.preferenceComponent || packageData?.svgIcon || packageData?.menuIconPath}
        {#key packageData.id}
          <NavTabsButton
            {selectedLeftTab}
            {leftSize}
            disabled={!packageData.isEnabled}
            tooltipText={packageData.name}
            tabName={packageData.id}
            menuIcon={packageData.svgIcon}
            menuIconPath={packageData.menuIconPath}
            clickHandler={changeLeftTab}
            installProgress={packageData.installProgress}
          />
        {/key}
      {/if}
    {/each}
  {:else}
    <NavTabsButton
      {selectedLeftTab}
      {leftSize}
      tooltipKey="sidebar_debugger_icon"
      tabName="debug-monitor"
      menuIcon="menu_debug_monitor"
      clickHandler={changeLeftTab}
    />

    <NavTabsButton
      {selectedLeftTab}
      {leftSize}
      tooltipKey="sidebar_midi_monitor_icon"
      tabName="midi-monitor"
      menuIcon="menu_midi_monitor"
      clickHandler={changeLeftTab}
    />

    <NavTabsButton
      {selectedLeftTab}
      {leftSize}
      tooltipText="File Manager"
      tabName="file-manager"
      menuIcon="menu_file_manager"
      clickHandler={changeLeftTab}
    />
  {/if}
  <div class="grow"></div>

  <NavTabsButton
    {selectedLeftTab}
    {leftSize}
    tooltipKey="sidebar_packages_icon"
    tabName="packages"
    menuIcon="menu_packages"
    clickHandler={changeLeftTab}
  />

  <NavTabsButton
    {selectedLeftTab}
    {leftSize}
    tooltipKey="sidebar_preferences_icon"
    tabName="preferences"
    menuIcon="menu_preferences"
    clickHandler={changeLeftTab}
  />
</nav-tab>
