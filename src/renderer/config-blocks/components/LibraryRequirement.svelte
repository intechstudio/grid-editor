<script lang="ts">
  // A block that needs a bundled library on the module. It reads the page
  // folder like the Library block does, and says when the module has no copy
  // or an older one than the editor's. `blocked` is then true, so the block
  // can disable its controls, and the Install (or Update) button puts the
  // editor's copy on the module. A module that can't be asked (a virtual
  // one) blocks nothing.
  import { onMount } from "svelte";
  import { Architecture } from "@intechstudio/grid-protocol";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import type {
    GridAction,
    GridElement,
    GridEvent,
    GridModule,
    GridPage,
  } from "../../runtime/runtime";
  import {
    type BundledLibrary,
    installLibrary,
    libraryRowStatus,
    pageLibraries,
    pageLibrariesKey,
    readPageLibraries,
  } from "../../lib/library";
  import { pageNumberToFolderPath } from "../../main/panels/FileManager/FileManager";

  export let action: GridAction;
  // The library's file name in the page folder, and the global it exports.
  export let file: string;
  export let global: string;
  // True while the module lacks the editor's version of the library.
  export let blocked = false;

  const event = action.parent as GridEvent;
  const element = event.parent as GridElement;
  const page = element.parent as GridPage;
  const module = page.parent as GridModule;

  const folder = pageNumberToFolderPath(page.pageNumber);
  const filesKey = pageLibrariesKey(page.pageNumber, module);

  $: files = $pageLibraries.get(filesKey);
  $: status = libraryRowStatus({ file, global }, files, folder);

  // The editor's copy that should be on the module, when it isn't.
  $: replacement = ((): BundledLibrary | undefined => {
    switch (status.kind) {
      case "missing":
        return status.library;
      case "present":
        return status.outdated;
      default:
        return undefined;
    }
  })();
  $: blocked = typeof replacement !== "undefined";

  let installing = false;
  let progress = 0;
  let installError: string | undefined = undefined;

  async function refresh() {
    if (module.architecture === Architecture.VIRTUAL) {
      return;
    }
    await readPageLibraries(page.pageNumber, module);
  }

  onMount(refresh);

  async function handleInstall() {
    if (typeof replacement === "undefined") {
      return;
    }
    installing = true;
    progress = 0;
    installError = undefined;
    try {
      await installLibrary(
        replacement,
        page.pageNumber,
        module,
        (percent) => (progress = percent),
      );
    } catch (e) {
      installError = e instanceof Error ? e.message : String(e);
    } finally {
      installing = false;
      await refresh();
    }
  }

  $: isUpdate = status.kind === "present";
  $: label = isUpdate ? "Update library" : "Install library";
</script>

{#if blocked}
  <div class="flex flex-col gap-2" data-library-requirement>
    <span class="text-sm text-warning" data-status={status.kind}>
      {#if status.kind === "present"}
        {file}.lua {status.version} on the module is older than the editor's {status
          .outdated?.version}. Update it to use this block.
      {:else}
        {file}.lua is missing in {folder}. Install it to use this block.
      {/if}
    </span>
    <div class="self-start">
      <MoltenPushButton
        text={installing
          ? `${isUpdate ? "Updating" : "Installing"}... ${progress}%`
          : label}
        disabled={installing}
        click={handleInstall}
      />
    </div>
    {#if installError}
      <span class="text-xs text-error">{installError}</span>
    {/if}
  </div>
{/if}
