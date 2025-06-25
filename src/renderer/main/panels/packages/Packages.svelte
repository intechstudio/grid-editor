<script>
  import { onMount } from "svelte";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { Analytics } from "../../../runtime/analytics.js";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { logger } from "../../../runtime/runtime.store";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { MeltCheckbox, MeltCombo } from "@intechstudio/grid-uikit";
  import CircularBar from "../../user-interface/CircularBar.svelte"
  import PackageItem from "./PackageItem.svelte";

  onMount(async () => {
    refreshPackageList();
  });

  $: $appSettings.persistent.enabledPackages,
    $appSettings.packageList,
    refreshPackagePreferences();

  let packagePreferenceComponents = [];
  let packagePathInput = "";
  let packageRepositoryDialog;

  function refreshPackagePreferences() {
    const loadedPackages = $appSettings.persistent.enabledPackages;
    const packageList = $appSettings.packageList;
    const loadedPackageDetails = loadedPackages
      .map((id) => packageList.find((e) => e.id == id))
      .filter((e) => e);

    const newComponents = [];
    packagePreferenceComponents.forEach((preference) => {
      if (
        loadedPackageDetails
          .map((e) => e.preferenceComponent)
          .includes(preference.componentName)
      ) {
        newComponents.push(preference);
      }
    });
    loadedPackageDetails.forEach((_package) => {
      if (
        _package.preferenceComponent &&
        !newComponents
          .map((e) => e.componentName)
          .includes(_package.preferenceComponent)
      ) {
        newComponents.push({
          componentName: _package.preferenceComponent,
          packageId: _package.id,
        });
      }
    });
    packagePreferenceComponents = newComponents;
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

  function removePackage(packageId) {
    window.packageManagerPort?.postMessage({
      type: "remove-package",
      id: packageId,
    });

    Analytics.track({
      event: "Package Manager",
      payload: { click: "Remove", id: packageId },
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
      payload: { click: "Add repository", url: packagePathInput },
      mandatory: false,
    });

    const regexPattern = /https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?.*/;
    let matches = packagePathInput.match(regexPattern);

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
          },
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
      return;
      //packageRepositoryUrlInput = "";
    }
    //Try to match for local path
    const pathRegex =
      /^(\/[^./\0]+(\/[^./\0]*)*|[a-zA-Z]:(\\[^<>:"/\\|?*]+)+\\?|~(\/[^./\0]+)*)$/;
    matches = packagePathInput.match(pathRegex);
    if (matches) {
      window.packageManagerPort?.postMessage({
        type: "add-local-package",
        rootPath: packagePathInput,
      });
    } else {
      logger.set({
        type: "fail",
        message: "Couldn't detect valid Github repository or absolute path!",
      });
    }
  }

  function approveRequest(request) {
    window.packageManagerPort?.postMessage({
      type: "add-local-package",
      rootPath: request.rootPath,
    });
    removeRequest(request);
  }

  function removeRequest(request) {
    appSettings.update((s) => {
      let list = s.developerPackagesRequested ?? [];
      let newList = list.filter((e) => e.id != request.id);
      s.developerPackagesRequested = newList;
      return s;
    });
  }

  function restartPackageManager() {
    $appSettings.packageManagerRunning = false;
    window.electron.restartPackageManager();
  }
</script>

<packages
  class="bg-primary flex flex-col h-full w-full text-white overflow-y-auto"
>
  <div class="flex flex-col h-full w-full p-4">
    <div class="flex py-2 text-white items-center">
      <div class="font-medium w-full">Packages</div>
      <div class="mx-2">
        <MoltenPushButton click={restartPackageManager} text="Force Restart" />
      </div>
      <div class="mx-2 font-medium text-base">
        <MoltenPushButton
          click={() => packageRepositoryDialog.show()}
          text="+"
        />
      </div>
    </div>

    {#if !$appSettings.packageManagerRunning}
      <p class="loading">Restarting package manager</p>
    {/if}
    <div class="flex flex-col h-full w-full overflow-y-auto overflow-x-clip">
      {#each $appSettings.packageList as _package}
        <PackageItem 
          data={_package} />
      {/each}
      <!--https://github.com/WebOnWebOff/svelte-resizable-columns-->
      <table>
        <thead class="text-gray-500 border-b border-gray-500">
          <tr>
            <th>Activate</th>
            <th>Name</th>
            <th>Version</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          
          {#each $appSettings.developerPackagesRequested as request}
            <tr class="h-20">
              <td />
              <td>{request.name}</td>
              <td />
              <td>
                <div class="flex flex-row">
                  <div class="mx-1">
                    <MoltenPushButton
                      click={() => {
                        approveRequest(request);
                      }}
                      ratio="box"
                      text=""
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        slot="content"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-check"
                        ><path d="M20 6 9 17l-5-5" /></svg
                      >
                    </MoltenPushButton>
                  </div>
                  <div class="mx-1">
                    <MoltenPushButton
                      click={() => {
                        removeRequest(request);
                      }}
                      ratio="box"
                      text=""
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        slot="content"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-x"
                        ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
                      >
                    </MoltenPushButton>
                  </div>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <textarea
        class="bg-secondary min-h-[20rem] max-h-[20rem] font-mono w-full p-1 my-1 rounded"
      >
        {JSON.stringify($appSettings.packageDebugLogs)}
      </textarea>
    </div>
  </div>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <dialog
    bind:this={packageRepositoryDialog}
    class="w-full h-full bg-opacity-60 bg-primary"
    on:click|self={() => packageRepositoryDialog.close()}
  >
    <div
      class="flex flex-row bg-secondary text-gray-400 font-normal px-8 py-4 items-end"
    >
      <MeltCombo
        size="full"
        title={"Repository url or path"}
        bind:value={packagePathInput}
      />
      <div class="mb-2 ml-2">
        <MoltenPushButton
          click={() => {
            addPackageRepository();
            packageRepositoryDialog.close();
          }}
          text="Add repository"
        />
      </div>
    </div>
  </dialog>
</packages>

<style>
  .loading:after {
    content: " .";
    animation: dots 1s steps(5, end) infinite;
  }
  @keyframes dots {
    0%,
    20% {
      color: rgba(0, 0, 0, 0);
      text-shadow:
        0.25em 0 0 rgba(0, 0, 0, 0),
        0.5em 0 0 rgba(0, 0, 0, 0);
    }
    40% {
      color: white;
      text-shadow:
        0.25em 0 0 rgba(0, 0, 0, 0),
        0.5em 0 0 rgba(0, 0, 0, 0);
    }
    60% {
      text-shadow:
        0.25em 0 0 white,
        0.5em 0 0 rgba(0, 0, 0, 0);
    }
    80%,
    100% {
      text-shadow:
        0.25em 0 0 white,
        0.5em 0 0 white;
    }
  }

  table {
    border-collapse: collapse;
  }
  th {
    font-weight: normal;
    text-align: start;
  }
</style>
