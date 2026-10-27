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
      "Load Lua libraries from the page folder for the elements of the page",
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
  import { Block, MeltCombo, MoltenPushButton } from "@intechstudio/grid-uikit";
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
    type LibraryRowStatus,
    areValidRows,
    globalForFile,
    globalsLoadedBefore,
    installLibrary,
    librarySuggestions,
    libraryRowStatus,
    pageLibraries,
    pageLibrariesKey,
    parseLibraryScript,
    readPageLibraries,
  } from "../libraries/library";
  import { pageNumberToFolderPath } from "../main/panels/FileManager/FileManager";
  import { mergeActionsToCode } from "../runtime/operations";
  import { logger } from "../runtime/runtime.store";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  let event = action.parent as GridEvent;
  let element = event.parent as GridElement;
  let page = element.parent as GridPage;
  let module = page.parent as GridModule;

  const folder = pageNumberToFolderPath(page.pageNumber);
  const filesKey = pageLibrariesKey(page.pageNumber, module);

  // Rows carry an id so each MeltCombo keeps its own row when one is removed.
  // `input` is what the user typed or picked; `rejected` is an input the
  // block couldn't load, shown with its error until the user picks again.
  // A new row has no file until the user picks one the block can load.
  type EditRow = LibraryRow & { id: number; input: string; rejected?: string };
  let nextId = 0;

  let rows: EditRow[] = [];
  let canonical = true;

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    const parsed = parseLibraryScript(data.script);
    canonical = parsed !== null;
    if (parsed !== null && !sameRows(parsed, loadedRows(rows))) {
      rows = parsed.map((e) => ({ ...e, id: nextId++, input: e.file }));
    }
  }

  function sameRows(a: LibraryRow[], b: LibraryRow[]) {
    return (
      a.length === b.length &&
      a.every((e, i) => e.global === b[i].global && e.file === b[i].file)
    );
  }

  // Lua files in the page folder with their headers; undefined until read,
  // and always on a virtual module, which has no files.
  $: files = $pageLibraries.get(filesKey);

  $: suggestions = librarySuggestions(files);

  // Libraries no row loads yet: what Add Library can pick.
  $: unused = suggestions.filter(
    (e) => !rows.some((row) => row.file === e.value),
  );

  $: statuses = rows.map((row) => rowStatus(row, files));

  function loadedRows(all: EditRow[]) {
    return all.filter((e) => e.file !== "");
  }

  function rowStatus(row: EditRow, current: typeof files): LibraryRowStatus {
    if (row.file === "" && typeof row.rejected === "undefined") {
      return { kind: "unknown" };
    }
    if (typeof row.rejected !== "undefined" && typeof current === "undefined") {
      return {
        kind: "error",
        message: `${row.rejected}.lua isn't bundled and the module's files can't be read`,
      };
    }
    const file = row.rejected ?? row.file;
    return libraryRowStatus({ file, global: row.global }, current, folder);
  }

  // Globals an earlier Library block of the page already loads.
  $: loadedBefore = rows && globalsLoadedBefore(action);

  function duplicateProblem(row: EditRow, all: EditRow[]) {
    if (row.file === "") {
      return undefined;
    }
    const earlier = loadedRows(all.slice(0, all.indexOf(row)));
    if (earlier.some((e) => e.file === row.file)) {
      return `${row.file}.lua is already loaded in this block`;
    }
    if (earlier.some((e) => e.global === row.global)) {
      return `${row.global} is already loaded in this block`;
    }
    if (loadedBefore.has(row.global)) {
      return `${row.global} is already loaded by an earlier Library block`;
    }
    return undefined;
  }

  function versionText(status: LibraryRowStatus) {
    switch (status.kind) {
      case "present":
        return status.version;
      case "missing":
        return status.library.version;
      case "unknown":
        return status.version ?? "-";
      default:
        return "-";
    }
  }

  // Every change the user makes to the rows goes to the module right away.
  function commit() {
    const plain = loadedRows(rows).map((e) => ({
      global: e.global,
      file: e.file,
    }));
    if (!areValidRows(plain)) {
      return;
    }
    dispatch("update-action", {
      short: information.short,
      script: libraryScriptToLua(plain),
      validationError: false,
    });
    dispatch("sync");
  }

  // A picked file loads under the global its header declares. A file the
  // editor can't read a header for stays on the row with its error, and
  // the block keeps loading what it loaded before.
  function handleFileChange(row: EditRow) {
    const global = globalForFile(row.input, files);
    if (typeof global === "undefined") {
      row.rejected = row.input;
      rows = rows;
      logUnavailable([row], files);
      return;
    }
    row.rejected = undefined;
    row.file = row.input;
    row.global = global;
    rows = rows;
    commit();
  }

  // Adds the first library no row loads yet, or an empty row for the user
  // to pick or type a file into.
  function addRow() {
    const suggestion = unused[0];
    const global =
      typeof suggestion === "undefined"
        ? undefined
        : globalForFile(suggestion.value, files);
    if (typeof global === "undefined") {
      rows = [...rows, { file: "", global: "", id: nextId++, input: "" }];
      return;
    }
    rows = [
      ...rows,
      { file: suggestion.value, global, id: nextId++, input: suggestion.value },
    ];
    commit();
  }

  function removeRow(id: number) {
    rows = rows.filter((e) => e.id !== id);
    commit();
  }

  function handleConvertToCode() {
    mergeActionsToCode(event, false, action);
  }

  // Tells the user in the editor log which libraries can't load, because
  // the module doesn't have them and the editor has no copy to install.
  function logUnavailable(target: EditRow[], current: typeof files) {
    for (const row of target) {
      const status = rowStatus(row, current);
      if (status.kind === "unavailable") {
        logger.set({
          type: "fail",
          mode: 0,
          classname: "libraryunavailable",
          message: status.message,
        });
      }
    }
  }

  let installing: string | undefined = undefined;
  let installError: string | undefined = undefined;

  // Shows the user which of the block's libraries are on the module.
  async function refresh() {
    if (module.architecture === Architecture.VIRTUAL) {
      return;
    }
    const read = await readPageLibraries(page.pageNumber, module);
    logUnavailable(rows, read);
  }

  onMount(refresh);

  // Lets the user install a row's missing bundled library and use it right
  // away. An "Install all" would run this for each row in turn.
  async function handleInstall(row: EditRow) {
    const status = rowStatus(row, files);
    if (status.kind !== "missing" || typeof row.rejected !== "undefined") {
      return;
    }
    installing = row.file;
    installError = undefined;
    try {
      await installLibrary(status.library, page.pageNumber, module);
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
      {#each rows as row, i (row.id)}
        {@const status = statuses[i] ?? rowStatus(row, files)}
        {@const duplicate = duplicateProblem(row, rows)}
        <div class="flex flex-col">
          <div
            class="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2 items-end"
          >
            <MeltCombo
              title={"Library"}
              {suggestions}
              placeholder={"file in " + folder}
              bind:value={row.input}
              on:change={() => handleFileChange(row)}
            />
            <div class="fixed-text">
              <span class="fixed-text-label">Global</span>
              <span class="fixed-text-value" data-global="fixed"
                >{row.global || "-"}</span
              >
            </div>
            <div class="fixed-text">
              <span class="fixed-text-label">Version</span>
              <span class="fixed-text-value" data-version
                >{versionText(status)}</span
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
          {#if duplicate}
            <span class="text-xs text-error" data-status="duplicate"
              >{duplicate}</span
            >
          {/if}
          {#if status.kind === "present"}
            <span class="text-xs text-gray-500" data-status="present"
              >{row.file}.lua is on the module{status.bundledVersion
                ? ` · bundled ${status.bundledVersion}`
                : ""}</span
            >
          {:else if status.kind === "missing"}
            <div class="flex flex-row items-center gap-2" data-status="missing">
              <span class="text-xs text-warning"
                >{row.file}.lua is missing in {folder}</span
              >
              <MoltenPushButton
                text={installing === row.file ? "Installing..." : "Install"}
                disabled={typeof installing !== "undefined" || $action.invalid}
                click={() => handleInstall(row)}
              />
            </div>
          {:else if status.kind === "unavailable" || status.kind === "error"}
            <span class="text-xs text-error" data-status={status.kind}
              >{status.message}</span
            >
          {/if}
        </div>
      {/each}
      {#if installError}
        <span class="text-xs text-error">{installError}</span>
      {/if}
      {#if rows.length === 0}
        <span class="text-sm text-gray-500">No libraries loaded.</span>
      {/if}
      <div class="self-center">
        <MoltenPushButton click={addRow} text={"Add Library"} />
      </div>
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
  /* A library's global and version, as text laid out like a MeltCombo field */
  .fixed-text {
    display: flex;
    flex-direction: column;
    gap: 0.25em;
    cursor: default;
    user-select: none;
  }
  .fixed-text-label {
    color: var(--foreground);
    font-size: 0.875em;
    line-height: 1.25em;
  }
  .fixed-text-value {
    padding: 0.5em;
    border: 1px solid transparent;
    color: var(--foreground-muted);
  }
</style>
