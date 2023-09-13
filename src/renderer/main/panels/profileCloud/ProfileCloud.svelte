<script>
  import { onDestroy, onMount } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import { appSettings } from "../../../runtime/app-helper.store";

  import { Analytics } from "../../../runtime/analytics.js";

  import { get } from "svelte/store";

  import { logger, runtime, user_input } from "../../../runtime/runtime.store";

  import { authStore } from "$lib/auth.store"; // this only changes if login, logout happens
  import { userStore } from "$lib/user.store";
  import { profileLinkStore } from "$lib/profilelink.store";
  import { selectedProfileStore } from "../../../runtime/profile-helper.store";

  const buildVariables = window.ctxProcess.buildVariables();

  let iframe_element;

  $: sendAuthEventToIframe($authStore);

  $: sendProfileLinkToIframe($profileLinkStore);

  $: sendSelectedModuleInfo(selectedModule);

  let selectedModule = undefined;

  $: {
    const ui = $user_input;
    let device = get(runtime).find(
      (device) => device.dx == ui.brc.dx && device.dy == ui.brc.dy
    );

    if (typeof device !== "undefined") {
      selectedModule = device.id.substr(0, 4);
    }
  }

  function sendProfileLinkToIframe(storeValue) {
    if (iframe_element == undefined) return;

    iframe_element.contentWindow.postMessage(
      {
        messageType: "profileLink",
        profileLinkId: storeValue.id,
      },
      "*"
    );
  }

  function sendSelectedModuleInfo(selectedModuleType) {
    if (iframe_element == undefined) return;

    iframe_element.contentWindow.postMessage(
      {
        messageType: "selectedModuleType",
        selectedModuleType: selectedModuleType,
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

  function sendHandshakeToIframe() {
    if (iframe_element == undefined) return;

    iframe_element.contentWindow.postMessage(
      {
        messageType: "handshake",
        handshake: "ping",
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

  async function handleCreateCloudProfileLink(event) {
    if (event.data.channelMessageType == "CREATE_CLOUD_PROFILE_LINK") {
      return await window.electron.clipboard.writeText(
        event.data.profileLinkUrl
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

  async function handleImportProfile(event) {
    if (event.data.channelMessageType == "IMPORT_PROFILE") {
      const path = $appSettings.persistant.profileFolder;
      // owner is not used, but user instead
      const profile = event.data;
      const importName = profile.name;

      return await window.electron.configs
        .saveConfig(path, profile.id, profile, "profiles", "local")
        .then((res) => {
          logger.set({
            type: "success",
            message: `Profile ${importName} imported successfully`,
          });
          return;
        })
        .catch((err) => {
          logger.set({
            type: "fail",
            message: `Profile ${importName} import failed`,
          });
          throw err;
        });
    }
  }

  async function handleGetListOfLocalProfiles(event) {
    if (event.data.channelMessageType == "GET_LIST_OF_LOCAL_PROFILES") {
      const path = $appSettings.persistant.profileFolder;
      const profiles = await window.electron.configs.loadConfigsFromDirectory(
        path,
        "profiles"
      );
      return profiles;
    }
  }

  async function handleProvideSelectedProfileForOptionalUploadingToOneOreMoreModules(
    event
  ) {
    if (
      event.data.channelMessageType ==
      "PROVIDE_SELECTED_PROFILE_FOR_OPTIONAL_UPLOADING_TO_ONE_OR_MORE_MODULES"
    ) {
      selectedProfileStore.set(event.data.profile);
      return;
    }
  }

  async function handleDeleteLocalProfile(event) {
    if (event.data.channelMessageType == "DELETE_LOCAL_PROFILE") {
      const path = $appSettings.persistant.profileFolder;
      const { folder, id } = event.data?.profile;

      await window.electron.configs
        .deleteConfig(path, id, "profiles", folder)
        .then((res) => {
          logger.set({
            type: "success",
            message: `Profile ${id} deleted successfully`,
          });
          return res;
        })
        .catch((err) => {
          logger.set({
            type: "fail",
            message: `Profile ${id} deletion failed`,
          });
          throw err;
        });
    }
  }

  async function handleCreateNewLocalProfileWithTheSelectedModulesConfigurationFromEditor(
    event,
    channel
  ) {
    if (
      event.data.channelMessageType ==
      "CREATE_NEW_LOCAL_PROFILE_WITH_THE_SELECTED_MODULES_CONFIGURATION_FROM_EDITOR"
    ) {
      const path = $appSettings.persistant.profileFolder;
      // this would be the needed data, if the profile would come from the profile cloud (profile.editorData...)
      // const { owner, name, editorData, _id } = event.data;

      let callback = await async function () {
        logger.set({
          type: "progress",
          mode: 0,
          classname: "profilesave",
          message: `Ready to save profile!`,
        });

        const li = get(user_input);

        const configs = get(runtime);

        let name = "New local profile";
        let description = "Click here to add description";
        let type = selectedModule;
        let id = uuidv4();

        let profile = {
          name: name,
          description: description,
          type: type,
          isGridProfile: true, // differentiator from different JSON files!
          version: {
            major: $appSettings.version.major,
            minor: $appSettings.version.minor,
            patch: $appSettings.version.patch,
          },
          id: id,
        };

        configs.forEach((d) => {
          if (d.dx == li.brc.dx && d.dy == li.brc.dy) {
            const page = d.pages.find(
              (x) => x.pageNumber == li.event.pagenumber
            );

            profile.configs = page.control_elements.map((cfg) => {
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
          }
        });

        await window.electron.configs.saveConfig(
          path,
          id,
          profile,
          "profiles",
          "local"
        );

        logger.set({
          type: "success",
          message: `Profile saved!`,
        });

        channel.postMessage({ ok: true, data: {} });

        return;
      };

      return runtime.fetch_page_configuration_from_grid(callback);
    }
  }

  async function handleOverwriteLocalProfile(event, channel) {
    if (event.data.channelMessageType == "OVERWRITE_LOCAL_PROFILE") {
      const { profileToOverwrite } = event.data;

      const path = $appSettings.persistant.profileFolder;

      let callback = await async function () {
        logger.set({
          type: "progress",
          mode: 0,
          classname: "profilesave",
          message: `Overwriting profile!`,
        });

        const li = get(user_input);
        const configs = get(runtime);

        configs.forEach((d) => {
          if (d.dx == li.brc.dx && d.dy == li.brc.dy) {
            const page = d.pages.find(
              (x) => x.pageNumber == li.event.pagenumber
            );

            profileToOverwrite.configs = page.control_elements.map((cfg) => {
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
          }
        });

        // tofi: here we could use updateLocal as well?
        await window.electron.configs.saveConfig(
          path,
          profileToOverwrite.id,
          profileToOverwrite,
          "profiles",
          "local"
        );

        logger.set({
          type: "success",
          message: `Profile saved!`,
        });

        channel.postMessage({ ok: true, data: {} });
      };

      runtime.fetch_page_configuration_from_grid(callback);
    }
  }

  async function handleTextEditLocalProfile(event) {
    if (event.data.channelMessageType == "TEXT_EDIT_LOCAL_PROFILE") {
      const { name, description, profile } = event.data;
      if (name) profile.name = name;
      if (description) profile.description = description;
      return await window.electron.configs.updateLocal(
        $appSettings.persistant.profileFolder,
        profile.id,
        profile,
        "profiles",
        "local"
      );
    }
  }

  let sessionPresetNumbers = [];
  let numberForSessionPreset = 0;
  async function handleSplitLocalProfile(event) {
    if (event.data.channelMessageType == "SPLIT_LOCAL_PROFILE") {
      const { profileToSplit } = event.data;
      const path = $appSettings.persistant.profileFolder;
      const profile = profileToSplit;

      let isSessionPresetNameUnique = undefined;

      const conversionPromises = profile.configs.map((profileElement) => {
        let user = "sessionPreset";

        let name;
        let description;
        let type;

        numberForSessionPreset++;

        let sessionPresetName;
        sessionPresetNumbers = [];

        name = `${profile.name} - Element ${profileElement.controlElementNumber}`;
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
          if ([0, 1, 2, 3].includes(profileElement.controlElementNumber)) {
            type = "encoder";
          }
          if ([4, 5, 6, 7].includes(profileElement.controlElementNumber)) {
            type = "fader";
          }
        }

        if (profile.type == "PBF4") {
          if ([0, 1, 2, 3].includes(profileElement.controlElementNumber)) {
            type = "potentiometer";
          }
          if ([4, 5, 6, 7].includes(profileElement.controlElementNumber)) {
            type = "fader";
          }
          if ([8, 9, 10, 11].includes(profileElement.controlElementNumber)) {
            type = "button";
          }
        }

        if (profileElement.controlElementNumber === 255) {
          type = "system";
        }

        let preset = {
          name: name,
          description: description,
          type: type,
          isGridPreset: true, // differentiator from different JSON files!
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

        const PRESET_PATH = get(appSettings).persistant.presetFolder;

        return window.electron.configs.saveConfig(
          PRESET_PATH,
          preset.name,
          preset,
          "presets",
          user
        );
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
      if (selectedModule !== undefined) {
        sendSelectedModuleInfo(selectedModule);
      }
      return;
    }
  }

  function initChannelCommunication(event) {
    if (event.ports && event.ports.length) {
      if (event.data == "profileCloudMounted") {
        channelMessageWrapper(event, handleProfileCloudMounted);
      }
      if (event.data == "profileImportCommunication") {
        channelMessageWrapper(event, handleImportProfile);
      }
      if (event.data == "getListOfLocalProfiles") {
        channelMessageWrapper(event, handleGetListOfLocalProfiles);
      }
      if (
        event.data ==
        "provideSelectedProfileForOptionalUploadingToOneOreMoreModules"
      ) {
        channelMessageWrapper(
          event,
          handleProvideSelectedProfileForOptionalUploadingToOneOreMoreModules //OMG
        );
      }
      if (event.data == "deleteLocalProfile") {
        channelMessageWrapper(event, handleDeleteLocalProfile);
      }
      // as there is a callback hell working with writebuffer, we need to pass the channel for the callback
      if (
        event.data ==
        "createNewLocalProfileWithTheSelectedModulesConfigurationFromEditor"
      ) {
        const channel = event.ports[0];
        channel.onmessage = (event) =>
          handleCreateNewLocalProfileWithTheSelectedModulesConfigurationFromEditor(
            //OMG2
            event,
            channel
          );
      }
      // as there is a callback hell working with writebuffer, we need to pass the channel for the callback
      if (event.data == "overwriteLocalProfile") {
        const channel = event.ports[0];
        channel.onmessage = (event) =>
          handleOverwriteLocalProfile(event, channel);
      }
      if (event.data == "textEditLocalProfile") {
        channelMessageWrapper(event, handleTextEditLocalProfile);
      }
      if (event.data == "loginToProfileCloud") {
        channelMessageWrapper(event, handleLoginToProfileCloud);
      }
      if (event.data == "logoutFromProfileCloud") {
        channelMessageWrapper(event, handleLogoutFromProfileCloud);
      }
      if (event.data == "splitLocalProfile") {
        channel.onmessage = (event) => {
          throw Error("Not implemented yet");
        };
      }
      if (event.data == "createCloudProfileLink") {
        channelMessageWrapper(event, handleCreateCloudProfileLink);
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
    selectedProfileStore.set({});
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
