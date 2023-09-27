<script>
  import { getAllComponents } from "../../../../lib/_configs";

  import { createEventDispatcher, onMount } from "svelte";
  import { ConfigList, ConfigObject } from "../Configuration.store";

  import {
    lastOpenedActionblocks,
    lastOpenedActionblocksInsert,
    lastOpenedActionblocksRemove,
  } from "../Configuration.store";

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
  export let indentation = 0;

  $: syntaxError = !config.checkSyntax();

  let syntaxError = false;
  let validationError = false;
  const dispatch = createEventDispatcher();

  function replace_me(e) {
    const name = e.detail;
    const components = getAllComponents();
    const new_config = components.find((e) => e.information.name === name);
    console.log(new_config);
    const obj = new ConfigObject({
      parent: config.parent,
      short: new_config.information.short,
      script: new_config.information.defaultLua,
    });
    config = obj;
    dispatch("update", {
      index: index,
      newConfig: obj,
    });
    toggled = true;
  }

  function handleOutput(e) {
    config.short = e.detail.short;
    config.script = e.detail.script;
    dispatch("update", {
      index: index,
      newConfig: config,
    });
  }

  function handleValidator(e) {
    const data = e.detail;
    validationError = data.isError;
  }

  //TODO: Refactor this out by refactoring the handling of
  //modifier rendering style blocks
  function handleToggle(e) {
    toggled = !toggled;

    if (toggled) {
      lastOpenedActionblocksInsert(config.short);
    } else {
      lastOpenedActionblocksRemove(config.short);
    }
  }
</script>

<wrapper
  class="flex flex-grow border-none outline-none transition-opacity duration-300"
>
  {#each Array(indentation) as n}
    <div style="width: 15px" class="flex items-center mx-1">
      <div class="w-3 h-3 rounded-full bg-secondary" />
    </div>
  {/each}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <carousel
    class="group flex flex-grow {toggled ? 'h-auto' : 'h-10'}"
    id="cfg-{index}"
    config-name={config.information.name}
    config-type={config.information.type}
    config-id={index}
    movable={config.information.movable}
    on:click|self={handleToggle}
  >
    <!-- Face of the config block, with disabled pointer events (Except for input fields) -->
    <div
      class="w-full flex flex-row pointer-events-none transition-all duration-300"
    >
      <!-- Icon -->
      <!-- //TODO: Refactor out the special cases -->
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
        style="background-color:{config.information.rendering !== 'standard'
          ? config.information.color
          : ''}"
        class="w-full border-y border-r {syntaxError
          ? 'border-error'
          : 'border-transparent'} flex flex-grow items-center pointer-events-auto bg-secondary"
        class:rounded-tr-xl={config.information.rounding == "top"}
        class:rounded-br-xl={config.information.rounding == "bottom"}
        class:group-hover:bg-select-saturate-10={!toggled}
        class:cursor-auto={toggled}
        class:bg-opacity-30={toggled}
      >
        <!-- Content of block -->

        {#if toggled}
          <svelte:component
            this={config.component}
            class="h-full w-full px-2 -my-[1px]"
            {index}
            {config}
            {access_tree}
            {syntaxError}
            on:replace={replace_me}
            on:validator={handleValidator}
            on:output={handleOutput}
            on:toggle={handleToggle}
          />
        {:else}
          <svelte:component
            this={config.header}
            {config}
            {access_tree}
            class="px-2 w-full h-full"
            on:toggle={handleToggle}
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
