<script lang="ts">
  import { writable, get } from "svelte/store";
  import instructions from "../../../serialport/instructions";
  import { onMount, onDestroy } from "svelte";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { Analytics } from "../../../runtime/analytics.js";

  import MeltCheckbox from "./MeltCheckbox.svelte";
  import MeltRadio from "./MeltRadio.svelte";
  import MeltSlider from "./MeltSlider.svelte";
  import MeltSelect from "./MeltSelect.svelte";
  import MoltenButton from "./MoltenButton.svelte";
  import MoltenInput from "./MoltenInput.svelte";
  import BlockRow from "./BlockRow.svelte";
  import BlockTitle from "./BlockTitle.svelte";
  import BlockBody from "./BlockBody.svelte";
  import Block from "./Block.svelte";

  const configuration = window.ctxProcess.configuration();

  onMount(async () => {});

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

  async function viewDirectory() {
    await window.electron.library.viewDirectory(
      get(appSettings).persistant.profileFolder
    );
  }

  async function resetDirectory() {
    let path = await window.electron.library.resetDirectory();
    appSettings.update((s) => {
      s.persistant.profileFolder = path;
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
    DEVELOPER = "developer",
  }

  const menuItems = [
    { title: "General settings", value: PreferenceMenu.GENERAL },
    { title: "Privacy settings", value: PreferenceMenu.PRIVACY },
    { title: "User Library", value: PreferenceMenu.USER_LIBRARY },
    { title: "Developer settings", value: PreferenceMenu.DEVELOPER },
  ];

  let activePreferenceMenu = PreferenceMenu.GENERAL;
</script>

<div
  class="bg-primary flex flex-col h-full w-full text-white px-4 py-4 overflow-y-auto"
>
  <MeltSelect bind:target={activePreferenceMenu} options={menuItems} />

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
      <BlockRow>
        <MeltSlider
          bind:target={$appSettings.persistant.size}
          min={0.5}
          max={2.6}
          step={0.1}
        />
        <MoltenButton
          title={"Reset"}
          click={() => {
            $appSettings.persistant.size = 1.0;
          }}
        />
      </BlockRow>
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

    <Block border={"yellow-500"}>
      <BlockTitle>Reset settings</BlockTitle>
      <BlockBody>
        Reset all preferences settings to their default values. This will not
        affect your profiles or other data.
      </BlockBody>
      <MoltenButton
        title={"Reset application settings"}
        border={"yellow-500"}
        click={resetAppSettings}
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
      <MoltenButton
        title={"Open Privacy Policy"}
        click={handleOpenPolicyClicked}
      />
    </Block>
  {/if}

  {#if activePreferenceMenu == PreferenceMenu.USER_LIBRARY}
    <Block>
      <BlockTitle>Grid Editor user data folder</BlockTitle>
      <BlockBody>
        Local folder on your hard drive where local profiles, temporary
        downloads and other Editor related files are saved.
      </BlockBody>
      <BlockBody>Current selection</BlockBody>
      <BlockRow>
        <MoltenInput
          disabled={true}
          bind:target={$appSettings.persistant.profileFolder}
        />
        <MoltenButton title={"Select Folder"} click={selectDirectory} />
      </BlockRow>
      <BlockBody>Open user folder to view the contents</BlockBody>
      <MoltenButton title={"Open grid-userdata"} click={viewDirectory} />

      <BlockBody>Reset folder selection to default</BlockBody>
      <MoltenButton title={"Reset to default"} click={resetDirectory} />
    </Block>
  {/if}

  {#if activePreferenceMenu == PreferenceMenu.DEVELOPER}
    <Block>
      <BlockTitle>NVM Defrag</BlockTitle>
      <BlockBody>
        Defragment the NVM memory of the module. This will take some time.
      </BlockBody>
      <MoltenButton
        title={"Defrag"}
        click={() => {
          instructions.sendNVMDefragToGrid();
        }}
      />
    </Block>
    <Block>
      <BlockTitle>NVM Erase</BlockTitle>
      <BlockBody>
        Erase the NVM memory of the module. This will take some time.
      </BlockBody>
      <MoltenButton
        title={"Erase"}
        click={() => {
          instructions.sendNVMEraseToGrid();
        }}
      />
    </Block>

    <Block>
      <BlockTitle>Websocket monitor</BlockTitle>
      <BlockBody>
        Enable/Disable the websocket monitor. This will show the websocket
        messages in the console and add the websocket panel.
      </BlockBody>

      <MeltCheckbox
        bind:target={$appSettings.persistant.websocketMonitorEnabled}
        title={"Activate websocket monitor"}
      />
    </Block>

    <Block>
      <BlockTitle>Port state overlay</BlockTitle>
      <BlockBody>
        Enable/Disable the port state overlay. This will show the port state on
        the module.
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistant.portstateOverlayEnabled}
        title={"Activate port sate overlay"}
      />
    </Block>

    <Block>
      <!-- Radio Select for profileCloudUrl -->

      <BlockTitle>Profile cloud URL</BlockTitle>
      <BlockBody>Change the url used in the Profile Cloud Iframe.</BlockBody>
      <MoltenInput bind:target={$appSettings.profileCloudUrl} />
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
