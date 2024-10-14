<script lang="ts">
  import { Architecture } from "@intechstudio/grid-protocol";
  import { user_input } from "./../../runtime/runtime.store";
  import { get } from "svelte/store";
  import { modal } from "./../modals/modal.store";
  import Pages from "../panels/configuration/components/Pages.svelte";
  import { selectedConfigStore } from "../../runtime/config-helper.store";
  import { moduleOverlay } from "../../runtime/moduleOverlay";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import AddVirtualModule from "../modals/AddVirtualModule.svelte";
  import { runtime } from "../../runtime/runtime.store";

  let selectedModule: any = undefined;

  $: handleSelecteModuleChange($runtime, $user_input);

  function handleSelecteModuleChange(rt: any, ui: any) {
    selectedModule = rt.modules.find(
      (e: any) => e.dx == ui.dx && e.dy == ui.dy
    );
  }

  function handleChangeModuleClicked() {
    const [dx, dy] = [selectedModule.dx, selectedModule.dy];
    modal.show({ component: AddVirtualModule, args: { dx: dx, dy: dy } });
  }

  function handleRemoveModuleClicked() {
    const [dx, dy] = [selectedModule.dx, selectedModule.dy];
    runtime.destroy_module(dx, dy);
  }
</script>

<div class="{$$props.class} flex flex-col items-center gap-2">
  <Pages />
  <div class="flex flex-row gap-2">
    {#if typeof $selectedConfigStore?.configType !== "undefined"}
      <MoltenPushButton
        text="Close Overlay"
        click={() => {
          selectedConfigStore.set(undefined);
          moduleOverlay.close();
        }}
      />
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
