<script>
  import _utils from "../../../../runtime/_utils";

  import { getAllComponents } from "../../../../lib/_configs";

  import { createEventDispatcher } from "svelte";
  import { ConfigObject } from "../Configuration.store";

  export let access_tree;
  export let index = undefined;
  export let config;

  $: syntaxError = !config.checkSyntax();

  let syntaxError = false;
  let validationError = false;
  const dispatch = createEventDispatcher();

  function replace_me(e) {
    const name = e.detail;
    const components = getAllComponents();
    const new_config = components.find((e) => e.information.name === name);
    const obj = new ConfigObject({
      short: new_config.information.short,
      script: new_config.information.defaultLua,
    });
    config = obj;
    dispatch("update", {
      index: index,
      newConfig: obj,
    });
    config.toggled = true;
    toggled = true;
  }

  function handleOutput(e) {
    const obj = new ConfigObject({
      short: e.detail.short,
      script: e.detail.script,
    });
    console.log("output");
    config = obj;
    dispatch("update", {
      index: index,
      newConfig: obj,
    });
  }

  function handleValidator(e) {
    const data = e.detail;
    validationError = data.isError;
  }

  //TODO: Refactor this out by refactoring the handling of
  //modifier rendering style blocks
  let toggled = false;
  function handleToggle(e) {
    if (config.information.rendering === "modifier") {
      return;
    }

    config.toggled = !config.toggled;
    toggled = config.toggled;
    dispatch("toggle", { value: config.toggled, index: index });
  }
</script>

<wrapper
  class="flex flex-grow border-none outline-none transition-opacity duration-300"
>
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
      <!-- Six dots to the left -->
      <div
        class="flex p-2 items-center bg-secondary"
        class:group-hover:bg-select-saturate-10={!toggled}
        class:border-error={syntaxError}
        class:border-y={syntaxError}
        class:border-l={syntaxError}
        class:invisible={!config.information.selectable}
      >
        <svg
          class="opacity-40 group-hover:opacity-100"
          width="8"
          height="13"
          viewBox="0 0 8 13"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="1.5" cy="1.5" r="1.5" fill="#D9D9D9" />
          <circle cx="1.5" cy="6.5" r="1.5" fill="#D9D9D9" />
          <circle cx="1.5" cy="11.5" r="1.5" fill="#D9D9D9" />
          <circle cx="6.5" cy="1.5" r="1.5" fill="#D9D9D9" />
          <circle cx="6.5" cy="6.5" r="1.5" fill="#D9D9D9" />
          <circle cx="6.5" cy="11.5" r="1.5" fill="#D9D9D9" />
        </svg>
      </div>

      <!-- Icon -->
      <!-- Refactor out the special cases -->
      {#if !config.information.name.endsWith("_End") && config.information.desc !== "Else"}
        <div
          style="background-color:{config.information.color}"
          class="flex items-center p-2 w-min text-center"
          class:border-y={syntaxError}
          class:border-error={syntaxError}
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
        class="w-full bg-secondary cur"
        class:rounded-tr-xl={config.information.rounding == "top"}
        class:rounded-br-xl={config.information.rounding == "bottom"}
        class:group-hover:bg-select-saturate-10={!toggled}
        class:border-error={syntaxError}
        class:border-y={syntaxError}
        class:border-r={syntaxError}
        class:cursor-auto={toggled}
        class:bg-opacity-30={toggled}
      >
        <!-- Refactor out the special case of IF -->
        {#if toggled || config.information.name === "Condition_If"}
          <container
            class="flex items-center h-full w-full pointer-events-auto"
          >
            <fader-transition class="w-full">
              <svelte:component
                this={config.component}
                {index}
                {config}
                {access_tree}
                on:replace={replace_me}
                on:validator={handleValidator}
                on:output={handleOutput}
              />
            </fader-transition>
          </container>
        {:else}
          <div
            class="px-4 flex flex-row justify-between w-full items-center h-full"
          >
            <span class="text-white">{config.information.desc}</span>
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
