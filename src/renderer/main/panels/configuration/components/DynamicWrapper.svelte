<script>
  import { getAllComponents } from "../../../../lib/_configs";

  import { createEventDispatcher, onMount } from "svelte";
  import { ConfigList, ConfigObject } from "../Configuration.store";

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
    config.toggled = true;
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

  let toggled;
  $: {
    toggled = config.toggled;
  }

  //TODO: Refactor this out by refactoring the handling of
  //modifier rendering style blocks
  function handleToggle(e) {
    if (config.information.rendering === "modifier") {
      return;
    }

    config.toggled = !config.toggled;
    dispatch("toggle", { value: config.toggled, index: index });
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
  <carousel
    class="group flex flex-grow {toggled ? 'h-auto' : 'h-10'}"
    id="cfg-{index}"
    config-component={config.information.name}
    config-id={index}
    movable={true}
    on:click|self={handleToggle}
  >
    <!-- Face of the config block, with disabled pointer events (Except for input fields) -->
    <div
      class="w-full flex flex-row pointer-events-none transition-all duration-300"
    >
      <!-- Icon -->
      <!-- //TODO: Refactor out the special cases -->
      {#if !config.information.name.endsWith("_End") && config.information.desc !== "Else"}
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
        class="w-full bg-secondary border-y border-r {syntaxError
          ? 'border-error'
          : 'border-transparent'}"
        class:rounded-tr-xl={config.information.rounding == "top"}
        class:rounded-br-xl={config.information.rounding == "bottom"}
        class:group-hover:bg-select-saturate-10={!toggled}
        class:cursor-auto={toggled}
        class:bg-opacity-30={toggled}
      >
        <!-- //TODO: Refactor out the special case of IF -->
        {#if toggled || config.information.short === "if" || config.information.short === "ei"}
          <container class="flex flex-grow items-center pointer-events-auto">
            <svelte:component
              this={config.component}
              class="w-full"
              {index}
              {config}
              {access_tree}
              on:replace={replace_me}
              on:validator={handleValidator}
              on:output={handleOutput}
            />
          </container>
        {:else}
          <div
            class="px-4 flex flex-row justify-between w-full items-center h-full"
          >
            <span class="text-white">{config.information.blockTitle}</span>
            <span class="text-error text-xs" class:hidden={!syntaxError}>
              SYNTAX ERROR
            </span>
          </div>
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
