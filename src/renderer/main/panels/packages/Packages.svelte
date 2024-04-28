<script>
  import { onMount } from "svelte";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { Analytics } from "../../../runtime/analytics.js";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { logger } from "../../../runtime/runtime.store.js";

  onMount(async () => {
    refreshPackageList();
  });

  $: $appSettings.persistent.enabledPackages,
    $appSettings.packageList,
    refreshPackagePreferences();

  let packageListDiv;
  let packagePreferenceElements = {};
  let packageRepositoryUrlInput = "";

  function refreshPackagePreferences() {
    const loadedPackages = $appSettings.persistent.enabledPackages;
    const packageList = $appSettings.packageList;
    if (!packageListDiv) {
      return;
    }
    // Remove existing divs not found in the external set of IDs
    const existingDivIds = Object.keys(packagePreferenceElements);
    existingDivIds.forEach((existingDivId) => {
      if (
        !loadedPackages.includes(existingDivId) ||
        !packageList.find((e) => e.id !== existingDivId)
      ) {
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
      const _package = packageList.find((e) => e.id == packageId);
      if (!_package || !_package.preferenceHtml) continue;
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
        id: packageId,
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
      payload: { click: "Download", id: packageId },
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
      payload: { click: "Uninstall", id: packageId },
      mandatory: false,
    });
  }

  function updatePackage(packageId) {
    window.packageManagerPort?.postMessage({
      type: "update-package",
      id: packageId,
    });

    Analytics.track({
      event: "Package Manager",
      payload: { click: "Update", id: packageId },
      mandatory: false,
    });
  }

  async function addPackageRepository() {
    Analytics.track({
      event: "Package Manager",
      payload: { click: "Add repository", url: packageRepositoryUrlInput },
      mandatory: false,
    });

    const githubLink = packageRepositoryUrlInput;

    const regexPattern = /https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?.*/;
    const matches = githubLink.match(regexPattern);

    if (matches) {
      const owner = matches[1];
      const repositoryName = matches[2];

      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repositoryName}/contents/package.json`,
          {
            method: "GET",
            headers: {
              Accept: "application/vnd.github.v3.raw",
              "User-Agent": "Grid Editor",
            },
          }
        );

        if (response.ok) {
          const packageJsonText = await response.text();
          const packageInfo = JSON.parse(packageJsonText);
          const packageName = packageInfo.description;
          const packageId = packageInfo.name;
          window.packageManagerPort?.postMessage({
            type: "add-github-repository",
            id: packageId,
            packageName,
            gitHubRepositoryOwner: owner,
            gitHubRepositoryName: repositoryName,
          });
        } else {
          logger.set({
            type: "fail",
            message: `Failed to fetch package.json!`,
          });
        }
      } catch (error) {
        logger.set({
          type: "fail",
          message: `Failed to fetch package.json: ${error.message}`,
        });
      }
      //packageRepositoryUrlInput = "";
    } else {
      logger.set({
        type: "fail",
        message: "Couldn't detect valid Github repository!",
      });
    }
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
        {#if _package.packageVersion}
          <div class="mx-1">{_package.packageVersion}</div>
        {/if}
        <div class="mx-1">
          {#if _package.status == "Downloading" || _package.status == "Uninstalled"}
            <MoltenPushButton
              on:click={downloadPackage(_package.id)}
              disabled={_package.status == "Downloading"}
              text="Download"
            />
          {:else if _package.canUpdate}
            <MoltenPushButton
              on:click={updatePackage(_package.id)}
              text="Update"
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

  <div class="bg-secondary p-2 mb-4 rounded-lg flex text-white items-center">
    <input
      class="bg-primary mr-2 w-full"
      type="text"
      bind:value={packageRepositoryUrlInput}
    />
    <MoltenPushButton on:click={addPackageRepository} text="Add repository" />
  </div>

  {#if !$appSettings.packageManagerRunning}
    <p class="loading">Restarting package manager</p>
  {/if}

  <div
    bind:this={packageListDiv}
    class="bg-secondary rounded-lg flex flex-col mb-4"
  />
</preferences>

<style>
  .loading:after {
    content: " .";
    animation: dots 1s steps(5, end) infinite;
  }
  @keyframes dots {
    0%,
    20% {
      color: rgba(0, 0, 0, 0);
      text-shadow: 0.25em 0 0 rgba(0, 0, 0, 0), 0.5em 0 0 rgba(0, 0, 0, 0);
    }
    40% {
      color: white;
      text-shadow: 0.25em 0 0 rgba(0, 0, 0, 0), 0.5em 0 0 rgba(0, 0, 0, 0);
    }
    60% {
      text-shadow: 0.25em 0 0 white, 0.5em 0 0 rgba(0, 0, 0, 0);
    }
    80%,
    100% {
      text-shadow: 0.25em 0 0 white, 0.5em 0 0 white;
    }
  }
</style>
