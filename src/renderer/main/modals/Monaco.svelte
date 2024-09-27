<script lang="ts">
  import { get } from "svelte/store";
  import { ActionData } from "./../../runtime/runtime.ts";
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
  import {
    grid,
    NumberToEventType,
    GridScript,
  } from "@intechstudio/grid-protocol";
  import { modal } from "./modal.store";
  import MoltenModal from "./MoltenModal.svelte";

  import { debug_monitor_store } from "../panels/DebugMonitor/DebugMonitor.store";

  import { monaco_editor } from "../../lib/CustomMonaco";

  import { beforeUpdate, afterUpdate, onMount } from "svelte";
  import { appSettings } from "../../runtime/app-helper.store";
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import { clickOutside } from "../_actions/click-outside.action";

  export let monaco_action: GridAction;

  let monaco_block;

  let monaco_disposables = [];

  let editor;

  let commitEnabled = false;
  let errorMesssage = "";

  let commited: ActionData = { script: "", name: "" };

  let scrollDown;
  let autoscroll;

  let scriptLength = undefined;
  let pathSnippets = [];

  let name;
  let isEditName = false;
  let nameInput;

  class LengthError extends String {}

  $: handleFontSizechange($appSettings.persistent.fontSize);

  function handleFontSizechange(fontSize) {
    editor?.updateOptions({ fontSize: fontSize });
  }

  $: handleActionChange($monaco_action);

  function isDeleted(action: ActionData) {
    const event = action?.parent as GridEvent;
    return typeof event === "undefined";
  }

  function handleActionChange(action: ActionData) {
    if (typeof action === "undefined") {
      return;
    }

    if (isDeleted(action)) {
      pathSnippets = ["Deleted Code Block"];
      return;
    }

    const event = action.parent as GridEvent;
    const element = event.parent as GridElement;
    const page = element.parent as GridPage;
    const module = page.parent as GridModule;

    name =
      typeof action.name !== "undefined"
        ? action.name
        : $monaco_action.information.displayName;
    monaco_action;

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
    monaco_action = get(modal).args;
    console.log(monaco_action, get(modal));
    commited.name = monaco_action.name;
    commited.script = monaco_action.script;
    scriptLength = (monaco_action.parent as GridEvent).toLua().length;

    //Creating and configuring the editor
    editor = monaco_editor.create(monaco_block, {
      value: GridScript.expandScript(monaco_action.script),
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

    editor.onDidChangeModelContent(handleContentChange);
  });

  function handleContentChange() {
    try {
      //Throws error on syntax error
      const compressed = GridScript.compressScript(editor.getValue());
      $monaco_action.script = compressed;
      $monaco_action.name =
        name !== $monaco_action?.information.displayName ? name : undefined;

      //Calculate length (this already includes the new value of referenceConfig)
      scriptLength = ($monaco_action.parent as GridEvent).toLua().length;

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

    //Restore to commited
    $monaco_action.name = commited.name;
    $monaco_action.script = commited.script;
  }

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

  async function handleCommit() {
    $monaco_action.script = GridScript.compressScript(editor.getValue());
    $monaco_action.name =
      name !== $monaco_action?.information.displayName ? name : undefined;
    commited.name = $monaco_action.name;
    commited.script = $monaco_action.script;
    commitEnabled = false;
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
    if (value === monaco_action?.information.displayName) {
      return;
    }

    if (value !== monaco_action?.name) {
      handleContentChange();
    }
  }

  $: handleNameChange(name);
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
          <span class:invisible={isDeleted($monaco_action)}
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
          {#if isDeleted($monaco_action)}
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
            disabled={!commitEnabled || isDeleted($monaco_action)}
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
