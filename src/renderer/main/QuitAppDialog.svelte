<script>
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
</script>

<div>
  <p class="text-lg font-medium">You will lose connection to Packages!</p>
  <p class="pt-2">Quitting will also close all enabled packages. Minimizing will keep the packages running in the background. Do you want to continue?</p>
  <p class="text-sm">You can change the default behaviour in the Settings panel!</p>
  <div class="flex flex-row justify-end pt-2 items-center gap-2">
    <MoltenPushButton click={() => { dispatch("cancel") }} text={"Cancel"} style={"normal"} />
      <MoltenPushButton click={() => { dispatch("quit") }} text={"Quit"} style={"outlined"} />
    <MoltenPushButton click={() => { dispatch("accept") }} text={"Minimze"} style={"accept"} />
  </div>
</div>