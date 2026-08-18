<script lang="ts">
  import { onMount, tick } from "svelte";
  import { Modal } from "./modal.store";
  import MoltenModal from "./MoltenModal.svelte";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  interface MoltenPushButtonParams {
    text: string;
    handler: () => void;
    style?: "outlined" | "normal" | "accept";
    focused?: boolean;
  }

  export let data: Modal.Instance;
  export let buttons: MoltenPushButtonParams[];
  let buttonRefs: MoltenPushButton[] = [];

  onMount(async () => {
    await tick();
    const focusedIndex = buttons.findIndex((b) => b.focused);
    if (focusedIndex !== -1) {
      buttonRefs[focusedIndex]?.focus();
    }
  });

  function handleClose() {
    data.close();
  }
</script>

<MoltenModal {data} width={"25%"}>
  <div slot="content" class="flex flex-col flex-wrap gap-2 w-full p-6">
    <span class="text-2xl">Unsaved Changes</span>
    <p>
      You have unsaved changes in the editor. Are you sure you want to close
      this window? Any unsaved work will be lost.
    </p>

    <div class="flex flex-row justify-end gap-2">
      {#each buttons as button, i}
        <MoltenPushButton
          bind:this={buttonRefs[i]}
          click={button.handler}
          text={button.text}
          style={button.style ?? "normal"}
        />
      {/each}
      <MoltenPushButton click={handleClose} text={"Cancel"} style={"normal"} />
    </div>
  </div>
</MoltenModal>
