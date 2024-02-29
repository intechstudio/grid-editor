<script>
  import { modal } from "./../modals/modal.store.ts";
  import Pages from "../panels/configuration/components/Pages.svelte";
  import { selectedConfigStore } from "../../runtime/config-helper.store";
  import { moduleOverlay } from "../../runtime/moduleOverlay";
  import MoltenPushButton from "../panels/preferences/MoltenPushButton.svelte";
  import { virtual_modules } from "../../runtime/virtual-engine";
  import AddVirtualModule from "../modals/AddVirtualModule.svelte";
</script>

<div class="{$$props.class} flex flex-col items-center gap-2">
  <Pages />
  <div class="flex flex-row">
    {#if typeof $selectedConfigStore?.configType !== "undefined"}
      <MoltenPushButton
        text="Close Overlay"
        on:click={() => {
          selectedConfigStore.set(undefined);
          moduleOverlay.close();
        }}
      />
    {/if}
    {#if $virtual_modules.length > 0}
      <MoltenPushButton
        text="Change Module"
        on:click={() => {
          modal.show(AddVirtualModule);
        }}
      />
    {/if}
  </div>
</div>
