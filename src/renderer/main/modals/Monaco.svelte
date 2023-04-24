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

  import { attachment } from "../user-interface/Monster.store";

  let monaco_block;

  let monaco_disposables = [];

  let editor;

  let commitState = 0;

  let error_messsage = "";

  let modalWidth;
  let modalHeight;

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

  let toColorize;

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

    scrollDown.scrollTo(0, scrollDown.scrollHeight);

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
        class="flex flex-row w-full h-content bg-black bg-opacity-10 justify-between items-center"
      >
        <div class="flex flex-col h-full p-6">
          <div class="flex w-full opacity-70">
            Grid Editor is Open-Source Software
          </div>
          <div class="flex w-full opacity-40">Developed by Intech Studio</div>
        </div>

        <div class="flex flex-row items-center h-full p-6">
          {#key commitState + error_messsage}
            <div class="flex flex-col">
              <div
                class="text-right text-sm {commitState
                  ? 'text-yellow-600'
                  : 'text-green-500'} "
              >
                {commitState ? "Unsaved changes!" : "Synced with Grid!"}
              </div>
              <div class="text-right text-sm text-red-600">
                {error_messsage}
              </div>
            </div>
          {/key}

          <button
            on:click={commit}
            disabled={!commitState}
            class="mx-2 p-2 {commitState
              ? 'opacity-100'
              : 'opacity-50 pointer-events-none'} bg-commit hover:bg-commit-saturate-20 text-white rounded text-sm focus:outline-none"
            >Commit</button
          >

          <button
            on:click={() => {
              $appSettings.modal = "";
            }}
            id="close-btn"
            class="p-1 cursor-pointer rounded not-draggable hover:bg-secondary bg-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <div class="flex-col w-full h-full flex justify-between">
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
