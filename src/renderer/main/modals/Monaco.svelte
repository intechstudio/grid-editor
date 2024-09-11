<script lang="ts">
  import { Grid } from "./../../lib/_utils";
  import {
    GridElement,
    GridEvent,
    GridPage,
    GridModule,
    GridAction,
    ActionData,
  } from "./../../runtime/runtime";
  import { watchResize } from "svelte-watch-resize";
  import { MoltenInput, MoltenPushButton } from "@intechstudio/grid-uikit";
  import { onDestroy } from "svelte";
  import { grid, NumberToEventType } from "@intechstudio/grid-protocol";
  import { modal } from "./modal.store";
  import MoltenModal from "./MoltenModal.svelte";

  import { debug_monitor_store } from "../panels/DebugMonitor/DebugMonitor.store";

  import { monaco_editor } from "../../lib/CustomMonaco";
  import { committed_code_store } from "../../config-blocks/Committed_Code.store";
  import { monaco_store, type MonacoValue } from "./monaco.store";

  import { beforeUpdate, afterUpdate, onMount } from "svelte";

  import { GridScript } from "@intechstudio/grid-protocol";
  import { configManager } from "../panels/configuration/Configuration.store";
  import { appSettings } from "../../runtime/app-helper.store";
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import { clickOutside } from "../_actions/click-outside.action";

  let monaco_block;

  let monaco_disposables = [];

  let editor;

  let commitEnabled = false;
  let errorMesssage = "";
  let commitedCode = "";

  let scrollDown;
  let autoscroll;

  let scriptLength = undefined;
  let pathSnippets = [];
  let editedAction: GridAction;

  class LengthError extends String {}

  $: handleFontSizechange($appSettings.persistent.fontSize);

  function handleFontSizechange(fontSize) {
    editor?.updateOptions({ fontSize: fontSize });
  }

  $: if ($editedAction) {
    handleConfigChange($editedAction);
  }

  function isDeleted(action: ActionData) {
    const event = action?.parent as GridEvent;
    return typeof event === "undefined";
  }

  function handleConfigChange(action: ActionData) {
    if (isDeleted(action)) {
      pathSnippets = ["Deleted Code Block"];
      return;
    }

    const event = action.parent as GridEvent;
    const element = event.parent as GridElement;
    const page = element.parent as GridPage;
    const module = page.parent as GridModule;

    pathSnippets = [
      `${module.type} (${module.dx},${module.dy})`,
      `Page ${page.pageNumber + 1}`,
      `Element ${element.elementIndex} (${Grid.toFirstCase(element.type)})`,
      `${Grid.toFirstCase(NumberToEventType(event.type))} event`,
      typeof action.name !== "undefined"
        ? action.name
        : `Block #${event.config.findIndex((e) => e.id === action.id) + 1}`,
    ];
  }

  onMount(() => {
    const store = $monaco_store;
    editedAction = store.config.runtimeRef;
    name =
      typeof store.config.name !== "undefined"
        ? store.config.name
        : store.config.information.displayName;

    commitedCode = store.config.script;

    //To be displayed in Editor
    const code_preview = GridScript.expandScript(store.config.script);

    //Set initial code length
    scriptLength = $configManager.toConfigScript().length;

    //Creating and configuring the editor
    editor = monaco_editor.create(monaco_block, {
      value: code_preview,
      language: "intech_lua",
      theme: "my-theme",
      fontSize: $appSettings.persistent.fontSize,

      folding: false,

      renderLineHighlight: "none",

      contextmenu: false,
      scrollBeyondLastLine: false,
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

      try {
        //Throws error on syntax error
        $monaco_store.config.script = GridScript.compressScript(editor_code);

        //Calculate length (this already includes the new value of referenceConfig)
        scriptLength = $configManager.toConfigScript().length;

        //Check the minified config length
        if (scriptLength >= grid.getProperty("CONFIG_LENGTH")) {
          throw new LengthError("Config limit reached.");
        }

        //Everything is ok if no error was thrown previously
        errorMesssage = "";
        commitEnabled = $monaco_store.config.script !== commitedCode;

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
      const minifiedCode = GridScript.compressScript(editor_code);

      $committed_code_store = {
        script: minifiedCode,
        name: name,
        index: $monaco_store.index,
      };

      commitedCode = minifiedCode;

      commitEnabled = false;
      errorMesssage = "";
    } catch (e) {
      console.warn(e);
    }
  }

  onDestroy(() => {
    monaco_disposables.forEach((element) => {
      element.dispose();
    });
  });

  function handleClose(e) {
    if (commitedCode !== $monaco_store.config.script) {
      $monaco_store.config.script = commitedCode;
    }
    modal.close();
  }

  function handleResize(e) {
    editor?.layout();
  }

  function handleEditClicked() {
    if (clickedOutside) {
      clickedOutside = false;
      return;
    }
    isEditName = !isEditName;
    if (isEditName) {
      setTimeout(() => {
        const focus = nameInput.focus;
        focus();
      }, 1);
    }
  }

  let clickedOutside = false;

  function handleClickOutside(e) {
    if (!isEditName) {
      return;
    }
    isEditName = false;
    clickedOutside = true;
  }

  function handleNameChange(value) {
    if (value != $monaco_store.config?.name) {
      commitEnabled = true;
    }
  }

  $: if (name && name !== $monaco_store.config.information.displayName) {
    handleNameChange(name);
  }

  let name;
  let isEditName = false;
  let nameInput;
</script>

<div id="modal-copy-placeholder" />

<MoltenModal>
  <div
    slot="content"
    class="h-full w-full text-white relative flex flex-col gap-2 items-start"
    use:watchResize={handleResize}
  >
    <div class="flex flex-row w-full items-center">
      <div class="flex flex-col text-white">
        <div class="flex flex-row gap-2 items-center">
          <span>Name:</span>
          <div
            use:clickOutside={{ useCapture: true }}
            on:click-outside={handleClickOutside}
          >
            <MoltenInput
              bind:this={nameInput}
              bind:target={name}
              disabled={!isEditName}
            />
          </div>

          <button
            on:click={handleEditClicked}
            class="cursor-pointer pointer-events-auto"
          >
            <SvgIcon iconPath="edit" fill="#FFF" width={13} height={13} />
          </button>
        </div>
        <div class="opacity-70">
          <span class:invisible={isDeleted($editedAction)}
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
          {#if isDeleted($editedAction)}
            <div class="text-right text-sm text-white">Deleted Action</div>
          {:else}
            <div
              class="text-right text-sm {commitEnabled
                ? 'text-yellow-600'
                : 'text-green-500'} "
            >
              {commitEnabled ? "Unsaved changes!" : "Synced with Grid!"}
            </div>
            <div class="text-right text-sm text-error">
              {errorMesssage}
            </div>
          {/if}
        </div>

        <div class="flex flex-row flex-wrap gap-2 justify-end">
          <MoltenPushButton
            click={handleCommit}
            disabled={!commitEnabled || isDeleted(editedAction)}
            text="Commit"
            style="accept"
          />

          <MoltenPushButton click={handleClose} text="Close" style="normal" />
        </div>
      </div>
    </div>

    <div
      id="monaco-container"
      class="{$$props.class} flex flex-col h-full w-full bg-black bg-opacity-20 border border-black"
    >
      <div
        class="flex flex-row gap-1 items-center flex-wrap bg-black bg-opacity-30 px-2 py-1 text-sm font-mono"
      >
        {#each pathSnippets as snippet, i}
          <span class="text-white text-opacity-85">{snippet}</span>
          {#if i < pathSnippets.length - 1}
            <div class="fill-orange-700">/</div>
          {/if}
        {/each}
      </div>
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
