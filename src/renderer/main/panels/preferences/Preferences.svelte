<script lang="ts">
  import { configManager } from "./../configuration/Configuration.store.js";
  import { logger } from "./../../../runtime/runtime.store.js";
  import { get } from "svelte/store";
  import { instructions } from "../../../serialport/instructions";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { runtime } from "../../../runtime/runtime.store.js";

  import {
    BlockBody,
    BlockTitle,
    BlockRow,
    Block,
    MeltCheckbox,
    MeltRadio,
    MeltSlider,
    MeltSelect,
    MoltenButton,
    MoltenInput,
  } from "@intechstudio/grid-uikit";
  import { reduced_motion_store } from "../../../runtime/animations.js";
  const configuration = window.ctxProcess.configuration();

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
        s.persistent.profileFolder = selectDirectoryResult;
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
      get(appSettings).persistent.profileFolder
    );
  }

  async function resetDirectory() {
    let path = await window.electron.library.resetDirectory();
    appSettings.update((s) => {
      s.persistent.profileFolder = path;
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
        bind:target={$appSettings.persistent.moduleRotation}
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
          bind:target={$appSettings.persistent.size}
          min={0.5}
          max={2.6}
          step={0.1}
        />
        <MoltenButton
          title={"Reset"}
          click={() => {
            $appSettings.persistent.size = 1.0;
          }}
        />
      </BlockRow>
    </Block>

    <Block>
      <BlockTitle>Action Block Helpers</BlockTitle>
      <BlockBody
        >Composite action blocks have text helpers and Add buttons, that can be
        turned off to save space.</BlockBody
      >
      <MeltCheckbox
        bind:target={$appSettings.persistent.actionHelperText}
        title={"Enabled"}
      />
    </Block>

    <Block>
      <BlockTitle>Editable Block Names</BlockTitle>
      <BlockBody
        >Blocks can display custom names instead of the block names.</BlockBody
      >
      <MeltCheckbox
        bind:target={$appSettings.persistent.editableBlockNames}
        title={"Enabled"}
      />
    </Block>

    <Block>
      <BlockTitle>Animations</BlockTitle>
      <BlockBody
        >Transition animations can be disabled to improve usability and
        performance.</BlockBody
      >
      <MeltRadio
        bind:target={$appSettings.persistent.disableAnimations}
        options={[
          {
            title: `Auto (${
              $reduced_motion_store ? "Disabled" : "Enabled"
            } by OS)`,
            value: "auto",
          },
          {
            title: "Enabled",
            value: "enabled",
          },
          {
            title: "Disabled",
            value: "disabled",
          },
        ]}
      />
    </Block>

    <Block>
      <BlockTitle>Welcome screen</BlockTitle>
      <BlockBody
        >News and quick links are shown every time you launch Grid Editor.</BlockBody
      >
      <MeltCheckbox
        bind:target={$appSettings.persistent.welcomeOnStartup}
        title={"Show welcome screen"}
      />
    </Block>

    <Block>
      <BlockTitle>Run application in background</BlockTitle>
      <BlockBody>
        Change what happens when you close the application window. Some
        features, packages might only work when the application always runs.
      </BlockBody>
      <MeltRadio
        bind:target={$appSettings.persistent.alwaysRunInTheBackground}
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
        bind:target={$appSettings.persistent.analyticsEnabled}
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
          bind:target={$appSettings.persistent.profileFolder}
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
          instructions
            .sendNVMDefragToGrid()
            .then((res) => {})
            .catch((e) => {
              logger.set({
                type: "fail",
                mode: 0,
                classname: "engine-disabled",
                message: `Engine is disabled, NVM Defragmentation failed!`,
              });
            });
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
          logger.set({
            type: "progress",
            mode: 0,
            classname: "nvmerase",
            message: `Erasing all modules...`,
          });
          instructions
            .sendNVMEraseToGrid()
            .then((res) => {
              runtime.erase();
              configManager.refresh().then(() => {
                logger.set({
                  type: "success",
                  mode: 0,
                  classname: "nvmerase",
                  message: `Erase complete!`,
                });
              });
            })
            .catch((e) => {
              if (typeof e !== "undefined") {
                logger.set(e);
              } else {
                logger.set({
                  type: "alert",
                  mode: 0,
                  classname: "nvmerase",
                  message: `Retry erase all modules...`,
                });
              }
            });
        }}
      />
    </Block>

    <Block>
      <BlockTitle>Unreleased Virtual Modules</BlockTitle>
      <BlockBody>
        Enable/Disable adding unrelease virtual modules.
      </BlockBody>

      <MeltCheckbox
        bind:target={$appSettings.persistent.unreleasedVirtualModules}
        title={"Activate ulrelease modules"}
      />
    </Block>

    <Block>
      <BlockTitle>Websocket monitor</BlockTitle>
      <BlockBody>
        Enable/Disable the websocket monitor. This will show the websocket
        messages in the console and add the websocket panel.
      </BlockBody>

      <MeltCheckbox
        bind:target={$appSettings.persistent.websocketMonitorEnabled}
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
        bind:target={$appSettings.persistent.portstateOverlayEnabled}
        title={"Activate port sate overlay"}
      />
      <BlockTitle>writeBuffer state indicator</BlockTitle>
      <BlockBody>
        Enable/Disable the writeBuffer state indicator. This will show the
        buffer length in the middle panel.
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.writeBufferDebugEnabled}
        title={"writeBuffer debug state"}
      />
    </Block>

    <Block>
      <BlockTitle>Graph based debugging</BlockTitle>
      <BlockBody>Enable/Disable heartbeat debug graphs</BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.heartbeatDebugEnabled}
        title={"Activate heartbeat debugging"}
      />
      <BlockBody>Enable/Disable message ID debug graphs</BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.messageIdDebugEnabled}
        title={"Activate message ID debugging"}
      />
      <MeltCheckbox
        bind:target={$appSettings.persistent.sendHeartbeatImmediate}
        title={"Send heartbeat immediate"}
      />
    </Block>

    <Block>
      <BlockTitle>Show PCB</BlockTitle>
      <BlockBody>
        When selecting the system element of a module, it's underlaying PCB
        shows.
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.showPCB}
        title={"Enabled"}
      />
    </Block>

    <Block>
      <BlockTitle>Nightly Firmware Update</BlockTitle>
      <BlockBody>
        The Nightly Firmware version contains new, but potentially unstable
        features and fixes. We suggest always staying on a Stable Firmware!
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.nightlyFirmware}
        title={"Enabled"}
      />
    </Block>

    <Block>
      <BlockTitle>Colorful Toolbar</BlockTitle>
      <BlockBody>Display the colors of the toolbar button by default</BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.colorfulToolbar}
        title={"Enabled"}
      />
    </Block>

    <Block>
      <BlockTitle>Scale UI</BlockTitle>
      <BlockBody
        >Scales the font size and control elements dimensions by keeping their
        ratio compared to each other.</BlockBody
      >
      <BlockRow>
        <MeltSlider
          bind:target={$appSettings.persistent.fontSize}
          min={8}
          max={30}
          step={0.1}
        />
        <MoltenButton
          title={"Reset"}
          click={() => {
            $appSettings.persistent.fontSize = 12;
          }}
        />
      </BlockRow>
    </Block>

    <Block>
      <!-- Radio Select for profileCloudUrl -->

      <BlockTitle>Profile cloud URL</BlockTitle>
      <BlockBody>Change the url used in the Profile Cloud Iframe.</BlockBody>
      <MoltenInput bind:target={$appSettings.persistent.profileCloudUrl} />
      <MeltRadio
        bind:target={$appSettings.persistent.profileCloudUrl}
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

    <Block>
      <!-- Checkbox for packageDeveloper -->

      <BlockTitle>Package Developer Mode</BlockTitle>
      <BlockBody
        >Automatically restart the package manager process when files are
        changed inside the package folder</BlockBody
      >
      <MeltCheckbox
        bind:target={$appSettings.persistent.packageDeveloper}
        title={"Enabled"}
      />
    </Block>
  {/if}
</div>
