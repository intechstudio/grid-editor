<script context="module">
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "../headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { appSettings } from "../../runtime/app-helper.store";
  import { GridAction } from "../../runtime/runtime";

  export let config: GridAction;

  const dispatch = createEventDispatcher();

  let actionElement;
  let updateActionWithConfig;

  $: config, updateActionWithConfig, refreshActionConfig();

  function refreshActionConfig() {
    if (updateActionWithConfig) {
      updateActionWithConfig(config);
    }
  }

  $: actionElement && addListeners();

  function addListeners() {
    actionElement.addEventListener(
      "updateCode",
      (e) => {
        dispatch("update-action", {
          short: config.short,
          script: e.detail.script,
          validationError: false,
        });
        dispatch("sync");
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
  }
</script>

<package class="flex flex-col w-full p-2 pointer-events-auto">
  {#if config?.information?.actionComponent}
    {#key $appSettings.packageComponentKeys[config.information.packageId]}
      <svelte:element
        this={config.information.actionComponent}
        bind:this={actionElement}
      />
    {/key}
  {/if}
</package>
