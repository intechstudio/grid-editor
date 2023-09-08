<script>
  import { appSettings, splitpanes } from "../runtime/app-helper.store";

  import { setTooltip } from "./user-interface/tooltip/Tooltip.js";

  let selectedRightTab = "Configuration";
  let selectedLeftTab = "ProfileCloud";

  $: {
    selectedLeftTab = $appSettings.leftPanel;
  }

  // TODO: Move it under the place of functionality
  // Merge toggleLeftTab() and toggleRightTab() if Possible
  function toggleLeftTab() {
    // Update store and global variables
    $appSettings.leftPanelVisible = !$appSettings.leftPanelVisible;
    splitpanes.update((store) => {
      store.left.size =
        $appSettings.leftPanelVisible == true ? store.left.default : 0;
      return store;
    });
  }

  function toggleRightTab() {
    // Update store and global variables
    $appSettings.rightPanelVisible = !$appSettings.rightPanelVisible;
    splitpanes.update((store) => {
      store.right.size =
        $appSettings.rightPanelVisible == true ? store.right.default : 0;
      return store;
    });
    console.log($appSettings.rightPanelVisible);
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

  function changeRightTab(tab) {
    // When same tab is clicked, toggle the visibility of the panel
    // Untoggle  when a new selection happened
    if (selectedRightTab == tab || $appSettings.rightPanelVisible == false) {
      toggleRightTab();
    }
    selectedRightTab = tab;
    appSettings.update((store) => {
      store.rightPanel = tab;
      return store;
    });
  }
</script>

<nav-tab
  style="background-color:rgb(25, 26, 32)"
  class=" flex px-1 flex-col items-center justify-between h-full"
>
  <div class="flex flex-col">
    <!--
    <div 
      class:bg-secondary={selectedRightTab == 'virtual-modules'} 
      on:click={()=>{changeRightTab('virtual-modules')}} 
      class="m-1 my-2 p-1 w-12 h-12 flex justify-center items-center group hover:bg-secondary rounded-lg">
      <svg 
        class:text-white={selectedRightTab == 'virtual-modules'} 
        class="fill-current text-black group-hover:text-white" width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M21 2H4C2.89543 2 2 2.89543 2 4V21C2 22.1046 2.89543 23 4 23H21C22.1046 23 23 22.1046 23 21V4C23 2.89543 22.1046 2 21 2ZM4 0C1.79086 0 0 1.79086 0 4V21C0 23.2091 1.79086 25 4 25H21C23.2091 25 25 23.2091 25 21V4C25 1.79086 23.2091 0 21 0H4Z"/>
        <path d="M12.4863 14.5869L13.8604 9.60352H15.9248L13.4297 17H11.543L9.04785 9.60352H11.1123L12.4863 14.5869Z" />
      </svg>
    </div>
    -->

    <button
      use:setTooltip={{
        nowrap: true,
        placement: "right",
        duration: 75,
        instant: true,
        class: "px-2 py-1",
        key: "sidebar_configuration_icon",
      }}
      on:click={() => {
        changeRightTab("Configuration");
      }}
      class="relative cursor-pointer mx-1 mb-2 p-1 w-14 h-14 flex justify-center items-center group rounded-lg transition hover:bg-opacity-100 {selectedRightTab ==
        'Configuration' && $appSettings.rightPanelVisible
        ? 'bg-opacity-100'
        : 'bg-opacity-40'} bg-secondary"
    >
      <svg
        class="stroke-current text-white"
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12.6772" cy="12.6777" r="11.5" stroke-width="2" />
        <rect x="1.17725" y="12.1777" width="10" height="1" fill="black" />
      </svg>
      <div
        class="left-0 -ml-3 absolute transition-all
        {selectedRightTab == 'Configuration' && $appSettings.rightPanelVisible
          ? 'h-8'
          : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
      />
    </button>

    <button
      use:setTooltip={{
        nowrap: true,
        placement: "right",
        duration: 75,
        instant: true,
        class: "px-2 py-1",
        key: "sidebar_preferences_icon",
      }}
      on:click={() => {
        changeRightTab("Preferences");
      }}
      class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg
      {selectedRightTab == 'Preferences' && $appSettings.rightPanelVisible
        ? 'bg-opacity-100 '
        : 'bg-opacity-40 '} bg-secondary"
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
        class="left-0 -ml-3 absolute transition-all {selectedRightTab ==
          'Preferences' && $appSettings.rightPanelVisible
          ? 'h-8'
          : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
      />
    </button>
  </div>

  <div class="flex flex-col">
    
      <button
        use:setTooltip={{
          nowrap: true,
          placement: "right",
          duration: 75,
          instant: true,
          class: "px-2 py-1",
          key: "sidebar_profile_cloud_icon",
        }}
        on:click={() => {
          changeLeftTab("ProfileCloud");
        }}
        class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg {selectedLeftTab ==
          'ProfileCloud' && $splitpanes.left.size != 0
          ? 'bg-opacity-100 '
          : 'bg-opacity-40 '} bg-secondary"
      >
        <svg
          class="w-full h-full p-1.5 text-white fill-current"
          id="Réteg_2"
          data-name="Réteg 2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 21.12 20.58"
          ><path
            d="M17.9,5.26a2.73,2.73,0,0,0-.41,0A4.44,4.44,0,0,0,13.67,2.9,5.85,5.85,0,0,0,3,4.36a3.71,3.71,0,0,0,.82,7.34H6.06v5.73a1.48,1.48,0,0,0,.65,1.22l2.43,1.67a1.42,1.42,0,0,0,.84.26,1.44,1.44,0,0,0,.69-.17,1.48,1.48,0,0,0,.79-1.31v-.46h2.11a1.48,1.48,0,0,0,1.48-1.48V11.7h2.87a3.22,3.22,0,0,0,0-6.44ZM9.66,18.5l-1.8-1.24V10.52l1.8,1.23Zm3.59-1.66H11.46V11.58a1.5,1.5,0,0,0-.64-1.22l-1-.65h3.39ZM17.92,9.9H15.05V9.39a1.48,1.48,0,0,0-1.48-1.48h-6A1.49,1.49,0,0,0,6.06,9.39V9.9H3.71a1.91,1.91,0,1,1,0-3.82.9.9,0,0,0,.9-.78,4,4,0,0,1,7.71-1.1.88.88,0,0,0,.93.52,2.65,2.65,0,0,1,2.83,1.89.9.9,0,0,0,.49.57.86.86,0,0,0,.75,0,1.44,1.44,0,0,1,.58-.13,1.43,1.43,0,0,1,1.42,1.42A1.4,1.4,0,0,1,17.92,9.9Z"
          /></svg
        >
        <div
          class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
            'ProfileCloud' && $splitpanes.left.size != 0
            ? 'h-8'
            : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
        />
      </button>
    <button
      use:setTooltip={{
        nowrap: true,
        placement: "right",
        duration: 75,
        instant: true,
        class: "px-2 py-1",
        key: "sidebar_debugger_icon",
      }}
      on:click={() => {
        changeLeftTab("Debug");
      }}
      class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group rounded-lg transition hover:bg-opacity-100 {selectedLeftTab ==
        'Debug' && $splitpanes.left.size != 0
        ? 'bg-opacity-100'
        : 'bg-opacity-40'} bg-secondary"
    >
      <svg
        class="w-full h-full p-2 text-white fill-current"
        version="1.1"
        id="Réteg_3"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        viewBox="0 0 24 22.8"
        style="enable-background:new 0 0 24 22.8;"
        xml:space="preserve"
      >
        <g>
          <path
            d="M12,6c-0.5,0-0.9,0.4-0.9,0.9l0,11.6c0,0.5,0.4,0.9,0.9,0.9s0.9-0.4,0.9-0.9l0-11.6C12.9,6.4,12.5,6,12,6z"
          />
          <path
            d="M23.1,10.7h-2V9.4c0-1.7-0.4-3.2-1.2-4.5l1.6-1.6c0.4-0.4,0.4-0.9,0-1.3s-0.9-0.4-1.3,0l-1.3,1.3c-0.6-0.7-1.3-1.3-2.1-1.7
		l0.2-0.5c0.2-0.5-0.1-1-0.6-1.1c-0.5-0.2-1,0.1-1.1,0.6l-0.1,0.3c-1-0.4-2-0.6-3.1-0.6h-0.1c-1.1,0-2.1,0.2-3.1,0.6L8.7,0.6
		C8.6,0.2,8.1-0.1,7.6,0C7.1,0.2,6.8,0.7,7,1.2l0.2,0.5C6.4,2.2,5.7,2.7,5.1,3.4L3.7,2.1c-0.4-0.4-0.9-0.4-1.3,0
		C2.1,2.4,2.1,3,2.5,3.4L4,4.9C3.2,6.2,2.8,7.8,2.8,9.4v1.2H0.9c-0.5,0-0.9,0.4-0.9,0.9s0.4,0.9,0.9,0.9h1.9v1.2
		c0,1.6,0.4,3.1,1.2,4.5l-1.6,1.6c-0.4,0.4-0.4,0.9,0,1.3c0.2,0.2,0.4,0.3,0.6,0.3s0.5-0.1,0.6-0.3L5,19.7c1.7,1.9,4.1,3.1,6.9,3.1
		H12c2.7,0,5.1-1.2,6.8-3.1l1.3,1.3c0.2,0.2,0.4,0.3,0.6,0.3s0.5-0.1,0.6-0.3c0.4-0.4,0.4-0.9,0-1.3l-1.6-1.6
		c0.8-1.3,1.2-2.9,1.2-4.5v-1.2h2c0.5,0,0.9-0.4,0.9-0.9S23.6,10.7,23.1,10.7z M12,21h-0.1c-4,0-7.3-3.3-7.3-7.3V9.4
		c0-2.1,0.9-3.9,2.2-5.3h10.3c1.4,1.3,2.2,3.2,2.2,5.3v4.3C19.3,17.8,16.1,21,12,21z"
          />
          <path
            d="M7.9,10.3c-0.7,0-1.3,0.6-1.3,1.3s0.6,1.3,1.3,1.3c0.7,0,1.3-0.6,1.3-1.3S8.6,10.3,7.9,10.3z"
          />
          <circle cx="16.3" cy="8.3" r="1.3" />
          <path
            d="M16.3,13.6c-0.7,0-1.3,0.6-1.3,1.3c0,0.7,0.6,1.3,1.3,1.3s1.3-0.6,1.3-1.3C17.6,14.2,17,13.6,16.3,13.6z"
          />
        </g>
      </svg>
      <div
        class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
          'Debug' && $splitpanes.left.size != 0
          ? 'h-8'
          : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
      />
    </button>

    <button
      use:setTooltip={{
        nowrap: true,
        placement: "right",
        duration: 75,
        instant: true,
        class: "px-2 py-1",
        key: "sidebar_midi_monitor_icon",
      }}
      on:click={() => {
        changeLeftTab("MIDI Monitor");
      }}
      class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg {selectedLeftTab ==
        'MIDI Monitor' && $splitpanes.left.size != 0
        ? 'bg-opacity-100 '
        : 'bg-opacity-40 '} bg-secondary"
    >
      <svg
        class="w-full h-full p-2 text-white fill-current"
        id="Réteg_2_másolat"
        data-name="Réteg 2 másolat"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 23.21 23.21"
        ><defs /><path
          class="cls-1"
          d="M11.61,0a11.61,11.61,0,1,0,11.6,11.61A11.63,11.63,0,0,0,11.61,0Zm0,21.41a9.8,9.8,0,0,1-4.1-18.7V4.23A1.89,1.89,0,0,0,9.39,6.12h4.45a1.89,1.89,0,0,0,1.88-1.89V2.72a9.8,9.8,0,0,1-4.11,18.69Z"
        /><path
          class="cls-1"
          d="M6.61,11.61a1.81,1.81,0,1,0-1.81,1.8A1.81,1.81,0,0,0,6.61,11.61Z"
        /><path
          class="cls-1"
          d="M18.41,9.8a1.81,1.81,0,1,0,1.8,1.81A1.81,1.81,0,0,0,18.41,9.8Z"
        /><path
          class="cls-1"
          d="M6.8,14.61a1.81,1.81,0,1,0,1.8,1.8A1.81,1.81,0,0,0,6.8,14.61Z"
        /><path
          class="cls-1"
          d="M16.41,14.61a1.81,1.81,0,1,0,1.81,1.81A1.81,1.81,0,0,0,16.41,14.61Z"
        /><path
          class="cls-1"
          d="M11.61,16.6a1.81,1.81,0,1,0,1.8,1.81A1.81,1.81,0,0,0,11.61,16.6Z"
        /></svg
      >
      <div
        class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
          'MIDI Monitor' && $splitpanes.left.size != 0
          ? 'h-8'
          : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
      />
    </button>

    <button
      use:setTooltip={{
        nowrap: true,
        placement: "right",
        instant: true,
        class: "px-2 py-1",
        key: "sidebar_packages_icon",
      }}
      on:click={() => {
        changeLeftTab("Packages");
      }}
      class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group transition hover:bg-opacity-100 rounded-lg {selectedLeftTab ==
        'Packages' && $splitpanes.left.size != 0
        ? 'bg-opacity-100 '
        : 'bg-opacity-40 '} bg-secondary"
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

    {#if $appSettings.persistant.websocketMonitorEnabled === true}
      <button
        use:setTooltip={{
          nowrap: true,
          placement: "right",
          duration: 75,
          instant: true,
          class: "px-2 py-1",
          key: "sidebar_websocket_monitor_icon",
        }}
        on:click={() => {
          changeLeftTab("Websocket");
        }}
        class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group rounded-lg transition hover:bg-opacity-100 {selectedLeftTab ==
          'Websocket' && $splitpanes.left.size != 0
          ? 'bg-opacity-100'
          : 'bg-opacity-40'} bg-secondary"
      >
        <svg
          class="fill-current text-white p-0.5"
          width="24"
          height="24"
          viewBox="0 0 512 511"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M282.667 511H229.333C149.931 511 85.3333 446.403 85.3333 367V249.667C85.3333 170.264 149.931 105.667 229.333 105.667H282.667C362.069 105.667 426.667 170.264 426.667 249.667V367C426.667 446.403 362.069 511 282.667 511ZM229.333 137.667C167.573 137.667 117.333 187.907 117.333 249.667V367C117.333 428.76 167.573 479 229.333 479H282.667C344.427 479 394.667 428.76 394.667 367V249.667C394.667 187.907 344.427 137.667 282.667 137.667H229.333Z"
          />
          <path
            d="M340.693 151.533C338.176 151.533 335.616 150.936 333.227 149.677C325.419 145.539 322.432 135.875 326.549 128.045C329.216 123.032 330.667 116.973 330.667 111C330.667 90.4133 313.92 73.6666 293.333 73.6666H218.667C208.64 73.6666 199.232 77.528 192.213 84.5467C185.195 91.5653 181.333 100.973 181.333 111C181.333 116.973 182.784 123.032 185.451 128.045C189.568 135.853 186.603 145.539 178.773 149.677C170.965 153.816 161.301 150.808 157.163 143C152.043 133.336 149.333 122.264 149.333 111C149.333 92.4187 156.523 74.9893 169.6 61.9333C182.677 48.8773 200.085 41.6666 218.667 41.6666H293.333C331.563 41.6666 362.667 72.7706 362.667 111C362.667 122.264 359.957 133.336 354.837 143C351.979 148.44 346.432 151.533 340.693 151.533Z"
          />
          <path
            d="M219.157 68.3333C210.325 68.3333 203.157 61.1653 203.157 52.3333V16.9413C203.157 8.10931 210.325 0.941315 219.157 0.941315C227.989 0.941315 235.157 8.10931 235.157 16.9413V52.3333C235.157 61.1653 227.989 68.3333 219.157 68.3333Z"
          />
          <path
            d="M293.824 68.3333C284.992 68.3333 277.824 61.1653 277.824 52.3333V16.9413C277.824 8.10931 284.992 0.941315 293.824 0.941315C302.656 0.941315 309.824 8.10931 309.824 16.9413V52.3333C309.824 61.1653 302.656 68.3333 293.824 68.3333Z"
          />
          <path
            d="M256 404.333C247.168 404.333 240 397.165 240 388.333V228.333C240 219.501 247.168 212.333 256 212.333C264.832 212.333 272 219.501 272 228.333V388.333C272 397.165 264.832 404.333 256 404.333Z"
          />
          <path
            d="M496 324.333H416C407.168 324.333 400 317.165 400 308.333C400 299.501 407.168 292.333 416 292.333H496C504.832 292.333 512 299.501 512 308.333C512 317.165 504.832 324.333 496 324.333Z"
          />
          <path
            d="M96 324.333H16C7.168 324.333 0 317.165 0 308.333C0 299.501 7.168 292.333 16 292.333H96C104.832 292.333 112 299.501 112 308.333C112 317.165 104.832 324.333 96 324.333Z"
          />
          <path
            d="M37.3333 489.667C32.448 489.667 27.6267 487.448 24.4693 483.203C19.2 476.099 20.672 466.093 27.776 460.824L96.6827 409.624C103.765 404.376 113.792 405.827 119.061 412.931C124.331 420.035 122.859 430.04 115.755 435.309L46.848 486.509C44.0107 488.643 40.6613 489.667 37.3333 489.667Z"
          />
          <path
            d="M405.781 210.2C400.896 210.2 396.075 207.981 392.917 203.736C387.648 196.632 389.12 186.627 396.224 181.357L465.131 130.157C472.213 124.909 482.24 126.36 487.509 133.464C492.779 140.568 491.307 150.573 484.203 155.843L415.296 207.043C412.437 209.176 409.088 210.2 405.781 210.2Z"
          />
          <path
            d="M474.667 489.667C471.339 489.667 467.989 488.643 465.131 486.509L396.224 435.309C389.12 430.04 387.648 420.013 392.917 412.931C398.208 405.827 408.235 404.397 415.296 409.624L484.203 460.824C491.307 466.093 492.779 476.12 487.509 483.203C484.373 487.448 479.552 489.667 474.667 489.667Z"
          />
          <path
            d="M106.219 210.2C102.891 210.2 99.5413 209.176 96.6827 207.043L27.776 155.843C20.6933 150.573 19.2213 140.547 24.4907 133.464C29.76 126.36 39.808 124.931 46.8693 130.157L115.776 181.357C122.88 186.627 124.352 196.653 119.083 203.736C115.947 207.96 111.104 210.2 106.219 210.2Z"
          />
        </svg>

        <div
          class="left-0 -ml-3 absolute transition-all {selectedLeftTab ==
            'Websocket' && $splitpanes.left.size != 0
            ? 'h-8'
            : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
        />
      </button>
    {/if}
  </div>
</nav-tab>