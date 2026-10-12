<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  import { EventType } from "@intechstudio/grid-protocol";
  import { libraryScriptToLua } from "../libraries/library-script";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "lib",
    name: "Library",
    rendering: "standard",
    category: "code",
    displayName: "Library",
    description: "Load Lua libraries from the page folder",
    // No rows: a fresh block loads nothing, so it can't break the Setup
    // with a require error before the file is on the module.
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
    eventTypes: [EventType.SETUP],
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { Architecture } from "@intechstudio/grid-protocol";
  import {
    Block,
    MeltCombo,
    MoltenPushButton,
    type MeltComboSuggestion,
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
    fileNameProblem,
    formatLibraryScript,
    globalNameProblem,
    isValidFile,
    isValidGlobal,
    parseLibraryScript,
    shadowsBuiltinGlobal,
  } from "../libraries/library-script";
  import { bundledLibraries, findLibraryByFile } from "../libraries/registry";
  import {
    type LibraryBinding,
    type LibraryStatus,
    deriveLibraryStatus,
    libraryAction,
  } from "../libraries/library-status";
  import {
    installLibrary,
    listPageLibraries,
    logLibraryVersion,
    readBoundLibraries,
    rerunSetup,
  } from "../libraries/library-device";
  import { pageNumberToFolderPath } from "../main/panels/FileManager/FileManager";
  import { mergeActionsToCode } from "../runtime/operations";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  let event = action.parent as GridEvent;
  let element = event.parent as GridElement;
  let page = element.parent as GridPage;
  let module = page.parent as GridModule;

  // Rows carry an id so each MeltCombo keeps its own row when one is removed.
  type EditRow = LibraryRow & { id: number };
  let nextId = 0;

  let rows: EditRow[] = [];
  let canonical = true;

  // An invalid action holds this block's own unfinished rows (see sendData);
  // the editor reverts it to the last valid script when the block closes.
  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    const parsed = parseLibraryScript(data.script);
    canonical = parsed !== null;
    if (parsed !== null && !sameRows(parsed, rows)) {
      setRows(parsed);
    }
  }

  function setRows(next: LibraryRow[]) {
    rows = next.map((e) => ({ global: e.global, file: e.file, id: nextId++ }));
  }

  function sameRows(a: LibraryRow[], b: LibraryRow[]) {
    return (
      a.length === b.length &&
      a.every((e, i) => e.global === b[i].global && e.file === b[i].file)
    );
  }

  function isValidRow(row: LibraryRow) {
    return isValidGlobal(row.global) && isValidFile(row.file);
  }

  // Dispatches only when the rows differ from what the action holds, so
  // opening or re-rendering the block never changes the Setup script.
  // Returns whether it dispatched.
  function sendData(): boolean {
    const plain = rows.map((e) => ({ global: e.global, file: e.file }));
    const valid = plain.every(isValidRow);
    const current = parseLibraryScript(action.script);

    if (valid && !$action.invalid && current !== null) {
      if (sameRows(plain, current)) {
        return false;
      }
    }

    dispatch("update-action", {
      short: information.short,
      script: valid ? libraryScriptToLua(plain) : formatLibraryScript(plain),
      validationError: !valid,
    });
    return true;
  }

  function syncWithGrid() {
    dispatch("sync");
  }

  function addRow() {
    rows = [...rows, { global: "", file: "", id: nextId++ }];
  }

  function removeRow(id: number) {
    rows = rows.filter((e) => e.id !== id);
    if (sendData()) {
      syncWithGrid();
    }
  }

  function handleGlobalInput(row: EditRow, value: string) {
    row.global = value;
    rows = rows;
    sendData();
  }

  function handleFileInput(row: EditRow, value: string) {
    row.file = value;
    const library = findLibraryByFile(value);
    if (row.global === "" && typeof library !== "undefined") {
      row.global = library.global;
    }
    rows = rows;
    sendData();
  }

  function handleConvertToCode() {
    mergeActionsToCode(event, false, action);
  }

  // Lua files in the page folder; undefined when the module can't be asked
  // (offline, virtual or the listing failed), which shows no status.
  let folderFiles: string[] | undefined = undefined;
  // What Setup bound to each row's global, by global name.
  let bindings: Record<string, LibraryBinding> = {};
  // Per row file: an action is running, or the last one failed.
  let busy: Record<string, boolean> = {};
  let actionErrors: Record<string, string | undefined> = {};
  let refreshToken = 0;

  // Asks the module on mount, after Install/Update/Reload and after a file
  // name is committed. A page change mounts the blocks of the new page, so it
  // refreshes too. No polling.
  async function refresh() {
    if (module.architecture === Architecture.VIRTUAL) {
      return;
    }
    const token = ++refreshToken;
    try {
      const files = (await listPageLibraries(page.pageNumber, module)).filter(
        isValidFile,
      );
      const globals = [
        ...new Set(rows.map((e) => e.global).filter(isValidGlobal)),
      ];
      const next = await readBoundLibraries(globals, module);
      if (token !== refreshToken) {
        return;
      }
      folderFiles = files;
      bindings = next;
      // Only a global Setup bound counts as loaded, so the log line is true.
      for (const row of rows) {
        const binding = next[row.global];
        if (
          files.includes(row.file) &&
          binding?.bound &&
          typeof binding.version !== "undefined"
        ) {
          logLibraryVersion(module, page.pageNumber, row.file, binding.version);
        }
      }
    } catch {
      if (token === refreshToken) {
        folderFiles = undefined;
        bindings = {};
      }
    }
  }

  onMount(refresh);

  function rowStatus(
    row: EditRow,
    files: string[] | undefined,
    bound: Record<string, LibraryBinding>,
  ): LibraryStatus {
    if (!isValidFile(row.file) || !isValidGlobal(row.global)) {
      return { kind: "unknown" };
    }
    return deriveLibraryStatus(
      row.file,
      files,
      bound[row.global],
      findLibraryByFile(row.file),
    );
  }

  function statusText(status: LibraryStatus, file: string): string {
    switch (status.kind) {
      case "missing":
        return `${file}.lua is missing in ${pageNumberToFolderPath(page.pageNumber)}`;
      case "not loaded":
        return `${file}.lua is there but not loaded`;
      case "present":
        return `present ${status.version ?? "(no version)"}`;
      case "older":
        return `older ${status.version} (bundled ${status.bundled})`;
      case "newer":
        return `newer ${status.version} than bundled ${status.bundled}`;
      default:
        return "";
    }
  }

  const ACTION_LABELS = {
    install: ["Install", "Installing..."],
    update: ["Update", "Updating..."],
    reload: ["Reload", "Reloading..."],
  };

  // Install and Update write the bundled source; all three then re-run this
  // element's Setup so the rows are bound without resending the config.
  async function handleLibraryAction(
    file: string,
    kind: "install" | "update" | "reload",
  ) {
    busy = { ...busy, [file]: true };
    actionErrors = { ...actionErrors, [file]: undefined };
    let written = false;
    try {
      const library = findLibraryByFile(file);
      if (kind !== "reload" && typeof library !== "undefined") {
        await installLibrary(library, page.pageNumber, module);
        written = true;
      }
      await rerunSetup(element.elementIndex, module);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      actionErrors = {
        ...actionErrors,
        [file]: written ? `Installed, but ${message}` : message,
      };
    } finally {
      await refresh();
      busy = { ...busy, [file]: false };
    }
  }

  let fileSuggestions: MeltComboSuggestion[];
  $: fileSuggestions = [
    ...bundledLibraries.map((e) => ({
      value: e.file.slice(0, -".lua".length),
      info: `${e.id} (bundled v${e.version})`,
    })),
    ...(folderFiles ?? [])
      .filter((e) => typeof findLibraryByFile(e) === "undefined")
      .map((e) => ({ value: e, info: `${e}.lua (page folder)` })),
  ];

  const globalSuggestions: MeltComboSuggestion[] = bundledLibraries.map(
    (e) => ({ value: e.global, info: `${e.global} (${e.id})` }),
  );

  function rowWarning(row: EditRow, all: EditRow[]): string | undefined {
    if (
      row.global !== "" &&
      all.filter((e) => e.global === row.global).length > 1
    ) {
      return `"${row.global}" is bound by more than one row, the last one wins`;
    }
    if (shadowsBuiltinGlobal(row.global)) {
      return `"${row.global}" replaces a built-in global for every script on the module`;
    }
    return undefined;
  }

  // An empty field of a new row is not an error yet, just unfinished.
  function rowError(row: EditRow): string | undefined {
    return (
      (row.global !== "" ? globalNameProblem(row.global) : undefined) ??
      (row.file !== "" ? fileNameProblem(row.file) : undefined)
    );
  }
</script>

<library-block class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  {#if canonical}
    <Block>
      {#each rows as row (row.id)}
        <div class="flex flex-col">
          <div class="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <MeltCombo
              title={"Global"}
              value={row.global}
              suggestions={globalSuggestions}
              validator={(e) => e === "" || isValidGlobal(e)}
              valueInfoEnabled={false}
              on:input={(e) => handleGlobalInput(row, e.detail.value)}
              on:change={syncWithGrid}
            />
            <MeltCombo
              title={"File"}
              value={row.file}
              suggestions={fileSuggestions}
              validator={(e) => e === "" || isValidFile(e)}
              valueInfoEnabled={false}
              on:input={(e) => handleFileInput(row, e.detail.value)}
              on:change={() => {
                syncWithGrid();
                refresh();
              }}
            />
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
          {#if rowError(row)}
            <span class="text-xs text-error">{rowError(row)}</span>
          {:else if rowWarning(row, rows)}
            <span class="text-xs text-warning">{rowWarning(row, rows)}</span>
          {/if}
          {#if !rowError(row)}
            {@const status = rowStatus(row, folderFiles, bindings)}
            {@const buttonAction = libraryAction(
              status,
              findLibraryByFile(row.file),
            )}
            {#if status.kind !== "unknown"}
              <div
                class="flex flex-row items-center gap-2"
                data-status={status.kind}
              >
                <span
                  class="text-xs"
                  class:text-warning={[
                    "missing",
                    "not loaded",
                    "older",
                  ].includes(status.kind)}
                  class:text-gray-500={["present", "newer"].includes(
                    status.kind,
                  )}>{statusText(status, row.file)}</span
                >
                {#if typeof buttonAction !== "undefined"}
                  <MoltenPushButton
                    text={ACTION_LABELS[buttonAction][busy[row.file] ? 1 : 0]}
                    disabled={busy[row.file] === true}
                    click={() => handleLibraryAction(row.file, buttonAction)}
                  />
                {/if}
              </div>
            {/if}
            {#if actionErrors[row.file]}
              <span class="text-xs text-error">{actionErrors[row.file]}</span>
            {/if}
          {/if}
        </div>
      {/each}
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
