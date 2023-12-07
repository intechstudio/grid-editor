<script>
  import Pages from "../panels/configuration/components/Pages.svelte";
  import { selectedConfigStore } from "../../runtime/config-helper.store";
  import { appSettings } from "../../runtime/app-helper.store";
</script>

<div class="{$$props.class} flex flex-col items-center">
  <Pages />
  {#if typeof $selectedConfigStore?.configType !== "undefined" && typeof $appSettings.displayedOverlay !== "undefined"}
    <button
      class="self-center mt-4 z-10 relative items-center justify-center focus:outline-none bg-error
                      rounded text-white py-1 w-24 hover:bg-error-desaturate-10"
      on:click={() => {
        selectedConfigStore.set({});
        $appSettings.displayedOverlay = undefined;
      }}
    >
      <div>Cancel</div>
    </button>
  {/if}
</div>
