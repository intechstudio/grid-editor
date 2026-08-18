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
    ((file: { filename: string; data: any }) => boolean) | undefined =
    undefined;
  export let fileLabel: ((filename: string) => string) | undefined = undefined;

  let files: { filename: string; data: any }[] = [];
  let error = false;

  $: filteredFiles =
    fileFilter && files ? files.filter(fileFilter) : files || [];
</script>

<BlockRow>
  <div style="color: var(--foreground-muted);">
    <BlockTitle>{title}</BlockTitle>
  </div>

  {#if files.length === 0}
    <MoltenPushButton
      text={error ? "Retry Download" : "Download and Extract"}
      click={async () => {
        try {
          error = false;
          const result = await fetchAndExtract(downloadUrl);
          if (result && result.length > 0) {
            files = result;
          } else {
            error = true;
            files = [];
          }
        } catch (e) {
          console.error("Download failed:", e);
          error = true;
          files = [];
        }
      }}
    />
  {/if}

  {#if error}
    <span class="text-error text-sm"
      >Download failed. Please check the URL and try again.</span
    >
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
