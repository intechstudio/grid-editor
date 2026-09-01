<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import {
    appSettings,
    DEFAULT_CUSTOM_THEME_CSS,
    THEME_PRESET_CSS,
  } from "../../../runtime/app-helper.store";
  import { MonacoEditor } from "../../../lib/monaco";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  let monaco_block: HTMLElement;
  let editor: MonacoEditor.CustomCodeEditor | undefined;
  let disposables: { dispose: () => void }[] = [];
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  // Set around editor.setValue() calls we make ourselves (theme-follow sync,
  // reset), so handleContentChange can tell those apart from a real
  // keystroke — setValue() fires onDidChangeModelContent synchronously just
  // like typing does, so without this guard loading a preset's source would
  // itself look like an edit and jump the radio to Custom.
  let isProgrammaticChange = false;
  // "custom" has a persisted, user-owned source (customThemeCss); the named
  // presets (dark/moss/sunset/icy) show their own real override block from
  // grid-uikit's theme.css (see THEME_PRESET_CSS).
  function sourceForTheme(theme: string): string {
    if (theme === "custom") {
      return $appSettings.persistent.customThemeCss || DEFAULT_CUSTOM_THEME_CSS;
    }
    return THEME_PRESET_CSS[theme] ?? DEFAULT_CUSTOM_THEME_CSS;
  }

  // Syntax-only validation. Browsers are very fault-tolerant of CSS (custom
  // properties in particular accept almost any token as a value, and
  // malformed rules are typically dropped rather than thrown), so this only
  // catches genuinely malformed input — not typo'd variable names or
  // otherwise-valid-but-meaningless declarations.
  function validateCss(css: string): string {
    try {
      new CSSStyleSheet().replaceSync(css);
      return "";
    } catch (e) {
      return `Invalid CSS: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  let validationError = "";
  // "idle": just viewing a preset's source, nothing to save.
  // "pending": debounce running after a real edit.
  // "saved": the edit was just persisted.
  let saveState: "idle" | "pending" | "saved" = "idle";

  // Tracks the theme the editor's content currently reflects, so the
  // reactive block below only reacts to genuine external theme switches
  // (e.g. the radio group) and not to our own edit-triggered jump to
  // "custom" (handleContentChange preempts this before writing to the
  // store) or to unrelated appSettings churn (Svelte reruns this block on
  // every store update, since it subscribes to the whole store).
  let lastSyncedTheme: string | undefined;

  $: if (editor) {
    editor.updateOptions({ fontSize: $appSettings.persistent.fontSize });
  }

  $: if (editor) {
    MonacoEditor.setTheme(
      $appSettings.persistent.lightMode
        ? MonacoEditor.Theme.LIGHT
        : MonacoEditor.Theme.DARK,
    );
  }

  $: if (editor && $appSettings.persistent.theme !== lastSyncedTheme) {
    syncThemeSource($appSettings.persistent.theme);
  }

  function syncThemeSource(theme: string) {
    lastSyncedTheme = theme;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }
    const expected = sourceForTheme(theme);
    if (editor && editor.getValue() !== expected) {
      isProgrammaticChange = true;
      editor.setValue(expected);
      isProgrammaticChange = false;
    }
    validationError = validateCss(expected);
    saveState = "idle";
  }

  onMount(async () => {
    await tick();

    const theme = $appSettings.persistent.theme;
    lastSyncedTheme = theme;

    editor = MonacoEditor.create(monaco_block, {
      value: sourceForTheme(theme),
      language: "css",
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
      fixedOverflowWidgets: true,
      minimap: { enabled: false },
      lineNumbers: "off",
      lineNumbersMinChars: 0,
      glyphMargin: false,
      lineDecorationsWidth: 0,
    });

    disposables.push(editor.onDidChangeModelContent(handleContentChange));
    validationError = validateCss(sourceForTheme(theme));

    // onDestroy only fires if this component unmounts while the app keeps
    // running (e.g. navigating away from Preferences) — if the app quits
    // outright with an edit still inside the debounce window, that's the
    // only chance to flush it before the renderer tears down.
    window.addEventListener("beforeunload", commitPendingChange);
  });

  // Writes the current editor content to the store as the new custom theme.
  // Called from the debounce below, and flushed immediately on destroy —
  // otherwise closing Preferences (or the app) within the debounce window
  // silently drops the last edit instead of persisting it.
  function commitPendingChange() {
    if (!debounceTimer) return;
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
    const value = editor?.getValue() ?? "";
    validationError = validateCss(value);
    saveState = "saved";
    // Preempt the reactive sync above so it doesn't treat this as an
    // external theme switch and reload the editor mid-edit.
    lastSyncedTheme = "custom";
    appSettings.update((s) => {
      s.persistent.customThemeCss = value;
      s.persistent.theme = "custom";
      return s;
    });
  }

  // Debounced so every keystroke doesn't trigger an electron-store disk
  // write. Editing any theme's source jumps Color Theme to Custom.
  function handleContentChange() {
    if (isProgrammaticChange) return;
    saveState = "pending";
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(commitPendingChange, 400);
  }

  // Loads css into the editor as the new custom theme, immediately
  // persisted (not debounced) — shared by Reset/Import, which both replace
  // the whole buffer in one shot rather than incrementally like typing.
  function applyCss(css: string) {
    if (!editor) return;
    lastSyncedTheme = "custom";
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }
    isProgrammaticChange = true;
    editor.setValue(css);
    isProgrammaticChange = false;
    validationError = validateCss(css);
    saveState = "saved";
    appSettings.update((s) => {
      s.persistent.customThemeCss = css;
      s.persistent.theme = "custom";
      return s;
    });
  }

  let fileInput: HTMLInputElement;

  async function exportThemeCss() {
    const css = editor?.getValue() ?? "";
    const filename = "grid-editor-theme.css";
    const isElectron = import.meta.env.VITE_BUILD_TARGET !== "web";

    try {
      if (!isElectron && window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: "CSS", accept: { "text/css": [".css"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(css);
        await writable.close();
        return;
      }
      // Electron (and any browser without the File System Access API): the
      // same anchor-tag download trick used for firmware saves
      // (firmware_update.ts saveFile()) — Electron's sandbox blocks
      // createWritable() even when showSaveFilePicker is available.
      const blob = new Blob([css], { type: "text/css" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") {
        console.error("Failed to export theme CSS:", e);
      }
    }
  }

  async function importThemeCss() {
    const isElectron = import.meta.env.VITE_BUILD_TARGET !== "web";

    if (!isElectron && window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: "CSS", accept: { "text/css": [".css"] } }],
          multiple: false,
        });
        const file = await handle.getFile();
        applyCss(await file.text());
      } catch (e) {
        if ((e as DOMException)?.name !== "AbortError") {
          console.error("Failed to import theme CSS:", e);
        }
      }
      return;
    }
    // Electron (and any browser without the File System Access API): a
    // hidden native file input sidesteps the same sandbox restriction that
    // pushes exports onto the anchor-download fallback above — there's no
    // existing "open a local file" precedent elsewhere in the app to copy.
    fileInput.click();
  }

  async function handleFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    applyCss(await file.text());
  }

  onDestroy(() => {
    window.removeEventListener("beforeunload", commitPendingChange);
    commitPendingChange();
    disposables.forEach((d) => d.dispose());
    editor?.dispose();
  });
</script>

<div class="flex flex-col gap-2">
  <div
    bind:this={monaco_block}
    class="relative flex w-full border border-background-soft"
    style="height: 320px"
  ></div>
  {#if validationError}
    <div class="text-left text-sm text-error whitespace-pre-line">
      {validationError}
    </div>
  {:else if saveState === "pending"}
    <div class="text-left text-sm text-yellow-600">Editing…</div>
  {:else if saveState === "saved"}
    <div class="text-left text-sm text-green-500">Applied</div>
  {/if}
  <input
    bind:this={fileInput}
    type="file"
    accept=".css,text/css"
    class="hidden"
    on:change={handleFileInputChange}
  />
  <div class="flex flex-row gap-2">
    <MoltenPushButton
      text="Export theme"
      style="normal"
      click={exportThemeCss}
    />
    <MoltenPushButton
      text="Import theme"
      style="normal"
      click={importThemeCss}
    />
  </div>
</div>
