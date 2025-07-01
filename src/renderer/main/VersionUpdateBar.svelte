<script lang="ts">
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { Modal } from "./modals/modal.store";
  import ReleaseNotes from "./modals/ReleaseNotes.svelte";
  import { AppUpdater } from "./versionUpdateBar.js";

  const manager = AppUpdater.stateManager;
  window.electron.updater.onAppUpdate(manager.handleAppUpdate);
</script>

<container
  class:hidden={$manager.state === AppUpdater.State.UPTODATE}
  class="relative"
>
  <div class="bg-blue-600 p-2">
    <div class="flex flex-row gap-5 items-center justify-center w-full">
      {#if $manager.state === AppUpdater.State.AVAILABLE}
        <div class="flex flex-col">
          <div class="font-bold text-white">
            New {$manager.info?.version.includes("nightly")
              ? "Nightly "
              : ""}version is available!
          </div>
          <div class="text-white">
            Grid Editor version {$manager.info?.version} is ready to be downloaded.
          </div>
        </div>
        <div
          class={$manager.updateFromStableToNightly ? "bg-red-600 rounded" : ""}
        >
          <MoltenPushButton
            click={AppUpdater.installUpdate}
            text={$manager.updateFromStableToNightly
              ? "Update to Nightly"
              : "Download"}
          />
        </div>
        {#if typeof $manager.info?.releaseNotes !== "undefined"}
          <MoltenPushButton
            click={() => new Modal.Window(ReleaseNotes).show()}
            text={"Release Notes"}
          />
        {/if}
        <MoltenPushButton click={AppUpdater.abortUpdate} text="Close" />
      {/if}
      {#if $manager.state === AppUpdater.State.DOWNLOADING}
        <div class="flex flex-col">
          <p class="text-white font-bold">Downloading update...</p>
          <p class="text-white">
            {`Downloading in the background ${$manager.progress}%`}
          </p>
        </div>
      {/if}

      {#if $manager.state === AppUpdater.State.SUCCESS}
        <div class="flex flex-col">
          <p class="text-white font-bold">Update Successful!</p>
          <p class="text-white">
            It will be installed on restart. Restart now?
          </p>
        </div>
        <MoltenPushButton click={AppUpdater.restartApp} text="Restart" />
        <MoltenPushButton click={AppUpdater.abortUpdate} text="Close" />
      {/if}

      {#if $manager.state === AppUpdater.State.ERROR}
        <div class="flex flex-col">
          <p class="font-bold text-white">Error during update!</p>
          <p class="text-white">
            Please visit the website and pick the download for your operating
            system!
          </p>
        </div>
        <MoltenPushButton click={AppUpdater.openDownloads} text="Download" />
        <MoltenPushButton click={AppUpdater.abortUpdate} text="Close" />
      {/if}
    </div>
  </div>
</container>
