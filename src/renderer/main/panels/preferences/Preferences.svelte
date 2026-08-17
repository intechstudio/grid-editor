<script lang="ts">
  import { get } from "svelte/store";
  import { appSettings } from "../../../runtime/app-helper.store";

  import {
    BlockBody,
    BlockTitle,
    BlockRow,
    Block,
    MeltCheckbox,
    MeltRadio,
    MeltSlider,
    MeltSelect,
    MoltenPushButton,
    MoltenInput,
  } from "@intechstudio/grid-uikit";
  import { reduced_motion_store } from "../../../runtime/animations.js";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import { Grid } from "../../../lib/_utils";
  const configuration = window.ctxProcess.configuration();

  // "Open hidden in the tray" only works reliably on Windows. macOS has no tray
  // (only the dock) and many Linux desktops (e.g. GNOME/Wayland) have no system
  // tray at all, where hiding the window would leave the app unreachable. Show
  // the option everywhere but disable it off Windows so users can see it exists.
  const startupWindowStateOptions = [
    { title: "Open in a normal window", value: "normal" },
    { title: "Open minimized to the taskbar", value: "taskbar" },
    {
      title: "Open hidden in the tray (Windows only)",
      value: "tray",
      disabled: window.ctxProcess.platform() !== "win32",
    },
  ];

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
      get(appSettings).persistent.profileFolder,
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
      configuration.DOCUMENTATION_ANALYTICS_POLICY_URL,
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

<div class="flex flex-col h-full w-full px-0 py-2 overflow-y-auto">
  <Block>
    <MeltSelect
      bind:target={activePreferenceMenu}
      options={menuItems}
      disabled={false}
    /><span></span>
  </Block>
  {#if activePreferenceMenu == PreferenceMenu.GENERAL}
    <Block>
      <BlockTitle>Color Theme</BlockTitle>
      <MeltRadio
        bind:target={$appSettings.persistent.theme}
        orientation={"horizontal"}
        options={[
          { title: "Dark", value: "dark" },
          { title: "Moss", value: "moss" },
          { title: "Sunset", value: "sunset" },
          { title: "Icy", value: "icy" },
        ]}
      />

      <BlockTitle>Control surface rotation</BlockTitle>
      <BlockBody>
        Changes how the controllers are rotated in Grid Editor. Useful when the
        plugged-in module is rotated.
      </BlockBody>
      <MeltRadio
        bind:target={$appSettings.persistent.moduleRotation}
        orientation={"horizontal"}
        options={[
          { title: "0°", value: Grid.Rotation.R0 },
          { title: "90°", value: Grid.Rotation.R90 },
          { title: "180°", value: Grid.Rotation.R180 },
          { title: "270°", value: Grid.Rotation.R270 },
        ]}
      />

      <BlockTitle>Controller scaling</BlockTitle>
      <BlockBody>Size of the controllers in the application.</BlockBody>
      <BlockRow>
        <MeltSlider
          bind:target={$appSettings.persistent.size}
          min={$appSettings.minSize}
          max={$appSettings.maxSize}
          step={$appSettings.stepSize}
        />
        <MoltenPushButton
          text="Reset"
          style="normal"
          click={() => {
            $appSettings.persistent.size = $appSettings.defaultSize;
          }}
        />
      </BlockRow>

      <BlockTitle>Action Block Helpers</BlockTitle>
      <BlockBody
        >Composite action blocks have text helpers and Add buttons, that can be
        turned off to save space.</BlockBody
      >
      <MeltCheckbox
        bind:target={$appSettings.persistent.actionHelperText}
        title={"Enabled"}
      />

      <BlockTitle>Colorful Toolbar</BlockTitle>
      <BlockBody>Display the colors of the toolbar button by default</BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.colorfulToolbar}
        title={"Enabled"}
      />

      <BlockTitle>Scale UI</BlockTitle>
      <BlockBody
        >Scales the font size and control elements dimensions by keeping their
        ratio compared to each other.</BlockBody
      >
      <BlockRow>
        <MeltSlider
          bind:target={$appSettings.persistent.fontSize}
          min={8}
          max={36}
          step={0.1}
        />
        <MoltenPushButton
          text="Reset"
          style="normal"
          click={() => {
            $appSettings.persistent.fontSize = 12;
          }}
        />
      </BlockRow>

      <BlockTitle>Code Editor height</BlockTitle>
      <BlockBody>
        Sets the default height of inline code editors. Larger values show more
        lines before the editor starts scrolling.
      </BlockBody>
      <BlockRow>
        <MoltenInput
          bind:target={$appSettings.persistent.codeEditorDefaultLines}
          type="number"
          min={3}
          max={20}
          step={1}
        />
        <MoltenPushButton
          text="Reset"
          style="normal"
          click={() => {
            $appSettings.persistent.codeEditorDefaultLines = 7;
          }}
        />
      </BlockRow>

      <BlockTitle>Show PCB</BlockTitle>
      <BlockBody>
        When selecting the system element of a module, it's underlaying PCB
        shows.
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.showPCB}
        title={"Enabled"}
      />

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

      <BlockTitle>Welcome screen</BlockTitle>
      <BlockBody
        >News and quick links are shown every time you launch Grid Editor.</BlockBody
      >
      <MeltCheckbox
        bind:target={$appSettings.persistent.welcomeOnStartup}
        title={"Show welcome screen"}
      />

      <BlockTitle>Automatic update check</BlockTitle>
      <BlockBody>Disable update checks on startup.</BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.disableAutoUpdate}
        title={"Disable automatic update checks"}
      />

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

      <BlockTitle>Startup window state</BlockTitle>
      <BlockBody>
        Choose how the window appears when Grid Editor launches. Useful when the
        editor starts automatically with your system.
      </BlockBody>
      <MeltRadio
        bind:target={$appSettings.persistent.startupWindowState}
        options={startupWindowStateOptions}
      />
    </Block>

    <Block border={"orange"}>
      <BlockTitle>Reset settings</BlockTitle>
      <BlockBody>
        Reset all preferences settings to their default values. This will not
        affect your profiles or other data.
      </BlockBody>
      <MoltenPushButton
        text="Reset application settings"
        style="outlined"
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

      <BlockTitle>Use data to improve Editor</BlockTitle>
      <BlockBody>
        Using your interactions with the Editor software we can get insight how
        the software is being used and we can continue improving it.
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.analyticsEnabled}
        title={"Track interaction with the Editor application"}
      />
      <MoltenPushButton
        text="Open Privacy Policy"
        style="normal"
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
        <MoltenPushButton
          text="Select Folder"
          style="normal"
          click={selectDirectory}
        />
      </BlockRow>
      <BlockBody>Open user folder to view the contents</BlockBody>
      <MoltenPushButton
        text="Open grid-userdata"
        style="normal"
        click={viewDirectory}
      />

      <BlockBody>Reset folder selection to default</BlockBody>
      <MoltenPushButton
        text="Reset to default"
        style="normal"
        click={resetDirectory}
      />
    </Block>
  {/if}

  {#if activePreferenceMenu == PreferenceMenu.DEVELOPER}
    <Block>
      <BlockTitle>Enable events loaded</BlockTitle>
      <BlockBody
        >Display on modules the number of events that are loaded and synced with
        editor.</BlockBody
      >
      <MeltCheckbox
        bind:target={$appSettings.persistent.eventsLoaded}
        title={"Enabled"}
      />
      <BlockTitle>Multi Event View</BlockTitle>
      <BlockBody
        >This feature allows editing all events of a Grid control element. Once
        enabled, resize the configuration panel to create enough space, and all
        events will be displayed side by side for editing.
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.multiViewEnabled}
        title={"Enabled"}
      />
      <BlockTitle>NVM Erase</BlockTitle>
      <BlockBody>
        Erase the NVM memory of the module. This will take some time.
      </BlockBody>
      <MoltenPushButton
        text="Erase"
        style="normal"
        click={() => {
          runtime_manager.NVMErase();
        }}
      />
      <BlockTitle>Unreleased Virtual Modules</BlockTitle>
      <BlockBody>Enable/Disable adding unrelease virtual modules.</BlockBody>

      <MeltCheckbox
        bind:target={$appSettings.persistent.unreleasedVirtualModules}
        title={"Activate unreleased modules"}
      />
      <BlockTitle>Unreleased Action Blocks</BlockTitle>
      <BlockBody>Enable/Disable adding unrelease action blocks.</BlockBody>

      <MeltCheckbox
        bind:target={$appSettings.persistent.allowDevBlocks}
        title={"Enabled"}
      />

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
      <BlockTitle>Console Error Overlay</BlockTitle>
      <BlockBody>
        Mirror console.error output into an on-screen overlay bar.
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.consoleErrorOverlayEnabled}
        title={"Enabled"}
      />

      <BlockTitle>Send heartbeat immediate</BlockTitle>
      <BlockBody>
        Skip the heartbeat delay and send it as soon as it's queued.
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.sendHeartbeatImmediate}
        title={"Enabled"}
      />
      <BlockTitle>Nightly Firmware Update</BlockTitle>
      <BlockBody>
        The Nightly Firmware version contains new, but potentially unstable
        features and fixes. We suggest staying on a Stable Firmware!
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.nightlyFirmware}
        title={"Enabled"}
      />
      <BlockTitle>Nightly Editor Update</BlockTitle>
      <BlockBody>
        The Nightly Editor version contains new, but potentially unstable
        features and fixes. We suggest staying on a Stable Editor version!
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.nightlyEditor}
        title={"Enabled"}
      />

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

      <!-- Checkbox for packageDeveloper -->

      <BlockTitle>Package Developer Mode</BlockTitle>
      <BlockBody>
        Starts a developer websocket in Editor allowing hot reload functionality
        for packages.
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.packageDeveloper}
        title={"Enabled"}
      />

      <BlockTitle>Midi Tester</BlockTitle>
      <BlockBody>
        Enables the WebMIDI based MIDI tester panel in MIDI Monitor.
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.midiTesterEnabled}
        title={"Enabled"}
      />

      <BlockTitle>WebSocket Notification Bar</BlockTitle>
      <BlockBody>
        Enables the WebSocket notification bar for connecting to external
        devices.
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.websocketNotificationEnabled}
        title={"Enabled"}
      />

      <BlockTitle>Variant Label</BlockTitle>
      <BlockBody>
        Display a variant label (e.g. "Center", "Smooth") on modules that have a
        hardware variant identifier.
      </BlockBody>
      <MeltCheckbox
        bind:target={$appSettings.persistent.variantLabelEnabled}
        title={"Enabled"}
      />
    </Block>
  {/if}
</div>
