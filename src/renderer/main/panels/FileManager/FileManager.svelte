<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import { MoltenPushButton, MeltSelect } from "@intechstudio/grid-uikit";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import { grid, GridScript } from "@intechstudio/grid-protocol";
  import {
    InstructionClassName,
    InstructionClass,
  } from "../../../runtime/engine.store";
  import {
    parseEvaluateResponse,
    type LuaValue,
    type LuaTable,
  } from "../../../serialport/evaluate-parser";
  import type { ModuleType } from "@intechstudio/grid-protocol";
  import SendEvaluate from "../DebugMonitor/SendEvaluate.svelte";
  import { MonacoEditor } from "../../../lib/monaco";
  import { appSettings } from "../../../runtime/app-helper.store";
  import * as monaco from "monaco-editor";

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

    moduleOptions = newOptions;

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
        return { dx: parseInt(dxStr) || 0, dy: parseInt(dyStr) || 0 };
      })()
    : null;

  // ── Lua evaluate helper ────────────────────────────────────────────────────

  async function sendLua(
    code: string,
    dx: number,
    dy: number,
    compress = true,
  ): Promise<LuaValue[]> {
    const runtime = get(runtime_manager).active?.runtime;
    if (!runtime) throw new Error("No runtime");

    const script = `<?lua ${compress ? GridScript.compressScript(code) : code} ?>`;
    const size = script.length.toString(16).padStart(4, "0");
    const classBody = `\x02086e0001` + `04` + size + script + `\x03`;
    const classArray: number[] = Array.from(classBody, (c) => c.charCodeAt(0));
    classArray.push(0x04);

    const dummyDescr = {
      brc_parameters: { DX: dx, DY: dy },
      class_name: InstructionClassName.IMMEDIATE,
      class_instr: InstructionClass.EXECUTE,
      class_parameters: { ACTIONLENGTH: 0, ACTIONSTRING: "" },
    };
    const encoded = grid.encode_packet(dummyDescr);
    if (!encoded) throw new Error("Packet encode failed");

    const brcHeader: number[] = encoded.serial.slice(0, 23);
    const messageArray: number[] = [...brcHeader, ...classArray];

    const lenHex = messageArray.length.toString(16).padStart(4, "0");
    for (let i = 0; i < 4; i++) {
      messageArray[2 + i] = lenHex.charCodeAt(i);
    }

    const checksum = messageArray.reduce((a, b) => a ^ b);
    const checksumHex = checksum.toString(16).padStart(2, "0");
    messageArray.push(checksumHex.charCodeAt(0));
    messageArray.push(checksumHex.charCodeAt(1));
    messageArray.push(10);

    const descr = await runtime.connection.buffer.sendRawDataToGrid(
      new Uint8Array(messageArray),
      {
        dx,
        dy,
        responseRequired: true,
        filter: {
          class_name: "EVALUATE",
          brc_parameters: {},
          class_parameters: {},
        },
        responseTimeout: 5000,
      },
    );
    return parseEvaluateResponse(descr);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  let currentPath = "/";
  type DirEntry = { name: string; type: "file" | "dir" };
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
    cancelRename();
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
        readFile(entry.name);
      }, 250);
    }
  }

  // ── Lua string escaping ────────────────────────────────────────────────────

  function luaEscape(s: string): string {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\0/g, "\\0")
      .replace(/[\x01-\x1f\x7f-\xff]/g, (c) => `\\${c.charCodeAt(0)}`);
  }

  // ── File reading ───────────────────────────────────────────────────────────

  let fileContent: string | null = null;
  let savedContent: string | null = null;
  let rawContent: string | null = null;
  let readingFile = false;
  let savingFile = false;

  $: fileDirty = fileContent !== null && fileContent !== savedContent;

  let luaSyntaxError: string | null = null;

  $: savePacketSize = (() => {
    if (!fileContent || !selectedEntry) return null;
    try {
      const path = currentPath + selectedEntry;
      const content =
        selectedLanguage === "lua"
          ? GridScript.compressScript(fileContent)
          : fileContent;
      luaSyntaxError = null;
      const lua = `local f=io.open(${JSON.stringify(path)},"w") if not f then return false end f:write("${luaEscape(content)}") f:close() return true`;
      return `<?lua ${lua} ?>`.length;
    } catch (e) {
      luaSyntaxError = String(e);
      return null;
    }
  })();

  let monacoElement: HTMLElement;
  let editor: MonacoEditor.CustomCodeEditor;

  const languageOptions = [
    { title: "Plain Text", value: "plaintext" },
    { title: "Lua", value: "lua" },
    { title: "TOML", value: "ini" },
  ];

  const extLanguageMap: Record<string, string> = {
    lua: "lua",
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
  }

  onMount(() => {
    editor = MonacoEditor.create(monacoElement, {
      value: "",
      language: "plaintext",
      theme: $appSettings.persistent.lightMode
        ? MonacoEditor.Theme.LIGHT
        : MonacoEditor.Theme.DARK,
      fontSize: $appSettings.persistent.fontSize,
      folding: false,
      renderLineHighlight: "none",
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
    fileContent = null;
    savedContent = null;
    try {
      const lua = `local f = io.open(${JSON.stringify(path)}, "r") if not f then return nil end local c = f:read("*a") f:close() return c`;
      const result = await sendLua(lua, target.dx, target.dy);
      rawContent = result[0] != null ? String(result[0]) : null;
      selectedLanguage = detectLanguage(entry);
      fileContent =
        rawContent !== null && selectedLanguage === "lua"
          ? GridScript.expandScript(rawContent)
          : rawContent;
      savedContent = fileContent;
      editor?.setValue(fileContent ?? "");
    } catch (e) {
      fileContent = null;
      savedContent = null;
    } finally {
      readingFile = false;
    }
  }

  async function saveFile() {
    if (!target || !selectedEntry || fileContent === null) return;
    savingFile = true;
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
      const lua = `local f=io.open(${JSON.stringify(path)},"w") if not f then return false end f:write("${luaEscape(content)}") f:close() return true`;
      const result = await sendLua(lua, target.dx, target.dy, false);
      if (result[0] === true) {
        savedContent = fileContent;
        // Invalidate Lua require() cache so the updated module is picked up next call
        const moduleName = selectedEntry.replace(/\.lua$/i, "");
        if (selectedEntry.toLowerCase().endsWith(".lua")) {
          await sendLua(
            `package.loaded[${JSON.stringify(moduleName)}] = nil`,
            target.dx,
            target.dy,
          );
        }
      } else {
        error = `Save failed: ${JSON.stringify(result)}`;
      }
    } catch (e) {
      error = String(e);
    } finally {
      savingFile = false;
    }
  }

  // ── File operations ────────────────────────────────────────────────────────

  let newFileName = "";
  let creating = false;
  let createError: string | null = null;

  let renaming = false;
  let renameValue = "";

  function startRename() {
    if (!selectedEntry) return;
    renameValue = selectedEntry;
    renaming = true;
  }

  function cancelRename() {
    renaming = false;
    renameValue = "";
  }

  async function confirmRename() {
    if (
      !target ||
      !selectedEntry ||
      !renameValue.trim() ||
      renameValue === selectedEntry
    ) {
      cancelRename();
      return;
    }
    const oldPath = currentPath + selectedEntry;
    const newPath = currentPath + renameValue.trim();
    const lua = `return os.rename(${JSON.stringify(oldPath)}, ${JSON.stringify(newPath)})`;
    try {
      const result = await sendLua(lua, target.dx, target.dy);
      if (result[0] !== true) {
        error = `Rename failed: ${result[1] ?? "unknown error"}`;
        return;
      }
      selectedEntry = null;
      cancelRename();
      await listDirectory();
    } catch (e) {
      error = String(e);
    }
  }

  async function deleteSelected() {
    if (!target || !selectedEntry) return;
    const path = currentPath + selectedEntry;
    const lua = `return os.remove(${JSON.stringify(path)})`;
    try {
      await sendLua(lua, target.dx, target.dy);
      selectedEntry = null;
      await listDirectory();
    } catch (e) {
      error = String(e);
    }
  }

  async function createFile() {
    if (!target || !newFileName.trim()) return;
    creating = true;
    createError = null;
    try {
      const path = currentPath + newFileName.trim();
      const lua = `local f = io.open(${JSON.stringify(path)}, "w") if not f then return false end f:close() return true`;
      const result = await sendLua(lua, target.dx, target.dy);
      if (result[0] === true) {
        newFileName = "";
        await listDirectory();
      } else {
        createError = "Failed to create file.";
      }
    } catch (e) {
      createError = String(e);
    } finally {
      creating = false;
    }
  }

  async function createDirectory() {
    if (!target || !newFileName.trim()) return;
    creating = true;
    createError = null;
    try {
      const path = currentPath + newFileName.trim();
      const lua = `return dirent.mkdir(${JSON.stringify(path)})`;
      const result = await sendLua(lua, target.dx, target.dy);
      if (result[0] === true) {
        newFileName = "";
        await listDirectory();
      } else {
        createError = `Failed to create directory: ${result[1] ?? "unknown error"}`;
      }
    } catch (e) {
      createError = String(e);
    } finally {
      creating = false;
    }
  }

  async function listDirectory() {
    if (!target) return;
    loading = true;
    error = null;
    try {
      const lua = `return dirent.list(${JSON.stringify(currentPath)})`;
      const result = await sendLua(lua, target.dx, target.dy);
      const table = result[0] as LuaTable | null;
      if (table && typeof table === "object") {
        entries = Object.values(table).map((v) => {
          const row = v as LuaTable;
          return {
            name: String(row["name"]),
            type: row["type"] === "dir" ? "dir" : "file",
          } as DirEntry;
        });
      } else {
        entries = [];
      }
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

  onMount(() => {
    refreshModuleList();
  });
</script>

<div class="w-full h-full flex flex-col p-4 gap-2 overflow-hidden">
  <!-- Module selector -->
  <div class="flex flex-row gap-2">
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
    <!-- Path breadcrumb + actions -->
    <div class="flex flex-row items-center gap-2">
      <div
        class="flex flex-row items-center gap-0.5 font-mono text-xs opacity-70 flex-wrap flex-grow"
      >
        {#each breadcrumbs as segment, i}
          {#if i > 0}
            <span class="opacity-40">/</span>
          {/if}
          <button
            class="hover:opacity-100 hover:underline px-0.5 rounded {i ===
            breadcrumbs.length - 1
              ? 'opacity-100'
              : 'opacity-60'}"
            onclick={() => onBreadcrumbClick(i)}
          >
            {segment}
          </button>
        {/each}
      </div>
      <MoltenPushButton
        click={startRename}
        text="Rename"
        disabled={!selectedEntry ||
          selectedEntry === "." ||
          selectedEntry === ".." ||
          renaming}
      />
      <MoltenPushButton
        click={deleteSelected}
        text="Delete"
        disabled={!selectedEntry ||
          selectedEntry === "." ||
          selectedEntry === ".."}
      />
    </div>

    {#if renaming}
      <div class="flex flex-row gap-2">
        <input
          class="flex-grow bg-transparent border border-white/20 rounded px-2 py-1 font-mono text-sm outline-none focus:border-white/50"
          bind:value={renameValue}
          onkeydown={(e) => {
            if (e.key === "Enter") confirmRename();
            else if (e.key === "Escape") cancelRename();
          }}
        />
        <MoltenPushButton
          click={confirmRename}
          text="OK"
          disabled={!renameValue.trim()}
        />
        <MoltenPushButton click={cancelRename} text="Cancel" />
      </div>
    {/if}

    <!-- File list -->
    {#if error}
      <p class="text-sm text-red-400 select-text">{error}</p>
    {:else if loading}
      <p class="text-sm opacity-50">Loading...</p>
    {:else if entries.length === 0}
      <p class="text-sm opacity-50">Empty directory.</p>
    {:else}
      <div class="flex flex-col overflow-y-auto gap-0.5 font-mono text-sm">
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
  {:else}
    <p class="text-sm opacity-50">No modules connected.</p>
  {/if}

  <div
    class="border-t border-white/10 pt-2 flex flex-col gap-1 {fileContent ===
      null && !readingFile
      ? 'hidden'
      : ''}"
  >
    <div class="flex items-center gap-2">
      <p class="text-xs opacity-50 font-mono flex-grow">
        {selectedEntry ?? ""}{fileDirty ? " •" : ""}
      </p>
      {#if savePacketSize !== null}
        <span class="text-xs font-mono opacity-50">{savePacketSize} B</span>
      {/if}
      <div class="w-28">
        <MeltSelect bind:target={selectedLanguage} options={languageOptions} />
      </div>
      <MoltenPushButton
        click={saveFile}
        text={savingFile ? "..." : "Save"}
        disabled={!fileDirty || savingFile || !!luaSyntaxError}
      />
    </div>
    {#if luaSyntaxError}
      <p class="text-xs text-red-400 font-mono">{luaSyntaxError}</p>
    {/if}
    {#if readingFile}
      <p class="text-sm opacity-50">Reading...</p>
    {/if}
    <div
      bind:this={monacoElement}
      class="w-full h-48 border border-white/20 rounded {readingFile
        ? 'hidden'
        : ''}"
    />
  </div>

  {#if target}
    <div class="border-t border-white/10 pt-2 flex flex-col gap-1">
      <div class="flex flex-row gap-2">
        <input
          class="flex-grow bg-transparent border border-white/20 rounded px-2 py-1 font-mono text-sm outline-none focus:border-white/50"
          placeholder="new file name"
          bind:value={newFileName}
          onkeydown={(e) => e.key === "Enter" && createFile()}
        />
        <MoltenPushButton
          click={createFile}
          text={creating ? "..." : "File"}
          disabled={!newFileName.trim() || creating}
        />
        <MoltenPushButton
          click={createDirectory}
          text={creating ? "..." : "Folder"}
          disabled={!newFileName.trim() || creating}
        />
      </div>
      {#if createError}
        <p class="text-xs text-red-400">{createError}</p>
      {/if}
    </div>

    <div class="border-t border-white/10 pt-2">
      <SendEvaluate {target} />
    </div>
  {/if}
</div>
