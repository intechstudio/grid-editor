<script>
  import Pages from "../panels/configuration/components/Pages.svelte";
  import { selectedConfigStore } from "../../runtime/config-helper.store";
  import { moduleOverlay } from "../../runtime/moduleOverlay";
</script>

<div class="{$$props.class} flex flex-col items-center">
  <Pages />
  {#if typeof $selectedConfigStore?.configType !== "undefined"}
    <button
      class="self-center mt-4 z-10 relative items-center justify-center focus:outline-none bg-select
                      rounded text-white py-1 w-32 hover:bg-select-desaturate-10"
      on:click={() => {
        selectedConfigStore.set(undefined);
        moduleOverlay.close();
      }}
    >
      <div>Close overlay</div>
    </button>
  {/if}
</div>
