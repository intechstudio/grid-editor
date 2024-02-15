<script>
  import { onMount, onDestroy } from "svelte";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { Analytics } from "../../../runtime/analytics.js";
  import MoltenPushButton from "../preferences/MoltenPushButton.svelte";

  onMount(async () => {
    refreshPackageList();
  });

  $: $appSettings.persistent.enabledPackages, refreshPackagePreferences();

  let packageListDiv;
  let packagePreferenceElements = {};

  function refreshPackagePreferences() {
    const loadedPackages = $appSettings.persistent.enabledPackages;
    if (!packageListDiv) {
      return;
    }
    // Remove existing divs not found in the external set of IDs
    const existingDivIds = Object.keys(packagePreferenceElements);
    existingDivIds.forEach((existingDivId) => {
      if (!loadedPackages.includes(existingDivId)) {
        packagePreferenceElements[existingDivId].remove();
        delete packagePreferenceElements[existingDivId];
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

    for (const packageId of loadedPackages) {
      const _package = $appSettings.packageList.find((e) => e.id == packageId);
      if (!_package.preferenceHtml) continue;
      if (existingDivIds.includes(_package.id)) continue;

      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = _package.preferenceHtml;
      packagePreferenceElements[_package.id] = tempContainer;
      packageListDiv.appendChild(tempContainer);
      executeScriptElements(tempContainer);
    }
    packageListDiv.style.display =
      packageListDiv.childElementCount == 0 ? "none" : "block";
  }

  function changePackageStatus(packageId, enabled) {
    if (enabled) {
      window.packageManagerPort?.postMessage({
        type: "load-package",
        id: packageId,
        payload: $appSettings.persistent.packagesDataStorage[packageId],
      });
    } else {
      window.packageManagerPort?.postMessage({
        type: "unload-package",
        id: packageId,
      });
    }

    Analytics.track({
      event: "Package Manager",
      payload: {
        click: "Status Change",
        id: pluginId,
        status: enabled ? "enabled" : "disabled",
      },
      mandatory: false,
    });
  }

  function refreshPackageList() {
    window.packageManagerPort?.postMessage({ type: "refresh-package-list" });
  }

  function downloadPackage(packageId) {
    window.packageManagerPort?.postMessage({
      type: "download-package",
      id: packageId,
    });

    Analytics.track({
      event: "Package Manager",
      payload: { click: "Download", id: pluginId },
      mandatory: false,
    });
  }

  function uninstallPackage(packageId) {
    window.packageManagerPort?.postMessage({
      type: "uninstall-package",
      id: packageId,
    });
    appSettings.update((s) => {
      delete s.persistent.packagesDataStorage[packageId];
      return s;
    });

    Analytics.track({
      event: "Package Manager",
      payload: { click: "Uninstall", id: pluginId },
      mandatory: false,
    });
  }

  function restartPackageManager() {
    if (packageListDiv) {
      packageListDiv.innerHTML = "";
    }
    packagePreferenceElements = {};
    window.electron.restartPackageManager();
  }
</script>

<preferences
  class="bg-primary flex flex-col h-full w-full text-white p-4 overflow-y-auto"
>
  <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">
    <div class="flex py-2 text-white items-center">
      <div class="mx-2">Packages</div>
      <div class="mx-2">
        <MoltenPushButton on:click={restartPackageManager} text="Restart" />
      </div>
      <div class="mx-2">
        <MoltenPushButton on:click={refreshPackageList} text="Refresh" />
      </div>
    </div>
    {#each $appSettings.packageList as _package}
      <div class="flex py-2 text-white items-center">
        <input
          class="bg-primary my-1"
          type="checkbox"
          checked={_package.status === "Enabled"}
          style="visibility:{_package.status === 'Downloaded' ||
          _package.status === 'Enabled'
            ? 'visible'
            : 'hidden'}"
          on:change={async (e) =>
            changePackageStatus(_package.id, e.target.checked)}
        />
        <div class="mx-1">{_package.name}</div>
        <div class="mx-1">
          {#if _package.status == "Downloading" || _package.status == "Uninstalled" || _package.status == "MarkedForDeletion"}
            <MoltenPushButton
              on:click={downloadPackage(_package.id)}
              disabled={_package.status == "Downloading"}
              text="Download"
            />
          {:else}
            <MoltenPushButton
              on:click={uninstallPackage(_package.id)}
              text="Uninstall"
            />
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <div
    bind:this={packageListDiv}
    class="bg-secondary rounded-lg flex flex-col mb-4"
  />
</preferences>
