<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import { MoltenPushButton, MeltSelect } from "@intechstudio/grid-uikit";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import type { GridRuntime } from "../../../runtime/runtime";
  import { grid, GridScript } from "@intechstudio/grid-protocol";
  import type { ModuleType } from "@intechstudio/grid-protocol";
  import { MonacoEditor } from "../../../lib/monaco";
  import { appSettings } from "../../../runtime/app-helper.store";
  import {
    fetchDirEntries,
    fetchFileContent,
    writeFileContent,
    invalidateLuaModule,
    createFile,
    createDir,
    renameEntry,
    copyFile,
    deleteFile,
  } from "./FileManager";
  import * as monaco from "monaco-editor";
  import {
    openEditorContext,
    closeEditorContext,
  } from "../../../lib/monaco-luals-client";

  let selectedModule: string = "";
  let moduleOptions: Array<{ title: string; value: string }> = [];

  function getModuleTypeName(type: ModuleType): string {
    if (typeof type === "object" && type.type) return type.type;
    return String(type);
  }

  function refreshModuleList() {
    const runtime = get(runtime_manager)?.active?.runtime;
    const modules = runtime?.modules || [];

    const newOptions = modules.map((module) => ({
      title: `Module [${module.dx}, ${module.dy}] - ${getModuleTypeName(module.type)}`,
      value: `${module.dx},${module.dy}`,
    }));

    // Only reassign when the options actually changed, to avoid needless
    // re-renders when the runtime store fires for unrelated updates.
    const changed =
      newOptions.length !== moduleOptions.length ||
      newOptions.some(
        (o, i) =>
          o.value !== moduleOptions[i]?.value ||
          o.title !== moduleOptions[i]?.title,
      );

    if (changed) {
      moduleOptions = newOptions;
    }

    if (
      newOptions.length > 0 &&
      !newOptions.some((o) => o.value === selectedModule)
    ) {
      selectedModule = newOptions[0].value;
      currentPath = "/";
    }
  }

  $: target = selectedModule
    ? (() => {
        const [dxStr, dyStr] = selectedModule.split(",");
        const dx = parseInt(dxStr) || 0;
        const dy = parseInt(dyStr) || 0;
        return get(runtime_manager).active?.runtime?.findModule(dx, dy) ?? null;
      })()
    : null;

  // ── Navigation ─────────────────────────────────────────────────────────────

  let currentPath = "/";
  let entries: DirEntry[] = [];
  let loading = false;
  let error: string | null = null;

  // Breadcrumb segments derived from currentPath, e.g. "/" → ["/"]
  // "/00/foo/" → ["/", "00", "foo"]
  $: breadcrumbs =
    currentPath === "/"
      ? ["/"]
      : ["/", ...currentPath.replace(/^\/|\/$/g, "").split("/")];

  function navigateTo(path: string) {
    currentPath = path;
    selectedEntry = null;
    fileContent = null;
    savedContent = null;
    rawContent = null;
    editor?.setValue("");
    cancelOp();
    listDirectory();
  }

  function onBreadcrumbClick(index: number) {
    if (index === 0) {
      navigateTo("/");
    } else {
      const segments = currentPath.replace(/^\/|\/$/g, "").split("/");
      navigateTo("/" + segments.slice(0, index).join("/") + "/");
    }
  }

  let selectedEntry: string | null = null;
  let clickTimer: ReturnType<typeof setTimeout> | null = null;

  function navigateUp() {
    const segments = currentPath
      .replace(/^\/|\/$/g, "")
      .split("/")
      .filter(Boolean);
    segments.pop();
    navigateTo(segments.length === 0 ? "/" : "/" + segments.join("/") + "/");
  }

  function onEntryClick(entry: DirEntry) {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      // Double-click
      if (entry.name === "..") {
        navigateUp();
      } else if (entry.name !== "." && entry.type === "dir") {
        navigateTo(currentPath + entry.name + "/");
      }
    } else {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        selectedEntry = entry.name;
        if (entry.type !== "dir") {
          readFile(entry.name);
        }
      }, 250);
    }
  }

  // ── File reading ───────────────────────────────────────────────────────────

  let fileContent: string | null = null;
  let savedContent: string | null = null;
  let rawContent: string | null = null;
  let readingFile = false;
  let downloadProgress: { current: number; total: number } | null = null;
  let savingFile = false;
  let uploadProgress: { current: number; total: number } | null = null;

  $: fileDirty = fileContent !== null && fileContent !== savedContent;

  let luaSyntaxError: string | null = null;

  const CHUNK_SIZE = 50; // raw content chars per write chunk — small for testing
  const READ_CHUNK_SIZE = 50; // bytes per read chunk — small for testing

  $: contentInfo = (() => {
    if (!fileContent || !selectedEntry) return null;
    try {
      const content =
        selectedLanguage === "lua"
          ? GridScript.compressScript(fileContent)
          : fileContent;
      luaSyntaxError = null;
      const bytes = content.length;
      const chunks = Math.max(1, Math.ceil(bytes / CHUNK_SIZE));
      return { bytes, chunks };
    } catch (e) {
      luaSyntaxError = String(e);
      return null;
    }
  })();

  let monacoElement: HTMLElement;
  let editor: MonacoEditor.CustomCodeEditor;
  let saveButton: HTMLElement;
  let lualsContextUri: string | null = null;
  let fileManagerEditorModel: ReturnType<
    typeof monaco.editor.createModel
  > | null = null;

  // Ctrl/Cmd+S saves the file, whether focus is somewhere in this section
  // outside Monaco or inside it: Monaco's own keybinding service consumes
  // the native keydown before it can bubble here on its own, so
  // MonacoEditor.create re-dispatches it as a synthetic, bubbling `keydown`
  // from the editor's DOM node, which this listener also catches. Either
  // way it triggers the Save button, which no-ops on its own when disabled.
  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      e.stopPropagation();
      saveButton?.querySelector("button")?.click();
    }
  }

  const languageOptions = [
    { title: "Plain Text", value: "plaintext" },
    { title: "Lua", value: "intech_lua" },
    { title: "TOML", value: "ini" },
  ];

  const extLanguageMap: Record<string, string> = {
    lua: "intech_lua",
    toml: "ini",
  };

  let selectedLanguage = "plaintext";

  function detectLanguage(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    return extLanguageMap[ext] ?? "plaintext";
  }

  $: if (editor && selectedLanguage) {
    const model = editor.getModel();
    if (model) monaco.editor.setModelLanguage(model, selectedLanguage);
    if (rawContent !== null) {
      try {
        const recalculated =
          selectedLanguage === "lua"
            ? GridScript.expandScript(rawContent)
            : rawContent;
        fileContent = recalculated;
        savedContent = recalculated;
        editor.setValue(recalculated);
      } catch (e) {
        luaSyntaxError = String(e);
      }
    }
    if (selectedLanguage === "intech_lua") {
      if (!lualsContextUri) {
        openEditorContext("").then((uri) => {
          lualsContextUri = uri;
        });
      }
    } else if (lualsContextUri) {
      closeEditorContext(lualsContextUri);
      lualsContextUri = null;
    }
  }

  onMount(() => {
    fileManagerEditorModel = monaco.editor.createModel(
      "",
      "plaintext",
      monaco.Uri.parse("file:///grid-editor/file-manager.lua"),
    );
    editor = MonacoEditor.create(monacoElement, {
      model: fileManagerEditorModel,
      theme: $appSettings.persistent.lightMode
        ? MonacoEditor.Theme.LIGHT
        : MonacoEditor.Theme.DARK,
      fontSize: $appSettings.persistent.fontSize,
      folding: false,
      renderLineHighlight: "none",
      fixedOverflowWidgets: true,
      contextmenu: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: "on",
      minimap: { enabled: false },
      lineNumbers: "on",
    });
    editor.onDidChangeModelContent(() => {
      if (fileContent !== null) {
        fileContent = editor.getValue();
      }
    });
  });

  onDestroy(() => {
    editor?.dispose();
    if (lualsContextUri) {
      closeEditorContext(lualsContextUri);
      lualsContextUri = null;
    }
    fileManagerEditorModel?.dispose();
  });

  $: if (editor) {
    MonacoEditor.setTheme(
      $appSettings.persistent.lightMode
        ? MonacoEditor.Theme.LIGHT
        : MonacoEditor.Theme.DARK,
    );
  }

  async function readFile(entry: string) {
    if (!target || entry === "." || entry === "..") {
      fileContent = null;
      savedContent = null;
      return;
    }
    const path = currentPath + entry;
    readingFile = true;
    downloadProgress = null;
    fileContent = null;
    savedContent = null;
    rawContent = null;
    try {
      const assembled = await fetchFileContent(
        path,
        target,
        READ_CHUNK_SIZE,
        (current, total) => {
          downloadProgress = { current, total };
        }, // pass callback function to update the downloadProgress
      );
      rawContent = assembled;
      selectedLanguage = detectLanguage(entry);
      try {
        fileContent =
          selectedLanguage === "lua"
            ? GridScript.expandScript(rawContent)
            : rawContent;
        luaSyntaxError = null;
      } catch (e) {
        fileContent = rawContent;
        luaSyntaxError = String(e);
      }
      savedContent = fileContent;
      editor?.setValue(fileContent ?? "");
    } catch (e) {
      fileContent = null;
      savedContent = null;
      rawContent = null;
    } finally {
      readingFile = false;
      downloadProgress = null;
    }
  }

  async function saveFile() {
    if (!target || !selectedEntry || fileContent === null) return;
    savingFile = true;
    uploadProgress = null;
    error = null;
    try {
      const path = currentPath + selectedEntry;

      let content: string;
      try {
        content =
          selectedLanguage === "lua"
            ? GridScript.compressScript(fileContent)
            : fileContent;
      } catch (e) {
        error = `Syntax error: ${e}`;
        return;
      }

      await writeFileContent(
        path,
        content,
        target,
        CHUNK_SIZE,
        (current, total) => {
          uploadProgress = { current, total };
        },
      );

      savedContent = fileContent;

      if (selectedEntry.toLowerCase().endsWith(".lua")) {
        const moduleName = selectedEntry.replace(/\.lua$/i, "");
        await invalidateLuaModule(moduleName, target);
      }
    } catch (e) {
      error = String(e);
    } finally {
      savingFile = false;
      uploadProgress = null;
    }
  }

  // ── File operations ────────────────────────────────────────────────────────

  type OpType = "newFile" | "newFolder" | "copy" | "rename";
  let activeOp: OpType | null = null;
  let opValue = "";
  let opInProgress = false;
  let opError: string | null = null;

  const opPlaceholder: Record<OpType, string> = {
    newFile: "new file name",
    newFolder: "new folder name",
    copy: "copy name",
    rename: "new name",
  };

  function startOp(op: OpType) {
    opError = null;
    opValue = op === "copy" || op === "rename" ? (selectedEntry ?? "") : "";
    activeOp = op;
  }

  function cancelOp() {
    activeOp = null;
    opValue = "";
    opError = null;
  }

  async function confirmOp() {
    if (!target || !activeOp || !opValue.trim()) return;
    opInProgress = true;
    opError = null;
    try {
      if (activeOp === "newFile") {
        await createFile(currentPath + opValue.trim(), target);
      } else if (activeOp === "newFolder") {
        await createDir(currentPath + opValue.trim(), target);
      } else if (activeOp === "rename") {
        if (!selectedEntry || opValue.trim() === selectedEntry) {
          cancelOp();
          return;
        }
        await renameEntry(
          currentPath + selectedEntry,
          currentPath + opValue.trim(),
          target,
        );
        selectedEntry = null;
      } else if (activeOp === "copy") {
        if (!selectedEntry || opValue.trim() === selectedEntry) {
          cancelOp();
          return;
        }
        await copyFile(
          currentPath + selectedEntry,
          currentPath + opValue.trim(),
          target,
        );
      }
      cancelOp();
      await listDirectory();
    } catch (e) {
      opError = String(e);
    } finally {
      opInProgress = false;
    }
  }

  async function deleteSelected() {
    if (!target || !selectedEntry) return;
    try {
      await deleteFile(currentPath + selectedEntry, target);
      selectedEntry = null;
      await listDirectory();
    } catch (e) {
      error = String(e);
    }
  }

  async function listDirectory() {
    if (!target) return;
    loading = true;
    error = null;
    try {
      entries = await fetchDirEntries(currentPath, target);
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  }

  $: if (target) {
    currentPath = "/";
    selectedEntry = null;
    fileContent = null;
    savedContent = null;
    rawContent = null;
    luaSyntaxError = null;
    editor?.setValue("");
    listDirectory();
  }

  let unsubscribeRuntimeManager: (() => void) | null = null;
  let unsubscribeActiveRuntime: (() => void) | null = null;

  function subscribeToActiveRuntime(runtime: GridRuntime | null) {
    unsubscribeActiveRuntime?.();
    unsubscribeActiveRuntime = null;
    if (runtime) {
      // Fires when modules connect/disconnect (reconnect) on the active runtime.
      unsubscribeActiveRuntime = runtime.subscribe(() => {
        refreshModuleList();
      });
    }
  }

  onMount(() => {
    refreshModuleList();

    let currentRuntime = get(runtime_manager)?.active?.runtime ?? null;
    subscribeToActiveRuntime(currentRuntime);

    // React to the active connection changing, and re-bind to its runtime.
    unsubscribeRuntimeManager = runtime_manager.subscribe((value) => {
      const nextRuntime = value?.active?.runtime ?? null;
      if (nextRuntime !== currentRuntime) {
        currentRuntime = nextRuntime;
        subscribeToActiveRuntime(nextRuntime);
      }
      refreshModuleList();
    });
  });

  onDestroy(() => {
    unsubscribeRuntimeManager?.();
    unsubscribeActiveRuntime?.();
  });
</script>

<container data-testid="file-manager" class="flex flex-col h-full p-4">
  <!-- Docs link -->
  <div class="flex flex-row mb-3">
    <button
      onclick={() =>
        window.electron.openInBrowser(
          "https://docs.intech.studio/wiki/more/file-manager/",
        )}
      class=" text-foreground-soft hover:text-foreground underline underline-offset-2 transition-colors"
    >
      Read the docs about File Manager
    </button>
  </div>
  <!-- Module selector -->
  <div class="flex flex-row gap-2 mb-2">
    <div class="flex-grow">
      {#key moduleOptions}
        <MeltSelect
          bind:target={selectedModule}
          options={moduleOptions}
          disabled={moduleOptions.length === 0}
        />
      {/key}
    </div>
    <MoltenPushButton click={refreshModuleList} text="Refresh" />
  </div>

  {#if target}
    <!-- Operations row -->
    {#if activeOp}
      <div class="flex flex-col gap-1">
        <div class="flex flex-row gap-2">
          <input
            class="flex-grow bg-transparent border border-white/20 rounded px-2 py-1 font-mono text-base outline-none focus:border-white/50"
            placeholder={opPlaceholder[activeOp]}
            bind:value={opValue}
            onkeydown={(e) => {
              if (e.key === "Enter") confirmOp();
              else if (e.key === "Escape") cancelOp();
            }}
          />
          <MoltenPushButton
            click={confirmOp}
            text={opInProgress ? "..." : "OK"}
            disabled={!opValue.trim() || opInProgress}
          />
          <MoltenPushButton click={cancelOp} text="Cancel" />
        </div>
        {#if opError}
          <p class="text-base text-red-400">{opError}</p>
        {/if}
      </div>
    {:else}
      <div class="flex flex-row gap-2 flex-wrap">
        <MoltenPushButton click={listDirectory} text="Refresh" />
        <MoltenPushButton click={() => startOp("newFile")} text="New File" />
        <MoltenPushButton
          click={() => startOp("newFolder")}
          text="New Folder"
        />
        <MoltenPushButton
          click={() => startOp("copy")}
          text="Copy"
          disabled={!selectedEntry ||
            selectedEntry === "." ||
            selectedEntry === ".."}
        />
        <MoltenPushButton
          click={() => startOp("rename")}
          text="Rename"
          disabled={!selectedEntry ||
            selectedEntry === "." ||
            selectedEntry === ".."}
        />
        <MoltenPushButton
          click={deleteSelected}
          text="Delete"
          disabled={!selectedEntry ||
            selectedEntry === "." ||
            selectedEntry === ".."}
        />
      </div>
    {/if}

    <!-- Path breadcrumb -->
    <div
      class="flex flex-row items-center gap-0.5 font-mono opacity-70 flex-wrap"
    >
      {#each breadcrumbs as segment, i}
        {#if i > 0}
          <span class="opacity-40">/</span>
        {/if}
        <button
          class="hover:opacity-100 hover:underline px-1 py-0.5 rounded {i ===
          breadcrumbs.length - 1
            ? 'opacity-100'
            : 'opacity-60'}"
          onclick={() => onBreadcrumbClick(i)}
        >
          {i === 0 ? "root" : segment}
        </button>
      {/each}
    </div>

    <!-- File list -->
    <div class="min-h-0">
      {#if error}
        <p
          class="text-sm text-error whitespace-pre-line max-h-24 overflow-y-auto select-text"
        >
          {error}
        </p>
      {:else if loading}
        <p class="text-base opacity-50">Loading...</p>
      {:else if entries.length === 0}
        <p class="text-base opacity-50">Empty directory.</p>
      {:else}
        <div class="flex flex-col overflow-y-auto gap-0.5 font-mono text-base">
          {#each entries as entry}
            <button
              class="flex items-center gap-2 px-2 py-1 rounded text-left w-full {selectedEntry ===
              entry.name
                ? 'bg-white/20'
                : 'hover:bg-white/10'}"
              onclick={() => onEntryClick(entry)}
            >
              <span class="opacity-50 shrink-0"
                >{entry.type === "dir" ? "📁" : "📄"}</span
              >
              <span class="truncate">{entry.name}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <p class="text-base opacity-50">No modules connected.</p>
  {/if}

  <div
    onkeydown={handleKeydown}
    class="border-t border-white/10 pt-2 flex flex-col gap-1 flex-grow min-h-0 {(fileContent ===
      null &&
      !readingFile) ||
    entries.find((e) => e.name === selectedEntry)?.type === 'dir'
      ? 'hidden'
      : ''}"
  >
    <div class="flex items-center gap-2">
      <p class="text-base opacity-50 font-mono flex-grow">
        {selectedEntry ?? ""}{fileDirty ? " •" : ""}
      </p>
      {#if contentInfo !== null}
        <span class="text-base font-mono opacity-50"
          >{contentInfo.bytes} B · {contentInfo.chunks} chunks</span
        >
      {/if}
      <div class="w-28">
        <MeltSelect bind:target={selectedLanguage} options={languageOptions} />
      </div>
      <MoltenPushButton
        click={() => {
          fileContent = savedContent;
          editor?.setValue(savedContent ?? "");
        }}
        text="Discard"
        disabled={!fileDirty}
      />
      <div bind:this={saveButton} class="contents">
        <MoltenPushButton
          click={saveFile}
          text={savingFile
            ? uploadProgress
              ? `${uploadProgress.current}/${uploadProgress.total}`
              : "..."
            : "Save"}
          disabled={!fileDirty || savingFile || !!luaSyntaxError}
        />
      </div>
    </div>
    {#if readingFile}
      <p class="text-base opacity-50">
        {downloadProgress
          ? `Reading ${downloadProgress.current}/${downloadProgress.total}`
          : "Reading..."}
      </p>
    {/if}
    <div
      bind:this={monacoElement}
      class="w-full flex-grow min-h-0 border border-white/20 rounded {readingFile
        ? 'hidden'
        : ''}"
    />
    {#if luaSyntaxError}
      <p
        class="text-sm text-error whitespace-pre-line max-h-24 overflow-y-auto font-mono"
      >
        {luaSyntaxError}
      </p>
    {/if}
  </div>
</container>
