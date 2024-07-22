<script context="module">
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "../headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;
</script>

<script>
  import { onMount, createEventDispatcher } from "svelte";

  export let config;

  const dispatch = createEventDispatcher();

  let actionElement;
  let updateActionWithConfig;

  $: config,
    updateActionWithConfig,
    refreshActionConfig();

  function refreshActionConfig() {
    if (updateActionWithConfig) {
      updateActionWithConfig(config);
    }
  }

  onMount(() => {
    
    actionElement.addEventListener(
      "updateCode",
      (e) => {
        dispatch("output", { short: config.short, script: e.detail.script });
      },
      false
    );
    actionElement.addEventListener(
      "updateConfigHandler",
      (e) => {
        updateActionWithConfig = e.detail.handler;
      },
      false
    );
  });
</script>

<package class="{$$props.class} flex flex-col w-full p-2 pointer-events-auto">
  {#if config?.information?.actionComponent}
    <svelte:element bind:this={actionElement} this={config.information.actionComponent} />
  {/if}
</package>
