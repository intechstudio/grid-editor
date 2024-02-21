<script>
  import Pages from "../panels/configuration/components/Pages.svelte";
  import { selectedConfigStore } from "../../runtime/config-helper.store";
  import { moduleOverlay } from "../../runtime/moduleOverlay";
  import MoltenPushButton from "../panels/preferences/MoltenPushButton.svelte";
</script>

<div class="{$$props.class} flex flex-col items-center gap-2">
  <Pages />
  {#if typeof $selectedConfigStore?.configType !== "undefined"}
    <MoltenPushButton
      text="Close overlay"
      on:click={() => {
        selectedConfigStore.set(undefined);
        moduleOverlay.close();
      }}
    />
  {/if}
</div>
