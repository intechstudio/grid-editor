<script>
  import { onDestroy, onMount } from "svelte";
  import { appSettings } from "../../runtime/app-helper.store";

  import { clickOutside } from "../_actions/click-outside.action";

  import { debug_monitor_store } from "../panels/DebugMonitor/DebugMonitor.store";

  import { monaco_editor, monaco_languages } from "../../lib/CustomMonaco";

  import { checkSyntaxAndMinify } from "../../runtime/monaco-helper";

  import { beforeUpdate, afterUpdate } from "svelte";

  import * as luamin from "lua-format";
  import stringManipulation from "../../main/user-interface/_string-operations";

  import _utils, { luaParser } from "../../runtime/_utils";
  import { luadebug_store } from "../../runtime/runtime.store";

  import VirtualList from "svelte-virtual-list";

  import { attachment } from "../user-interface/Monster.store";

  let monaco_block;

  let monaco_disposables = [];

  let editor;

  let commitState = 0;

  let error_messsage = "";

  let modalWidth;
  let modalHeight;

  let runtimeScript = "";
  let runtimeParser = "";

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

  function commit() {
    const editor_code = editor.getValue();
    try {
      let minified_code = checkSyntaxAndMinify(editor_code);
      $appSettings.monaco_code_committed = minified_code;
      commitState = 0;
      error_messsage = "";
    } catch (e) {
      error_messsage = e;
    }
  }

  let modalElement;

  onMount(() => {
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
          <div class="flex w-full opacity-70">
            Grid Editor is Open-Source Software
          </div>
          <div class="flex w-full opacity-40">Developed by Intech Studio</div>
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

    <div class="h-full w-full border border-red-400">
      <div bind:this={monaco_block} class="h-2/3" />

      <div class="flex flex-col font-mono bg-secondary m-1 min-h-[200px]">
        <VirtualList {items} let:item>
          <span class="debugtexty text-white">{item}</span>
        </VirtualList>
      </div>
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
