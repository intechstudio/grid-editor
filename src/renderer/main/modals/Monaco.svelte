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
  import { onDestroy, onMount } from "svelte";
  import { NumberToEventType } from "@intechstudio/grid-protocol";
  import { Modal, modalManager } from "./modal.store";
  import { activeMonacoSession } from "./monaco-session.store";
  import { get } from "svelte/store";
  import MoltenModal from "./MoltenModal.svelte";
  import { clickOutside } from "../_actions/click-outside.action";
  import { MonacoEditor } from "../../lib/monaco";
  import CodeEditor from "../user-interface/CodeEditor.svelte";
  import CommitStatus from "../user-interface/CommitStatus.svelte";
  import CharacterCount from "../user-interface/CharacterCount.svelte";
  import SendFeedback from "../user-interface/SendFeedback.svelte";
  import DebugTextList from "../panels/DebugMonitor/DebugTextList.svelte";
  import ConfirmModal from "./ConfirmModal.svelte";

  const lualogo_foreground = "#808080";
  const lualogo_background = "#212a2c";

  const lualogo = `<svg version="1.0" id="Ebene_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 width="100%" height="100%" viewBox="0 0 947 947" enable-background="new 0 0 947 947" xml:space="preserve">
<g>
	<path fill="${lualogo_foreground}" d="M835.5,473.6c0-199.8-162.2-362-362-362s-362,162.2-362,362c0,199.8,162.2,362,362,362
		S835.5,673.4,835.5,473.6"/>
	<path fill="${lualogo_background}" d="M729.5,323.6c0-58.5-47.5-106-106-106s-106,47.5-106,106c0,58.5,47.5,106,106,106S729.5,382.1,729.5,323.6"
		/>
	<path fill="${lualogo_foreground}" d="M941.5,111.5c0-58.5-47.5-106-106-106s-106,47.5-106,106c0,58.5,47.5,106,106,106S941.5,170.1,941.5,111.5"
		/>
	<g>
		<path fill="${lualogo_background}" d="M258.1,627.8h117.3v26.7H227.8V417h30.3V627.8z"/>
		<path fill="${lualogo_background}" d="M515.5,654.5v-23.8c-16,22.5-31.9,31.3-57,31.3c-33.2,0-54.4-18.2-54.4-46.6V483.8h27v120.9
			c0,20.5,13.7,33.6,35.2,33.6c28.3,0,46.6-22.8,46.6-57.7v-96.8h27v170.7H515.5z"/>
		<path fill="${lualogo_background}" d="M738.4,659.1c-8.8,2.3-13,2.9-18.6,2.9c-17.6,0-26.1-7.8-28-25.1c-19.2,17.6-36.5,25.1-58,25.1
			c-34.5,0-56-19.5-56-50.5c0-22.2,10.1-37.5,30-45.6c10.4-4.2,16.3-5.5,54.7-10.4c21.5-2.6,28.3-7.5,28.3-18.9v-7.2
			c0-16.3-13.7-25.4-38.1-25.4c-25.4,0-37.8,9.4-40.1,30.3h-27.4c0.7-16.9,3.9-26.7,11.7-35.5c11.4-12.7,31.9-19.9,56.7-19.9
			c42,0,64.2,16.3,64.2,46.6v100.4c0,8.5,5.2,13.4,14.7,13.4c1.6,0,2.9,0,5.9-0.7V659.1z M690.8,570.1c-9.1,4.2-15,5.5-43.7,9.4
			c-29,4.2-41.1,13.4-41.1,31.3c0,17.3,12.4,27.4,33.6,27.4c16,0,29.3-5.2,40.4-15.3c8.1-7.5,10.8-13,10.8-22.2V570.1z"/>
	</g>
	<path fill="none" stroke="${lualogo_foreground}" stroke-width="10.8612" stroke-miterlimit="10" stroke-dasharray="40.8475" d="M890.6,261
		c33.5,65.8,51,138.6,51,212.5c0,258.4-209.7,468.1-468.1,468.1S5.4,731.9,5.4,473.5C5.4,215.1,215.1,5.4,473.5,5.4
		c83.1,0,164.6,22.1,236.2,63.9"/>
</g>
</svg>`;

  export let data: Modal.Instance;
  export let monaco_action: GridAction;
  // Optional uncommitted content carried over from the inline editor.
  export let initial_value: string | undefined = undefined;

  let codeEditor: CodeEditor;
  let commitButton: HTMLElement;
  let editor: MonacoEditor.CustomCodeEditor | undefined;
  let commitEnabled = false;
  let errorMessage = "";
  let scriptLength: number | undefined = undefined;
  let pathSnippets = [];
  let name;
  let isEditName = false;
  let nameInput;
  let clickedOutside = false;
  const sessionToken = {};

  // Element type drives autocomplete scope; available synchronously for the
  // CodeEditor child's initial mount.
  const element = (monaco_action.parent as GridEvent)?.parent as GridElement;

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

  onMount(() => {
    activeMonacoSession.set({
      token: sessionToken,
      action: monaco_action,
      dirty,
      close: () => data.close(),
    });
  });

  // "Needs committing": unsaved changes or an unresolved error.
  $: dirty = commitEnabled || errorMessage !== "";

  // Keep the shared session in sync so other code blocks can react to whether
  // this editor currently needs committing (issue #1390, part 1).
  $: activeMonacoSession.update((s) =>
    s?.token === sessionToken ? { ...s, dirty } : s,
  );

  onDestroy(() => {
    if (get(activeMonacoSession)?.token === sessionToken) {
      activeMonacoSession.set(null);
    }
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

  // Ctrl/Cmd+S commits the editor, whether focus is somewhere in the modal
  // outside Monaco (e.g. the Name field) or inside it: Monaco's own
  // keybinding service consumes the native keydown before it can bubble here
  // on its own, so CodeEditor's Monaco instance re-dispatches it as a
  // synthetic, bubbling `keydown` from the editor's DOM node, which this
  // listener (wired up via MoltenModal's `onkeydown` prop) also catches.
  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      e.stopPropagation();
      commitButton?.querySelector("button")?.click();
      return;
    }

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

<MoltenModal {data} onkeydown={handleKeydown}>
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
            <SvgIcon iconPath="edit" fill="#FFF" />
          </button>
        </div>

        <span class:invisible={isDeleted($monaco_action)}>
          <CharacterCount {scriptLength} />
        </span>

        <div class="flex-grow"></div>

        <CommitStatus {commitEnabled} deleted={isDeleted($monaco_action)} />

        <div bind:this={commitButton} class="contents">
          <MoltenPushButton
            click={() => codeEditor.commit()}
            disabled={!commitEnabled || isDeleted($monaco_action)}
            text="Commit"
            style="accept"
          />
        </div>
        <MoltenPushButton click={handleClose} text="Close" style="normal" />
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
      <CodeEditor
        bind:this={codeEditor}
        bind:editor
        bind:commitEnabled
        bind:errorMessage
        bind:scriptLength
        bind:name
        action={monaco_action}
        restrictScope={element?.type}
        initialValue={initial_value}
        luals
      />
    </div>

    <div
      class="text-left text-sm text-error whitespace-pre-line min-h-10 max-h-24 overflow-y-auto w-full"
    >
      {errorMessage}
    </div>

    <div class="h-1/4 flex w-full">
      <DebugTextList />
    </div>

    <div class="flex flex-row items-center gap-2 w-full">
      <SendFeedback feedback_context="CodeBlock" />
      <div class="flex-grow" />
      <div class="text-gray-500 font-bold">Powered by Lua</div>
      <div class="h-12 w-12">
        {@html lualogo}
      </div>
    </div>
  </div>
</MoltenModal>

<!-- <style global>
  #monaco-container .monaco-editor {
    position: absolute !important;
  }
</style> -->
