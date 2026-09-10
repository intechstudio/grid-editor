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
    type DirEntry,
  } from "./FileManager";
  import * as monaco from "monaco-editor";
  import {
    openEditorContext,
    closeEditorContext,
  } from "../../../lib/monaco-luals-client";

  // Monaco language id for Grid Lua files.
  const LUA_LANGUAGE_ID = "intech_lua";

  // Electron's sandbox blocks File System Access API writes even where the
  // API exists, so imports there fall back to hidden <input type="file">
  // pickers — same split as theme CSS import/export (CustomThemeEditor.svelte).
  const isElectron = import.meta.env.VITE_BUILD_TARGET !== "web";

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
        selectedLanguage === LUA_LANGUAGE_ID
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
    { title: "Lua", value: LUA_LANGUAGE_ID },
    { title: "TOML", value: "ini" },
  ];

  const extLanguageMap: Record<string, string> = {
    lua: LUA_LANGUAGE_ID,
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
          selectedLanguage === LUA_LANGUAGE_ID
            ? GridScript.expandScript(rawContent)
            : rawContent;
        fileContent = recalculated;
        savedContent = recalculated;
        editor.setValue(recalculated);
      } catch (e) {
        luaSyntaxError = String(e);
      }
    }
    if (selectedLanguage === LUA_LANGUAGE_ID) {
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
          selectedLanguage === LUA_LANGUAGE_ID
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
          selectedLanguage === LUA_LANGUAGE_ID
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

  // ── File export (to OS) ─────────────────────────────────────────────────

  let exporting = false;

  // Exports rawContent (the exact on-device bytes, before any Lua
  // expand/compress transform) so the downloaded file matches what's
  // actually stored — same byte-per-char convention as writeFileContent's
  // reverse, readBytesAsString.
  async function exportFile() {
    if (!selectedEntry || rawContent === null) return;
    exporting = true;
    error = null;
    try {
      const bytes = new Uint8Array(rawContent.length);
      for (let i = 0; i < rawContent.length; i++) {
        bytes[i] = rawContent.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/octet-stream" });
      const filename = selectedEntry;

      if (!isElectron && window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      }
      // Electron (and any browser without the File System Access API): the
      // same anchor-tag download trick used for firmware saves
      // (firmware_update.ts saveFile()) and theme CSS export
      // (CustomThemeEditor.svelte) — Electron's sandbox blocks
      // createWritable() even when showSaveFilePicker is available.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") error = String(e);
    } finally {
      exporting = false;
    }
  }

  // ── File import (from OS) ────────────────────────────────────────────────

  let importing = false;
  let importProgress: {
    current: number;
    total: number;
    name: string;
    chunkCurrent: number;
    chunkTotal: number;
  } | null = null;
  let importFileInput: HTMLInputElement;
  let importFolderInput: HTMLInputElement;

  // Any subfolders an import needs (from relative paths like "sub/file.lua")
  // must exist on the module before writeFileContent can target them.
  async function ensureDirectories(relPaths: string[]) {
    const dirs = new Set<string>();
    for (const relPath of relPaths) {
      const segments = relPath.split("/").slice(0, -1);
      let acc = "";
      for (const segment of segments) {
        acc = acc ? `${acc}/${segment}` : segment;
        dirs.add(acc);
      }
    }
    for (const dir of [...dirs].sort(
      (a, b) => a.split("/").length - b.split("/").length,
    )) {
      try {
        await createDir(currentPath + dir, target!);
      } catch {
        // Already exists — fine, directories are created top-down anyway.
      }
    }
  }

  // The module's protocol is byte-oriented — evaluate-parser.ts decodes
  // replies with String.fromCharCode(byte) for every byte — so content
  // handed to writeFileContent must use that same one-char-per-byte mapping.
  // file.text() UTF-8-decodes instead, which turns non-UTF-8 bytes (any
  // binary file) into replacement characters that corrupt the Lua command
  // sent over serial and hang the write in an infinite retry loop. Reading
  // raw bytes and mapping them directly avoids that for both text and
  // binary files.
  async function readBytesAsString(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let content = "";
    const CHUNK = 0x2000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      content += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return content;
  }

  async function importItems(items: { relPath: string; file: File }[]) {
    if (!target || items.length === 0) return;
    importing = true;
    error = null;
    const failures: string[] = [];
    try {
      await ensureDirectories(items.map((i) => i.relPath));
      for (let i = 0; i < items.length; i++) {
        const { relPath, file } = items[i];
        importProgress = {
          current: i + 1,
          total: items.length,
          name: relPath,
          chunkCurrent: 0,
          chunkTotal: 0,
        };
        try {
          const bytes = await readBytesAsString(file);
          // Match saveFile(): .lua content is authored/edited in expanded
          // (human-readable) form but the module only runs the compressed
          // syntax, so it needs the same transform on the way in.
          const content =
            detectLanguage(relPath) === LUA_LANGUAGE_ID
              ? GridScript.compressScript(bytes)
              : bytes;
          await writeFileContent(
            currentPath + relPath,
            content,
            target,
            CHUNK_SIZE,
            (chunkCurrent, chunkTotal) => {
              importProgress = { ...importProgress!, chunkCurrent, chunkTotal };
            },
          );
        } catch (e) {
          failures.push(`${relPath}: ${e}`);
        }
      }
      if (failures.length > 0) {
        error = `Failed to import:\n${failures.join("\n")}`;
      }
    } finally {
      importing = false;
      importProgress = null;
      await listDirectory();
    }
  }

  async function importFiles() {
    if (!isElectron && window.showOpenFilePicker) {
      try {
        const handles = await window.showOpenFilePicker({ multiple: true });
        const files = await Promise.all(handles.map((h) => h.getFile()));
        await importItems(files.map((f) => ({ relPath: f.name, file: f })));
      } catch (e) {
        if ((e as DOMException)?.name !== "AbortError") error = String(e);
      }
      return;
    }
    // Electron (and any browser without the File System Access API): a
    // hidden native file input, same fallback used for theme CSS import
    // (CustomThemeEditor.svelte).
    importFileInput.click();
  }

  function handleImportFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = "";
    importItems(files.map((f) => ({ relPath: f.name, file: f })));
  }

  async function importFolder() {
    if (!isElectron && window.showDirectoryPicker) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        const items: { relPath: string; file: File }[] = [];
        async function walk(handle: any, prefix: string) {
          for await (const [name, entry] of handle.entries()) {
            if (entry.kind === "file") {
              items.push({
                relPath: prefix + name,
                file: await entry.getFile(),
              });
            } else {
              await walk(entry, `${prefix}${name}/`);
            }
          }
        }
        await walk(dirHandle, "");
        await importItems(items);
      } catch (e) {
        if ((e as DOMException)?.name !== "AbortError") error = String(e);
      }
      return;
    }
    // Electron fallback: webkitdirectory input yields a flat FileList where
    // each entry's webkitRelativePath is "<pickedFolderName>/sub/file.ext" —
    // strip that leading segment to match the web picker's relative paths.
    importFolderInput.click();
  }

  function handleImportFolderInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = "";
    const items = files.map((f) => {
      const parts = (f as any).webkitRelativePath.split("/");
      parts.shift();
      return { relPath: parts.join("/"), file: f };
    });
    importItems(items);
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
    <input
      bind:this={importFileInput}
      type="file"
      multiple
      class="hidden"
      onchange={handleImportFileInput}
    />
    <input
      bind:this={importFolderInput}
      type="file"
      webkitdirectory
      multiple
      class="hidden"
      onchange={handleImportFolderInput}
    />
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
          click={importFiles}
          text={importing
            ? `${importProgress?.current ?? 0}/${importProgress?.total ?? 0}`
            : "Import File(s)"}
          disabled={importing}
        />
        <MoltenPushButton
          click={importFolder}
          text={importing
            ? `${importProgress?.current ?? 0}/${importProgress?.total ?? 0}`
            : "Import Folder"}
          disabled={importing}
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

    {#if importProgress}
      <p class="text-base opacity-50 font-mono truncate">
        Importing {importProgress.current}/{importProgress.total}: {importProgress.name}
        {#if importProgress.chunkTotal > 0}
          ({importProgress.chunkCurrent}/{importProgress.chunkTotal} chunks)
        {/if}
      </p>
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

  <!-- svelte-ignore a11y-no-static-element-interactions -->
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
        click={exportFile}
        text={exporting ? "..." : "Export"}
        disabled={rawContent === null || exporting}
      />
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
    ></div>
    {#if luaSyntaxError}
      <p
        class="text-sm text-error whitespace-pre-line max-h-24 overflow-y-auto font-mono"
      >
        {luaSyntaxError}
      </p>
    {/if}
  </div>
</container>
