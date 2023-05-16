<script>
  import { quadIn } from "svelte/easing";

  import { fade, slide } from "svelte/transition";
  import { get } from "svelte/store";

  import Options from "./Options.svelte";

  import {
    runtime,
    user_input,
    logger,
    localDefinitions,
    luadebug_store,
    appMultiSelect,
  } from "../../../../runtime/runtime.store.js";

  import _utils from "../../../../runtime/_utils";

  import {
    configNodeBinding,
    openedActionBlocks,
  } from "../../../../runtime/app-helper.store.js";

  import { getAllComponents } from "../../../../lib/_configs";

  import { checkSyntax } from "../../../../runtime/monaco-helper";

  import { onMount } from "svelte";
  import { append_hydration_dev } from "svelte/internal";

  export let config = ""; //{desc: 'unnamed', rendering: 'standard', id: ''};
  export let configs;

  export let access_tree;
  export let index = undefined;
  export let disable_pointer_events = false;

  export let toggle = false;

  let syntaxError = false;
  let validationError = false;
  let animationDuration = 0;

  onMount(() => {
    let openedBlocks = $openedActionBlocks;

    if (openedBlocks.find((s) => s == config.short)) {
      toggle = true;

      animationDuration = 0;
    } else {
      animationDuration =
        config.information.rendering != "standard" ||
        config.information.toggleable === false
          ? 0
          : 400;
    }
    isSyntaxError();
  });

  let informationOverride = {};

  function replace_me(e) {
    appMultiSelect.reset();

    let components = getAllComponents();

    let new_config = components.find((c) => c.information.name == e.detail);

    config.script = new_config.information.defaultLua;
    config.short = new_config.information.short;

    config.component = new_config.component;
    config.information = new_config.information;

    handleConfigChange({ configName: config.information.name });
  }

  function isSyntaxError() {
    try {
      let toValidate =
        typeof config.toValidate !== "undefined"
          ? config.toValidate
          : config.script;
      checkSyntax(toValidate);
      syntaxError = false;
    } catch (e) {
      syntaxError = true;
      logger.set({
        type: "alert",
        mode: 0,
        classname: "syntaxerror",
        message: `Syntax Error`,
      });
    }
    return syntaxError;
  }

  function information_override(e) {
    Object.keys(e.detail).forEach((k) => {
      //console.log("k-v", k, e.detail[k]);
      informationOverride[k] = e.detail[k];
    });
  }

  function handleConfigChange({ configName }) {
    // when rendering the Else and End config-blocks, they automatically send out their respective values
    // this results in config change trigger, which should not be sent out to grid, consider it as AUTO change

    const li = get(user_input);

    const dx = li.brc.dx;
    const dy = li.brc.dy;
    const page = li.event.pagenumber;
    const element = li.event.elementnumber;
    const event = li.event.eventtype;

    let dest = findUpdateDestEvent(rt, dx, dy, page, element, event);
    console.log(dest.config);
    console.log(configs);
    const actionstring = _utils.configMerge({ config: configs });

    // EncoderPushRotElse, EncoderPushRotEnd ects
    if (configName.endsWith("_End") || configName.endsWith("_Else")) {
      runtime.update_event_configuration(
        dx,
        dy,
        page,
        element,
        event,
        actionstring,
        "EDITOR_EXECUTE"
      );
    } else {
      runtime
        .check_action_string_length(actionstring)
        .then(() => {
          runtime.update_event_configuration(
            dx,
            dy,
            page,
            element,
            event,
            actionstring,
            "EDITOR_EXECUTE"
          );
          runtime.send_event_configuration_to_grid(
            dx,
            dy,
            page,
            element,
            event
          );
        })
        .catch();
    }

    localDefinitions.update(configs);
    luadebug_store.update_config(_utils.configMerge({ config: configs }));
  }

  function handleToggle(short) {
    if (toggle === true) {
      toggle = false;
      animationDuration =
        config.information.rendering != "standard" ||
        config.information.toggleable === false
          ? 0
          : 400;

      openedActionBlocks.update((s) => {
        s = s.filter((v) => v !== short);
        return s;
      });
    } else {
      toggle = true;

      openedActionBlocks.update((s) => {
        s = s.filter((v) => v !== short);
        s.push(short);
        return s;
      });
    }
  }

  //$: console.log(configs, "configs");
</script>

<wrapper
  bind:this={$configNodeBinding[config.id]}
  class="flex border-none outline-none transition-opacity duration-300"
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <carousel
    class="group flex flex-grow {toggle ? 'h-auto' : 'h-10'} "
    class:cursor-pointer={!disable_pointer_events}
    id="cfg-{index}"
    config-component={config.information.name}
    movable={config.information.rendering == "standard" ||
      config.information.name.endsWith("_If")}
    config-id={config.id}
    on:click|self={() => {
      if (config.information.rendering !== "standard") return;
      handleToggle(config.short);
    }}
  >
    <!-- Face of the config block, with disabled pointer events (Except for input fields) -->
    <div class="w-full flex flex-row pointer-events-none">
      <!-- Six dots to the left -->
      <div
        class="flex p-2 items-center bg-secondary"
        class:group-hover:bg-select-saturate-10={!toggle}
        class:invisible={config.information.rendering !== "standard" &&
          !config.information.name.endsWith("_If")}
        class:border-error={syntaxError}
        class:border-y={syntaxError}
        class:border-l={syntaxError}
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

      {#if config.information.blockTitle !== "End"}
        <div
          style="background-color:{config.information.color}"
          class="flex items-center p-2 w-min text-center"
          class:border-y={syntaxError}
          class:border-error={syntaxError}
        >
          <div class="w-6 h-6 whitespace-nowrap">
            {#if config.information.blockTitle !== "IF"}
              {@html config.information.icon}
            {:else}
              <span class="text-white">
                {config.information.blockTitle}
              </span>
            {/if}
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
        class:group-hover:bg-select-saturate-10={!toggle}
        class:border-error={syntaxError}
        class:border-y={syntaxError}
        class:border-r={syntaxError}
        class:cursor-auto={toggle}
      >
        {#if toggle || config.information.blockTitle === "IF"}
          <container
            in:slide={{ duration: animationDuration }}
            class="flex items-center h-full w-full pointer-events-auto"
            class:bg-primary={toggle && config.information.blockTitle !== "IF"}
            class:bg-opacity-60={toggle}
            class:pr-2={config.information.rendering !== "standard"}
          >
            <fader-transition
              class="w-full"
              in:fade={{
                easing: quadIn,
                delay: animationDuration / 3,
                duration: animationDuration,
              }}
            >
              <svelte:component
                this={config.component}
                {index}
                {config}
                {access_tree}
                on:replace={(e) => {
                  replace_me(e);
                }}
                on:informationOverride={(e) => {
                  information_override(e);
                }}
                on:validator={(e) => {
                  const data = e.detail;
                  validationError = data.isError;
                }}
                on:output={(e) => {
                  config.script = e.detail.script;
                  config.toValidate = e.detail.toValidate;
                  isSyntaxError();
                  handleConfigChange({ configName: config.information.name });
                  configs = configs;
                }}
              />
            </fader-transition>
          </container>
        {:else}
          <div
            class="px-4 flex flex-row justify-between w-full items-center h-full"
          >
            <span class="text-white">{config.information.desc}</span>
            {#if syntaxError}
              <span class="text-error text-xs">SYNTAX ERROR</span>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </carousel>

  <Options
    {toggle}
    {index}
    {configs}
    rendering={config.information.rendering}
    componentName={config.information.name}
  />
</wrapper>

<style global>
  carousel:last-child {
    margin-bottom: 0;
  }
</style>
