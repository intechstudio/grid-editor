<script lang="ts">
  import { GridElement } from "./../../../runtime/runtime";
  import { onDestroy, onMount } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import { appSettings } from "../../../runtime/app-helper.store";
  import {
    moduleOverlay,
    ModuleOverlayType,
  } from "../../../runtime/moduleOverlay";

  import { Analytics } from "../../../runtime/analytics.js";

  import { get } from "svelte/store";

  import { logger, runtime, user_input } from "../../../runtime/runtime.store";

  import { authStore, AuthEnvironment } from "$lib/auth.store"; // this only changes if login, logout happens
  import { userStore } from "$lib/user.store";
  import { configLinkStore } from "$lib/configlink.store";
  import { selectedConfigStore } from "../../../runtime/config-helper.store";
  import { modal } from "../../modals/modal.store";
  import UserLogin from "../../modals/UserLogin.svelte";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  const configuration = window.ctxProcess.configuration();
  const buildVariables = window.ctxProcess.buildVariables();

  let iframe_element;

  $: profileCloudIsMounted && sendAuthEventToIframe($authStore);

  $: sendConfigLinkToIframe($configLinkStore);

  $: handleRuntimeChange($runtime);

  function handleRuntimeChange(rt) {
    const compatible = new Set([]);
    for (const module of rt.modules) {
      const elements = module.pages[0].control_elements.map((e) => e.type);
      compatible.add(module.type);
      elements.forEach((item) => compatible.add(item));
    }
    sendCompatibleTypes(Array.from(compatible));
  }

  function sendCompatibleTypes(types) {
    if (iframe_element == undefined) return;

    iframe_element.contentWindow.postMessage(
      {
        messageType: "compatibleTypes",
        compatibleTypes: types,
      },
      "*"
    );
  }

  $: handleUserInputChange($user_input);

  function handleUserInputChange(ui) {
    const target = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );

    if (typeof target === "undefined") {
      return;
    }

    selectedModuleType = runtime.modules.find(
      (device) => device.dx == ui.dx && device.dy == ui.dy
    ).type;
    selectedControlElementType = target.type;
    sendSelectedComponentInfos(selectedModuleType, selectedControlElementType);
  }

  let selectedModuleType = undefined;
  let selectedControlElementType = undefined;

  function channelMessageWrapper(event, func) {
    const channel = event.ports[0];
    if (channel) {
      channel.onmessage = (event) =>
        func(event)
          .then((res) => {
            console.log(func.name);
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

  function sendConfigLinkToIframe(storeValue) {
    if (iframe_element == undefined) return;
    iframe_element.contentWindow.postMessage(
      {
        messageType: "configLink",
        configLinkId: storeValue.id,
      },
      "*"
    );
  }

  function sendSelectedComponentInfos(
    selectedModuleType,
    selectedControlElementType
  ) {
    if (iframe_element == undefined) return;

    iframe_element.contentWindow.postMessage(
      {
        messageType: "selectedComponentTypes",
        selectedComponentTypes: [
          selectedModuleType,
          selectedControlElementType,
        ],
      },
      "*"
    );
  }

  function sendAuthEventToIframe(authEvent) {
    if (!iframe_element || !authEvent) return;

    // the authStore should contain an event!
    if (!authEvent.event) return;

    console.log("authevent!", authEvent);

    iframe_element.contentWindow.postMessage(
      {
        messageType: "userAuthentication",
        authEvent: authEvent,
      },
      "*"
    );
  }

  function sendLocalConfigs(configs) {
    if (iframe_element == undefined) return;

    iframe_element.contentWindow.postMessage(
      {
        messageType: "localConfigs",
        configs,
      },
      "*"
    );
  }

  async function handleLoginToProfileCloud(event) {
    modal.show({ component: UserLogin });
  }

  async function handleCreateCloudConfigLink(event) {
    return await window.electron.clipboard.writeText(event.data.configLinkUrl);
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

  async function handleProvideSelectedConfigForEditor(event) {
    selectedConfigStore.set(event.data.config);
    if (typeof get(selectedConfigStore) !== "undefined") {
      moduleOverlay.show(ModuleOverlayType.CONFIGURATION_LOAD);
    } else {
      if (get(moduleOverlay) === ModuleOverlayType.CONFIGURATION_LOAD) {
        moduleOverlay.close();
      }
    }
  }

  async function handleDeleteLocalConfig(event) {
    const path = $appSettings.persistent.profileFolder;
    const config = event.data?.config;

    return await window.electron.configs.deleteConfig(path, "configs", config);
  }

  async function handleGetCurrentConfigurationFromEditor(event) {
    return new Promise((resolve) => {
      const configType = event.data.configType;

      const ui = get(user_input);
      runtime
        .findPage(ui.dx, ui.dy, ui.pagenumber)
        .load()
        .then(() => {
          const ui = get(user_input);

          let name = undefined;
          let description = "Click here to add description";
          let id = uuidv4();

          let config: any = {
            name: name,
            id: id,
            description: description,
            configType: configType, // differentiator from different JSON files!
            version: {
              major: $appSettings.version.major,
              minor: $appSettings.version.minor,
              patch: $appSettings.version.patch,
            },
            localId: id,
          };

          runtime.modules.forEach((d) => {
            if (d.dx == ui.dx && d.dy == ui.dy) {
              const page = d.pages.find((x) => x.pageNumber == ui.pagenumber);

              if (configType === "profile") {
                config.type = selectedModuleType;
                config.configs = page.control_elements.map((element) => {
                  return {
                    controlElementNumber: element.elementIndex,
                    events: element.events.map((ev) => {
                      return {
                        event: ev.type,
                        config: ev.config,
                      };
                    }),
                  };
                });
              } else if (configType === "preset") {
                const element = page.control_elements.find(
                  (elemet) => elemet.elementIndex === ui.elementnumber
                );

                const current = runtime.findEvent(
                  ui.dx,
                  ui.dy,
                  ui.pagenumber,
                  ui.elementnumber,
                  ui.eventtype
                );

                config.type = (current.parent as GridElement).type;
                config.configs = {
                  events: element.events.map((ev) => {
                    return {
                      event: ev.type,
                      config: ev.config,
                    };
                  }),
                };
              }
            }
          });
          config.name = `New ${config.type} config`;
          resolve(config);
        })
        .catch((e) => {
          logger.set({
            type: "fail",
            mode: 0,
            classname: "profileclouderror",
            message: e,
          });
        });
    });
  }

  let profileCloudIsMounted = false;
  async function handleProfileCloudMounted(event) {
    console.log("profile cloud is mounted received");
    profileCloudIsMounted = true;
    let authEnvironment = AuthEnvironment.PRODUCTION;
    if (event.data.environment && event.data.environment !== "production") {
      authEnvironment = AuthEnvironment.DEVELOPMENT;
    }
    authStore.setCurrentAuthEnvironment(authEnvironment);
    if (
      selectedModuleType !== undefined ||
      selectedControlElementType !== undefined
    ) {
      sendSelectedComponentInfos(
        selectedModuleType,
        selectedControlElementType
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
    if (window.ctxProcess.buildVariables().BUILD_TARGET === "web") {
      window.open(link);
    } else {
      window.electron.openInBrowser(link);
    }
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
      }
    }
  }

  let listenerRegistered = false;
  let profileCloudUrl = "";
  let offlineProfileCloudUrl = undefined;

  $: if (
    listenerRegistered === true &&
    profileCloudUrl !==
      (offlineProfileCloudUrl ?? $appSettings.persistent.profileCloudUrl)
  ) {
    // listenerRegistered variable makes sure that the iframe loading is after registering the listener.
    // otherwise handleProfileCloudMounted is missed and offline fallback is displayed
    profileCloudUrl =
      offlineProfileCloudUrl ?? $appSettings.persistent.profileCloudUrl;

    console.log("Profile Cloud url", profileCloudUrl);
    profileCloudIsMounted = false;
  }

  onMount(async () => {
    // get to know the user
    await userStore.known;
    console.log("profile cloud is mounted status", profileCloudIsMounted);
    console.log("Profile Cloud url", $appSettings.persistent.profileCloudUrl);
    window.addEventListener("message", initChannelCommunication);
    profileCloudUrl = $appSettings.persistent.profileCloudUrl;
    listenerRegistered = true;
  });

  onDestroy(() => {
    console.log("De-initialize Profile Cloud");
    window.removeEventListener("message", initChannelCommunication);
    window.electron.stopOfflineProfileCloud();
    if (get(moduleOverlay) === "configuration-load-overlay") {
      moduleOverlay.close();
    }
    selectedConfigStore.set(undefined);
    window.electron.configs.stopConfigsWatch();
  });

  async function loadOfflineProfileCloud() {
    try {
      const serverAddress = await window.electron.startOfflineProfileCloud();
      const url = `http://${serverAddress.address}:${serverAddress.port}`;
      offlineProfileCloudUrl = url;
      profileCloudUrl = url;
    } catch (e) {
      error = {
        type: "no-offline",
        title: "Offline Profile Cloud is not available",
        text: "Offline version of Profile Cloud could not be located. Internet connection is needed to load the Online version.",
      };
    }
  }

  let error = {
    type: "default",
    title: "Sorry, can't load Profile Cloud",
    text: "You need internet access to load it. You can load the offline version as well.",
  };

  function updateFontSize(fontSize) {
    if (iframe_element == undefined) return;

    iframe_element.contentWindow.postMessage(
      {
        messageType: "updateFontSize",
        fontSize: `${fontSize}px`,
      },
      "*"
    );
  }

  $: {
    if (profileCloudIsMounted) {
      updateFontSize($appSettings.persistent.fontSize);
    }
  }

  function handleMouseOut(e) {
    //Removed due to textArea losing focus when in edit mode
    //window.focus();
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div class="flex flex-col bg-primary w-full h-full relative">
  <div class="flex items-center justify-center h-full absolute">
    {#if !profileCloudIsMounted}
      <div class="p-4">
        <h1 class="text-white text-xl">{error.title}</h1>
        <div class="text-white text-opacity-80 mb-2">
          {error.text}
        </div>
        {#if error.type === "default"}
          <MoltenPushButton
            click={loadOfflineProfileCloud}
            text="Load Offline"
          />
        {/if}
      </div>
    {/if}
  </div>

  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <iframe
    bind:this={iframe_element}
    on:mouseout={handleMouseOut}
    class="w-full h-full {profileCloudIsMounted ? '' : ' hidden'}"
    title="Test"
    allow="clipboard-read; clipboard-write;}"
    src={profileCloudUrl}
    style=""
  />
</div>
