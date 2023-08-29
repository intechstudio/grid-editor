<script lang="ts">
  import { engine, logger } from "../../../runtime/runtime.store.js";
  import isOnline from "is-online";
  import { writable, get } from "svelte/store";
  import {
    profileListRefresh,
    presetListRefresh,
  } from "../../../runtime/app-helper.store.js";

  import instructions from "../../../serialport/instructions";

  import { onMount, onDestroy } from "svelte";

  import { appSettings } from "../../../runtime/app-helper.store";

  import { Analytics } from "../../../runtime/analytics.js";
  import VRadioButton from "./VRadioButton.svelte";
  import VCheckbox from "./VCheckbox.svelte";

  const configuration = window.ctxProcess.configuration();

  let helperPreviewElement;

  let helperAttachment = writable({
    element: helperPreviewElement,
    scale: 0.7,
    vpos: "50%",
    hpos: "50%",
  });

  let selected;

  onMount(async () => {
    helperAttachment.set({
      element: helperPreviewElement,
      scale: 0.7,
      vpos: "50%",
      hpos: "50%",
    });

    switch ($appSettings.profileBrowserMode) {
      case "newLibrary":
        selected = "newLibrary";
      case "legacyLibrary":
        selected = "legacyLibrary";
      case "profileCloud":
        selected = "profileCloud";
      default:
        selected = "profileCloud";
    }
  });

  // profile browser radio handler
  $: {
    if (selected === "newLibrary") {
      $appSettings.profileBrowserMode = "newLibrary";
    } else if (selected === "legacyLibrary") {
      $appSettings.profileBrowserMode = "legacyLibrary";
    } else if (selected == "profileCloud") {
      $appSettings.profileBrowserMode = "profileCloud";
    }
  }

  let DEFAULT_PATH = "";

  window.electron.library.defaultDirectory().then((res) => {
    DEFAULT_PATH = res;
  });

  let download_status = "";
  let download_status_interval;

  async function selectDirectory() {
    appSettings.update((s) => {
      s.intervalPause = true;
      return s;
    });
    const selectDirectoryResult =
      await window.electron.library.selectDirectory();
    // if the selected directory fails or cancels, it returns with ''
    if (selectDirectoryResult !== "") {
      appSettings.update((s) => {
        s.persistant.profileFolder = selectDirectoryResult;
        return s;
      });
    }
    appSettings.update((s) => {
      s.intervalPause = false;
      return s;
    });
  }

  let migrationComplete = false;

  async function migrateProfiles() {
    Analytics.track({
      event: "Migrate Profiles",
      payload: {},
      mandatory: false,
    });

    const dir = $appSettings.persistant.profileFolder;

    window.electron.configs
      .migrateToProfileCloud(dir + "/profiles", dir + "/profiles/local")
      .then((res) => {
        migrationComplete = true;
        $appSettings.persistant.useProfileCloud = true;
        logger.set({
          type: "success",
          message: `Profile to local migration complete.`,
        });
        return;
      })
      .catch((err) => {
        logger.set({
          type: "fail",
          message: `Profile migration failed, contact support!`,
        });
        throw err;
      });
  }

  async function libraryDownload() {
    if (!(await isOnline())) {
      download_status = "no internet connection!";
      return;
    }

    clearTimeout(download_status_interval);

    download_status = "Starting the download...";

    const targetFolder = get(appSettings).persistant.profileFolder;

    await window.electron.library.download(targetFolder, "library");

    profileListRefresh.update((s) => {
      return s + 1;
    });
    presetListRefresh.update((s) => {
      return s + 1;
    });

    download_status = "Library updated!";

    download_status_interval = setTimeout(() => {
      download_status = "";
    }, 2500);
  }

  async function viewDirectory() {
    await window.electron.library.viewDirectory(
      get(appSettings).persistant.profileFolder
    );
  }

  async function resetDirectory() {
    DEFAULT_PATH = await window.electron.library.resetDirectory();
    appSettings.update((s) => {
      s.persistant.profileFolder = DEFAULT_PATH;
      return s;
    });
  }

  function resetAppSettings() {
    window.electron.resetAppSettings();
  }

  function setModuleRotation(rot) {
    $appSettings.persistant.moduleRotation = rot;
  }

  function setHelperShape(shape) {
    $appSettings.persistant.helperShape = shape;
  }

  function setHelperColor(color) {
    $appSettings.persistant.helperColor = color;
  }

  function setHelperName() {}

  function handleOpenPolicyClicked(e) {
    window.electron.openInBrowser(
      configuration.DOCUMENTATION_ANALYTICS_POLICY_URL
    );
  }

  enum PreferenceMenu {
    GENERAL = "general",
    USER_LIBRARY = "user_library",
    PRIVACY = "privacy",
    ADVANCED = "advanced",
    DEVELOPER = "developer",
  }

  const preferencesNavigation = [
    { title: "General settings", route: PreferenceMenu.GENERAL },
    { title: "Privacy settings", route: PreferenceMenu.PRIVACY },
    { title: "User Library", route: PreferenceMenu.USER_LIBRARY },
    { title: "Advanced", route: PreferenceMenu.ADVANCED },
    { title: "Developer settings", route: PreferenceMenu.DEVELOPER },
  ];

  let activePreferenceMenu = PreferenceMenu.GENERAL;
  function setActiveNavItem(item: PreferenceMenu) {
    activePreferenceMenu = item;
  }

  const generalSettings = {
    moduleRotation: {
      title: "Control surface rotation",
      description:
        "Changes how the controllers are rotated in Grid Editor. Useful when the plugged-in module is rotated.",
      type: "radio",
      options: [
        { title: "0°", value: 0 },
        { title: "90°", value: 90 },
        { title: "180°", value: 180 },
        { title: "270°", value: 270 },
      ],
    },
    controllerScaling: {
      title: "Controller scaling",
      description: "Size of the controllers in the application.",
    },
    welcomeScreen: {
      title: "Welcome screen",
      description:
        "News and quick links are shown every time you launch Grid Editor.",
      type: "checkbox",
      label: "Show welcome screen",
    },
    runAppInBackground: {
      title: "Run application in background",
      description:
        "Change what happens when you close the application window. Some features, plugins might only work when the application always runs.",
      type: "radio",
      options: [
        {
          title: "Keep the application running on the tray or dock",
          value: true,
        },
        { title: "On close, quit the application", value: false },
      ],
    },
    resetSettings: {
      level: "danger",
      title: "Reset settings",
      description:
        "Reset all preferences settings to their default values. This will not affect your profiles or other data.",
      label: "Reset application settings",
    },
    migrateProfiles: {
      title: "Convert profiles to new format",
      description:
        "Before migration, it's safest to archive (.zip) your grid-userdata! After v1.2.35, we introduced Profile Cloud. Moving forward, we will develop this feature. To move your profiles to the new format, click the button below.",
      label: "Migrate profiles",
    },
  };

  const privacySettings = {
    requiredInformation: {
      title: "Use data to make Editor work",
      description:
        "We process anonymized logs and errors the application produces to promptly respond to failing services. This analytics data is automatically captured when Editor has access to the internet.",
    },
    improveApp: {
      title: "Use data to improve Editor",
      description:
        "Using your interactions with the Editor software we can get insight how the software is being used and we can continue improving it.",
      type: "checkbox",
      value: 1,
      label: "Track interaction with the Editor application",
    },
  };

  const userLibrarySettings = {
    libraryLocation: {
      title: "Grid Editor user data folder",
      description:
        "Local folder on your hard drive where local profiles, temporary downloads and other Editor related files are saved.",
    },
  };

  const developerSettings = {
    nvmDefrag: {
      title: "NVM Defrag",
      description:
        "Defragment the NVM memory of the module. This will take some time.",
      label: "Defrag",
    },
    nvmErase: {
      title: "NVM Erase",
      description:
        "Erase the NVM memory of the module. This will take some time.",
      label: "Erase",
    },
    portstateOverlayEnabled: {
      title: "Port state overlay",
      description:
        "Enable/Disable the port state overlay. This will show the port state on the module.",
      label: "Activate port sate overlay",
    },
    websocketMonitorEnabled: {
      title: "Websocket monitor",
      description:
        "Enable/Disable the websocket monitor. This will show the websocket messages in the console and add the websocket panel.",
      label: "Activate websocket monitor",
    },
    profileCloudUrl: {
      title: "Profile cloud URL",
      description: "Change the url used in the Profile Cloud Iframe.",
      type: "radio",
      options: [
        {
          title: "Development (localhost)",
          value: "http://localhost:5200",
        },
        {
          title: "Nightly (profile-cloud-dev)",
          value: "https://profile-cloud-dev.web.app",
        },
        {
          title: "Production (profile-cloud)",
          value: "https://profile-cloud.web.app",
        },
      ],
    },
  };
</script>

<div
  class="bg-primary flex flex-col h-full w-full text-white px-4 py-4 overflow-y-auto"
>
  <div class="mb-4">
    <div class="pb-2 text-white text-opacity-60">Preferences menu</div>
    <select
      on:change={(event) => setActiveNavItem(event.target.value)}
      class="px-2 py-2 rounded order border border-black border-opacity-20 bg-black hover:bg-opacity-40 bg-opacity-10 focus:outline-none"
    >
      {#each preferencesNavigation as navItem}
        <option class="bg-black text-white" value={navItem.route}
          >{navItem.title}</option
        >
      {/each}
    </select>
  </div>

  {#if activePreferenceMenu == PreferenceMenu.GENERAL}
    <div class="py-4 border border-transparent">
      <div class="text-white">{generalSettings.moduleRotation.title}</div>
      <div class="text-white text-opacity-60 py-2">
        {generalSettings.moduleRotation.description}
      </div>
      <div
        class="bg-black bg-opacity-10 border border-black border-opacity-20 text-white grid gap-4 grid-flow-col p-2"
      >
        {#each generalSettings.moduleRotation.options as option}
          <label class=" group flex w-full items-center cursor-pointer">
            <VRadioButton
              selectedState={$appSettings.persistant.moduleRotation ==
                option.value}
            />
            <input
              type="radio"
              class="hidden"
              name="scoops"
              value={option.value}
              bind:group={$appSettings.persistant.moduleRotation}
            />
            <span
              class="pl-2 text-white group-hover:text-opacity-100 {$appSettings
                .persistant.moduleRotation == option.value
                ? 'text-opacity-100'
                : 'text-opacity-80'}"
              >{option.title}
            </span>
          </label>
        {/each}
      </div>
    </div>

    <div class="py-4 border border-transparent">
      <div class="text-white">{generalSettings.controllerScaling.title}</div>
      <div class="text-white text-opacity-60 py-2">
        {generalSettings.controllerScaling.description}
      </div>
      <div class="flex flex-row w-full gap-y-1 gap-x-8 py-2">
        <input
          class="flex flex-grow accent-neutral-500"
          type="range"
          min="0.5"
          max="2.6"
          step="0.1"
          bind:value={$appSettings.persistant.size}
        />
        <button
          class="px-8 py-1 rounded bg-black bg-opacity-20 border border-black border-opacity-20 hover:bg-opacity-60"
          on:click={() => {
            $appSettings.persistant.size = 1.0;
          }}
          >Reset
        </button>
      </div>
    </div>

    <div class="py-4 border border-transparent">
      <div class="text-white">{generalSettings.welcomeScreen.title}</div>
      <div class="text-white text-opacity-60 py-2">
        {generalSettings.welcomeScreen.description}
      </div>
      <label
        class="bg-black bg-opacity-10 border border-black border-opacity-20 group flex text-white items-center cursor-pointer p-2"
      >
        <VCheckbox checkedState={$appSettings.persistant.welcomeOnStartup} />
        <input
          class="hidden"
          type="checkbox"
          bind:checked={$appSettings.persistant.welcomeOnStartup}
        />
        <div
          class="pl-2 text-white group-hover:text-opacity-100 {$appSettings
            .persistant.welcomeOnStartup
            ? 'text-opacity-100'
            : 'text-opacity-80'}"
        >
          {generalSettings.welcomeScreen.label}
        </div>
      </label>
    </div>

    <div class="py-4 border border-transparent">
      <div class="text-white">{generalSettings.runAppInBackground.title}</div>
      <div class="text-white text-opacity-60 py-2">
        {generalSettings.runAppInBackground.description}
      </div>
      <div class="text-white grid grid-flow-row gap-4 py-2">
        {#each generalSettings.runAppInBackground.options as option}
          <label
            class="bg-black bg-opacity-10 border border-black border-opacity-20 p-2 group cursor-pointer flex items-center"
          >
            <VRadioButton
              selectedState={$appSettings.persistant.alwaysRunInTheBackground ==
                option.value}
            />
            <input
              class="hidden"
              type="radio"
              name="scoops"
              value={option.value}
              bind:group={$appSettings.persistant.alwaysRunInTheBackground}
            />
            <span
              class="pl-2 text-white {$appSettings.persistant
                .alwaysRunInTheBackground == option.value
                ? 'text-opacity-100'
                : 'text-opacity-80'} group-hover:text-opacity-100"
              >{option.title}</span
            >
          </label>
        {/each}
      </div>
    </div>
  {/if}

  {#if activePreferenceMenu == PreferenceMenu.PRIVACY}
    <div class="py-4 border border-transparent">
      <div class="text-white">{privacySettings.requiredInformation.title}</div>
      <div class="py-2 text-white text-opacity-60">
        {privacySettings.requiredInformation.description}
      </div>
    </div>

    <div class="py-4 border border-transparent">
      <div class="text-white">{privacySettings.improveApp.title}</div>
      <div class="py-2 text-white text-opacity-60">
        {privacySettings.improveApp.description}
      </div>
      <label
        class="bg-black bg-opacity-10 border border-black border-opacity-20 p-2 group cursor-pointer flex items-center"
      >
        <VCheckbox checkedState={$appSettings.persistant.analyticsEnabled} />
        <input
          class="hidden"
          type="checkbox"
          bind:checked={$appSettings.persistant.analyticsEnabled}
        />
        <div
          class="pl-2 text-white {$appSettings.persistant.analyticsEnabled
            ? 'text-opacity-100'
            : 'text-opacity-80'}"
        >
          {privacySettings.improveApp.label}
        </div>
      </label>
    </div>
  {/if}

  {#if activePreferenceMenu == PreferenceMenu.USER_LIBRARY}
    <div class="py-4 border border-transparent">
      <div class="text-white">{userLibrarySettings.libraryLocation.title}</div>
      <div class="py-2 text-white text-opacity-60">
        {userLibrarySettings.libraryLocation.description}
      </div>
      <div class="text-white text-opacity-40 pt-2">Current selection</div>
      <div class="flex flex-row gap-4 py-2">
        <input
          disabled={true}
          class="flex px-2 text-white text-opacity-80 flex-grow bg-black bg-opacity-10 border border-black border-opacity-20"
          type="text"
          bind:value={$appSettings.persistant.profileFolder}
        />
        <button
          class="px-8 py-1 rounded bg-black bg-opacity-20 border border-black border-opacity-20 hover:bg-opacity-60 active:border-green-500"
          on:click={() => {
            selectDirectory();
          }}
          >Select Folder
        </button>
      </div>
      <div class="text-white text-opacity-40 py-2">
        Open grid-userdata folder to view the contents
      </div>
      <button
        class="px-8 py-1 rounded bg-black bg-opacity-20 border border-black border-opacity-20 hover:bg-opacity-60 active:border-green-500"
        on:click={() => {
          viewDirectory();
        }}
        >Open grid-userdata
      </button>
      <div class="text-white text-opacity-40 py-2">
        Reset folder selection to default
      </div>
      <button
        class="px-8 py-1 rounded bg-black bg-opacity-20 border border-black border-opacity-20 hover:bg-opacity-60 active:border-green-500"
        on:click={() => {
          resetDirectory();
        }}
        >Reset to default
      </button>
    </div>
  {/if}

  {#if activePreferenceMenu == PreferenceMenu.ADVANCED}
    <div class="border border-transparent py-4">
      <div class="text-white">{generalSettings.migrateProfiles.title}</div>
      <div class="text-white text-opacity-60 py-2">
        {generalSettings.migrateProfiles.description}
      </div>
      {#if !migrationComplete}
        <button
          class="px-8 py-1 rounded bg-black bg-opacity-20 border border-yellow-500 border-opacity-40 hover:bg-opacity-60"
          on:click={() => migrateProfiles()}
          >{generalSettings.migrateProfiles.label}
        </button>
      {:else}
        <button
          on:click={() => window.electron.restartApp()}
          class="px-8 py-1 rounded bg-emerald-700 text-white hover:bg-emerald-800 border border-emerald-500 focus:outline-none relative"
        >
          Reload app
        </button>
      {/if}
    </div>

    <div class="border border-yellow-500 p-4">
      <div class="text-white">{generalSettings.resetSettings.title}</div>
      <div class="text-white text-opacity-60 py-2">
        {generalSettings.resetSettings.description}
      </div>
      <button
        class="px-8 py-1 rounded bg-black bg-opacity-20 border border-yellow-500 border-opacity-40 hover:bg-opacity-60"
        on:click={() => {
          resetAppSettings();
        }}
        >{generalSettings.resetSettings.label}
      </button>
    </div>
  {/if}

  {#if activePreferenceMenu == PreferenceMenu.DEVELOPER}
    <div class="py-4 border border-transparent">
      <div class="text-white">{developerSettings.nvmDefrag.title}</div>
      <div class="text-white text-opacity-60 py-2">
        {developerSettings.nvmDefrag.description}
      </div>
      <button
        on:click={() => {
          instructions.sendNVMDefragToGrid();
        }}
        class="px-8 py-1 rounded bg-black bg-opacity-20 border border-black border-opacity-20 hover:bg-opacity-60"
      >
        {developerSettings.nvmDefrag.label}
      </button>
    </div>
    <div class="py-4 border border-transparent">
      <div class="text-white">{developerSettings.nvmErase.title}</div>
      <div class="text-white text-opacity-60 py-2">
        {developerSettings.nvmErase.description}
      </div>
      <button
        on:click={() => {
          instructions.sendNVMEraseToGrid();
        }}
        class="px-8 py-1 rounded bg-black bg-opacity-20 border border-black border-opacity-20 hover:bg-opacity-60"
      >
        {developerSettings.nvmErase.label}
      </button>
    </div>

    <div class="py-4 border border-transparent">
      <div class="text-white">
        {developerSettings.websocketMonitorEnabled.title}
      </div>
      <div class="text-white text-opacity-60 py-2">
        {developerSettings.websocketMonitorEnabled.description}
      </div>
      <label
        class="bg-black bg-opacity-10 border border-black border-opacity-20 p-2 group cursor-pointer flex items-center"
      >
        <VCheckbox
          checkedState={$appSettings.persistant.websocketMonitorEnabled}
        />
        <input
          class="hidden"
          type="checkbox"
          bind:checked={$appSettings.persistant.websocketMonitorEnabled}
        />
        <div
          class="pl-2 text-white {$appSettings.persistant
            .websocketMonitorEnabled
            ? 'text-opacity-100'
            : 'text-opacity-80'}"
        >
          {developerSettings.websocketMonitorEnabled.label}
        </div>
      </label>
    </div>

    <div class="py-4 border border-transparent">
      <div class="text-white">
        {developerSettings.portstateOverlayEnabled.title}
      </div>
      <div class="text-white text-opacity-60 py-2">
        {developerSettings.portstateOverlayEnabled.description}
      </div>
      <label
        class="bg-black bg-opacity-10 border border-black border-opacity-20 p-2 group cursor-pointer flex items-center"
      >
        <VCheckbox
          checkedState={$appSettings.persistant.portstateOverlayEnabled}
        />
        <input
          class="hidden"
          type="checkbox"
          bind:checked={$appSettings.persistant.portstateOverlayEnabled}
        />
        <div
          class="pl-2 text-white {$appSettings.persistant
            .portstateOverlayEnabled
            ? 'text-opacity-100'
            : 'text-opacity-80'}"
        >
          {developerSettings.portstateOverlayEnabled.label}
        </div>
      </label>
    </div>

    <div class="py-4 border border-transparent">
      <div class="text-white">
        {developerSettings.profileCloudUrl.title}
      </div>
      <div class="text-white text-opacity-60 py-2">
        {developerSettings.profileCloudUrl.description}
      </div>
      <div class="flex w-full py-2">
        <input
          class="flex px-2 py-2 text-white text-opacity-80 flex-grow bg-black bg-opacity-10 border border-black border-opacity-20 focus:border-green-500 focus:outline-none"
          type="text"
          bind:value={$appSettings.profileCloudUrl}
        />
      </div>
      <div class="text-white grid grid-flow-row gap-4 py-2">
        {#each developerSettings.profileCloudUrl.options as option}
          <label
            class="bg-black bg-opacity-10 border border-black border-opacity-20 p-2 group cursor-pointer flex items-center"
          >
            <VRadioButton
              selectedState={$appSettings.profileCloudUrl == option.value}
            />
            <input
              class="hidden"
              type="radio"
              name="profile-cloud-url"
              value={option.value}
              bind:group={$appSettings.profileCloudUrl}
            />
            <span
              class="pl-2 text-white {$appSettings.profileCloudUrl ==
              option.value
                ? 'text-opacity-100'
                : 'text-opacity-80'} group-hover:text-opacity-100"
              >{option.title}</span
            >
          </label>
        {/each}
      </div>
    </div>
  {/if}
</div>
