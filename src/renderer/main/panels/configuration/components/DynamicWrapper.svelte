<script>
  import { quadIn } from "svelte/easing";

  import { fade, slide } from "svelte/transition";
  import { get } from "svelte/store";

  import Options from "./Options.svelte";

  import {
    runtime,
    user_input,
    logger,
    appMultiSelect,
  } from "../../../../runtime/runtime.store.js";

  import _utils from "../../../../runtime/_utils";

  import { getAllComponents } from "../../../../lib/_configs";

  import { checkSyntax } from "../../../../runtime/monaco-helper";

  import { onMount } from "svelte";
  import { ConfigObject } from "../Configuration.store";

  export let config;

  export let access_tree;
  export let index = undefined;

  let toggled = false;
  let carousel = undefined;

  let syntaxError = false;
  let validationError = false;

  onMount(() => {
    isSyntaxError();
  });

  function replace_me(e) {
    appMultiSelect.reset();

    let new_config = getAllComponents().find(
      (c) => c.information.name == e.detail
    );

    config = new ConfigObject(
      new_config.information.short,
      new_config.information.defaultLua
    );

    handleConfigChange({ configName: component.information.name });
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

  function handleConfigChange({ configName }) {
    // when rendering the Else and End config-blocks, they automatically send out their respective values
    // this results in config change trigger, which should not be sent out to grid, consider it as AUTO change

    const li = get(user_input);

    const dx = li.brc.dx;
    const dy = li.brc.dy;
    const page = li.event.pagenumber;
    const element = li.event.elementnumber;
    const event = li.event.eventtype;

    //const actionstring = _utils.configMerge({ config: configs });

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
        .catch((e) => {
          logger.set({
            type: "fail",
            mode: 0,
            classname: "check_action_string_length_error",
            message: `Config length is too long, shorten your code or delete actions!`,
          });
        });
    }
  }

  function handleToggle() {
    toggled = !toggled;
  }

  function openAnimation(node, isOpen) {
    let initialHeight = node.offsetHeight;
    node.style.height = isOpen ? "auto" : 0;
    node.style.overflow = "hidden";
    return {
      update(isOpen) {
        let animation = node.animate(
          [
            {
              height: initialHeight + "px",
              overflow: "hidden",
            },
            {
              height: 0,
              overflow: "hidden",
            },
          ],
          { duration: 100, fill: "both" }
        );
        animation.pause();
        if (!isOpen) {
          animation.play();
        } else {
          animation.reverse();
        }
      },
    };
  }

  //$: $openedActionBlocks.forEach();
</script>

<wrapper class="flex border-none outline-none transition-opacity duration-300">
  <!-- svelte-ignore a11y-click-events-have-key-events -->

  <carousel
    bind:this={carousel}
    class="group flex flex-grow {toggled ? 'h-auto' : 'h-10'}"
    id="cfg-{index}"
    config-component={config.information.name}
    config-id={config.id}
    movable={config.information.rendering == "standard" ||
      config.information.name.endsWith("_If")}
    on:click|self={() => {
      handleToggle();
      openAnimation(carousel, toggled);
    }}
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
        {#if toggled}
          <container
            class="flex items-center h-full w-full pointer-events-auto"
          >
            <fader-transition class="w-full">
              <svelte:component
                this={config.component}
                {index}
                {config}
                {access_tree}
                on:replace={(e) => {
                  replace_me(e);
                }}
                on:validator={(e) => {
                  const data = e.detail;
                  validationError = data.isError;
                }}
                on:output={(e) => {
                  config.script = e.detail.script;
                  config.toValidate = e.detail.toValidate;
                  isSyntaxError();
                  handleConfigChange({
                    configName: config.information.name,
                  });
                }}
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

  <!-- <Options
    {toggle}
    {index}
    {configs}
    rendering={configInformation.rendering}
    componentName={configInformation.name}
  /> -->
</wrapper>

<style global>
  carousel:last-child {
    margin-bottom: 0;
  }
</style>
