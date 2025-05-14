<script>
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
</script>

<div>
  <p class="text-lg font-medium">Packages are still running!</p>
  <p class="pt-2">
    Quitting stops all packages that are running in the background! Minimizing
    will keep the packages running in the background. Do you want to continue?
  </p>
  <div class="flex flex-row justify-end pt-2 items-center gap-2">
    <MoltenPushButton
      click={() => {
        dispatch("cancel");
      }}
      text={"Cancel"}
      style={"normal"}
    />
    <MoltenPushButton
      click={() => {
        dispatch("quit");
      }}
      text={"Quit"}
      style={"outlined"}
    />
    <MoltenPushButton
      click={() => {
        dispatch("tray");
      }}
      text={"Close to Tray"}
      style={"accept"}
    />
  </div>
</div>
