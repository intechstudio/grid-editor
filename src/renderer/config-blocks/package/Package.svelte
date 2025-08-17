<script module>
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "../headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;
</script>

<script lang="ts">
  import { run } from 'svelte/legacy';

  import { createEventDispatcher } from "svelte";
  import { appSettings } from "../../runtime/app-helper.store";
  import { GridAction } from "../../runtime/runtime";

  interface Props {
    config: GridAction;
  }

  let { config }: Props = $props();

  const dispatch = createEventDispatcher();

  let actionElement = $state();
  let updateActionWithConfig = $state();


  function refreshActionConfig() {
    if (updateActionWithConfig) {
      updateActionWithConfig(config);
    }
  }


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
      false,
    );
    actionElement.addEventListener(
      "updateConfigHandler",
      (e) => {
        updateActionWithConfig = e.detail.handler;
      },
      false,
    );
  }
  run(() => {
    config, updateActionWithConfig, refreshActionConfig();
  });
  run(() => {
    actionElement && addListeners();
  });
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
