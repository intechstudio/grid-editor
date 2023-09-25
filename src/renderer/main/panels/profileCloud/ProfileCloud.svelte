<script>
  import { onDestroy, onMount } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import { appSettings } from "../../../runtime/app-helper.store";

  import { Analytics } from "../../../runtime/analytics.js";

  import { get } from "svelte/store";

  import { logger, runtime, user_input } from "../../../runtime/runtime.store";

  import { authStore } from "$lib/auth.store"; // this only changes if login, logout happens
  import { userStore } from "$lib/user.store";
  import { configLinkStore } from "$lib/configlink.store";
  import { selectedConfigStore } from "../../../runtime/config-helper.store";

  const configuration = window.ctxProcess.configuration();
  const buildVariables = window.ctxProcess.buildVariables();

  let iframe_element;

  $: sendAuthEventToIframe($authStore);

  $: sendConfigLinkToIframe($configLinkStore);

  $: sendSelectedComponentInfos(selectedModule, selectedControlElementType);

  let selectedModule = undefined;
  let selectedControlElementType = undefined;

  $: {
    const ui = $user_input;
    let device = get(runtime).find(
      (device) => device.dx == ui.brc.dx && device.dy == ui.brc.dy
    );

    if (typeof device !== "undefined") {
      selectedModule = device.id.substr(0, 4);
    }
    selectedControlElementType = ui.event.elementtype;
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
    if (iframe_element == undefined) return;

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

  async function handleLoginToProfileCloud(event) {
    if (event.data.channelMessageType == "LOGIN_TO_PROFILE_CLOUD") {
      $appSettings.modal = "userLogin";
      return;
    }
  }

  async function handleCreateCloudConfigLink(event) {
    if (event.data.channelMessageType == "CREATE_CLOUD_CONFIG_LINK") {
      return await window.electron.clipboard.writeText(
        event.data.configLinkUrl
      );
    }
  }

  async function handleLogoutFromProfileCloud(event) {
    if (event.data.channelMessageType == "LOGOUT_FROM_PROFILE_CLOUD") {
      return await authStore.logout();
    }
  }

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

  async function handleSubmitAnalytics(event) {
    if (event.data.channelMessageType == "SUBMIT_ANALYTICS") {
      const { payload, eventName } = event.data;
      Analytics.track({
        event: eventName,
        payload: payload,
        mandatory: false,
      });
      return;
    }
  }

  async function handleImportConfig(event) {
    if (event.data.channelMessageType == "IMPORT_CONFIG") {
      const path = $appSettings.persistent.profileFolder;
      const config = event.data;
      const importName = config.name;

      config.cloudId = config.id;
      delete config.id;
      config.localId = uuidv4();

      return await window.electron.configs
        .saveConfig(path, "configs", config)
        .then((res) => {
          logger.set({
            type: "success",
            message: `Config ${importName} imported successfully`,
          });
          return;
        })
        .catch((err) => {
          logger.set({
            type: "fail",
            message: `Config ${importName} import failed`,
          });
          throw err;
        });
    }
  }

  async function handleGetListOfLocalConfigs(event) {
    if (event.data.channelMessageType == "GET_LIST_OF_LOCAL_CONFIGS") {
      const path = $appSettings.persistent.profileFolder;

      return await window.electron.configs.loadConfigsFromDirectory(
        path,
        "configs"
      );
    }
  }

  async function handleProvideSelectedConfigForOptionalUploadingToOneOreMoreModules(
    event
  ) {
    if (
      event.data.channelMessageType ==
      "PROVIDE_SELECTED_CONFIG_FOR_OPTIONAL_UPLOADING_TO_ONE_OR_MORE_MODULES"
    ) {
      selectedConfigStore.set(event.data.config);
      return;
    }
  }

  async function handleDeleteLocalConfig(event) {
    if (event.data.channelMessageType == "DELETE_LOCAL_CONFIG") {
      const path = $appSettings.persistent.profileFolder;
      const config = event.data?.config;

      return await window.electron.configs
        .deleteConfig(path, "configs", config)
        .then((res) => {
          logger.set({
            type: "success",
            message: `Config ${id} deleted successfully`,
          });
          return res;
        })
        .catch(async (err) => {
          await handleDeleteLegacyConfig(config);
        });
    }
  }

  async function handleCreateNewLocalConfigWithTheSelectedModulesConfigurationFromEditor(
    event,
    channel
  ) {
    if (
      event.data.channelMessageType ==
      "CREATE_NEW_LOCAL_CONFIG_WITH_THE_SELECTED_MODULES_CONFIGURATION_FROM_EDITOR"
    ) {
      const configType = event.data.configType;
      const path = $appSettings.persistent.profileFolder;
      // this would be the needed data, if the profile would come from the profile cloud (profile.editorData...)
      // const { owner, name, editorData, _id } = event.data;

      let callback = await async function () {
        logger.set({
          type: "progress",
          mode: 0,
          classname: "configsave",
          message: `Ready to save config!`,
        });

        const li = get(user_input);

        const configs = get(runtime);

        let name = undefined;
        let description = "Click here to add description";
        let id = uuidv4();

        let config = {
          name: name,
          description: description,
          configType: configType, // differentiator from different JSON files!
          version: {
            major: $appSettings.version.major,
            minor: $appSettings.version.minor,
            patch: $appSettings.version.patch,
          },
          localId: id,
        };

        configs.forEach((d) => {
          if (d.dx == li.brc.dx && d.dy == li.brc.dy) {
            const page = d.pages.find(
              (x) => x.pageNumber == li.event.pagenumber
            );

            if (configType === "profile") {
              config.type = selectedModule;
              config.configs = page.control_elements.map((cfg) => {
                return {
                  controlElementNumber: cfg.controlElementNumber,
                  events: cfg.events.map((ev) => {
                    return {
                      event: ev.event.value,
                      config: ev.config,
                    };
                  }),
                };
              });
            } else if (configType === "preset") {
              const element = page.control_elements.find(
                (x) => x.controlElementNumber === li.event.elementnumber
              );
              config.type = li.event.elementtype;
              config.configs = {
                events: element.events.map((ev) => {
                  return {
                    event: ev.event.value,
                    config: ev.config,
                  };
                }),
              };
            }
          }
        });

        await window.electron.configs.saveConfig(path, "configs", config);

        logger.set({
          type: "success",
          message: `Config saved!`,
        });

        channel.postMessage({ ok: true, data: {} });

        return;
      };

      return runtime.fetch_page_configuration_from_grid(callback);
    }
  }

  async function handleOverwriteLocalConfig(event, channel) {
    if (event.data.channelMessageType == "OVERWRITE_LOCAL_CONFIG") {
      const { configToOverwrite } = event.data;

      const path = $appSettings.persistent.profileFolder;

      let callback = await async function () {
        logger.set({
          type: "progress",
          mode: 0,
          classname: "configsave",
          message: `Overwriting config!`,
        });

        const li = get(user_input);
        const configs = get(runtime);
        configs.forEach((d) => {
          if (d.dx == li.brc.dx && d.dy == li.brc.dy) {
            const page = d.pages.find(
              (x) => x.pageNumber == li.event.pagenumber
            );

            if (configToOverwrite.configType === "profile") {
              configToOverwrite.configs = page.control_elements.map((cfg) => {
                return {
                  controlElementNumber: cfg.controlElementNumber,
                  events: cfg.events.map((ev) => {
                    return {
                      event: ev.event.value,
                      config: ev.config,
                    };
                  }),
                };
              });
            } else if (configToOverwrite.configType === "preset") {
              const element = page.control_elements.find(
                (x) => x.controlElementNumber === li.event.elementnumber
              );
              config.configs = {
                events: element.events.map((ev) => {
                  return {
                    event: ev.event.value,
                    config: ev.config,
                  };
                }),
              };
            }
          }
        });

        await window.electron.configs.saveConfig(
          path,
          "configs",
          configToOverwrite
        );

        logger.set({
          type: "success",
          message: `Config saved!`,
        });

        channel.postMessage({ ok: true, data: {} });
      };

      runtime.fetch_page_configuration_from_grid(callback);
    }
  }

  async function handleTextEditLocalConfig(event) {
    if (event.data.channelMessageType == "TEXT_EDIT_LOCAL_CONFIG") {
      const { name, description, config } = event.data;
      if (name) config.name = name;
      if (description) config.description = description;
      return await window.electron.configs.saveConfig(
        $appSettings.persistent.profileFolder,
        "configs",
        config
      );
    }
  }

  let sessionPresetNumbers = [];
  let numberForSessionPreset = 0;
  async function handleSplitLocalConfig(event) {
    if (event.data.channelMessageType == "SPLIT_LOCAL_CONFIG") {
      const { configToSplit } = event.data;
      const path = $appSettings.persistent.profileFolder;
      const config = configToSplit;

      let isSessionPresetNameUnique = undefined;

      //TODO: differentiate between presets and profiles
      const conversionPromises = config.configs.map((configElement) => {
        let user = "sessionPreset";

        let name;
        let description;
        let type;

        numberForSessionPreset++;

        let sessionPresetName;
        sessionPresetNumbers = [];

        name = `${profile.name} - Element ${configElement.controlElementNumber}`;
        description = "";

        if (profile.type == "BU16") {
          type = "button";
        }

        if (profile.type == "PO16") {
          type = "potentiometer";
        }

        if (profile.type == "EN16") {
          type = "encoder";
        }

        if (profile.type == "EF44") {
          if ([0, 1, 2, 3].includes(configElement.controlElementNumber)) {
            type = "encoder";
          }
          if ([4, 5, 6, 7].includes(configElement.controlElementNumber)) {
            type = "fader";
          }
        }

        if (profile.type == "PBF4") {
          if ([0, 1, 2, 3].includes(configElement.controlElementNumber)) {
            type = "potentiometer";
          }
          if ([4, 5, 6, 7].includes(configElement.controlElementNumber)) {
            type = "fader";
          }
          if ([8, 9, 10, 11].includes(configElement.controlElementNumber)) {
            type = "button";
          }
        }

        if (configElement.controlElementNumber === 255) {
          type = "system";
        }

        let preset = {
          name: name,
          description: description,
          type: type,
          configType: "preset", // differentiator from different JSON files!
          version: {
            major: $appSettings.version.major,
            minor: $appSettings.version.minor,
            patch: $appSettings.version.patch,
          },
          configs: {
            ...profileElement,
          },
          id: uuidv4(),
        };

        const PRESET_PATH = get(appSettings).persistent.presetFolder;

        if (!config.localId) {
          console.log(`Missing localId, generating for config: ${config}`);
          config.localId = uuidv4();
        }

        return window.electron.configs.saveConfig(path, "configs", config);
      });

      await Promise.all(conversionPromises).then((res) => {
        logger.set({
          type: "success",
          mode: 0,
          classname: "presetsave",
          message: `Profile to element presets conversion finished!`,
        });
      });
    }
  }

  let profileCloudIsMounted = false;
  async function handleProfileCloudMounted(event) {
    if (event.data.channelMessageType == "PROFILE_CLOUD_MOUNTED") {
      console.log("profile cloud is mounted received");
      profileCloudIsMounted = true;
      if (
        selectedModule !== undefined ||
        selectedControlElementType !== undefined
      ) {
        sendSelectedComponentInfos(selectedModule, selectedControlElementType);
      }
      return configuration.EDITOR_VERSION;
    }
  }

  function initChannelCommunication(event) {
    if (event.ports && event.ports.length) {
      if (event.data == "profileCloudMounted") {
        channelMessageWrapper(event, handleProfileCloudMounted);
      }
      if (event.data == "configImportCommunication") {
        channelMessageWrapper(event, handleImportConfig);
      }
      if (event.data == "getListOfLocalConfigs") {
        channelMessageWrapper(event, handleGetListOfLocalConfigs);
      }
      if (
        event.data ==
        "provideSelectedConfigForOptionalUploadingToOneOreMoreModules"
      ) {
        channelMessageWrapper(
          event,
          handleProvideSelectedConfigForOptionalUploadingToOneOreMoreModules //OMG
        );
      }
      if (event.data == "deleteLocalConfig") {
        channelMessageWrapper(event, handleDeleteLocalConfig);
      }
      // as there is a callback hell working with writebuffer, we need to pass the channel for the callback
      if (
        event.data ==
        "createNewLocalConfigWithTheSelectedModulesConfigurationFromEditor"
      ) {
        const channel = event.ports[0];
        channel.onmessage = (event) =>
          handleCreateNewLocalConfigWithTheSelectedModulesConfigurationFromEditor(
            //OMG2
            event,
            channel
          );
      }
      // as there is a callback hell working with writebuffer, we need to pass the channel for the callback
      if (event.data == "overwriteLocalConfig") {
        const channel = event.ports[0];
        channel.onmessage = (event) =>
          handleOverwriteLocalConfig(event, channel);
      }
      if (event.data == "textEditLocalConfig") {
        channelMessageWrapper(event, handleTextEditLocalConfig);
      }
      if (event.data == "loginToProfileCloud") {
        channelMessageWrapper(event, handleLoginToProfileCloud);
      }
      if (event.data == "logoutFromProfileCloud") {
        channelMessageWrapper(event, handleLogoutFromProfileCloud);
      }
      if (event.data == "splitLocalConfig") {
        channel.onmessage = (event) => {
          throw Error("Not implemented yet");
        };
      }
      if (event.data == "createCloudConfigLink") {
        channelMessageWrapper(event, handleCreateCloudConfigLink);
      }
      if (event.data == "submitAnalytics") {
        channelMessageWrapper(event, handleSubmitAnalytics);
      }
    }
  }

  onMount(async () => {
    // get to know the user
    await userStore.known;

    $appSettings.profileCloudUrl = buildVariables.PROFILE_CLOUD_URL;

    $appSettings.profileCloudUrlEnabled = true;

    console.log("profile cloud is mounted status", profileCloudIsMounted);

    window.addEventListener("message", initChannelCommunication);

    // const iframeLoaded = iframe_element.addEventListener("load", () => {
    //   console.log("iframe loaded");
    // });
  });

  onDestroy(() => {
    console.log("De-initialize Profile Cloud");
    window.removeEventListener("message", initChannelCommunication);
    window.electron.stopOfflineProfileCloud();
    selectedConfigStore.set({});
  });

  async function loadOfflineProfileCloud() {
    const serverAddress = await window.electron.startOfflineProfileCloud();
    const url = `http://${serverAddress.address}:${serverAddress.port}`;
    $appSettings.profileCloudUrl = url;
  }
</script>

<div class="flex flex-col bg-primary w-full h-full">
  {#if profileCloudIsMounted == false}
    <div class="flex items-center justify-center h-full">
      <div class="p-4">
        <h1 class="text-white text-xl">Sorry, can't load Profile Cloud</h1>
        <div class="text-white text-opacity-80">
          You need internet access to load it. You can load the offline version
          as well.
        </div>
        <button
          class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2"
          on:click={loadOfflineProfileCloud}
        >
          Load Offline
        </button>
      </div>
    </div>
  {/if}
  <iframe
    bind:this={iframe_element}
    class="w-full h-full {profileCloudIsMounted == false ? 'hidden' : ''}"
    title="Test"
    allow="clipboard-read; clipboard-write;}"
    src={$appSettings.profileCloudUrl}
  />
</div>
