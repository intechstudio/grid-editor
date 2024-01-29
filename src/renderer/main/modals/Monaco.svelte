<script>
  import MoltenPushButton from "./../panels/preferences/MoltenPushButton.svelte";
  import { onDestroy, onMount } from "svelte";
  import { modal } from "./modal.store.ts";
  import grid from "../../protocol/grid-protocol.js";
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

  let modalWidth;
  let modalHeight;

  let scrollDown;
  let autoscroll;

  let editedConfig = undefined;
  let editedList = undefined;
  let scriptLength = undefined;

  class LengthError extends String {}

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
      fontSize: 12,

      folding: false,

      renderLineHighlight: "none",

      contextmenu: false,
      scrollBeyondLastLine: 0,
      wordWrap: "on",
      suggest: {
        showIcons: false,
        showWords: true,
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
        if (scriptLength >= grid.properties.CONFIG_LENGTH) {
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

  $: if (modalWidth || modalHeight) {
    if (editor !== undefined) {
      editor.layout();
    }
  }

  function handleClickOutside(e) {
    if (!commitEnabled) {
      handleClose(e);
    }
  }

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
      console.error(e);
    }
  }

  let modalElement;

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
      console.error(e);
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
</script>

<svelte:window bind:innerWidth={modalWidth} bind:innerHeight={modalHeight} />

<div id="modal-copy-placeholder" />

<MoltenModal>
  <div
    slot="content"
    class=" h-[400px] text-white relative flex flex-col items-start"
  >
    <div class="flex-col w-full flex justify-between items-center mb-2">
      <div class="flex flex-row w-full justify-between items-center">
        <div class="flex flex-col h-full">
          <div class="flex w-full opacity-70">Edit Code</div>
          <div class="flex w-full opacity-40">
            <span class="mr-2">Character Count:</span>
            {typeof scriptLength === "undefined" ? "?" : scriptLength}
            <span>/</span>
            <span>{grid.properties.CONFIG_LENGTH - 1}</span>
          </div>
        </div>

        <div class="flex flex-row items-center h-full gap-2">
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
      class="flex-col w-full h-full flex justify-between bg-black bg-opacity-20 py-2"
    >
      <div
        bind:this={monaco_block}
        class="flex-col w-full h-full flex justify-between"
      />
    </div>

    <div
      bind:this={scrollDown}
      class="flex-col w-full h-1/3 flex overflow-y-scroll bg-secondary"
    >
      {#each $debug_monitor_store as debug, i}
        <span class="debugtexty px-1 py-1 font-mono text-white">{debug}</span>
      {/each}
    </div>
  </div>
</MoltenModal>

<style global>
  .debugtexty:nth-child(even) {
    @apply bg-select;
  }
  .monaco-editor .suggest-widget {
    width: 250px !important;
    overflow: hidden !important;
  }
  .line-editor .monaco-editor .suggest-widget {
    position: absolute !important;
    left: 0 !important;
  }
</style>
