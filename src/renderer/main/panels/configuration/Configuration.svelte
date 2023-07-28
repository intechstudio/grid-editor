<script>
  import { get, writable } from "svelte/store";

  import { Analytics } from "../../../runtime/analytics.js";

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
    luadebug_store,
    localDefinitions,
  } from "../../../runtime/runtime.store.js";

  import {
    ConfigList,
    ConfigObject,
    ConfigTarget,
    UnknownEventException,
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
  let lastOpenedElementsType = undefined;
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
    const les = $lua_error_store;
    const error = les.slice(-1).pop();
    if (typeof error !== "undefined") {
      handleError(error);
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

    if (target.element == 255) {
      $appSettings.configType = "systemEvents";
    } else {
      $appSettings.configType = "uiEvents";
    }
  }

  function updateLuaDebugStore(list) {
    if (!(list instanceof ConfigList)) {
      throw "Invalid list object. Expected an instance of ConfigList.";
    }
    $luadebug_store.configScript = list.toConfigScript();
    $luadebug_store.syntaxError = list.checkSyntax();
  }

  function updateLocalSuggestions(list) {
    if (!(list instanceof ConfigList)) {
      throw "Invalid list object. Expected an instance of ConfigList.";
    }
    localDefinitions.update(list);
  }

  function handleUserInputchange() {
    let target = ConfigTarget.getCurrent();
    let list = undefined;
    try {
      list = ConfigList.createFrom(target);
    } catch (e) {
      if (e instanceof UnknownEventException) {
        const availableEvents = target.events.map((e) => e.event.value);
        const closestEvent = Math.min(
          ...availableEvents.map((e) => Number(e)).filter((e) => e > 0)
        );
        user_input.update((s) => {
          s.event.eventtype = String(closestEvent);
          return s;
        });
        target.eventType = String(closestEvent);
        list = ConfigList.createFrom(target);
      } else {
        //Unknown Error
        console.error(`Configuration: ${e}`);
        displayDefault();
        return;
      }
    }
    configs.set(list);
    toggleLastConfigs();
    setSelectedEvent();
    updateLuaDebugStore(list);
    updateLocalSuggestions(list);
    deselectAll();
  }

  $: if ($user_input) {
    handleUserInputchange();
  }

  let animation = false;
  let isDragged = false;

  let scrollHeight = "100%";

  function handleError(e) {
    switch (e.type) {
      case "lengthError":
        logger.set({
          type: "fail",
          mode: 0,
          classname: "luanotok",
          message: `${e.device}: Modifications can not be synced with grid, 
          maximum character limit reached. Shorten your code or delete action blocks.`,
        });
        break;
      case "syntaxError":
        logger.set({
          type: "fail",
          mode: 0,
          classname: "luanotok",
          message: `${e.device}: Syntax error on ${e.element.no} ${e.event.type} event.`,
        });
        break;
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

  function handleConfigInsertion(e) {
    const { config, index } = e.detail;
    if (typeof config === "undefined") {
      throw "Unknown Error";
    }

    let list = $configs.makeCopy();

    //Think through the indexing
    if (typeof index !== "undefined") {
      list.insert(config, index + 1);
    } else {
      list.push(config);
    }

    list
      .sendTo({ target: ConfigTarget.getCurrent() })
      .then((e) => {
        //TODO: refactor this out, it is needed because of inserting an IF
        //TODO: rethink composit block creation
        const target = ConfigTarget.getCurrent();
        const list = ConfigList.createFrom(target);
        if (typeof list === "undefined") {
          throw "Error loading current config.";
        }
        configs.set(list);
        deselectAll();
        updateLuaDebugStore(list);
        updateLocalSuggestions(list);
      })
      .catch((e) => handleError(e));
  }

  function handleDrop(e) {
    let list = $configs.makeCopy();
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

    list
      .sendTo({ target: ConfigTarget.getCurrent() })
      .then((e) => {
        configs.set(list);
        deselectAll();
        updateLuaDebugStore(list);
        updateLocalSuggestions(list);
      })
      .catch((e) => handleError(e));
  }

  function handleConfigUpdate(e) {
    const { index, newConfig } = e.detail;

    let list = $configs.makeCopy();

    try {
      list[index] = newConfig;
    } catch (e) {
      console.error(e);
    }

    list
      .sendTo({ target: ConfigTarget.getCurrent() })
      .then((e) => {
        //TODO: Refactor this out
        if ($configs[index].short != newConfig.short) {
          $configs[index] = newConfig;
        } else $configs[index].script = newConfig.script;

        updateLuaDebugStore(list);
        updateLocalSuggestions(list);
        //deselectAll();
      })
      .catch((e) => handleError(e));
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
  let selectAllChecked = false;

  function handleSelectionChange(e) {
    const { value, index } = e.detail;

    const selectedConfig = $configs[index];
    if (typeof selectedConfig === "undefined") {
      throw `Can't find selected config by index (${index})`;
    }

    //Find the closing tag of the multiselect component
    const multiSelect = selectedConfig.information.name.endsWith("_If");
    if (multiSelect) {
      let indentationDepth = 1;
      for (
        let i = index + 1;
        i < $configs.length && indentationDepth > 0;
        ++i
      ) {
        //Another component is found inside the component, increase
        //indentation depth.
        if ($configs[i].information.name.endsWith("_If")) {
          ++indentationDepth;
        }
        //Closing tag found inside the component, decrease
        //indentation depth.
        else if ($configs[i].information.name.endsWith("_End")) {
          --indentationDepth;
        }
        $configs[i].selected = value;
      }

      if (indentationDepth !== 0) {
        throw `No closing tag found for ${selectedConfig.information.name}`;
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
    let list = $configs.makeCopy();

    let script = "";
    for (let config of $configs) {
      if (config.selected) {
        script += config.script + " ";
      }
    }

    const codeBlock = new ConfigObject({
      parent: list,
      short: "cb",
      script: script,
    });
    const index = list.findIndex((e) => e.selected); //First
    list.splice(index, 0, codeBlock);
    list = list.filter((e) => !e.selected);

    list
      .sendTo({ target: ConfigTarget.getCurrent() })
      .then((e) => {
        configs.set(list);
        deselectAll();
        updateLuaDebugStore(list);
        updateLocalSuggestions(list);
      })
      .catch((e) => handleError(e));
  }

  function handleCut(e) {
    handleCopy(e);
    handleRemove(e);
    Analytics.track({
      event: "Config Action",
      payload: { click: "Cut" },
      mandatory: false,
    });
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
    Analytics.track({
      event: "Config Action",
      payload: { click: "Copy" },
      mandatory: false,
    });
  }

  $: enablePaste = $appActionClipboard.length > 0;

  function handlePaste(e) {
    const { index } = e.detail;
    let list = $configs.makeCopy();

    //TODO: Refactor this out
    //DropZone indexing is shifted with -1
    if (typeof index !== "undefined" && index + 1 < list.length) {
      list.splice(index + 1, 0, ...$appActionClipboard);
    } else {
      for (const config of $appActionClipboard) {
        list.push(config);
      }
    }

    list
      .sendTo({ target: ConfigTarget.getCurrent() })
      .then((e) => {
        configs.set(list);
        deselectAll();
        clearClipboard();
        updateLuaDebugStore(list);
        updateLocalSuggestions(list);
      })
      .catch((e) => handleError(e));
    Analytics.track({
      event: "Config Action",
      payload: { click: "Paste" },
      mandatory: false,
    });
  }

  function toggleLastConfigs() {
    if (typeof $configs === "undefined") {
      return;
    }

    for (const config of $configs) {
      if (config.short === lastOpenedElementsType) {
        config.toggled = true;
      }
    }
  }

  function handleRemove(e) {
    let list = $configs.makeCopy();

    list = list.filter((e) => !e.selected);

    list
      .sendTo({ target: ConfigTarget.getCurrent() })
      .then((e) => {
        configs.set(list);
        deselectAll();
        updateLuaDebugStore(list);
        updateLocalSuggestions(list);
      })
      .catch((e) => handleError(e));
    Analytics.track({
      event: "Config Action",
      payload: { click: "Remove" },
      mandatory: false,
    });
  }

  function deselectAll() {
    enableCopy = false;
    enableConvert = false;
    enableCut = false;
    enableRemove = false;
    selectAllChecked = false;

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

  function handleToggleChange(e) {
    const { value, index } = e.detail;

    if (value) {
      lastOpenedElementsType = $configs[index].short;
    }
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
              bind:selectAll={selectAllChecked}
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
                on:paste={handlePaste}
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

            {#each $configs as config, index (config)}
              <anim-block
                animate:flip={{ duration: 300 }}
                in:fade={{ delay: 0 }}
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
                    on:toggle={handleToggleChange}
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
                    on:paste={handlePaste}
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
              on:paste={handlePaste}
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
