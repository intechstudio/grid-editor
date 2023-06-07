<script>
  import { get, writable } from "svelte/store";

  import { fly, fade } from "svelte/transition";
  import { flip } from "svelte/animate";

  import ConfigParameters from "./ConfigParameters.svelte";

  import TooltipSetter from "../../user-interface/tooltip/TooltipSetter.svelte";

  import { lua_error_store } from "../DebugMonitor/DebugMonitor.store";

  import {
    runtime,
    logger,
    user_input,
    engine,
  } from "../../../runtime/runtime.store.js";

  import { ConfigList, ConfigTarget } from "./Configuration.store.js";

  import _utils from "../../../runtime/_utils.js";

  import { configListScrollSize } from "../../_actions/boundaries.action";

  import MultiSelect from "./components/MultiSelect.svelte";
  import DropZone from "./components/DropZone.svelte";
  import DynamicWrapper from "./components/DynamicWrapper.svelte";
  import Options from "./components/Options.svelte";

  import ExportConfigs from "./components/ExportConfigs.svelte";

  import { changeOrder } from "../../_actions/move.action.js";

  import { ConfigManager } from "./Configuration.store.js";
  import AddAction from "./components/AddAction.svelte";

  import { appSettings } from "../../../runtime/app-helper.store";

  import { selectedControllerIndexStore } from "/runtime/preset-helper.store";

  let configs = writable([]);
  let events = { options: ["", "", ""], selected: "" };
  let elements = { options: [], selected: "" };

  let access_tree = {};

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

  $: if ($user_input) {
    selectedConfigs.clear();
    try {
      const target = ConfigTarget.getCurrent();
      const list = ConfigList.createFrom(target);
      if (typeof list === "undefined") {
        throw "Error loading current config.";
      }

      configs.set(list);

      // set UI to uiEvents, if its not system events
      if ($configs.target.element !== 255) {
        $appSettings.configType = "uiEvents";
      }
    } catch (e) {
      console.error("Configuration:", e);
    }
  }

  // ========================= FROM OLD CONFIGLIST IMPLEMENTATION ======================= //

  let animation = false;
  let isDragged = false;
  let selectedConfigs = new Map();

  let scrollHeight = "100%";

  function handleConfigInsertion(e) {
    const { config, index } = e.detail;
    if (typeof config === "undefined") {
      throw "Unknown Error";
    }

    const target = ConfigTarget.getCurrent();
    const list = ConfigList.createFrom(target);

    //Think through the indexing
    list.insert(config, index + 1);

    list
      .sendTo({ target: target })
      .then((e) => {
        configs.set(list);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  function handleDrop(e) {
    const target = ConfigTarget.getCurrent();
    const list = ConfigList.createFrom(target);

    //TODO: Make this prettier as a code
    ///////////////////////////////////////////////////////////
    let grabbed = [];
    dragIndexes.forEach((i) => grabbed.push(list[i]));

    const cutIndex = list.indexOf(grabbed.at(0));
    const cutLength = grabbed.length;
    let pasteIndex = Number(dropIndex) + 1;

    // correction for multidrag
    if (pasteIndex > cutIndex) {
      pasteIndex = pasteIndex - dragIndexes.length;
    }

    //Remove grabbed
    console.log(list);
    list.splice(cutIndex, cutLength);
    //Add grabbed to index
    list.splice(pasteIndex, 0, ...grabbed);
    console.log(list);
    ///////////////////////////////////////////////////////////

    list
      .sendTo({ target: target })
      .then((e) => {
        configs.set(list);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  function handleConfigUpdate(e) {
    const { configId, newConfig } = e.detail;
    const index = $configs.findIndex((e) => e.id === configId);
    if (index !== -1) {
      throw "Unknown Error";
    }

    $configs[index] = newConfig;
    ConfigManager.update({
      target: $configs.target,
      newConfig: $configs,
    });
  }

  function handleDragStart(e) {
    isDragged = true;
    selectedConfigs.clear();
  }

  function handleDragEnd(e) {
    isDragged = false;
    dropIndex = undefined;
    dragIndexes = [];
  }

  let dragIndexes = [];
  function handleDragTargetChange(e) {
    dragIndexes = e.detail.id;
  }

  let dropIndex = undefined;
  function handleDropTargetChange(e) {
    dropIndex = e.detail.drop_target;
  }

  function handleSelectionChange(e) {
    const { value, index } = e.detail;
    selectedConfigs.set(index, value);
    console.log(selectedConfigs);
  }

  function handleConvertToCodeBlock(e) {
    const list = new ConfigManager();
    list.converttocodeblock();
    selectedConfigs.clear();
  }

  function handleCut(e) {
    const list = new ConfigManager();
    list.cut();
    selectedConfigs.clear();
  }

  function handleCopy(e) {
    const list = new ConfigManager();
    list.copy();
    selectedConfigs.clear();
  }

  function handlePaste(e) {
    const list = new ConfigManager();
    list.paste();
    selectedConfigs.clear();
  }

  function handleRemove(e) {
    const list = new ConfigManager();
    list.remove();
    selectedConfigs.clear();
  }

  function handleSelectAll(e) {
    const list = new ConfigManager();
    list.select_all();
  }
</script>

<configuration
  class="w-full h-full flex flex-col"
  class:pointer-events-none={$engine != "ENABLED"}
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
            <MultiSelect
              on:convert-to-code-block={handleConvertToCodeBlock}
              on:copy={handleCopy}
              on:cut={handleCut}
              on:paste={handlePaste}
              on:remove={handleRemove}
              on:select-all={handleSelectAll}
            />
          </div>
        </div>

        <div
          use:changeOrder={(this, { config: $configs })}
          on:drag-start={handleDragStart}
          on:drag-target={handleDragTargetChange}
          on:drop-target={handleDropTargetChange}
          on:drop={handleDrop}
          on:drag-end={handleDragEnd}
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
            use:configListScrollSize={$configs}
            on:height={(e) => {
              scrollHeight = e.detail;
            }}
            class="flex flex-col w-full h-auto overflow-y-auto px-4"
          >
            {#if !isDragged}
              <AddAction
                index={-1}
                {animation}
                configs={$configs}
                on:new-config={handleConfigInsertion}
              />
            {:else}
              <DropZone
                index={-1}
                drop_target={dropIndex}
                drag_target={dragIndexes}
                {animation}
                drag_start={isDragged}
              />
            {/if}

            {#each $configs as config, index (config.id)}
              <anim-block
                animate:flip={{ duration: 500 }}
                in:fade={{ duration: 500 }}
              >
                <div class="flex flex-row justify-between">
                  <DynamicWrapper
                    let:toggle
                    drag_start={isDragged}
                    {index}
                    {config}
                    configs={$configs}
                    {access_tree}
                    on:update={handleConfigUpdate}
                  />

                  <Options
                    {index}
                    on:selection-change={handleSelectionChange}
                  />
                </div>

                {#if !isDragged}
                  <AddAction
                    {animation}
                    {config}
                    configs={$configs}
                    {index}
                    on:new-config={handleConfigInsertion}
                  />
                {:else}
                  <DropZone
                    {index}
                    drag_target={dragIndexes}
                    drop_target={dropIndex}
                    {animation}
                    drag_start={isDragged}
                  />
                {/if}
              </anim-block>
            {/each}
          </config-list>
        </div>
        <container class="flex flex-col w-full">
          <div class="w-full flex justify-between mb-3">
            <AddAction
              userHelper={true}
              {animation}
              configs={$configs}
              index={undefined}
              on:new-config={handleConfigInsertion}
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
