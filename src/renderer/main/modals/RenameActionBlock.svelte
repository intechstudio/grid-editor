<script lang="ts">
  import { MoltenInput, MoltenPushButton } from "@intechstudio/grid-uikit";
  import MoltenModal from "./MoltenModal.svelte";
  import { onMount, tick } from "svelte";
  import { Modal } from "./modal.store";
  import { ActionData, GridAction } from "../../runtime/runtime";
  import { updateAction } from "../../runtime/operations";

  export let data: Modal.Instance;

  export let action: GridAction;
  export let availableCharacters: number;

  let editValue: string = action.name ?? "";
  let input: MoltenInput;

  onMount(async () => {
    await tick();
    input.focus();
  });

  function handleNameInput(e: any) {
    const { value } = e.detail;
    editValue = value;
  }

  function updateActionName(action: GridAction, name: string) {
    if (name !== action.name) {
      const next = name.length > 0 ? name : undefined;
      updateAction(
        action,
        new ActionData(action.short, action.script, next),
        true,
      );
      data.close();
    }
  }

  function handleInputKeyDown(e: any) {
    const { key } = e.detail;

    if (key === "Enter") {
      updateActionName(action, editValue);
    }
  }

  function handleRename() {
    updateActionName(action, editValue);
  }

  function handleCancel() {
    data.close();
  }
</script>

<MoltenModal {data} width="400px">
  <div slot="content" class="class flex flex-col gap-2 items-center p-6">
    <span class="text-xl self-start">Rename Action</span>
    <MoltenInput
      bind:this={input}
      target={editValue}
      on:input={handleNameInput}
      on:keydown={handleInputKeyDown}
      {availableCharacters}
    />
    <div class="flex flex-row gap-2">
      <MoltenPushButton click={handleRename} text={"Rename"} style={"accept"} />
      <MoltenPushButton click={handleCancel} text={"Cancel"} />
    </div>
  </div>
</MoltenModal>
