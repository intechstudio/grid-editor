<script>
  import { getAllComponents } from "../../../../lib/_configs";

  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { ConfigObject } from "../Configuration.store";

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

  $: syntaxError = !config.checkSyntax();

  let syntaxError = false;
  let validationError = false;
  let ctrlIsDown = false;

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
    const { short, script } = e.detail;
    dispatch("update", {
      index: index,
      config: new ConfigObject({
        short: short,
        script: script,
      }),
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

  function handleCarouselClicked(e) {
    if (e.ctrlKey) {
      dispatch("select");
    } else {
      handleToggle(e);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Control") {
      ctrlIsDown = true;
    }
  }

  function handleKeyUp(e) {
    if (e.key === "Control") {
      ctrlIsDown = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<wrapper class="flex flex-grow outline-none" class:cursor-pointer={ctrlIsDown}>
  {#each Array(config.indentation >= 0 ? config.indentation : 0) as n}
    <div style="width: 15px" class="flex items-center mx-1">
      <div class="w-3 h-3 rounded-full bg-secondary" />
    </div>
  {/each}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <carousel
    class="group/bg-color flex flex-grow h-auto min-h-[32px] border {syntaxError
      ? 'border-error'
      : 'border-transparent'}"
    id="cfg-{index}"
    class:rounded-tr-xl={config.information.rounding === "top"}
    class:rounded-br-xl={config.information.rounding === "bottom"}
    config-name={config.information.name}
    config-type={config.information.type}
    config-id={index}
    movable={config.information.movable}
    on:click|self={handleCarouselClicked}
  >
    <!-- Face of the config block, with disabled pointer events (Except for input fields) -->
    <!-- TODO: Make marking when the block has unsaved changes  -->
    <div class="w-full flex flex-row pointer-events-none">
      <!-- Icon -->
      {#if config.information.hideIcon !== true}
        <div
          style="background-color:{config.information.color}"
          class="flex items-center p-2 w-min text-center"
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
              class="h-full w-full px-2"
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
            class="bg-secondary px-2 w-full h-full {config.information
              .rounding === 'top'
              ? 'rounded-tr-xl'
              : ''} {config.information.rounding === 'bottom'
              ? 'rounded-br-xl'
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
