<script>
  import { modal } from "./../modals/modal.store.ts";
  import Pages from "../panels/configuration/components/Pages.svelte";
  import { selectedConfigStore } from "../../runtime/config-helper.store";
  import { moduleOverlay } from "../../runtime/moduleOverlay";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { virtual_runtime } from "../../runtime/virtual-engine";
  import AddVirtualModule from "../modals/AddVirtualModule.svelte";
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
    {#if $virtual_runtime.length > 0}
      <MoltenPushButton
        text="Change Module"
        on:click={() => {
          modal.show({ component: AddVirtualModule, args: { dx: 0, dy: 0 } });
        }}
      />
    {/if}
  </div>
</div>
