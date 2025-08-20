<script>
  import { tooltip } from "./_actions/tooltip.ts";
  import { appSettings, splitpanes } from "../runtime/app-helper.store";
  import menuIcons from "$lib/menu.icons";
  import NavTabsButton from "./user-interface/NavTabsButton.svelte";

  import CircularBar from "./user-interface/CircularBar.svelte";

  $: selectedLeftTab = $appSettings.leftPanel ?? "profile-cloud";
  $: enabledPackages = $appSettings.persistent.enabledPackages;
  $: menuItems = $appSettings.packageList
    .sort((p1, p2) => p1.name.localeCompare(p2.name))
    .filter((p) => p.installProgress !== undefined || p.isEnabled);

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
    console.log(selectedLeftTab)
  }

  let leftSize = 0;
  $: leftSize = $splitpanes.left.size;
</script>

<nav-tab
  style="background-color: var(--background-soft)"
  class=" flex px-1 flex-col items-center h-full overflow-y-auto overflow-x-hidden"
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
  {/if}
  <div class="grow" />
 
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

