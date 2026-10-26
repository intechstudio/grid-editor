<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  import { libraryScriptToLua } from "../libraries/library";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "lib",
    name: "Library",
    rendering: "standard",
    category: "code",
    displayName: "Library",
    description:
      "Load Lua libraries from the page folder for every element of the page",
    documentationUrl: "https://docs.intech.studio/wiki/actions/code/library",
    defaultLua: libraryScriptToLua([]),
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2.5Z"/><path d="M6 21h13v-2"/><path d="M8.5 7.5h6"/><path d="M8.5 11h4"/></svg>`,
    color: categoryColors["code"],
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
    editName: true,
    version: "2.0",
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { Architecture } from "@intechstudio/grid-protocol";
  import {
    Block,
    MeltSelect,
    MoltenPushButton,
  } from "@intechstudio/grid-uikit";
  import type {
    ActionData,
    GridAction,
    GridElement,
    GridEvent,
    GridModule,
    GridPage,
  } from "../runtime/runtime";
  import {
    type LibraryRow,
    areValidRows,
    bundledLibraries,
    findBundledLibrary,
    installLibrary,
    listPageLibraries,
    parseLibraryScript,
  } from "../libraries/library";
  import { pageNumberToFolderPath } from "../main/panels/FileManager/FileManager";
  import { mergeActionsToCode } from "../runtime/operations";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  let event = action.parent as GridEvent;
  let element = event.parent as GridElement;
  let page = element.parent as GridPage;
  let module = page.parent as GridModule;

  // Rows carry an id so each MeltSelect keeps its own row when one is removed.
  type EditRow = LibraryRow & { id: number };
  let nextId = 0;

  let rows: EditRow[] = [];
  let canonical = true;

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    const parsed = parseLibraryScript(data.script);
    canonical = parsed !== null;
    if (parsed !== null && !sameRows(parsed, rows)) {
      rows = parsed.map((e) => ({ ...e, id: nextId++ }));
    }
  }

  function sameRows(a: LibraryRow[], b: LibraryRow[]) {
    return (
      a.length === b.length &&
      a.every((e, i) => e.global === b[i].global && e.file === b[i].file)
    );
  }

  function sendData() {
    const plain = rows.map((e) => ({ global: e.global, file: e.file }));
    dispatch("update-action", {
      short: information.short,
      script: libraryScriptToLua(plain),
      validationError: !areValidRows(plain),
    });
  }

  function syncWithGrid() {
    dispatch("sync");
  }

  // Libraries no row loads yet: what Add Library and each row can pick.
  $: unused = bundledLibraries.filter(
    (e) => !rows.some((row) => row.file === e.file),
  );

  function optionsFor(row: EditRow, all: EditRow[]) {
    return bundledLibraries
      .filter((e) => e.file === row.file || !all.some((r) => r.file === e.file))
      .map((e) => ({ title: `${e.file}.lua`, value: e.file }));
  }

  function addRow() {
    const library = unused[0];
    if (typeof library === "undefined") {
      return;
    }
    rows = [...rows, { ...library, id: nextId++ }];
  }

  function removeRow(id: number) {
    rows = rows.filter((e) => e.id !== id);
  }

  // A picked library loads under its own global; every change the user makes
  // to the rows goes to the module right away.
  $: handleRowsEdited(rows);

  function handleRowsEdited(current: EditRow[]) {
    for (const row of current) {
      row.global = findBundledLibrary(row.file)?.global ?? "";
    }
    if (libraryScriptToLua(current) === $action.script) {
      return;
    }
    sendData();
    syncWithGrid();
    refresh();
  }

  function handleConvertToCode() {
    mergeActionsToCode(event, false, action);
  }

  // Lua files in the page folder; undefined when the module can't be asked.
  let folderFiles: string[] | undefined = undefined;
  let installing: string | undefined = undefined;
  let installError: string | undefined = undefined;

  // Shows the user which of the block's libraries are on the module.
  async function refresh() {
    if (module.architecture === Architecture.VIRTUAL) {
      return;
    }
    try {
      folderFiles = await listPageLibraries(page.pageNumber, module);
    } catch {
      folderFiles = undefined;
    }
  }

  onMount(refresh);

  // Lets the user install a missing bundled library and use it right away.
  async function handleInstall(file: string) {
    const library = findBundledLibrary(file);
    if (typeof library === "undefined") {
      return;
    }
    installing = file;
    installError = undefined;
    try {
      await installLibrary(library, page.pageNumber, module);
    } catch (e) {
      installError = e instanceof Error ? e.message : String(e);
    } finally {
      installing = undefined;
      await refresh();
    }
  }
</script>

<library-block class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  {#if canonical}
    <Block>
      {#each rows as row (row.id)}
        <div class="flex flex-col">
          <div class="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <MeltSelect
              title={"Library"}
              options={optionsFor(row, rows)}
              bind:target={row.file}
            />
            <div class="fixed-global">
              <span class="fixed-global-label">Global</span>
              <span class="fixed-global-value" data-global="fixed"
                >{row.global}</span
              >
            </div>
            <button
              on:click={() => removeRow(row.id)}
              class="flex group cursor-pointer mb-2"
              aria-label="Remove library"
            >
              <svg
                class="w-5 h-5 p-1 fill-current group-hover:text-white text-gray-500"
                viewBox="0 0 29 29"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z"
                />
                <path
                  d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z"
                />
              </svg>
            </button>
          </div>
          {#if typeof folderFiles !== "undefined"}
            {#if folderFiles.includes(row.file)}
              <span class="text-xs text-gray-500" data-status="present"
                >{row.file}.lua is on the module</span
              >
            {:else}
              <div
                class="flex flex-row items-center gap-2"
                data-status="missing"
              >
                <span class="text-xs text-warning"
                  >{row.file}.lua is missing in {pageNumberToFolderPath(
                    page.pageNumber,
                  )}</span
                >
                <MoltenPushButton
                  text={installing === row.file ? "Installing..." : "Install"}
                  disabled={typeof installing !== "undefined" ||
                    $action.invalid}
                  click={() => handleInstall(row.file)}
                />
              </div>
            {/if}
          {/if}
        </div>
      {/each}
      {#if installError}
        <span class="text-xs text-error">{installError}</span>
      {/if}
      {#if rows.length === 0}
        <span class="text-sm text-gray-500">No libraries loaded.</span>
      {/if}
      {#if unused.length > 0}
        <div class="self-center">
          <MoltenPushButton click={addRow} text={"Add Library"} />
        </div>
      {/if}
    </Block>
  {:else}
    <div class="flex flex-col gap-2">
      <span class="text-sm text-warning">
        This script is not in the Library block format, so it is shown as is.
        Edit it in a Code block.
      </span>
      <pre
        class="text-xs whitespace-pre-wrap break-all p-2 bg-background-mute">{$action.script}</pre>
      <div class="self-center">
        <MoltenPushButton
          click={handleConvertToCode}
          text={"Convert to Code Block"}
        />
      </div>
    </div>
  {/if}
</library-block>

<style>
  /* A library's global, as text laid out like a MeltSelect field */
  .fixed-global {
    display: flex;
    flex-direction: column;
    gap: 0.25em;
    cursor: default;
    user-select: none;
  }
  .fixed-global-label {
    color: var(--foreground);
    font-size: 0.875em;
    line-height: 1.25em;
  }
  .fixed-global-value {
    padding: 0.5em;
    border: 1px solid transparent;
    color: var(--foreground-muted);
  }
</style>
