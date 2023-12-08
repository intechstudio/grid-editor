<script>
  import { onMount, onDestroy } from "svelte";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { Analytics } from "../../../runtime/analytics.js";

  onMount(async () => {
    refreshPluginList();
  });

  $: $appSettings.persistent.enabledPlugins, refreshPluginPreferences();

  let pluginListDiv;
  let pluginPreferenceElements = {};

  function refreshPluginPreferences() {
    const loadedPlugins = $appSettings.persistent.enabledPlugins;
    if (!pluginListDiv) {
      return;
    }
    // Remove existing divs not found in the external set of IDs
    const existingDivIds = Object.keys(pluginPreferenceElements);
    existingDivIds.forEach((existingDivId) => {
      if (!loadedPlugins.includes(existingDivId)) {
        pluginPreferenceElements[existingDivId].remove();
        delete pluginPreferenceElements[existingDivId];
      }
    });

    function executeScriptElements(containerElement) {
      const scriptElements = containerElement.querySelectorAll("script");

      Array.from(scriptElements).forEach((scriptElement) => {
        const clonedElement = document.createElement("script");

        Array.from(scriptElement.attributes).forEach((attribute) => {
          clonedElement.setAttribute(attribute.name, attribute.value);
        });

        clonedElement.text = scriptElement.text;

        scriptElement.parentNode.replaceChild(clonedElement, scriptElement);
      });
    }

    for (const pluginId of loadedPlugins) {
      const plugin = $appSettings.pluginList.find((e) => e.id == pluginId);
      if (!plugin.preferenceHtml) continue;
      if (existingDivIds.includes(plugin.id)) continue;

      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = plugin.preferenceHtml;
      pluginPreferenceElements[plugin.id] = tempContainer;
      pluginListDiv.appendChild(tempContainer);
      executeScriptElements(tempContainer);
    }
    pluginListDiv.style.display =
      pluginListDiv.childElementCount == 0 ? "none" : "block";
  }

  function changePluginStatus(pluginId, enabled) {
    if (enabled) {
      window.pluginManagerPort.postMessage({
        type: "load-plugin",
        id: pluginId,
        payload: $appSettings.persistent.pluginsDataStorage[pluginId],
      });
    } else {
      window.pluginManagerPort.postMessage({
        type: "unload-plugin",
        id: pluginId,
      });
    }
  }

  function refreshPluginList() {
    window.pluginManagerPort.postMessage({ type: "refresh-plugin-list" });
  }

  function downloadPlugin(pluginId) {
    window.pluginManagerPort.postMessage({
      type: "download-plugin",
      id: pluginId,
    });
  }

  function uninstallPlugin(pluginId) {
    window.pluginManagerPort.postMessage({
      type: "uninstall-plugin",
      id: pluginId,
    });
    appSettings.update((s) => {
      delete s.persistent.pluginsDataStorage[pluginId];
      return s;
    });
  }

  function restartPackageManager() {
    window.electron.restartPackageManager();
  }
</script>

<preferences
  class="bg-primary flex flex-col h-full w-full text-white p-4 overflow-y-auto"
>
  <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">
    <div class="flex py-2 text-white items-center">
      <div class="mx-2">Plugins</div>
      <div class="mx-2">
        <button
          class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2"
          on:click={restartPackageManager}
        >
          Restart
        </button>
      </div>
      <div class="mx-2">
        <button
          class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2"
          on:click={refreshPluginList}
        >
          Refresh
        </button>
      </div>
    </div>
    {#each $appSettings.pluginList as plugin}
      <div class="flex py-2 text-white items-center">
        <input
          class="bg-primary my-1"
          type="checkbox"
          checked={plugin.status === "Enabled"}
          style="visibility:{plugin.status === 'Downloaded' ||
          plugin.status === 'Enabled'
            ? 'visible'
            : 'hidden'}"
          on:change={async (e) =>
            changePluginStatus(plugin.id, e.target.checked)}
        />
        <div class="mx-1">{plugin.name}</div>
        <div class="mx-1">
          {#if plugin.status == "Downloading" || plugin.status == "Uninstalled" || plugin.status == "MarkedForDeletion"}
            <button
              class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2"
              on:click={downloadPlugin(plugin.id)}
              disabled={plugin.status == "Downloading"}
            >
              Download
            </button>
          {:else}
            <button
              class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2"
              on:click={uninstallPlugin(plugin.id)}
            >
              Uninstall
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <div
    bind:this={pluginListDiv}
    class="bg-secondary rounded-lg flex flex-col mb-4"
  />
</preferences>
