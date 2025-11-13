<script lang="ts">
  import {
    MoltenPushButton,
    BlockRow,
    BlockTitle,
  } from "@intechstudio/grid-uikit";
  import { fetchAndExtract, saveFile } from "../firmware_update.ts";

  export let title: string;
  export let downloadUrl: string;
  export let fileFilter:
    | ((file: { filename: string; data: any }) => boolean)
    | undefined = undefined;
  export let fileLabel: ((filename: string) => string) | undefined = undefined;

  let files: { filename: string; data: any }[] = [];

  $: filteredFiles = fileFilter ? files.filter(fileFilter) : files;
</script>

<BlockRow>
  <BlockTitle>{title}</BlockTitle>

  {#if files.length === 0}
    <MoltenPushButton
      text="Download and Extract"
      click={async () => {
        files = await fetchAndExtract(downloadUrl);
      }}
    />
  {/if}

  {#each filteredFiles as file}
    <MoltenPushButton
      text={fileLabel ? fileLabel(file.filename) : file.filename}
      click={() => {
        saveFile(file.data, file.filename);
      }}
    />
  {/each}
</BlockRow>
