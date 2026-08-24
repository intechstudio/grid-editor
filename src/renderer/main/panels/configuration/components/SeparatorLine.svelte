<script lang="ts">
  import DropZone from "./DropZone.svelte";
  import AddActionLine from "./AddActionLine.svelte";
  import { GridEvent } from "../../../../runtime/runtime";
  import { draggedActions } from "../../../_actions/move.action";
  import { addActions, pasteActions } from "../../../../runtime/operations";
  import {
    profile_cloud,
    profileCloudConfigDrag,
  } from "../../profileCloud/ProfileCloud";

  export let target: { index: number; event: GridEvent } = undefined;

  function handleNewConfig(e: CustomEvent) {
    const { configs, index } = e.detail;
    addActions(target.event, index, ...configs);
  }

  function handlePaste(e: CustomEvent) {
    const { index } = e?.detail ?? { index: undefined };
    pasteActions(target.event, index);
  }

  function handleDragEnter(target: GridEvent, index: number) {
    const message = {
      messageType: "configDragTargetChange",
      target: { ...target.getInfo(), index: index },
    };

    profile_cloud.sendMessage(message);
  }

  function handleDragLeave() {
    const message = {
      messageType: "configDragTargetChange",
      target: undefined,
    };

    profile_cloud.sendMessage(message);
  }
</script>

<div class="flex items-center h-5">
  {#if $draggedActions.length > 0}
    <DropZone {target} />
  {:else if $profileCloudConfigDrag?.configType === "snippet"}
    <div class="w-full h-2 flex">
      <div
        role="region"
        aria-label="Drop area for presets"
        class="w-full h-full bg-commit/25 pointer-events-auto rounded"
        on:dragenter={() => handleDragEnter(target.event, target.index)}
        on:dragleave|preventDefault={handleDragLeave}
        on:dragover|preventDefault
      ></div>
    </div>
  {:else}
    <AddActionLine
      {target}
      on:paste={handlePaste}
      on:new-config={handleNewConfig}
    />
  {/if}
</div>
