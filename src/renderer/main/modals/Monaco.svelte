<script>
  import { onDestroy, onMount } from "svelte";
  import { appSettings } from "../../runtime/app-helper.store";
  import grid from "../../protocol/grid-protocol.js";

  import { clickOutside } from "../_actions/click-outside.action";

  import { debug_monitor_store } from "../panels/DebugMonitor/DebugMonitor.store";

  import { monaco_editor, monaco_languages } from "../../lib/CustomMonaco";

  import { beforeUpdate, afterUpdate } from "svelte";

  import * as luamin from "lua-format";
  import stringManipulation from "../../main/user-interface/_string-operations";
  import _utils from "../../runtime/_utils.js";
  import { attachment } from "../user-interface/Monster.store";
  import {
    ConfigTarget,
    ConfigList,
  } from "../panels/configuration/Configuration.store";

  import { luadebug_store } from "../../runtime/runtime.store";

  let monaco_block;

  let monaco_disposables = [];

  let editor;

  let commitState = 0;

  let error_messsage = "";

  let modalWidth;
  let modalHeight;

  let runtimeScript = "";
  let runtimeParser = "";

  let scrollDown;
  let autoscroll;

  beforeUpdate(() => {
    autoscroll =
      scrollDown &&
      scrollDown.offsetHeight + scrollDown.scrollTop >
        scrollDown.scrollHeight - 20;
  });

  afterUpdate(() => {
    if (autoscroll) scrollDown.scrollTo(0, scrollDown.scrollHeight);
  });

  const items = [
    "Item 1",
    "Item 2",
    "Item 3",
    "Item 4",
    "Item 5",
    "Item 6",
    "Item 7",
    "Item 8",
    "Item 9",
    "Item 10",
  ];

  $: {
    let res = _utils.gridLuaToEditorLua($luadebug_store.config);
    const configs = res;
    let code = "";
    configs.forEach((e, i) => {
      code += `--[[@${e.short}]] ` + e.script + "\n";
    });
    runtimeScript = "<?lua " + "\n" + code + "?>";
    runtimeParser = luaParser(code, { comments: true });
  }

  $: if (modalWidth || modalHeight) {
    if (editor !== undefined) {
      editor.layout();
    }
  }

  function clickOutsideHandler() {
    if (!commitState) {
      $appSettings.modal = "";
    }
  }

  let monacoTextLength = 0;
  let addedCodeLength = 0;

  function commit() {
    const editor_code = editor.getValue();
    const maxConfigLimit = grid.properties.CONFIG_LENGTH;

    try {
      //Is this necessary?
      //checkForbiddenIdentifiers(code);
      const short_code = stringManipulation.shortify(editor_code);
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
      let minified_code = luamin.Minify(safe_code, luaminOptions);

      const addedCodeLength = minified_code.length - initCodeLength;
      const newConfigLength = initConfigLength + addedCodeLength;
      if (newConfigLength > maxConfigLimit) {
        throw "Config limit reached!";
      }
      $appSettings.monaco_code_committed = minified_code;
      commitState = 0;
      error_messsage = "";
    } catch (e) {
      error_messsage = e;
    }
  }

  let modalElement;

  let initCodeLength;
  let initConfigLength = undefined;

  onMount(() => {
    const target = ConfigTarget.getCurrent();
    const list = ConfigList.createFrom(target);
    if (typeof list === "undefined") {
      throw "Error loading current config.";
    }
    initConfigLength = list.toConfigScript().length;
    initCodeLength = $appSettings.monaco_code_committed.length;
    let human = stringManipulation.humanize($appSettings.monaco_code_committed);
    let beautified = luamin.Beautify(human, {
      RenameVariables: false,
      RenameGlobals: false,
      SolveMath: false,
    });

    if (beautified.charAt(0) === "\n") beautified = beautified.slice(1);

    const code_preview = stringManipulation.noCommentToLineComment(beautified);

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

    editor.getModel().onDidChangeContent((event) => {
      if (editor.getValue() !== $appSettings.monaco_code_committed) {
        commitState = 1;
      } else {
        commitState = 0;
      }
    });

    initCodeLength = editor.getValue().length;
    editor.onDidChangeModelContent(() => {
      monacoTextLength = editor.getValue().length;
      addedCodeLength = monacoTextLength - initCodeLength;
    });

    $attachment = {
      element: modalElement,
      hpos: "60%",
      vpos: "0%",
      scale: 0.75,
    };
  });

  onDestroy(() => {
    if ($attachment.element === modalElement) {
      $attachment = undefined;
    }

    monaco_disposables.forEach((element) => {
      element.dispose();
    });
  });
</script>

<svelte:window bind:innerWidth={modalWidth} bind:innerHeight={modalHeight} />

<div id="modal-copy-placeholder" />

<modal
  class=" z-40 flex absolute items-center justify-center w-full h-screen bg-primary bg-opacity-50"
>
  <div
    bind:this={modalElement}
    use:clickOutside={{ useCapture: true }}
    on:click-outside={clickOutsideHandler}
    id="clickbox"
    class=" z-50 w-3/4 h-3/4 text-white relative flex flex-col shadow bg-primary bg-opacity-100 items-start opacity-100"
  >
    <div
      class=" bg-black bg-opacity-10 flex-col w-full flex justify-between items-center"
    >
      <div
        class="flex flex-row w-full bg-black bg-opacity-10 justify-between items-center p-6"
      >
        <div class="flex flex-col h-full">
          <div class="flex w-full opacity-70">Edit Code</div>
          <div class="flex w-full opacity-40">
            <span class="mr-2">Character Count:</span>
            <span>{runtimeScript.length + addedCodeLength}</span>
            <span>/</span>
            <span>{grid.properties.CONFIG_LENGTH}</span>
          </div>
        </div>

        <div class="flex flex-row items-center h-full gap-2">
          {#key commitState + error_messsage}
            <div class="flex flex-col">
              <div
                class="text-right text-sm {commitState
                  ? 'text-yellow-600'
                  : 'text-green-500'} "
              >
                {commitState ? "Unsaved changes!" : "Synced with Grid!"}
              </div>
              <div class="text-right text-sm text-error">
                {error_messsage}
              </div>
            </div>
          {/key}

          <button
            on:click={commit}
            disabled={!commitState}
            class="w-24 p-2 bg-commit hover:bg-commit-saturate-20 text-white rounded
            {commitState ? 'opacity-100' : 'opacity-50 pointer-events-none'}"
          >
            Commit
          </button>

          <button
            on:click={() => {
              $appSettings.modal = "";
            }}
            id="close-btn"
            class="w-24 p-2 rounded text-white hover:bg-secondary bg-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <div class="flex-col w-full h-full flex justify-between">
      <div
        bind:this={monaco_block}
        on:keyup={() => {
          /*
          if (typeof editor !== "undefined") {
            const newCodeLength = editor.getValue().length;
            addedCodeLength = editor.getValue().length - initCodeLength;
            //codeLength = editor.getValue().length;
            console.log(initCodeLength, newCodeLength);
          }
          */
        }}
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
</modal>

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
