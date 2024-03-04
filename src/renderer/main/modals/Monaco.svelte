<script>
  import { appSettings } from "/runtime/app-helper.store";
  import { watchResize } from "svelte-watch-resize";
  import MoltenPushButton from "./../panels/preferences/MoltenPushButton.svelte";
  import { onDestroy, onMount } from "svelte";
  import { grid } from "../../protocol/grid-protocol";
  import { modal } from "./modal.store";
  import MoltenModal from "./MoltenModal.svelte";

  import { debug_monitor_store } from "../panels/DebugMonitor/DebugMonitor.store";

  import { monaco_editor } from "../../lib/CustomMonaco";
  import { committed_code_store } from "../../config-blocks/Committed_Code.store";
  import { monaco_store } from "./Monaco.store";

  import { beforeUpdate, afterUpdate } from "svelte";

  import * as luamin from "lua-format";
  import stringManipulation from "../../main/user-interface/_string-operations";
  import { configManager } from "../panels/configuration/Configuration.store";

  let monaco_block;

  let monaco_disposables = [];

  let editor;

  let commitEnabled = false;
  let unsavedChanges = false;
  let errorMesssage = "";

  let scrollDown;
  let autoscroll;

  let editedConfig = undefined;
  let editedList = undefined;
  let scriptLength = undefined;

  class LengthError extends String {}

  $: handleFontSizechange($appSettings.persistent.fontSize);

  function handleFontSizechange(fontSize) {
    editor?.updateOptions({ fontSize: fontSize });
  }

  onMount(() => {
    //Make local copies
    editedList = $configManager.makeCopy();
    editedConfig = editedList[$monaco_store.index];

    //To be displayed in Editor
    const code_preview = expandCode(editedConfig.script);

    //Set initial code length
    scriptLength = editedList.toConfigScript().length;

    //Creating and configuring the editor
    editor = monaco_editor.create(monaco_block, {
      value: code_preview,
      language: "intech_lua",
      theme: "my-theme",
      fontSize: $appSettings.persistent.fontSize,

      folding: false,

      renderLineHighlight: "none",

      contextmenu: false,
      scrollBeyondLastLine: 0,
      automaticLayout: true,
      wordWrap: "on",
      suggest: {
        showIcons: false,
        showWords: true,
      },
      minimap: {
        enabled: false,
      },
    });

    editor.onDidChangeModelContent(() => {
      const editor_code = editor.getValue();
      unsavedChanges = true;

      try {
        //Throws error on syntax error
        editedConfig.script = minifyCode(editor_code);

        //Calculate length (this already includes the new value of referenceConfig)
        scriptLength = editedList.toConfigScript().length;

        //Check the minified config length
        if (scriptLength >= grid.getProperty("CONFIG_LENGTH")) {
          throw new LengthError("Config limit reached.");
        }

        //Everything is ok if no error was thrown previously
        errorMesssage = "";
        commitEnabled = true;

        //Syntax or Length Error
      } catch (e) {
        if (!(e instanceof LengthError)) {
          scriptLength = undefined;
        }
        commitEnabled = false;
        errorMesssage = e;
      }
    });
  });

  beforeUpdate(() => {
    autoscroll =
      scrollDown &&
      scrollDown.offsetHeight + scrollDown.scrollTop >
        scrollDown.scrollHeight - 20;
  });

  afterUpdate(() => {
    if (autoscroll && scrollDown)
      scrollDown.scrollTo(0, scrollDown.scrollHeight);
  });

  function handleCommit() {
    try {
      const editor_code = editor.getValue();
      const minifiedCode = minifyCode(editor_code);

      $committed_code_store = {
        script: minifiedCode,
        index: $monaco_store.index,
      };

      commitEnabled = false;
      unsavedChanges = false;
      errorMesssage = "";
    } catch (e) {
      console.warn(e);
    }
  }

  function expandCode(code) {
    let human = stringManipulation.humanize(code);
    try {
      let beautified = luamin.Beautify(human, {
        RenameVariables: false,
        RenameGlobals: false,
        SolveMath: false,
      });

      if (beautified.trim() === "") {
        return code;
      }

      if (beautified.charAt(0) === "\n") beautified = beautified.slice(1);
      return stringManipulation.noCommentToLineComment(beautified);
    } catch (e) {
      console.warn(e);
      return human;
    }
  }

  function minifyCode(code) {
    const short_code = stringManipulation.shortify(code);
    const line_commented_code =
      stringManipulation.blockCommentToLineComment(short_code);

    var safe_code = String(
      stringManipulation.lineCommentToNoComment(line_commented_code)
    );
    const luaminOptions = {
      RenameVariables: false, // Should it change the variable names? (L_1_, L_2_, ...)
      RenameGlobals: false, // Not safe, rename global variables? (G_1_, G_2_, ...) (only works if RenameVariables is set to true)
      SolveMath: false, // Solve math? (local a = 1 + 1 => local a = 2, etc.)
    };

    try {
      const result = luamin.Minify(safe_code, luaminOptions);
      return result;
    } catch (e) {
      throw `Syntax Error: ${e}`;
    }
  }

  onDestroy(() => {
    monaco_disposables.forEach((element) => {
      element.dispose();
    });
  });

  function handleClose(e) {
    modal.close();
  }

  function handleResize(e) {
    editor?.layout();
  }
</script>

<div id="modal-copy-placeholder" />

<MoltenModal>
  <div
    slot="content"
    class="h-full w-full text-white relative flex flex-col gap-2 items-start overflow-x-clip"
    use:watchResize={handleResize}
  >
    <div class="flex flex-row w-full items-center">
      <div class="flex flex-col text-white">
        <div>Code Editor</div>
        <div class="opacity-70">
          <span
            >{`Character Count: ${
              typeof scriptLength === "undefined" ? "?" : scriptLength
            }/${grid.getProperty("CONFIG_LENGTH") - 1} (max)`}</span
          >
        </div>
      </div>

      <div
        class="flex flex-row flex-grow flex-wrap justify-end items-center h-full gap-2"
      >
        <div class="flex flex-col">
          <div
            class="text-right text-sm {unsavedChanges
              ? 'text-yellow-600'
              : 'text-green-500'} "
          >
            {unsavedChanges ? "Unsaved changes!" : "Synced with Grid!"}
          </div>
          <div class="text-right text-sm text-error">
            {errorMesssage}
          </div>
        </div>

        <div class="flex flex-row flex-wrap gap-2 justify-end">
          <MoltenPushButton
            on:click={handleCommit}
            disabled={!commitEnabled}
            text="Commit"
            style="accept"
          />

          <MoltenPushButton
            on:click={handleClose}
            text="Close"
            style="normal"
          />
        </div>
      </div>
    </div>

    <div
      id="monaco-container"
      class="{$$props.class} flex h-full w-full bg-black bg-opacity-20 border border-black"
    >
      <div bind:this={monaco_block} class="flex w-full h-full" />
    </div>

    <span class="mt-2">Debug Text:</span>
    <div
      bind:this={scrollDown}
      class="flex-col w-full h-80 flex overflow-y-auto bg-primary border border-black"
    >
      {#each $debug_monitor_store as debug, i}
        <span class="debugtexty px-1 py-1 font-mono text-white">{debug}</span>
      {/each}
    </div>
  </div>
</MoltenModal>

<style global>
  .debugtexty:nth-child(even) {
    @apply bg-black;
    @apply bg-opacity-20;
  }
  .monaco-editor .suggest-widget {
    width: 250px !important;
    overflow: hidden !important;
  }
  .line-editor .monaco-editor .suggest-widget {
    position: absolute !important;
    left: 0 !important;
  }

  #monaco-container .monaco-editor {
    position: absolute !important;
  }
</style>
