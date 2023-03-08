<script>
  import { sineOut } from "svelte/easing";

  import { fade, slide } from "svelte/transition";
  import { get } from "svelte/store";

  import Options from "./Options.svelte";

  import {
    runtime,
    user_input,
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

  import { onMount } from "svelte";

  export let config = ""; //{desc: 'unnamed', rendering: 'standard', id: ''};
  export let configs;

  export let access_tree;
  export let index = undefined;
  export let disable_pointer_events = false;

  export let toggle = false;
  export let drag_start;

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
    console.log(config.short);
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

  $: console.log(drag_start, "drag_start");

  let isDragIconClicked = false;
</script>

<wrapper
  bind:this={$configNodeBinding[config.id]}
  class=" flex border-none outline-none transition-opacity duration-300"
>
  <carousel
    class=" flex flex-grow text-white  group "
    id="cfg-{index}"
    movable={config.information.rendering == "standard" ||
      config.information.name.endsWith("_If")}
    config-component={config.information.name}
    config-id={config.id}
  >
    <div
      on:focus={() => {
        isDragIconClicked = !isDragIconClicked;
      }}
      class="flex p-2 {disable_pointer_events
        ? ' pointer-events-none'
        : ''} {isDragIconClicked
        ? 'cursor-grabbing'
        : 'cursor-grab'}  bg-secondary "
    >
      <!---cursor-grab problem-->
      <svg
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
      <div
        on:click={() => {
          handleToggle(config.short);
        }}
        class=" flex relative"
      >
        <div>
          <icon
            style="background-color:{config.information.color}"
            class="flex group-hover:bg-opacity-75 items-center p-2 "
          >
            <div class="w-6 h-6">
              {@html config.information.icon ? config.information.icon : " "}
            </div>
          </icon>
        </div>
      </div>
    {:else}
      <div
        style="background-color:{config.information.color}"
        class="{disable_pointer_events ? 'pointer-events-none' : ''} {config
          .information.rounding == 'top'
          ? 'rounded-tl-2xl '
          : ''} {config.information.rounding == 'bottom'
          ? 'rounded-bl-2xl '
          : ''} flex flex-row w-full min-h-fit"
      >
        <icon
          class="flex items-center p-2 {config.information.hiddenIcon
            ? ' hidden '
            : ' '}"
        >
          <div class="w-6 h-6">
            {#if informationOverride.icon !== undefined}
              {@html informationOverride.icon ? informationOverride.icon : " "}
            {:else}
              {@html config.information.icon ? config.information.icon : " "}
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
          on:output={(e) => {
            config.script = e.detail.script;
            handleConfigChange({ configName: config.information.name });
            configs = configs;
          }}
        />
      </div>
    {/if}

    {#if !(toggle || config.information.toggleable === false) && config.information.rendering == "standard"}
      <name
        on:click={() => {
          toggle = true;
        }}
        class="pl-4 flex items-center w-full bg-secondary group-hover:bg-select-saturate-10 py-2"
      >
        <span class="block">{config.information.desc}</span>
      </name>
    {/if}
  </carousel>

  {#if toggle || config.information.toggleable === false}
    <container
      in:slide={{ duration: animationDuration }}
      class=" w-full flex bg-secondary bg-opacity-25 rounded-b-lg"
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
          on:output={(e) => {
            config.script = e.detail.script;
            handleConfigChange({ configName: config.information.name });
            configs = configs;
          }}
        />
      </fader-transition>
    </container>
  {/if}

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
