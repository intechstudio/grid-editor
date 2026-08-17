<script lang="ts">
  import {
    MarkdownContainer,
    MoltenPushButton,
    type MarkdownContainerTypes,
  } from "@intechstudio/grid-uikit";
  import MoltenModal from "./MoltenModal.svelte";
  import { Grid } from "../../lib/_utils";
  import { AppUpdater } from "../versionUpdateBar";
  import { Modal } from "./modal.store";

  export let data: Modal.Instance;

  const manager = AppUpdater.stateManager;

  function handleLinkClicked(
    e: CustomEvent<MarkdownContainerTypes.LinkClickEvent>,
  ) {
    const { link } = e.detail;
    Grid.Link.openExternalLink(link);
  }

  function handleInstallUpdate() {
    AppUpdater.installUpdate();
    data.close();
  }

  function handleSkipClicked() {
    AppUpdater.abortUpdate();
    data.close();
  }
</script>

<MoltenModal {data}>
  <div slot="content" class="flex flex-col max-h-[80vh] gap-2 p-6">
    <span class="flex w-full text-4xl opacity-90">
      {`${$manager.info?.releaseName} (${$manager.info?.version})`}
    </span>

    <div
      class="px-10 py-5 bg-black bg-opacity-25 rounded w-full
            overflow-auto max-h-[50vh]"
    >
      <MarkdownContainer
        markdown={String($manager.info?.releaseNotes)}
        on:link-click={handleLinkClicked}
      />
    </div>
    <div class="flex flex-row gap-2 items-center justify-end w-full">
      <MoltenPushButton click={handleInstallUpdate} text={"Download"} />
      <MoltenPushButton click={handleSkipClicked} text="Skip" />
    </div>
  </div></MoltenModal
>
