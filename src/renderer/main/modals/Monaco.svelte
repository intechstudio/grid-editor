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
  import {
    MoltenInput,
    MoltenPushButton,
    SvgIcon,
  } from "@intechstudio/grid-uikit";
  import { onDestroy, tick } from "svelte";
  import { NumberToEventType, GridScript } from "@intechstudio/grid-protocol";
  import { Modal, modalManager } from "./modal.store";
  import MoltenModal from "./MoltenModal.svelte";
  import { onMount } from "svelte";
  import { appSettings } from "../../runtime/app-helper.store";
  import { clickOutside } from "../_actions/click-outside.action";
  import { updateAction } from "../../runtime/operations";
  import { editor as monacoEditor, Uri } from "monaco-editor";
  import { MonacoEditor } from "../../lib/monaco";
  import {
    openEditorContext,
    closeEditorContext,
  } from "../../lib/monaco-luals-client";
  import DebugTextList from "../panels/DebugMonitor/DebugTextList.svelte";
  import ConfirmModal from "./ConfirmModal.svelte";

  export let data: Modal.Instance;
  export let monaco_action: GridAction;

  let event: GridEvent;
  let element: GridElement;
  let monaco_block;
  let editor;
  let commitEnabled = false;
  let errorMessage = "";
  let commited = { script: "", name: "" };
  let scriptLength = undefined;
  let pathSnippets = [];
  let name;
  let isEditName = false;
  let nameInput;
  let clickedOutside = false;
  let monaco_disposables = [];
  let lualsContextUri: string | null = null;
  let editorModel: ReturnType<typeof monacoEditor.createModel> | null = null;

  class LengthError extends String {}

  $: handleFontSizechange($appSettings.persistent.fontSize);

  function handleFontSizechange(fontSize) {
    editor?.updateOptions({ fontSize });
  }

  $: handleActionChange($monaco_action);

  function isDeleted(data: ActionData) {
    const event = data?.parent as GridEvent;
    return typeof event === "undefined";
  }

  function handleActionChange(data: ActionData) {
    if (!data) return;
    if (isDeleted(data)) {
      pathSnippets = ["Deleted Code Block"];
      return;
    }

    const event = data.parent as GridEvent;
    const element = event.parent as GridElement;
    const page = element.parent as GridPage;
    const module = page.parent as GridModule;

    name =
      typeof data.name !== "undefined"
        ? data.name
        : data.information.displayName;

    pathSnippets = [
      `${module.type} (${module.dx},${module.dy})`,
      `Page ${page.pageNumber + 1}`,
      `Element ${element.elementIndex} (${Grid.toFirstCase(element.type)})`,
      `${Grid.toFirstCase(NumberToEventType(event.type))} event`,
      typeof data.name !== "undefined"
        ? data.name
        : `Block #${event.config.findIndex((e) => e.id === data.id) + 1}`,
    ];
  }

  onMount(async () => {
    await tick();
    event = monaco_action.parent as GridEvent;
    element = event.parent as GridElement;
    commited.name = monaco_action.name;
    commited.script = monaco_action.script;
    scriptLength = event.toLua().length;

    openEditorContext(element.type).then((uri) => {
      lualsContextUri = uri;
    });

    // Create model with a .lua URI so LuaLS recognises it as a Lua file and
    // provides hover/completion for the standard library (print, string, etc.)
    // alongside our custom API. Without a .lua extension, LuaLS treats the
    // inmemory:// model as an unknown file type and stdlib hover is unreliable.
    const modelUri = Uri.parse(`file:///grid-editor/editor-${Date.now()}.lua`);
    editorModel = monacoEditor.createModel(
      GridScript.expandScript(monaco_action.script),
      "intech_lua",
      modelUri,
    );

    editor = MonacoEditor.create(monaco_block, {
      model: editorModel,
      theme: $appSettings.persistent.lightMode
        ? MonacoEditor.Theme.LIGHT
        : MonacoEditor.Theme.DARK,
      fontSize: $appSettings.persistent.fontSize,
      restrictScope: $element.type,
      folding: false,
      renderLineHighlight: "none",
      contextmenu: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: "on",
      suggest: {
        showIcons: true,
        showWords: true,
      },
      minimap: { enabled: false },
    });

    editor.onDidChangeModelContent(handleContentChange);
  });

  $: if (editor) {
    handleLightModeChange($appSettings.persistent.lightMode);
  }

  function handleLightModeChange(value: boolean) {
    MonacoEditor.setTheme(
      value ? MonacoEditor.Theme.LIGHT : MonacoEditor.Theme.DARK,
    );
  }

  function handleContentChange() {
    try {
      const compressed = GridScript.compressScript(editor.getValue());
      $monaco_action.script = compressed;
      $monaco_action.name =
        name !== $monaco_action?.information.displayName ? name : undefined;
      scriptLength = ($monaco_action.parent as GridEvent).toLua().length;
      if (scriptLength >= Grid.Protocol.maxScriptLength) {
        throw new LengthError("Config limit reached.");
      }
      errorMessage = "";
      commitEnabled =
        $monaco_action.script !== commited.script ||
        commited.name !== $monaco_action.name;
    } catch (e) {
      if (!(e instanceof LengthError)) {
        scriptLength = undefined;
      }
      commitEnabled = false;
      errorMessage = String(e).replace(/^error parsing: ?\n?/i, "");
    }
    $monaco_action.name = commited.name;
    $monaco_action.script = commited.script;
  }

  async function handleCommitClicked() {
    updateAction(
      monaco_action,
      new ActionData(
        monaco_action.short,
        GridScript.compressScript(editor.getValue()),
        name !== $monaco_action?.information.displayName ? name : undefined,
      ),
      true,
    ).then(() => {
      commited.name = $monaco_action.name;
      commited.script = $monaco_action.script;
      commitEnabled = false;
    });
  }

  onDestroy(() => {
    monaco_disposables.forEach((d) => d.dispose());
    if (lualsContextUri) closeEditorContext(lualsContextUri);
    editorModel?.dispose();
  });

  function handleClose() {
    if (errorMessage || commitEnabled) {
      const confirmModal = new Modal.Window(ConfirmModal, Modal.Snap.Full, {
        showAsUnique: true,
      });
      confirmModal.show({
        buttons: [
          {
            text: "Discard Changes & Close",
            style: "outlined",
            handler: () => {
              data.close();
              confirmModal.close();
            },
            focused: true,
          },
        ],
      });
    } else {
      data.close();
    }
  }

  function handleResize() {
    editor?.layout();
  }

  function handleEditClicked() {
    if (clickedOutside) {
      clickedOutside = false;
      return;
    }
    isEditName = !isEditName;
    if (isEditName) {
      setTimeout(() => nameInput.focus(), 1);
    }
  }

  function handleClickOutside() {
    if (!isEditName) return;
    isEditName = false;
    clickedOutside = true;
  }

  function handleNameChange(value) {
    if (value === monaco_action?.information.displayName) return;
    if (value !== monaco_action?.name) {
      handleContentChange();
    }
  }

  $: handleNameChange(name);

  function handleWindowKeydown(e: KeyboardEvent) {
    if (modalManager.getTop() !== data) {
      return;
    }

    switch (e.key) {
      case "Escape": {
        if (
          editor &&
          editor.getContribution("editor.contrib.suggestController")?.model
            ?.state === 2
        ) {
          // Suggest widget is open (State 2 is "Open")
          e.stopPropagation();
          e.preventDefault();
          editor
            .getContribution("editor.contrib.suggestController")
            .cancelSuggestWidget();
        } else {
          handleClose();
        }
        break;
      }
    }
  }
</script>

<div id="modal-copy-placeholder" />
<svelte:window on:keydown={handleWindowKeydown} />

<MoltenModal {data}>
  <div
    slot="content"
    class="h-full w-full relative flex flex-col gap-2 items-start text-foreground"
    use:watchResize={handleResize}
  >
    <div class="flex flex-col w-full gap-2">
      <div class="flex flex-row w-full items-center gap-4">
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

        <span class:invisible={isDeleted($monaco_action)}>
          {`Character Count: ${typeof scriptLength === "undefined" ? "?" : scriptLength}/${
            Grid.Protocol.maxScriptLength - 1
          } (max)`}
        </span>

        <div class="flex-grow"></div>

        {#if isDeleted($monaco_action)}
          <div class="text-right text-sm">Deleted Action</div>
        {:else}
          <div
            class="text-right text-sm {commitEnabled
              ? 'text-yellow-600'
              : 'text-green-500'}"
          >
            {commitEnabled ? "Unsaved changes!" : "Synced with Grid!"}
          </div>
        {/if}

        <MoltenPushButton
          click={handleCommitClicked}
          disabled={!commitEnabled || isDeleted($monaco_action)}
          text="Commit"
          style="accept"
        />
        <MoltenPushButton click={handleClose} text="Close" style="normal" />
      </div>

      <div
        class="text-left text-sm text-error whitespace-pre-line min-h-10 max-h-24 overflow-y-auto"
      >
        {errorMessage}
      </div>
    </div>

    <div
      id="monaco-container"
      class="flex flex-col h-full w-full border border-background-soft bg-background-muted"
    >
      <div
        class="flex flex-row gap-1 items-center flex-wrap bg-black bg-opacity-30 px-2 py-1 text-sm font-mono"
      >
        {#each pathSnippets as snippet, i}
          <span>{snippet}</span>
          {#if i < pathSnippets.length - 1}
            <span>/</span>
          {/if}
        {/each}
      </div>
      <div bind:this={monaco_block} class="flex w-full h-full" />
    </div>

    <div class="h-1/4 flex w-full">
      <DebugTextList />
    </div>
  </div>
</MoltenModal>

<style global>
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
