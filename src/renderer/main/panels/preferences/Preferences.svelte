<script lang="ts">
  import { engine, logger } from "../../../runtime/runtime.store.js";
  import { writable, get } from "svelte/store";

  import instructions from "../../../serialport/instructions";

  import { onMount, onDestroy } from "svelte";

  import { appSettings } from "../../../runtime/app-helper.store";

  import { Analytics } from "../../../runtime/analytics.js";
  import VRadioButton from "./VRadioButton.svelte";
  import VCheckbox from "./VCheckbox.svelte";

  import MeltCheckbox from "./MeltCheckbox.svelte";
  import MeltRadio from "./MeltRadio.svelte";
  import MeltSlider from "./MeltSlider.svelte";
  import BlockTitle from "./BlockTitle.svelte";
  import BlockBody from "./BlockBody.svelte";
  import Block from "./Block.svelte";

  const configuration = window.ctxProcess.configuration();

  onMount(async () => {});

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
    <Block>
      <BlockTitle>Control surface rotation</BlockTitle>
      <BlockBody>
        Changes how the controllers are rotated in Grid Editor. Useful when the
        plugged-in module is rotated.
      </BlockBody>
      <MeltRadio
        bind:target={$appSettings.persistant.moduleRotation}
        orientation={"horizontal"}
        options={[
          { title: "0°", value: 0 },
          { title: "90°", value: 90 },
          { title: "180°", value: 180 },
          { title: "270°", value: 270 },
        ]}
      />
    </Block>

    <Block>
      <BlockTitle>Controller scaling</BlockTitle>
      <BlockBody>Size of the controllers in the application.</BlockBody>
      <div class="flex flex-row w-full gap-y-1 gap-x-8 py-2">
        <MeltSlider
          bind:target={$appSettings.persistant.size}
          min={0.5}
          max={2.6}
          step={0.1}
        />
        <button
          class="px-8 py-1 rounded bg-black bg-opacity-20 border border-black border-opacity-20 hover:bg-opacity-60"
          on:click={() => {
            $appSettings.persistant.size = 1.0;
          }}
          >Reset
        </button>
      </div>
    </Block>
    <Block>
      <BlockTitle>Welcome screen</BlockTitle>
      <BlockBody
        >News and quick links are shown every time you launch Grid Editor.</BlockBody
      >
      <MeltCheckbox
        bind:target={$appSettings.persistant.welcomeOnStartup}
        title={"Show welcome screen"}
      />
    </Block>

    <Block>
      <BlockTitle>Run application in background</BlockTitle>
      <BlockBody>
        Change what happens when you close the application window. Some
        features, plugins might only work when the application always runs.
      </BlockBody>
      <MeltRadio
        bind:target={$appSettings.persistant.alwaysRunInTheBackground}
        options={[
          {
            title: "Keep the application running on the tray or dock",
            value: true,
          },
          {
            title: "On close, quit the application",
            value: false,
          },
        ]}
      />
    </Block>
  {/if}

  {#if activePreferenceMenu == PreferenceMenu.PRIVACY}
    <Block>
      <BlockTitle>Use data to make Editor work</BlockTitle>
      <BlockBody>
        We process anonymized logs and errors the application produces to
        promptly respond to failing services. This analytics data is
        automatically captured when Editor has access to the internet.
      </BlockBody>
    </Block>
    <Block>
      <BlockTitle>Use data to improve Editor</BlockTitle>
      <BlockBody>
        Using your interactions with the Editor software we can get insight how
        the software is being used and we can continue improving it.
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistant.analyticsEnabled}
        title={"Track interaction with the Editor application"}
      />
    </Block>

    <Block>
      <button
        on:click={handleOpenPolicyClicked}
        class="text-white text-opacity-60 underline"
      >
        Open Privacy Policy
      </button>
    </Block>
  {/if}

  {#if activePreferenceMenu == PreferenceMenu.USER_LIBRARY}
    <Block>
      <BlockTitle>Grid Editor user data folder</BlockTitle>
      <BlockBody>
        Local folder on your hard drive where local profiles, temporary
        downloads and other Editor related files are saved.
      </BlockBody>
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
    </Block>
  {/if}

  {#if activePreferenceMenu == PreferenceMenu.ADVANCED}
    <Block>
      <BlockTitle>Convert profiles to new format</BlockTitle>
      <BlockBody>
        Before migration, it's safest to archive (.zip) your grid-userdata!
        After v1.2.35, we introduced Profile Cloud. Moving forward, we will
        develop this feature. To move your profiles to the new format, click the
        button below.
      </BlockBody>
      {#if !migrationComplete}
        <button
          class="px-8 py-1 rounded bg-black bg-opacity-20 border border-yellow-500 border-opacity-40 hover:bg-opacity-60"
          on:click={() => migrateProfiles()}
          >Migrate profiles
        </button>
      {:else}
        <button
          on:click={() => window.electron.restartApp()}
          class="px-8 py-1 rounded bg-emerald-700 text-white hover:bg-emerald-800 border border-emerald-500 focus:outline-none relative"
        >
          Reload app
        </button>
      {/if}
    </Block>

    <Block border={"yellow-500"}>
      <BlockTitle>Reset settings</BlockTitle>
      <BlockBody>
        Reset all preferences settings to their default values. This will not
        affect your profiles or other data.
      </BlockBody>
      <button
        class="px-8 py-1 rounded bg-black bg-opacity-20 border border-yellow-500 border-opacity-40 hover:bg-opacity-60"
        on:click={() => {
          resetAppSettings();
        }}
        >Reset application settings
      </button>
    </Block>
  {/if}

  {#if activePreferenceMenu == PreferenceMenu.DEVELOPER}
    <Block>
      <div class="text-white">NVM Defrag</div>
      <div class="text-white text-opacity-60 py-2">
        Defragment the NVM memory of the module. This will take some time.
      </div>
      <button
        on:click={() => {
          instructions.sendNVMDefragToGrid();
        }}
        disabled={$engine != "ENABLED"}
        class="{$engine == 'ENABLED'
          ? ''
          : 'opacity-75'} px-8 py-1 rounded bg-black bg-opacity-20 border border-black border-opacity-20 hover:bg-opacity-60"
      >
        Defrag
      </button>
    </Block>
    <Block>
      <div class="text-white">NVM Erase</div>
      <div class="text-white text-opacity-60 py-2">
        Erase the NVM memory of the module. This will take some time.
      </div>
      <button
        on:click={() => {
          instructions.sendNVMEraseToGrid();
        }}
        disabled={$engine != "ENABLED"}
        class="{$engine == 'ENABLED'
          ? ''
          : 'opacity-75'} px-8 py-1 rounded bg-black bg-opacity-20 border border-black border-opacity-20 hover:bg-opacity-60"
      >
        Erase
      </button>
    </Block>

    <Block>
      <div class="text-white">Websocket monitor</div>
      <div class="text-white text-opacity-60 py-2">
        Enable/Disable the websocket monitor. This will show the websocket
        messages in the console and add the websocket panel.
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
          Activate websocket monitor
        </div>
      </label>
    </Block>

    <Block>
      <div class="text-white">Port state overlay</div>
      <div class="text-white text-opacity-60 py-2">
        Enable/Disable the port state overlay. This will show the port state on
        the module.
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
          Activate port sate overlay
        </div>
      </label>
    </Block>

    <Block>
      <!-- Radio Select for profileCloudUrl -->

      <BlockTitle>Profile cloud URL</BlockTitle>
      <BlockBody>Change the url used in the Profile Cloud Iframe.</BlockBody>

      <div class="flex w-full">
        <input
          class="flex px-2 py-2 text-white text-opacity-80 flex-grow bg-black bg-opacity-10 border border-black border-opacity-20 focus:border-green-500 focus:outline-none"
          bind:value={$appSettings.profileCloudUrl}
        />
      </div>

      <MeltRadio
        bind:target={$appSettings.profileCloudUrl}
        options={[
          {
            title: "Development (localhost)",
            value: configuration.PROFILE_CLOUD_URL_LOCAL,
          },
          {
            title: "Nightly (profile-cloud-dev)",
            value: configuration.PROFILE_CLOUD_URL_DEV,
          },
          {
            title: "Production (profile-cloud)",
            value: configuration.PROFILE_CLOUD_URL_PROD,
          },
        ]}
      />
    </Block>
  {/if}
</div>
