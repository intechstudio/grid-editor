<script>
  import { get, writable } from "svelte/store";

  import { Analytics } from "../../../runtime/analytics.js";

  import { fly, fade } from "svelte/transition";
  import { flip } from "svelte/animate";

  import ConfigParameters from "./ConfigParameters.svelte";

  import { setTooltip } from "../../user-interface/tooltip/Tooltip.js";

  import { lua_error_store } from "../DebugMonitor/DebugMonitor.store";

  import {
    runtime,
    logger,
    user_input,
    appActionClipboard,
    luadebug_store,
    localDefinitions,
  } from "../../../runtime/runtime.store.js";

  import { writeBuffer } from "../../../runtime/engine.store.js";

  import {
    ConfigList,
    ConfigObject,
    ConfigTarget,
    configManager,
    UnknownEventException,
  } from "./Configuration.store.js";

  import { configListScrollSize } from "../../_actions/boundaries.action";

  import MultiSelect from "./components/MultiSelect.svelte";
  import DropZone from "./components/DropZone.svelte";
  import DynamicWrapper from "./components/DynamicWrapper.svelte";
  import Options from "./components/Options.svelte";

  import ExportConfigs from "./components/ExportConfigs.svelte";

  import { changeOrder } from "../../_actions/move.action.js";
  import AddAction from "./components/AddAction.svelte";

  import { appSettings } from "../../../runtime/app-helper.store";

  import { init_config_block_library } from "../../../lib/_configs";
  import { onMount } from "svelte";

  class EventList {
    constructor({ options = ["", "", ""], selected = "" } = {}) {
      this.options = options;
      this.selected = selected;
    }
  }

  let events = new EventList();

  let access_tree = {};

  //TODO: Refactor this out!
  function changeSelectedConfig(arg) {
    if ($writeBuffer.length > 0) {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "engine-disabled",
        message: `Engine is disabled, changing event type failed!`,
      });
      return;
    }

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

  //TODO: refactor
  function getEventList(target) {
    const events = new EventList();
    if (typeof target === "undefined") {
      return events;
    }

    //Get available events
    events.options = target.events.map((e) => e.event);

    //Get selected event
    events.selected = target.events.find(
      (e) => target.eventType == e.event.value
    ).event;

    return events;
  }

  function updateLuaDebugStore(list) {
    $luadebug_store.configScript = list.toConfigScript();
    $luadebug_store.syntaxError = list.checkSyntax();
  }

  function updateLocalSuggestions(list) {
    localDefinitions.update(list);
  }

  let bufferValueChanged = false;
  $: {
    if ($writeBuffer.length > 0) {
      bufferValueChanged = true;
      //Display default
      configManager.set(new ConfigList());
      events = new EventList();
    } else {
      if (bufferValueChanged) {
        //Display User Input
        //handleUserInputchange(); TODO: refactor
        bufferValueChanged = false;
      }
    }
  }

  $: handleConfigListChange($configManager);

  function handleConfigListChange(configs) {
    console.log("change", configs.target);
    if (
      typeof configs === "undefined" ||
      typeof configs.target === "undefined"
    ) {
      return;
    }
    const map = ConfigList.getIndentationMap(configs);
    for (const i in map) {
      configs[i].indentation = map[i];
    }
    //console.log(map);

    events = getEventList(configs.target);

    updateLuaDebugStore(configs);
    updateLocalSuggestions(configs);
    deselectAll();

    //Set selected tab tab
    if (configs.target.element == 255) {
      $appSettings.configType = "systemEvents";
    } else {
      $appSettings.configType = "uiEvents";
    }
    console.log("change", configs.target);
  }

  onMount(() => {
    init_config_block_library();
  });

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

    let list = $configManager.makeCopy();

    //Think through the indexing
    if (typeof index !== "undefined") {
      list.insert(config, index + 1);
    } else {
      list.push(config);
    }

    list
      .sendTo({ target: ConfigTarget.getCurrent() })
      .catch((e) => handleError(e));
  }

  function handleDrop(e) {
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
      temp.push($configManager[sourceIndex]);
      $configManager[sourceIndex] = undefined;
    }

    for (let i = 0; i < temp.length; ++i) {
      if (targetIndex + i < $configManager.length) {
        $configManager.splice(targetIndex + i, 0, temp[i]);
      } else {
        $configManager.push(temp[i]);
      }
    }

    $configManager = $configManager.filter((e) => typeof e !== "undefined");

    console.log($configManager.target);
    $configManager
      .sendTo({ target: $configManager.target })
      .catch((e) => handleError(e));
    console.log($configManager.target);
  }

  function handleConfigUpdate(e) {
    const { index, newConfig } = e.detail;

    let list = $configManager.makeCopy();

    try {
      list[index] = newConfig;
    } catch (e) {
      console.error(e);
    }

    list
      .sendTo({ target: ConfigTarget.getCurrent() })
      .catch((e) => handleError(e));
  }

  function handleDragStart(e) {
    isDragged = true;
  }

  function handleDragEnd(e) {
    isDragged = false;
    dropIndex = undefined;
    draggedIndexes = [];
    clearInterval(autoScroll);
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

    const selectedConfig = $configManager[index];

    //Find the closing tag of the multiselect component
    const multiSelect = selectedConfig.information.type === "composite_open";
    if (multiSelect) {
      let indentationDepth = 1;
      for (
        let i = index + 1;
        i < $configManager.length && indentationDepth > 0;
        ++i
      ) {
        //Another component is found inside the component, increase
        //indentation depth.
        if ($configManager[i].information.type === "composite_open") {
          ++indentationDepth;
        }
        //Closing tag found inside the component, decrease
        //indentation depth.
        else if ($configManager[i].information.type === "composite_close") {
          --indentationDepth;
        }
        $configManager[i].selected = value;
      }
    }

    //Set MultiOptions values
    const selectionCount = $configManager.reduce((acc, curr) => {
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
    let list = $configManager.makeCopy();

    let script = "";
    for (let config of $configManager) {
      if (config.selected) {
        if (config.checkSyntax() === false) {
          logger.set({
            type: "fail",
            mode: 0,
            classname: "luanotok",
            message: `Cannot merge actionblocks with syntax error!`,
          });
          return;
        }
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
    for (let config of $configManager) {
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
    let list = $configManager.makeCopy();

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
      .catch((e) => handleError(e));
    Analytics.track({
      event: "Config Action",
      payload: { click: "Paste" },
      mandatory: false,
    });
  }

  function handleRemove(e) {
    let list = $configManager.makeCopy();

    list = list.filter((e) => !e.selected);

    list
      .sendTo({ target: ConfigTarget.getCurrent() })
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

    configManager.update((s) => {
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

    configManager.update((s) => {
      s.forEach((e) => {
        e.selected = value;
      });
      return s;
    });
  }

  let autoScroll;
  function handleDrag(e) {
    if (draggedIndexes.length > 0) {
      const index = draggedIndexes[0];
      const id = `cfg-${index}`;
      const configList = document.getElementById("cfg-list");
      const draggedDOMElement = document.getElementById(id);
      const mouseY = e.clientY - configList.getBoundingClientRect().top;
      const configListHeight = configList.offsetHeight;
      const treshold = 60;
      const lowerThreshold = configListHeight - mouseY <= treshold;
      const upperThreshold =
        configListHeight - mouseY > configListHeight - treshold;
      clearInterval(autoScroll);
      if (lowerThreshold) {
        autoScroll = setInterval(() => {
          configList.scrollTop += 5;
        }, 10);
      } else if (upperThreshold) {
        autoScroll = setInterval(() => {
          configList.scrollTop -= 5;
        }, 10);
      }
    }
  }
</script>

<configuration class="w-full h-full flex flex-col">
  <div class="bg-primary py-5 flex flex-col justify-center">
    <div class="flex flex-row items-start bg-primary py-2 px-10">
      <button
        use:setTooltip={{
          key: "configuration_ui_events",
          placement: "top",
          class: "w-60 p-4",
        }}
        on:click={() => {
          changeSelectedConfig("uiEvents");
        }}
        class="{$appSettings.configType == 'uiEvents'
          ? 'shadow-md bg-pick text-white'
          : 'hover:bg-pick-desaturate-10 text-gray-50 bg-secondary'} relative m-2 p-1 flex-grow border-0 rounded focus:outline-none w-48"
      >
        <span> UI Events </span>
      </button>

      <button
        use:setTooltip={{
          key: "configuration_system_events",
          placement: "top",
          class: "w-60 p-4",
        }}
        on:click={() => {
          changeSelectedConfig("systemEvents");
        }}
        class="{$appSettings.configType == 'systemEvents'
          ? 'shadow-md bg-pick text-white'
          : 'hover:bg-pick-desaturate-10 text-gray-50 bg-secondary '} relative m-2 p-1 flex-grow border-0 rounded focus:outline-none w-48"
      >
        <span> System Events </span>
      </button>
    </div>
  </div>

  {#key $appSettings.configType == "uiEvents"}
    <container
      class="flex flex-col h-full"
      in:fly|global={{
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

        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          use:changeOrder={(this, { configs: $configManager })}
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
            use:configListScrollSize={$configManager}
            on:height={(e) => {
              scrollHeight = e.detail;
            }}
            on:mousemove={handleDrag}
            on:mouseleave={() => {
              //clearInterval(autoScroll);
            }}
            class="flex flex-col w-full h-auto overflow-y-auto px-4"
          >
            {#if !isDragged}
              <AddAction
                index={-1}
                on:paste={handlePaste}
                {animation}
                configs={$configManager}
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

            {#each $configManager as config, index (config)}
              <anim-block
                animate:flip={{ duration: 300 }}
                in:fade|global={{ delay: 0 }}
              >
                <div class="flex flex-row justify-between">
                  <DynamicWrapper
                    {index}
                    {config}
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
                    on:paste={handlePaste}
                    {animation}
                    configs={$configManager}
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
              configs={$configManager}
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
