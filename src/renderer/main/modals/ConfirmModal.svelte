<script lang="ts">
  import { Modal } from "./modal.store";
  import MoltenModal from "./MoltenModal.svelte";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  interface MoltenPushButtonParams {
    text: string;
    handler: () => void;
    style: "outlined" | "normal" | "accept";
  }

  export let data: Modal.Instance;
  export let buttons: MoltenPushButtonParams[];

  function handleClose() {
    data.close();
  }
</script>

<MoltenModal {data} width={"25%"}>
  <div slot="content" class="flex flex-col flex-wrap gap-2 text-white w-full">
    <span class="text-2xl">Unsaved Changes</span>
    <p>
      You have unsaved changes in the editor. Are you sure you want to close
      this window? Any unsaved work will be lost.
    </p>

    <div class="flex flex-row justify-end gap-2">
      {#each buttons as button}
        <MoltenPushButton
          click={button.handler}
          text={button.text}
          style={button.style}
        />
      {/each}
      <MoltenPushButton click={handleClose} text={"Cancel"} style={"normal"} />
    </div>
  </div>
</MoltenModal>
