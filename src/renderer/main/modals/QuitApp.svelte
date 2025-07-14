<script lang="ts">
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import MoltenModal from "./MoltenModal.svelte";
  import { onMount, tick } from "svelte";

  export let data: Modal.Instance;

  let quitButton: MoltenPushButton;

  onMount(async () => {
    await tick();
    quitButton.focus();
  });
</script>

<MoltenModal {data}>
  <div slot="content">
    <p class="text-lg font-medium">Packages are still running!</p>
    <p class="pt-2">
      Quitting stops all packages that are running in the background! Minimizing
      will keep the packages running in the background. Do you want to continue?
    </p>
    <div class="flex flex-row justify-end pt-2 items-center gap-2">
      <MoltenPushButton
        click={() => {
          data.close();
        }}
        text={"Cancel"}
        style={"normal"}
      />
      <MoltenPushButton
        bind:this={quitButton}
        click={() => {
          data.close();
          window.electron.quitDialogResult("quit");
        }}
        text={"Quit"}
        style={"outlined"}
      />
      <MoltenPushButton
        click={() => {
          data.close();
          window.electron.quitDialogResult("tray");
        }}
        text={"Minimize"}
        style={"accept"}
      />
    </div>
  </div>
</MoltenModal>
