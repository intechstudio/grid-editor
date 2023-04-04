<script>
  import { onDestroy, onMount } from "svelte";
  import { appSettings } from "../../../runtime/app-helper.store";

  import { get } from "svelte/store";
  const { env } = window.ctxProcess;

  import configuration from "../../../../../configuration.json";
  import { userAccountStore } from "../user-account/user-account.store";
  import { logger } from "../../../runtime/runtime.store";

  let iframe_element;
  let iframe_response_element;

  $: iframe_send($userAccountStore);

  function iframe_send(message) {
    console.log("Parent sending:  useraccount", message);
    if (iframe_element == undefined) return;
    iframe_element.contentWindow.postMessage(
      { credential: JSON.stringify(message.credential) },
      "*"
    );
  }

  async function handleMessageReceive(event) {
    if (event.data.channelMessageType == "IMPORT_PROFILE") {
      const path = $appSettings.persistant.profileFolder;
      const { owner, name, editorData, _id } = event.data;
      const profile = JSON.parse(editorData);
      profile.id = _id; // this should be _id instead of id!
      await window.electron.configs
        .saveConfig(path, name, profile, "profiles", owner)
        .then((res) => {
          logger.set({
            type: "success",
            message: `Profile ${name} imported successfully`,
          });
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

  let channel; // communication channel received from iframe, used for profile import responses
  function initChannelCommunication(event) {
    if (event.data == "profileImportCommunication") {
      if (event.ports && event.ports.length) {
        channel = event.ports[0];
        channel.onmessage = handleMessageReceive;
      }
    }
  }

  onMount(() => {
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
