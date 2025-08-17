<script lang="ts">
  import { run } from 'svelte/legacy';

  import { Architecture } from "@intechstudio/grid-protocol";

  import { Modal } from "./../modals/modal.store";
  import Pages from "../panels/configuration/components/Pages.svelte";
  import { selectedConfigStore } from "../../runtime/config-helper.store";
  import { moduleOverlay } from "../../runtime/moduleOverlay";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import AddVirtualModule from "../modals/AddVirtualModule.svelte";
  import { runtime_manager } from "../../runtime/runtime-manager.store";
  import { GridRuntime } from "../../runtime/runtime";
  import { user_input, UserInputValue } from "../../runtime/user-input.store";
import { mount } from "svelte";

  let selectedModule: any = $state(undefined);

  let runtime: GridRuntime = $state();


  function handleSelecteModuleChange(rt: GridRuntime, ui: UserInputValue) {
    selectedModule = rt.modules.find(
      (e: any) => e.dx == ui.dx && e.dy == ui.dy,
    );
  }

  function handleChangeModuleClicked() {
    const [dx, dy] = [selectedModule.dx, selectedModule.dy];
    mount(AddVirtualModule, AddVirtualModule).show({ dx, dy });
  }

  function handleRemoveModuleClicked() {
    const active = $runtime_manager.active.runtime;
    const [dx, dy] = [selectedModule.dx, selectedModule.dy];
    active.destroy_module(dx, dy);
  }

  function handleCloseOverlay() {
    selectedConfigStore.set(undefined);
    moduleOverlay.close();
  }
  run(() => {
    runtime = $runtime_manager.active.runtime;
  });
  run(() => {
    if ($runtime) {
      handleSelecteModuleChange(runtime, $user_input);
    }
  });
</script>

<div class="flex flex-col items-center gap-2">
  <Pages />
  <div class="flex flex-row gap-2">
    {#if typeof $moduleOverlay !== "undefined"}
      <MoltenPushButton text="Close Overlay" click={handleCloseOverlay} />
    {/if}
    {#if selectedModule?.architecture === Architecture.VIRTUAL}
      <MoltenPushButton
        text="Change Module"
        click={handleChangeModuleClicked}
      />
      <MoltenPushButton
        text="Remove Module"
        click={handleRemoveModuleClicked}
      />
    {/if}
  </div>
</div>
