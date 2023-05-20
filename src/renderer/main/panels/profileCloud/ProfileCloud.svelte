<script>
  import { onDestroy, onMount } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import { appSettings } from "../../../runtime/app-helper.store";

  import { get } from "svelte/store";

  import {
    engine,
    logger,
    runtime,
    user_input,
  } from "../../../runtime/runtime.store";

  import { authStore } from "$lib/auth.store"; // this only changes if login, logout happens
  import { userStore } from "$lib/user.store";
  import { selectedProfileStore } from "../../../runtime/profile-helper.store";

  const { env } = window.ctxProcess;

  let iframe_element;

  $: sendAuthEventToIframe($authStore);

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

  function sendAuthEventToIframe(authEvent) {
    if (iframe_element == undefined) return;

    // the authStore should contain an event!
    if (!authEvent.event) return;

    console.log("Parent sending", authEvent);

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
      channel.postMessage({ ok: true, data: {} });
    }
  }

  async function handleImportProfile(event) {
    if (event.data.channelMessageType == "IMPORT_PROFILE") {
      const path = $appSettings.persistant.profileFolder;
      // owner is not used, but user instead
      const profile = event.data;
      const importName = uuidv4();
      await window.electron.configs
        .saveConfig(path, importName, profile, "profiles", "local")
        .then((res) => {
          logger.set({
            type: "success",
            message: `Profile ${name} imported successfully`,
          });
          console.log(channel);
          channel.postMessage({ ok: true, data: {} });
        })
        .catch((err) => {
          logger.set({
            type: "fail",
            message: `Profile ${name} import failed`,
          });
          channel.postMessage({ ok: false, data: {} });
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
      console.log(profiles);
      channel.postMessage({ ok: true, data: profiles });
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
      channel.postMessage({ ok: true, data: "" });
    }
  }

  async function handleDeleteLocalProfile(event) {
    if (event.data.channelMessageType == "DELETE_LOCAL_PROFILE") {
      const path = $appSettings.persistant.profileFolder;
      const { folder, name } = event.data?.profile;
      await window.electron.configs
        .deleteConfig(path, name, "profiles", folder)
        .then((res) => {
          logger.set({
            type: "success",
            message: `Profile ${name} deleted successfully`,
          });
          channel.postMessage({ ok: true, data: {} });
        })
        .catch((err) => {
          logger.set({
            type: "fail",
            message: `Profile ${name} deletion failed`,
          });
          channel.postMessage({ ok: false, data: {} });
        });
    }
  }

  async function handleCreateNewLocalProfileWithTheSelectedModulesConfigurationFromEditor(
    event
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

        let name = `${uuidv4()}`;
        let description = "";
        let type = selectedModule;

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
          id: uuidv4(),
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
          name,
          profile,
          "profiles",
          "local"
        );

        logger.set({
          type: "success",
          message: `Profile saved!`,
        });

        engine.set("ENABLED");

        channel.postMessage({ ok: true, data: {} });
      };

      runtime.fetch_page_configuration_from_grid(callback);
    }
  }

  async function handleRenameLocalProfile(event) {
    if (event.data.channelMessageType == "RENAME_LOCAL_PROFILE") {
      console.log("rename", event.data);
      const { newName, profile } = event.data;
      const oldName = profile.name;
      profile.name = newName;

      await window.electron.configs.updateConfig(
        $appSettings.persistant.profileFolder,
        newName,
        profile,
        "profiles",
        oldName,
        "local"
      );

      channel.postMessage({ ok: true, data: {} });
    }
  }

  async function handleOverwriteLocalProfile(event) {
    if (event.data.channelMessageType == "OVERWRITE_LOCAL_PROFILE") {
      console.log("overwrite", event.data);
      const { profileToOverwrite } = event.data;

      console.log(profileToOverwrite);

      const path = $appSettings.persistant.profileFolder;
      // this would be the needed data, if the profile would come from the profile cloud (profile.editorData...)
      // const { owner, name, editorData, _id } = event.data;

      let callback = await async function () {
        logger.set({
          type: "progress",
          mode: 0,
          classname: "profilesave",
          message: `Overwriting profile!`,
        });

        const li = get(user_input);
        const configs = get(runtime);

        let name = profileToOverwrite.name;
        let description = profileToOverwrite.description;
        let id = profileToOverwrite.id;
        let type = selectedModule;

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
          name,
          profile,
          "profiles",
          "local"
        );

        logger.set({
          type: "success",
          message: `Profile saved!`,
        });

        engine.set("ENABLED");

        channel.postMessage({ ok: true, data: {} });
      };

      runtime.fetch_page_configuration_from_grid(callback);
    }
  }

  let channel; // communication channel received from iframe
  function initChannelCommunication(event) {
    if (event.ports && event.ports.length) {
      channel = event.ports[0];
      if (event.data == "profileImportCommunication") {
        channel.onmessage = handleImportProfile;
      }
      if (event.data == "getListOfLocalProfiles") {
        channel.onmessage = handleGetListOfLocalProfiles;
      }
      if (
        event.data ==
        "provideSelectedProfileForOptionalUploadingToOneOreMoreModules"
      ) {
        channel.onmessage =
          handleProvideSelectedProfileForOptionalUploadingToOneOreMoreModules;
      }
      if (event.data == "deleteLocalProfile") {
        channel.onmessage = handleDeleteLocalProfile;
      }
      if (
        event.data ==
        "createNewLocalProfileWithTheSelectedModulesConfigurationFromEditor"
      ) {
        channel.onmessage =
          handleCreateNewLocalProfileWithTheSelectedModulesConfigurationFromEditor;
      }
      if (event.data == "renameLocalProfile") {
        channel.onmessage = handleRenameLocalProfile;
      }
      if (event.data == "overwriteLocalProfile") {
        channel.onmessage = handleOverwriteLocalProfile;
      }
      if (event.data == "loginToProfileCloud") {
        channel.onmessage = handleLoginToProfileCloud;
      }
    }
  }

  onMount(async () => {
    await userStore.known;
    console.log($userStore);

    if (env().NODE_ENV === "development") {
      $appSettings.profileCloudUrl = "http://localhost:5200";
    } else {
      $appSettings.profileCloudUrl = "https://profile-cloud.web.app";
    }

    $appSettings.profileCloudUrlEnabled = true;

    window.addEventListener("message", initChannelCommunication);

    console.log("iframe", iframe_element);

    if (iframe_element) {
      let doc = iframe_element.contentDocument;
      doc.body.innerHTML =
        doc.body.innerHTML +
        `
        <style>
          ::-webkit-scrollbar {
            height: 6px;
            width: 6px;
            background: #1e2628;
          }

          ::-webkit-scrollbar-thumb {
            background: #286787;
            box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
          }

          ::-webkit-scrollbar-corner {
            background: #1e2628;
          }
        </style>
        `;
    }
  });

  onDestroy(() => {
    console.log("De-initialize Profile Cloud");
    window.removeEventListener("message", initChannelCommunication);
  });
</script>

<div class="flex flex-col bg-primary w-full h-full">
  {#if env().NODE_ENV === "development"}
    <div class="flex flex-row items-center bg-primary w-full">
      <input
        type="checkbox"
        class="flex m-2"
        bind:checked={$appSettings.profileCloudUrlEnabled}
      />
      <span class="text-white">Custom URL</span>
    </div>

    {#if $appSettings.profileCloudUrlEnabled}
      <div class="flex-row">
        <button
          on:click={() => {
            $appSettings.profileCloudUrl = "http://localhost:5200";
          }}
          class="bg-secondary text-white w-36 rounded m-2"
          >localhost:5200</button
        >
        <button
          on:click={() => {
            $appSettings.profileCloudUrl = "https://profile-cloud.web.app";
          }}
          class="bg-secondary text-white w-36 rounded m-2"
          >profile-cloud.web.app</button
        >
        <button
          on:click={() => {
            $appSettings.profileCloudUrl = "http://example.com";
          }}
          class="bg-secondary text-white w-36 rounded m-2">example.com</button
        >
        <button
          on:click={() => {
            $appSettings.profileCloudUrl = "http://google.com";
          }}
          class="bg-secondary text-white w-36 rounded m-2">google.com</button
        >
      </div>
      <input class="flex m-2" bind:value={$appSettings.profileCloudUrl} />
    {/if}
  {/if}
  <iframe
    bind:this={iframe_element}
    class="w-full h-full"
    title="Test"
    src={$appSettings.profileCloudUrl}
  />
</div>
