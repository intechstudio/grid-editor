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
    downloadProgress = null;
    fileContent = null;
    savedContent = null;
    rawContent = null;
    try {
      const sizeResult = await sendLua(
        `local f=io.open(${JSON.stringify(path)},"r") if not f then return nil end local n=0 local c=f:read(256) while c do n=n+#c c=f:read(256) end f:close() return n`,
        target.dx,
        target.dy,
      );
      if (sizeResult[0] == null) {
        throw new Error("Could not read file size");
      }
      const fileSize = Number(sizeResult[0]);

      let assembled = "";
      if (fileSize > 0) {
        const totalChunks = Math.ceil(fileSize / READ_CHUNK_SIZE);
        for (let i = 0; i < totalChunks; i++) {
          const offset = i * READ_CHUNK_SIZE;
          const result = await sendLua(
            `local f=io.open(${JSON.stringify(path)},"r") if not f then return nil end f:seek("set",${offset}) local c=f:read(${READ_CHUNK_SIZE}) f:close() collectgarbage("collect") return c`,
            target.dx,
            target.dy,
          );
          if (result[0] == null) {
            throw new Error(`Read failed at chunk ${i + 1}/${totalChunks}`);
          }
          assembled += String(result[0]);
          downloadProgress = { current: i + 1, total: totalChunks };
        }
      }

      rawContent = assembled;
      selectedLanguage = detectLanguage(entry);
      fileContent =
        selectedLanguage === "lua"
          ? GridScript.expandScript(rawContent)
          : rawContent;
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
      const tmpPath = path + ".tmp";

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

      const expectedSize = content.length;

      // Split on raw content boundaries so escape sequences are never split
      const rawChunks: string[] = [];
      for (let i = 0; i < content.length; i += CHUNK_SIZE) {
        rawChunks.push(content.slice(i, i + CHUNK_SIZE));
      }
      if (rawChunks.length === 0) rawChunks.push("");

      for (let i = 0; i < rawChunks.length; i++) {
        const mode = i === 0 ? "w" : "a";
        const escaped = luaEscape(rawChunks[i]);
        const lua = `local f=io.open(${JSON.stringify(tmpPath)},"${mode}") if not f then return false end f:write("${escaped}") f:close() collectgarbage("collect") return true`;
        const result = await sendLua(lua, target.dx, target.dy, false);
        if (result[0] !== true) {
          error = `Write failed at chunk ${i + 1}/${rawChunks.length}`;
          return;
        }
        uploadProgress = { current: i + 1, total: rawChunks.length };
      }

      const renameResult = await sendLua(
        `return os.rename(${JSON.stringify(tmpPath)}, ${JSON.stringify(path)})`,
        target.dx,
        target.dy,
      );
      if (renameResult[0] !== true) {
        error = `Rename failed: ${renameResult[1] ?? "unknown"}`;
        return;
      }

      const sizeResult = await sendLua(
        `local f=io.open(${JSON.stringify(path)},"r") if not f then return nil end local n=0 local c=f:read(256) while c do n=n+#c c=f:read(256) end f:close() return n`,
        target.dx,
        target.dy,
      );
      const actualSize = sizeResult[0];
      if (actualSize !== expectedSize) {
        error = `Size mismatch: expected ${expectedSize} B, got ${actualSize} B`;
        return;
      }

      savedContent = fileContent;

      if (selectedEntry.toLowerCase().endsWith(".lua")) {
        const moduleName = selectedEntry.replace(/\.lua$/i, "");
        await sendLua(
          `package.loaded[${JSON.stringify(moduleName)}] = nil`,
          target.dx,
          target.dy,
        );
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
        const path = currentPath + opValue.trim();
        const lua = `local f=io.open(${JSON.stringify(path)},"w") if not f then return false end f:close() return true`;
        const result = await sendLua(lua, target.dx, target.dy);
        if (result[0] !== true) {
          opError = "Failed to create file.";
          return;
        }
      } else if (activeOp === "newFolder") {
        const path = currentPath + opValue.trim();
        const lua = `return dirent.mkdir(${JSON.stringify(path)})`;
        const result = await sendLua(lua, target.dx, target.dy);
        if (result[0] !== true) {
          opError = `Failed to create folder: ${result[1] ?? "unknown error"}`;
          return;
        }
      } else if (activeOp === "rename") {
        if (!selectedEntry || opValue.trim() === selectedEntry) {
          cancelOp();
          return;
        }
        const oldPath = currentPath + selectedEntry;
        const newPath = currentPath + opValue.trim();
        const lua = `return os.rename(${JSON.stringify(oldPath)}, ${JSON.stringify(newPath)})`;
        const result = await sendLua(lua, target.dx, target.dy);
        if (result[0] !== true) {
          opError = `Rename failed: ${result[1] ?? "unknown error"}`;
          return;
        }
        selectedEntry = null;
      } else if (activeOp === "copy") {
        if (!selectedEntry || opValue.trim() === selectedEntry) {
          cancelOp();
          return;
        }
        const srcPath = currentPath + selectedEntry;
        const dstPath = currentPath + opValue.trim();
        const lua = `local s=io.open(${JSON.stringify(srcPath)},"r") if not s then return false,"open src failed" end local d=io.open(${JSON.stringify(dstPath)},"w") if not d then s:close() return false,"open dst failed" end local c=s:read(256) while c do d:write(c) c=s:read(256) end s:close() d:close() return true`;
        const result = await sendLua(lua, target.dx, target.dy);
        if (result[0] !== true) {
          opError = `Copy failed: ${result[1] ?? "unknown error"}`;
          return;
        }
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
            name: String(row[1]),
            type: row[2] === 2 ? "dir" : "file",
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
    <!-- Path breadcrumb -->
    <div
      class="flex flex-row items-center gap-0.5 font-mono text-xs opacity-70 flex-wrap"
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

    <!-- Operations row -->
    {#if activeOp}
      <div class="flex flex-col gap-1">
        <div class="flex flex-row gap-2">
          <input
            class="flex-grow bg-transparent border border-white/20 rounded px-2 py-1 font-mono text-sm outline-none focus:border-white/50"
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
          <p class="text-xs text-red-400">{opError}</p>
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
      {#if contentInfo !== null}
        <span class="text-xs font-mono opacity-50"
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
    {#if luaSyntaxError}
      <p class="text-xs text-red-400 font-mono">{luaSyntaxError}</p>
    {/if}
    {#if readingFile}
      <p class="text-sm opacity-50">
        {downloadProgress
          ? `Reading ${downloadProgress.current}/${downloadProgress.total}`
          : "Reading..."}
      </p>
    {/if}
    <div
      bind:this={monacoElement}
      class="w-full h-48 border border-white/20 rounded {readingFile
        ? 'hidden'
        : ''}"
    />
  </div>
</div>
