<script lang="ts">
  import { GridModule, GridRuntime } from "./../../../runtime/runtime";
  import { ProfileCloud } from "./../../../runtime/string-table";
  import { onDestroy, onMount } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { ModuleOverlay, moduleOverlay } from "../../../runtime/moduleOverlay";

  import { Analytics } from "../../../runtime/analytics.js";

  import { get } from "svelte/store";

  import { logger } from "../../../runtime/runtime.store";
  import {
    user_input,
    UserInput,
    type UserInputValue,
  } from "./../../../runtime/user-input.store";

  import { selected_actions } from "./../../../runtime/selected-actions.store";

  import { authStore, AuthEnvironment } from "$lib/auth.store"; // this only changes if login, logout happens
  import { userStore } from "$lib/user.store";
  import { configLinkStore } from "$lib/configlink.store";
  import { Modal } from "../../modals/modal.store";
  import UserAuthenticationModal from "../../modals/user-authentication/UserAuthenticationModal.svelte";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { ElementType } from "@intechstudio/grid-protocol";
  import "@intechstudio/profile-cloud-webcomponent";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import {
    profile_cloud,
    ProfileCloudEvent,
    selectedConfigStore,
  } from "./ProfileCloud";
  import { Grid } from "../../../lib/_utils";
  import {
    fetchDirEntries,
    fetchFileContent,
    pageNumberToFolderPath,
    type DirEntry,
  } from "../FileManager/FileManager";

  const configuration = window.ctxProcess.configuration();

  $: profileCloudIsMounted && sendAuthEventToProfileCloud($authStore);

  $: sendConfigLinkToProfileCloud($configLinkStore);

  let runtime: GridRuntime;
  $: runtime = $runtime_manager.active.runtime;

  $: if ($runtime) {
    handleRuntimeChange(runtime);
  }

  function handleRuntimeChange(rt: GridRuntime) {
    const compatible = new Set([]);
    const ui = get(user_input);
    for (const module of rt.modules) {
      const elements = module.findPage(ui.pagenumber).control_elements;
      compatible.add(module.type);
      elements.forEach((e) => {
        compatible.add(e.type);
        if (e.type == ElementType.ENCODER) {
          compatible.add(ElementType.BUTTON);
        }
        if (e.type == ElementType.ENDLESS) {
          compatible.add(ElementType.BUTTON);
        }
      });
    }
    sendCompatibleTypes(Array.from(compatible));
  }

  function sendCompatibleTypes(types) {
    sendMessageToProfileCloud({
      messageType: "compatibleTypes",
      compatibleTypes: types,
    });
  }

  $: handleDataChange($user_input, $runtime_manager.active.runtime);

  function handleDataChange(ui: UserInputValue, rt: GridRuntime) {
    const module = rt.findModule(ui.dx, ui.dy);
    const element = rt.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
    );

    if (typeof module === "undefined" || typeof element === "undefined") {
      return;
    }

    sendSelectedComponentInfos(module.type, element.type);
  }

  let selectedModuleType = undefined;
  let selectedControlElementType = undefined;

  function channelMessageWrapper(event, func) {
    const channel = event.ports[0];
    if (channel) {
      channel.onmessage = (event) =>
        func(event)
          .then((res) => {
            channel.postMessage({ ok: true, data: res });
          })
          .catch((err) => {
            channel.postMessage({ ok: false, data: err });
          })
          .finally(() => {
            channel.close();
          });
    }
  }

  function sendConfigLinkToProfileCloud(storeValue) {
    sendMessageToProfileCloud({
      messageType: "configLink",
      configLinkId: storeValue.id,
    });
  }

  function sendSelectedComponentInfos(
    selectedModuleType,
    selectedControlElementType,
  ) {
    sendMessageToProfileCloud({
      messageType: "selectedComponentTypes",
      selectedComponentTypes: [selectedModuleType, selectedControlElementType],
    });
  }

  function sendAuthEventToProfileCloud(authEvent) {
    if (!authEvent) return;

    // the authStore should contain an event!
    if (!authEvent.event) return;

    sendMessageToProfileCloud({
      messageType: "userAuthentication",
      authEvent: authEvent,
    });
  }

  function sendLocalConfigs(configs) {
    sendMessageToProfileCloud({
      messageType: "localConfigs",
      configs,
    });
  }

  async function handleLoginToProfileCloud(event) {
    new Modal.Window(UserAuthenticationModal).show();
  }

  async function handleCreateCloudConfigLink(event) {
    return await navigator.clipboard.writeText(event.data.configLinkUrl);
  }

  async function handleLogoutFromProfileCloud(event) {
    return await authStore.logout();
  }

  async function handleSubmitAnalytics(event) {
    const { payload, eventName } = event.data;
    Analytics.track({
      event: eventName,
      payload: payload,
      mandatory: false,
    });
    return;
  }

  async function handleProvideSelectedConfigForEditor(event: any) {
    const { config } = event.data;

    selectedConfigStore.set(config);

    switch (config?.configType) {
      case "profile": {
        moduleOverlay.show(ModuleOverlay.Types.PROFILE_LOAD);
        break;
      }
      case "preset": {
        moduleOverlay.show(ModuleOverlay.Types.PRESET_LOAD);
        break;
      }
      default: {
        moduleOverlay.close();
        break;
      }
    }
  }

  async function handleDeleteLocalConfig(event) {
    const path = $appSettings.persistent.profileFolder;
    const config = event.data?.config;

    return await window.electron.configs.deleteConfig(path, "configs", config);
  }

  async function handleGetCurrentConfigurationFromEditor(event): Promise<any> {
    const active = get(runtime_manager).active.runtime;
    if (active.modules.length === 0) {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "profileclouderror",
        message: ProfileCloud.ErrorText.NO_DEVICE,
      });
      return Promise.reject(ProfileCloud.ErrorText.NO_DEVICE);
    }

    const ui: UserInput = get(user_input);
    const configType = event.data.configType;
    const id = uuidv4();

    let config: any = {
      name: undefined,
      id: id,
      description: "Click here to add description",
      configType: configType, // differentiator from different JSON files!
      version: {
        major: $appSettings.version.major,
        minor: $appSettings.version.minor,
        patch: $appSettings.version.patch,
      },
      localId: id,
    };

    switch (configType) {
      case "profile": {
        const page = runtime.findPage(ui.dx, ui.dy, ui.pagenumber);
        await page.load();

        if (!page.isValid()) {
          return Promise.reject(ProfileCloud.ErrorText.SYNTAX_ERROR);
        }

        // Get files from the selected module, under given page folder. NO recursion / traversal.
        const pageFolderPath = pageNumberToFolderPath(ui.pagenumber);
        const activeModule = active.findModule(ui.dx, ui.dy);
        let fileEntries: DirEntry[] = [];
        try {
          fileEntries = await fetchDirEntries(pageFolderPath, activeModule);
        } catch {
          // Directory doesn't exist yet — nothing to include
        }
        const files: { name: string; content: string }[] = [];

        for (const entry of fileEntries) {
          if (entry.type !== "file") {
            continue;
          }
          const content = await fetchFileContent(
            `${pageFolderPath}${entry.name}`,
            activeModule,
            512,
          );
          files.push({
            name: entry.name,
            content,
          });
        }

        config.type = (page.parent as GridModule).type;
        config.configs = page.control_elements.map((element) => {
          return {
            controlElementNumber: element.elementIndex,
            events: element.events.map((ev) => {
              return {
                event: ev.type,
                config: ev.toLua(),
              };
            }),
          };
        });
        config.files = files;
        config.name = `New ${config.type} config`;
        break;
      }
      case "preset": {
        const element = runtime.findElement(
          ui.dx,
          ui.dy,
          ui.pagenumber,
          ui.elementnumber,
        );
        await element.load();

        if (!element.isValid()) {
          return Promise.reject(ProfileCloud.ErrorText.SYNTAX_ERROR);
        }

        config.type = element.type;
        config.configs = {
          events: element.events.map((ev) => {
            return {
              event: ev.type,
              config: ev.toLua(),
            };
          }),
        };
        config.name = `New ${config.type} config`;
        break;
      }

      case "snippet": {
        const selected = get(selected_actions);
        if (selected.some((e) => !e.isValid())) {
          return Promise.reject(ProfileCloud.ErrorText.SYNTAX_ERROR);
        }
        if (selected.length === 0) {
          logger.set({
            type: "fail",
            mode: 0,
            classname: "profileclouderror",
            message: ProfileCloud.ErrorText.EMPTY_SNIPPET,
          });
          return Promise.reject(ProfileCloud.ErrorText.EMPTY_SNIPPET);
        }

        const script = selected.map((e) => e.toLua()).join("");

        config.type = "snippet";
        config.configs = script;
        config.name = `New Snippet`;
        break;
      }
    }

    return Promise.resolve(config);
  }

  let profileCloudIsMounted = false;
  async function handleProfileCloudMounted(event) {
    profileCloudIsMounted = true;
    let authEnvironment = AuthEnvironment.PRODUCTION;
    if (event.data.environment !== "production") {
      authEnvironment = AuthEnvironment.DEVELOPMENT;
    }
    authStore.setCurrentAuthEnvironment(authEnvironment);
    if (
      selectedModuleType !== undefined ||
      selectedControlElementType !== undefined
    ) {
      sendSelectedComponentInfos(
        selectedModuleType,
        selectedControlElementType,
      );
    }
    const path = $appSettings.persistent.profileFolder;
    window.electron.configs.onSendConfigsToRenderer((_event, configs) => {
      sendLocalConfigs(configs);
    });
    window.electron.configs.startConfigsWatch(path, "configs");
    return configuration.EDITOR_VERSION;
  }

  async function handleImportConfig(event) {
    const path = $appSettings.persistent.profileFolder;
    const config = event.data;
    const importName = config.name;

    return window.electron.configs.saveConfig(path, "configs", config);
  }

  async function handleSendLogMessage(event) {
    const logData = event.data;
    logger.set(logData);
  }

  async function handleOpenExternalLink(event) {
    const { link } = event.data;
    Grid.Link.openExternalLink(link);
  }

  function initChannelCommunication(event) {
    if (event.ports && event.ports.length) {
      switch (event.data) {
        case "profileCloudMounted":
          channelMessageWrapper(event, handleProfileCloudMounted);
          break;
        case "configImportCommunication":
          channelMessageWrapper(event, handleImportConfig);
          break;
        case "deleteLocalConfig":
          channelMessageWrapper(event, handleDeleteLocalConfig);
          break;
        case "getCurrenConfigurationFromEditor":
          channelMessageWrapper(event, handleGetCurrentConfigurationFromEditor);
          break;
        case "loginToProfileCloud":
          channelMessageWrapper(event, handleLoginToProfileCloud);
          break;
        case "logoutFromProfileCloud":
          channelMessageWrapper(event, handleLogoutFromProfileCloud);
          break;
        case "createCloudConfigLink":
          channelMessageWrapper(event, handleCreateCloudConfigLink);
          break;
        case "submitAnalytics":
          channelMessageWrapper(event, handleSubmitAnalytics);
          break;
        case "provideSelectedConfigForEditor":
          channelMessageWrapper(event, handleProvideSelectedConfigForEditor);
          break;
        case "sendLogMessage":
          channelMessageWrapper(event, handleSendLogMessage);
          break;
        case "openExternalLink":
          channelMessageWrapper(event, handleOpenExternalLink);
          break;

        case "configDragChange":
          channelMessageWrapper(
            event,
            ProfileCloudEvent.handleConfigDragChange,
          );
          break;
        case "showOverlay":
        //channelMessageWrapper(event, ProfileCloudEvent.handleShowOverlay);
      }
    }
  }

  let listenerRegistered = false;
  let profileCloudUrl = "";
  let offlineMode = false;
  let profileCloudWebComponentName = undefined;

  $: if (
    listenerRegistered === true &&
    (profileCloudUrl !== $appSettings.persistent.profileCloudUrl || offlineMode)
  ) {
    // listenerRegistered variable makes sure that the webcomponent loading is after registering the listener.
    // otherwise handleProfileCloudMounted might be missed and offline fallback is displayed
    if (profileCloudUrl !== $appSettings.persistent.profileCloudUrl) {
      offlineMode = false;
      profileCloudUrl = $appSettings.persistent.profileCloudUrl;
      profileCloudIsMounted = false;
      profileCloudWebComponentName = undefined;
    }

    let fixedUrl = profileCloudUrl;
    if (!fixedUrl.endsWith(".js")) {
      if (fixedUrl.endsWith("/")) {
        fixedUrl = `${fixedUrl}wc/components.js`;
      } else {
        fixedUrl = `${fixedUrl}/wc/components.js`;
      }
    }
    if (profileCloudUrl === configuration.PROFILE_CLOUD_URL_LOCAL) {
      fixedUrl = `package://v${new Date().getTime()}/${configuration.PROFILE_CLOUD_URL_LOCAL.substring(
        "package://".length,
      )}/wc/components.js`;
    }
    if (offlineMode) {
      profileCloudWebComponentName = "profile-cloud-offline";
    } else {
      import(/* @vite-ignore */ fixedUrl)
        .then(() => {
          if (profileCloudUrl === configuration.PROFILE_CLOUD_URL_DEV) {
            profileCloudWebComponentName = "profile-cloud-nightly";
          } else if (
            profileCloudUrl === configuration.PROFILE_CLOUD_URL_LOCAL
          ) {
            profileCloudWebComponentName = "profile-cloud-dev";
          } else if (profileCloudUrl.includes("profile-cloud-dev--pr")) {
            profileCloudWebComponentName = "profile-cloud-pr";
          } else {
            profileCloudWebComponentName = "profile-cloud-prod";
          }
        })
        .catch((e) => {
          profileCloudWebComponentName = "profile-cloud-prod";
          console.warn(e);
        });
    }
  }

  onMount(async () => {
    // get to know the user
    await userStore.known;
    console.log(
      `Profile Cloud url: ${$appSettings.persistent.profileCloudUrl} (status: ${profileCloudIsMounted})`,
    );
    window.addEventListener("message", initChannelCommunication);
    listenerRegistered = true;
  });

  onDestroy(() => {
    window.removeEventListener("message", initChannelCommunication);
    if (
      [
        ModuleOverlay.Types.PROFILE_LOAD,
        ModuleOverlay.Types.PRESET_LOAD,
      ].includes(get(moduleOverlay))
    ) {
      moduleOverlay.close();
    }
    selectedConfigStore.set(undefined);
    window.electron.configs.stopConfigsWatch();
  });

  let error = {
    type: "default",
    title: "Sorry, can't load Profile Cloud",
    text: "You need internet access to load it. You can load the offline version as well.",
  };

  function sendMessageToProfileCloud(message) {
    profile_cloud.sendMessage(message);
  }

  function handleMouseOut(e) {
    //Removed due to textArea losing focus when in edit mode
    //window.focus();
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div class="flex flex-col w-full h-full relative">
  {#if !profileCloudIsMounted}
    <div class="flex items-center justify-center h-full absolute">
      <div class="p-4">
        <h1 class="text-white text-xl">{error.title}</h1>
        <div class="text-white text-opacity-80 mb-2">
          {error.text}
        </div>
        {#if error.type === "default"}
          <MoltenPushButton
            click={() => {
              offlineMode = true;
            }}
            text="Load Offline"
          />
        {/if}
      </div>
    </div>
  {/if}
  {#if profileCloudWebComponentName}
    {#key profileCloudWebComponentName == "profile-cloud-dev" ? $appSettings.packageComponentKeys["profile-cloud"] : true}
      <svelte:element
        this={profileCloudWebComponentName}
        class="w-full h-full"
      />
    {/key}
  {/if}
</div>
