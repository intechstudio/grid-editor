<script>
  import { get, writable } from "svelte/store";

  import mixpanel from "mixpanel-browser";

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
    appActionClipboard,
  } from "../../../runtime/runtime.store.js";

  import {
    ConfigList,
    ConfigObject,
    ConfigTarget,
  } from "./Configuration.store.js";

  import _utils from "../../../runtime/_utils.js";

  import { configListScrollSize } from "../../_actions/boundaries.action";

  import MultiSelect from "./components/MultiSelect.svelte";
  import DropZone from "./components/DropZone.svelte";
  import DynamicWrapper from "./components/DynamicWrapper.svelte";
  import Options from "./components/Options.svelte";

  import ExportConfigs from "./components/ExportConfigs.svelte";

  import { changeOrder } from "../../_actions/move.action.js";
  import AddAction from "./components/AddAction.svelte";

  import { appSettings } from "../../../runtime/app-helper.store";

  import { selectedControllerIndexStore } from "/runtime/preset-helper.store";

  const configs = writable([]);
  let events = { options: ["", "", ""], selected: "" };
  let elements = { options: [], selected: "" };

  function displayDefault() {
    configs.set([]);
    events = { options: ["", "", ""], selected: "" };
    elements = { options: [], selected: "" };
  }

  let access_tree = {};

  let controllerIndex;

  $: controllerIndex = $selectedControllerIndexStore;

  $: selectedControllerIndexStore.set(elements);

  //TODO: Refactor this out!
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

  function setSelectedEvent() {
    const target = $configs.target;
    if (typeof target === "undefined") {
      throw "Unknown Error";
    }
    events.options = [];
    for (const event of target.events) {
      events.options.push(event.event);
      if (target.eventType == event.event.value) {
        events.selected = event.event;
      }
    }
  }

  $: if ($user_input) {
    try {
      displayCurrentConfigs();
      setSelectedEvent();
    } catch (e) {
      console.error(`Configuration: ${e}`);
      displayDefault();
    }
  }

  let animation = false;
  let isDragged = false;

  let scrollHeight = "100%";

  function handleConfigInsertion(e) {
    const { config, index } = e.detail;
    if (typeof config === "undefined") {
      throw "Unknown Error";
    }

    let list = $configs.copy();
    const target = $configs.target;

    //Think through the indexing
    if (typeof index !== "undefined") {
      list.insert(config, index + 1);
    } else {
      list.push(config);
    }

    list
      .sendTo({ target: target })
      .then((e) => {
        displayCurrentConfigs();
        deselectAll();
      })
      .catch((e) => {
        console.error(e);
      });
  }

  function handleDrop(e) {
    let list = $configs.copy();
    const target = $configs.target;
    const targetIndex = ++dropIndex;

    //Check for incorrect dropzones
    const multiDrag = draggedIndexes.length > 1;
    if (multiDrag) {
      const firstIndex = draggedIndexes.at(0);
      const lastIndex = draggedIndexes.at(-1);
      const dist1 = targetIndex - firstIndex;
      const dist2 = targetIndex - lastIndex;
      if ([0, 1].includes(dist1) || [0, 1].includes(dist2)) {
        //Drop target is next to, or inside target,
        //no swap is needed, or is forbidden
        return;
      }
    } else {
      const sourceIndex = draggedIndexes.at(0);
      const dist = targetIndex - sourceIndex;
      if ([0, 1].includes(dist)) {
        //Drop target is next to target, no swap is needed
        return;
      }
    }

    let temp = [];
    for (let i = 0; i < draggedIndexes.length; ++i) {
      const sourceIndex = draggedIndexes[i];
      temp.push(list[sourceIndex]);
      list[sourceIndex] = undefined;
    }

    for (let i = 0; i < temp.length; ++i) {
      if (targetIndex + i < list.length) {
        list.splice(targetIndex + i, 0, temp[i]);
      } else {
        list.push(temp[i]);
      }
    }

    list = list.filter((e) => typeof e !== "undefined");
    console.log(list);

    list
      .sendTo({ target: target })
      .then((e) => {
        displayCurrentConfigs();
        deselectAll();
      })
      .catch((e) => {
        console.error(e);
      });
  }

  function handleConfigUpdate(e) {
    const { index, newConfig } = e.detail;
    let list = $configs.copy();
    const target = $configs.target;

    try {
      list[index] = newConfig;
    } catch (e) {
      console.error(e);
    }

    list
      .sendTo({ target: target })
      .then((e) => {
        displayCurrentConfigs();
        deselectAll();
      })
      .catch((e) => {
        console.error(e);
      });
  }

  function handleDragStart(e) {
    isDragged = true;
  }

  function handleDragEnd(e) {
    isDragged = false;
    dropIndex = undefined;
    draggedIndexes = [];
  }

  let draggedIndexes = [];
  function handleDragTargetChange(e) {
    draggedIndexes = e.detail.id;
  }

  let dropIndex = undefined;
  function handleDropTargetChange(e) {
    dropIndex = e.detail.drop_target;
  }

  let enableConvert = false;
  let enableCut = false;
  let enableCopy = false;
  let enablePaste = false;
  let enableRemove = false;

  function handleSelectionChange(e) {
    const { value, index } = e.detail;

    const selectedConfig = $configs[index];
    if (typeof selectedConfig === "undefined") {
      throw `Can't find selected config by index (${index})`;
    }

    //Check if selection was multi selection
    const component = [{ start: "Condition_If", end: "Condition_End" }].find(
      (e) => e.start === selectedConfig.information.name
    );
    if (typeof component !== "undefined") {
      //Find the closing tag of the multiselect component
      let indentationDepth = 1;
      for (
        let i = index + 1;
        i < $configs.length && indentationDepth > 0;
        ++i
      ) {
        //Another component is found inside the component, increase
        //indentation depth.
        if ($configs[i].information.name === component.start) {
          ++indentationDepth;
        }
        //Closing tag found inside the component, decrease
        //indentation depth.
        else if ($configs[i].information.name === component.end) {
          --indentationDepth;
        }
        $configs[i].selected = value;
      }

      if (indentationDepth !== 0) {
        throw `No closing tag found for ${component.start}`;
      }
    }

    //Set MultiOptions values
    const selectionCount = $configs.reduce((acc, curr) => {
      if (curr.selected) {
        acc += 1;
      }
      return acc;
    }, 0);

    const isSelection = selectionCount > 0;

    enableCopy = isSelection;
    enableConvert = isSelection;
    enableCut = isSelection;
    enableRemove = isSelection;
  }

  function handleConvertToCodeBlock(e) {
    let list = $configs.copy();
    const target = $configs.target;

    let script = "";
    for (let config of $configs) {
      if (config.selected) {
        script += config.script + " ";
      }
    }

    const codeBlock = new ConfigObject({ short: "cb", script: script });
    const index = list.findIndex((e) => e.selected); //First
    list.splice(index, 0, codeBlock);
    list = list.filter((e) => !e.selected);

    list
      .sendTo({ target: target })
      .then((e) => {
        displayCurrentConfigs();
        deselectAll();
      })
      .catch((e) => {
        console.error(e);
      });
  }

  function handleCut(e) {
    handleCopy(e);
    handleRemove(e);
    mixpanel.track("Config Action", { click: "Cut" });
  }

  function clearClipboard() {
    appActionClipboard.set([]);
  }

  function handleCopy(e) {
    let clipboard = [];
    for (let config of $configs) {
      if (config.selected) {
        clipboard.push(config);
      }
    }
    appActionClipboard.set(clipboard);
    mixpanel.track("Config Action", { click: "Copy" });
  }

  $: enablePaste = $appActionClipboard.length > 0;

  function handlePaste(e) {
    let list = $configs.copy();
    const target = $configs.target;

    for (let config of $appActionClipboard) {
      list.push(config);
    }

    list
      .sendTo({ target: target })
      .then((e) => {
        displayCurrentConfigs();
        deselectAll();
        clearClipboard();
      })
      .catch((e) => {
        console.error(e);
      });
    mixpanel.track("Config Action", { click: "Paste" });
  }

  function displayCurrentConfigs() {
    const target = ConfigTarget.getCurrent();
    const list = ConfigList.createFrom(target);
    if (typeof list === "undefined") {
      throw "Error loading current config.";
    }
    configs.set(list);
  }

  function handleRemove(e) {
    let list = $configs.copy();
    const target = $configs.target;

    list = list.filter((e) => !e.selected);

    list
      .sendTo({ target: target })
      .then((e) => {
        displayCurrentConfigs();
        deselectAll();
      })
      .catch((e) => {
        console.error(e);
      });
    mixpanel.track("Config Action", { click: "Remove" });
  }

  function deselectAll() {
    enableCopy = false;
    enableConvert = false;
    enableCut = false;
    enableRemove = false;

    configs.update((s) => {
      s.forEach((e) => {
        e.selected = false;
      });
      return s;
    });
  }

  function handleSelectAll(e) {
    const { value } = e.detail;

    enableCopy = value;
    enableConvert = value;
    enableCut = value;
    enableRemove = value;

    configs.update((s) => {
      s.forEach((e) => {
        e.selected = value;
      });
      return s;
    });
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
              {enableConvert}
              {enableCut}
              {enableCopy}
              {enablePaste}
              {enableRemove}
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
          use:changeOrder={(this, { configs: $configs })}
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
                drag_target={draggedIndexes}
                {animation}
                drag_start={isDragged}
              />
            {/if}

            {#each $configs as config, index}
              <anim-block in:fade={{ duration: 500 }}>
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
                    bind:selected={config.selected}
                    disabled={!config.information.selectable}
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
                    drag_target={draggedIndexes}
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
