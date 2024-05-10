<script lang="ts">
  import { Architecture } from "./../../protocol/grid-protocol";
  import { user_input } from "./../../runtime/runtime.store.js";
  import { get } from "svelte/store";
  import { modal } from "./../modals/modal.store";
  import Pages from "../panels/configuration/components/Pages.svelte";
  import { selectedConfigStore } from "../../runtime/config-helper.store";
  import { moduleOverlay } from "../../runtime/moduleOverlay";
  import MoltenPushButton from "../panels/preferences/MoltenPushButton.svelte";
  import { virtual_runtime } from "../../runtime/virtual-engine";
  import AddVirtualModule from "../modals/AddVirtualModule.svelte";
  import { runtime } from "../../runtime/runtime.store.js";

  let selectedModule: any = undefined;

  $: handleSelecteModuleChange($runtime, $user_input);

  function handleSelecteModuleChange(rt: any, ui: any) {
    selectedModule = rt.find((e: any) => e.dx == ui.dx && e.dy == ui.dy);
  }

  function handleChangeModuleClicked() {
    const [dx, dy] = [selectedModule.dx, selectedModule.dy];
    modal.show({ component: AddVirtualModule, args: { dx: dx, dy: dy } });
  }

  function handleRemoveModuleClicked() {
    const [dx, dy] = [selectedModule.dx, selectedModule.dy];
    console.log(dx, dy);
    runtime.destroy_module(dx, dy);
  }
</script>

<div class="{$$props.class} flex flex-col items-center gap-2">
  <Pages />
  <div class="flex flex-row gap-2">
    {#if typeof $selectedConfigStore?.configType !== "undefined"}
      <MoltenPushButton
        text="Close Overlay"
        on:click={() => {
          selectedConfigStore.set(undefined);
          moduleOverlay.close();
        }}
      />
    {/if}
    {#if selectedModule?.architecture === Architecture.VIRTUAL}
      <MoltenPushButton
        text="Change Module"
        on:click={handleChangeModuleClicked}
      />
      <MoltenPushButton
        text="Remove Module"
        on:click={handleRemoveModuleClicked}
      />
    {/if}
  </div>
</div>
