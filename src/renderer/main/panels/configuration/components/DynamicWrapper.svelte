<script>
  import { sineOut } from "svelte/easing";

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
      runtime.update_event_configuration(
        dx,
        dy,
        page,
        element,
        event,
        actionstring,
        "EDITOR_EXECUTE"
      );
      runtime.send_event_configuration_to_grid(dx, dy, page, element, event);
    }

    localDefinitions.update(configs);
    luadebug_store.update_config(_utils.configMerge({ config: configs }));
  }

  function heightChange(
    node,
    { delay = 0, duration = 200, position = "relative" }
  ) {
    let h = +getComputedStyle(node)["height"].slice(0, -2);

    return {
      delay,
      duration,
      css: (t) => {
        return `position: ${position}; height: ${sineOut(t) * h}px;`;
      },
    };
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

  $: console.log(configs, "configs");
</script>

<wrapper
  bind:this={$configNodeBinding[config.id]}
  class=" flex border-none outline-none transition-opacity duration-300"
>
  <carousel
    class=" flex flex-grow text-white {syntaxError
      ? 'border-error border-opacity-75'
      : 'border-transparent'} border"
    id="cfg-{index}"
    config-component={config.information.name}
    movable={config.information.rendering == "standard" ||
      config.information.name.endsWith("_If")}
    config-id={config.id}
  >
    <parent
      class="flex w-full group {disable_pointer_events == true
        ? 'pointer-events-none '
        : ''}"
    >
      <div
        class=" contents w-full {disable_pointer_events == true
          ? 'group-hover:pointer-events-none '
          : ''}"
      >
        <div
          class="flex p-2 items-center {!toggle
            ? 'group-hover:bg-select-saturate-10'
            : ''}  bg-secondary {config.information.grabbing !== false
            ? 'cursor-grab'
            : 'opacity-0 cursor-default '}"
        >
          <svg
            class=" {config.information.grabbing !== false
              ? 'opacity-40'
              : 'opacity-0'}  group-hover:opacity-100"
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

        {#if config.information.rendering == "standard"}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            on:click={() => {
              handleToggle(config.short);
            }}
            class=" flex relative w-min {disable_pointer_events && toggle
              ? 'group-hover:pointer-events-auto'
              : toggle
              ? 'cursor-pointer '
              : config.information.grabbing !== false
              ? 'cursor-grab'
              : ''}"
          >
            <div>
              <icon
                style="background-color:{config.information.color}"
                class="flex group-hover:bg-opacity-75 items-center p-2 h-full cursor-pointer"
              >
                <div class="w-6 h-6">
                  {@html config.information.icon
                    ? config.information.icon
                    : " "}
                </div>
              </icon>
            </div>
          </div>
        {:else}
          <div
            style="background-color:{config.information.color}"
            class=" {config.information.rounding == 'top'
              ? 'rounded-tr-xl '
              : ''} {config.information.rounding == 'bottom'
              ? 'rounded-br-xl '
              : ''}   flex flex-row w-full min-h-fit {config.information
              .grabbing !== false
              ? 'cursor-grab'
              : ''}"
          >
            <icon
              class="flex items-center p-2 {config.information.hiddenIcon
                ? ' hidden '
                : ' '}"
            >
              <div class="w-6 h-6">
                {#if informationOverride.icon !== undefined}
                  {@html informationOverride.icon
                    ? informationOverride.icon
                    : " "}
                {:else}
                  {@html config.information.icon
                    ? config.information.icon
                    : " "}
                {/if}
              </div>
            </icon>

            <div style="white-space: nowrap" class="mx-2 flex items-center">
              {#if informationOverride.blockTitle !== undefined}
                {informationOverride.blockTitle}
              {:else}
                {config.information.blockTitle}
              {/if}
            </div>

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
          </div>
        {/if}
      </div>

      {#if !(toggle || config.information.toggleable === false) && config.information.rendering == "standard"}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <name
          on:click={() => {
            toggle = true;
          }}
          class="px-4 flex items-center w-full bg-secondary group-hover:bg-select-saturate-10 py-2 {disable_pointer_events ==
          true
            ? 'group-hover:pointer-events-auto'
            : 'cursor-pointer'} "
        >
          <div class="flex flex-row justify-between w-full items-center">
            <span>{config.information.desc}</span>
            {#if syntaxError}
              <span class="text-error text-xs">SYNTAX ERROR</span>
            {/if}
          </div>
        </name>
      {/if}

      {#if (toggle || config.information.toggleable === false) && config.information.rendering == "standard"}
        <container
          in:slide={{ duration: animationDuration }}
          class=" w-full flex bg-secondary bg-opacity-25 rounded-br-lg"
        >
          <fader-transition
            class="w-full"
            in:fade={{ delay: animationDuration, duration: animationDuration }}
          >
            <svelte:component
              this={config.component}
              {index}
              {config}
              {access_tree}
              {informationOverride}
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
      {/if}
    </parent>
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
