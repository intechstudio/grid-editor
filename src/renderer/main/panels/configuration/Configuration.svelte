<script>
  import { get } from "svelte/store";

  import { fly, fade } from "svelte/transition";
  import { flip } from "svelte/animate";

  import ConfigParameters from "./ConfigParameters.svelte";

  let actionIsDragged = false;

  import TooltipSetter from "../../user-interface/tooltip/TooltipSetter.svelte";

  import { lua_error_store } from "../DebugMonitor/DebugMonitor.store";

  import {
    runtime,
    logger,
    appMultiSelect,
    user_input,
    engine,
  } from "../../../runtime/runtime.store.js";

  import { ConfigList } from "./Configuration.store.js";

  import _utils from "../../../runtime/_utils.js";

  import { onMount, onDestroy } from "svelte";

  import { configListScrollSize } from "../../_actions/boundaries.action";

  import MultiSelect from "./components/MultiSelect.svelte";
  import DropZone from "./components/DropZone.svelte";
  import DynamicWrapper from "./components/DynamicWrapper.svelte";

  import ExportConfigs from "./components/ExportConfigs.svelte";

  import { changeOrder } from "../../_actions/move.action.js";

  import { ConfigManager } from "./Configuration.store.js";
  import AddAction from "./components/AddAction.svelte";

  import { appSettings } from "../../../runtime/app-helper.store";

  import { selectedControllerIndexStore } from "/runtime/preset-helper.store";

  let configs = [];
  let events = { options: ["", "", ""], selected: "" };
  let elements = { options: [], selected: "" };

  let access_tree = {};

  onMount(() => {});

  let controllerIndex;

  $: controllerIndex = $selectedControllerIndexStore;

  $: selectedControllerIndexStore.set(elements);

  function changeSelectedConfig(arg) {
    $appSettings.configType = arg;

    if (arg == "systemEvents") {
      // maybe ui.event.elementnumber = 255 ?
      user_input.update((ui) => {
        ui.event.elementnumber = 255;
        ui.event.eventtype = 4;
        ui.event.elementtype = "system";
        return ui;
      });
    }

    if (arg == "uiEvents") {
      const rt = get(runtime);
      const ui = get(user_input);
      const device = rt.find(
        (device) => device.dx == ui.brc.dx && device.dy == ui.brc.dy
      );

      if (device === undefined) {
        return;
      }

      user_input.update((ui) => {
        ui.event.elementnumber = 0;
        ui.event.eventtype = 0;
        ui.event.elementtype =
          device.pages[
            ui.event.pagenumber
          ].control_elements[0].controlElementType;
        return ui;
      });
    }
  }

  $: {
    let les = $lua_error_store;
    let e = les.slice(-1).pop();

    if (e) {
      switch (e.type) {
        case "luanotok":
          logger.set({
            type: "alert",
            mode: 0,
            classname: "luanotok",
            message: `${e.device}: Error on Element ${e.element.no} ${e.event.type} event.`,
          });
          break;
        case "kbisdisabled":
          logger.set({
            type: "alert",
            mode: 0,
            classname: "kbisdisabled",
            message: `${e.device}: Keyboard events are disabled until storing.`,
          });
          break;
      }
    }
  }

  const ui_unsubscribe = user_input.subscribe((ui) => {
    try {
      if ($user_input) {
        appMultiSelect.reset();
        const list = ConfigList.getCurrent();
        if (typeof list === "undefined") {
          throw "Error loading current config.";
        }
        configs = list.toArray();

        // set UI to uiEvents, if its not system events
        if (list.target.element !== 255) {
          $appSettings.configType = "uiEvents";
        }
      }
    } catch (e) {
      console.error(e);
    }
  });

  onDestroy(() => {
    ui_unsubscribe();
  });

  // ========================= FROM OLD CONFIGLIST IMPLEMENTATION ======================= //

  let animation = false;
  let drag_start = false;
  let drag_target = "";
  let drop_target = "";

  let scrollHeight = "100%";

  function addConfigAtPosition(arg, index) {
    const newConfig = arg.detail.config;
    if (typeof newConfig === "undefined" || newConfig === "") {
      return;
    }

    const list = new ConfigManager();
    const res = list.add(newConfig, index);
  }

  function handleDrop(e) {
    // if only cfg-list is selected, don't let dnd happen nor delete.
    if (!Number.isNaN(drop_target)) {
      const list = new ConfigManager();
      console.log(configs, drag_target, drop_target, undefined);
      list.reorder(configs, drag_target, drop_target, e.detail.multi);
    }
  }
</script>

<configuration
  class="w-full h-full flex flex-col {$engine == 'ENABLED'
    ? ''
    : 'pointer-events-none'}"
>
  <div class="bg-primary py-5 flex flex-col justify-center">
    <div class="flex flex-row items-start bg-primary py-2 px-10">
      <button
        on:click={() => {
          changeSelectedConfig("uiEvents");
        }}
        class="{$appSettings.configType == 'uiEvents'
          ? 'shadow-md bg-pick text-white'
          : 'hover:bg-pick-desaturate-10 text-gray-50'} relative m-2 p-1 flex-grow border-0 rounded focus:outline-none bg-secondary w-48"
      >
        <span> UI Events </span>
        <TooltipSetter key={"configuration_ui_events"} />
      </button>

      <button
        on:click={() => {
          changeSelectedConfig("systemEvents");
        }}
        class="{$appSettings.configType == 'systemEvents'
          ? 'shadow-md bg-pick text-white'
          : 'hover:bg-pick-desaturate-10 text-gray-50'} relative m-2 p-1 flex-grow border-0 rounded focus:outline-none bg-secondary w-48"
      >
        <span> System Events </span>
        <TooltipSetter key={"configuration_system_events"} />
      </button>
    </div>
  </div>

  {#key $appSettings.configType == "uiEvents"}
    <container
      class="flex flex-col h-full"
      in:fly={{
        x: $appSettings.configType == "uiEvents" ? -5 : 5,
        opacity: 0.5,
        duration: 200,
        delay: 0,
      }}
    >
      <configs class="w-full h-full flex flex-col px-4 bg-primary pb-2">
        <div>
          <ConfigParameters {events} />
          <div class="px-4 flex w-full items-center justify-between">
            <div class="text-gray-500 text-sm">Actions</div>
            <MultiSelect />
          </div>
        </div>

        <div
          use:changeOrder={{ configs }}
          on:drag-start={(e) => {
            drag_start = true;
            actionIsDragged = true;
            appMultiSelect.reset();
          }}
          on:drag-target={(e) => {
            drag_target = e.detail.id;
          }}
          on:drop-target={(e) => {
            drop_target = e.detail.drop_target;
          }}
          on:drop={handleDrop}
          on:drag-end={(e) => {
            drag_start = false;
            actionIsDragged = true;
            drop_target = undefined;
            drag_target = [];
          }}
          on:anim-start={() => {
            animation = true;
          }}
          on:anim-end={() => {
            animation = false;
          }}
          class="flex flex-col h-full relative justify-between"
        >
          <config-list
            id="cfg-list"
            style="height:{scrollHeight}"
            use:configListScrollSize={configs}
            on:height={(e) => {
              scrollHeight = e.detail;
            }}
            class="flex flex-col w-full h-auto overflow-y-auto px-4"
          >
            {#if typeof configs !== "undefined"}
              {#if !drag_start}
                <AddAction
                  {animation}
                  on:new-config={(e) => {
                    addConfigAtPosition(e, 0);
                  }}
                />
              {:else}
                <DropZone
                  index={-1}
                  {configs}
                  {drop_target}
                  {drag_target}
                  {animation}
                  {drag_start}
                />
              {/if}

              {#each configs as config, index}
                <anim-block in:fade={{ delay: 0 }} class="select-none">
                  <DynamicWrapper
                    let:toggle
                    {drag_start}
                    {index}
                    {config}
                    {configs}
                    {access_tree}
                  />

                  {#if !drag_start}
                    <AddAction
                      {animation}
                      {config}
                      {index}
                      {configs}
                      on:new-config={(e) => {
                        addConfigAtPosition(e, index + 1);
                      }}
                    />
                  {:else}
                    <DropZone
                      {configs}
                      {index}
                      {drag_target}
                      {drop_target}
                      {animation}
                      {drag_start}
                    />
                  {/if}
                </anim-block>
              {/each}
            {/if}
          </config-list>
        </div>
        <container class="flex flex-col w-full">
          <div class="w-full flex justify-between mb-3">
            <AddAction
              userHelper={true}
              {animation}
              on:new-config={(e) => {
                addConfigAtPosition(e, configs.length + 1);
              }}
            />
            <ExportConfigs />
          </div>
        </container>
      </configs>
    </container>
  {/key}
</configuration>

<style global>
  /*   .grabbed {
    cursor: grab !important;
  }
 */
  .unselectable {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    /*     cursor: default; */
  }

  ::-webkit-scrollbar {
    height: 6px;
    width: 6px;
    background: #1e2628;
  }

  ::-webkit-scrollbar-thumb {
    background: #286787;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
  }

  ::-webkit-scrollbar-corner {
    background: #1e2628;
  }
</style>
