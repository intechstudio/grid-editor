<script>
  import { getAllComponents } from "../../../../lib/_configs";

  import { createEventDispatcher, onMount } from "svelte";
  import { ConfigList, ConfigObject } from "../Configuration.store";

  import {
    lastOpenedActionblocks,
    lastOpenedActionblocksInsert,
    lastOpenedActionblocksRemove,
  } from "../Configuration.store";
  import { config_drag, DragEvent } from "../../../_actions/move.action";
  import DropZone from "./DropZone.svelte";

  let toggled = false;

  onMount(() => {
    if (config.information.toggleable !== false) {
      toggled =
        -1 !==
        $lastOpenedActionblocks.findIndex((e) => {
          return e == config.short;
        });
    } else {
      toggled = true;
    }
  });

  export let access_tree;
  export let index = undefined;
  export let config;

  $: syntaxError = !config.checkSyntax();

  let syntaxError = false;
  let validationError = false;

  const dispatch = createEventDispatcher();

  function replace_me(e) {
    const { short, script } = e.detail;

    const components = getAllComponents();
    const new_config = components.find((e) => e.information.short === short);

    const obj = new ConfigObject({
      short: new_config.information.short,
      script:
        typeof script === "undefined"
          ? new_config.information.defaultLua
          : script,
    });

    dispatch("replace", {
      index: index,
      config: obj,
    });
    toggled = true;
  }

  function handleOutput(e) {
    dispatch("update", {
      index: index,
      short: e.detail.short,
      script: e.detail.script,
    });
  }

  function handleValidator(e) {
    const data = e.detail;
    validationError = data.isError;
  }

  function handleToggle(e) {
    if (config.information.toggleable == false) {
      return;
    }

    toggled = !toggled;

    if (toggled) {
      lastOpenedActionblocksInsert(config.short);
    } else {
      lastOpenedActionblocksRemove(config.short);
    }
  }

  $: console.log(config.indentation);
</script>

<wrapper class="flex flex-grow border-none outline-none">
  {#each Array(config.indentation >= 0 ? config.indentation : 0) as n}
    <div style="width: 15px" class="flex items-center mx-1">
      <div class="w-3 h-3 rounded-full bg-secondary" />
    </div>
  {/each}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <carousel
    class="group/bg-color flex flex-grow h-auto min-h-[32px]"
    id="cfg-{index}"
    config-name={config.information.name}
    config-type={config.information.type}
    config-id={index}
    movable={config.information.movable}
    on:click|self={handleToggle}
  >
    <!-- Face of the config block, with disabled pointer events (Except for input fields) -->
    <!-- TODO: Make marking when the block has unsaved changes  -->
    <div class="w-full flex flex-row pointer-events-none">
      <!-- Icon -->
      {#if config.information.hideIcon !== true}
        <div
          style="background-color:{config.information.color}"
          class="flex items-center p-2 w-min text-center border-y border-l {syntaxError
            ? 'border-error'
            : 'border-transparent'}"
        >
          <div class="w-6 h-6 whitespace-nowrap">
            {@html config.information.blockIcon}
          </div>
        </div>
      {/if}

      <!-- Body of the config block -->
      <div
        class="w-full flex flex-grow items-center"
        class:cursor-auto={toggled}
        class:bg-opacity-30={toggled}
      >
        <!-- Content of block -->
        {#if (toggled && config.information.toggleable) || typeof config.header === "undefined"}
          <!-- Body of the Action block when toggled -->
          <div class="bg-secondary bg-opacity-30 h-full w-full">
            <svelte:component
              this={config.component}
              class="h-full w-full px-2 -my-[1px] border-y border-r {syntaxError
                ? 'border-error'
                : 'border-transparent'} {config.information.hideIcon
                ? 'border-l'
                : ''}"
              {index}
              {config}
              {access_tree}
              {syntaxError}
              on:replace={replace_me}
              on:validator={handleValidator}
              on:output={handleOutput}
              on:toggle={handleToggle}
            />
          </div>
        {:else}
          <!-- Header of the Action block when untoggled -->

          <svelte:component
            this={config.header}
            {config}
            {access_tree}
            class="bg-secondary px-2 w-full h-full -mt-[1px] border-y border-r {syntaxError
              ? 'border-error'
              : 'border-transparent'} {config.information.hideIcon
              ? 'border-l'
              : ''}"
            on:toggle={handleToggle}
            on:output={handleOutput}
          />
        {/if}
      </div>
    </div>
  </carousel>
</wrapper>

<style global>
  carousel:last-child {
    margin-bottom: 0;
  }
</style>
