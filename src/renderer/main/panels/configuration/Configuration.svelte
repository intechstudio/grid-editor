<script>
  import { get } from "svelte/store";

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
    controlElementClipboard,
    luadebug_store,
    localDefinitions,
  } from "../../../runtime/runtime.store.js";

  import { writeBuffer } from "../../../runtime/engine.store.js";

  import {
    ConfigList,
    ConfigObject,
    ConfigTarget,
    configManager,
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
  import { v4 as uuidv4 } from "uuid";

  //////////////////////////////////////////////////////////////////////////////
  /////     VARIABLES, LIFECYCLE FUNCTIONS AND TYPE DEFINITIONS       //////////
  //////////////////////////////////////////////////////////////////////////////

  class EventList {
    constructor({ options = ["", "", ""], selected = "" } = {}) {
      this.options = options;
      this.selected = selected;
    }
  }

  let events = new EventList();
  let access_tree = {};
  let bufferValueChanged = false;
  let animation = false;
  let isDragged = false;
  let scrollHeight = "100%";
  let draggedIndexes = [];
  let autoScroll;

  onMount(() => {
    init_config_block_library();
  });

  //////////////////////////////////////////////////////////////////////////////
  /////////////////       REACTIVE STATEMENTS        ///////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  $: {
    const les = $lua_error_store;
    const error = les.slice(-1).pop();
    if (typeof error !== "undefined") {
      handleError(error);
    }
  }

  $: {
    /*
    if ($writeBuffer.length > 0) {
      bufferValueChanged = true;
      //Display default
      configManager.set(new ConfigList());
      events = new EventList();
    } else {
      if (bufferValueChanged) {
        //Display User Input
        const current = ConfigTarget.createFrom({ userInput: $user_input });
        const list = ConfigList.createFrom(current);
        configManager.set(list);
        bufferValueChanged = false;
      }
    }
    */
  }

  $: handleConfigManagerUpdate($configManager);

  $: handleUserInputChange($user_input);

  //////////////////////////////////////////////////////////////////////////////
  /////////////////       FUNCTION DEFINITIONS        //////////////////////////
  //////////////////////////////////////////////////////////////////////////////

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

  function sendConfigurationToGrid() {
    $configManager
      .sendTo({ target: ConfigTarget.createFrom({ userInput: $user_input }) })
      .catch((e) => handleError(e));
  }

  //////////////////////////////////////////////////////////////////////////////
  /////////////////           EVENT HANDLERS          //////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  //TODO: Refactor this out!
  function handleChangeEventTab(arg) {
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

  function handleUserInputChange(ui) {
    console.log("ui");
    const target = ConfigTarget.createFrom({ userInput: ui });
    if (typeof target === "undefined") {
      return;
    }

    //Set event list
    if (typeof target !== "undefined") {
      events = getEventList(target);
    }

    //Set selected tab tab
    if (target.element == 255) {
      $appSettings.configType = "systemEvents";
    } else {
      $appSettings.configType = "uiEvents";
    }
  }

  function handleConfigManagerUpdate(configs) {
    console.log("config");
    if (typeof configs === "undefined") {
      return;
    }

    const map = ConfigList.getIndentationMap(configs);
    for (const i in map) {
      configs[i].indentation = map[i];
    }
    updateLuaDebugStore(configs);
    updateLocalSuggestions(configs);
    return;
  }

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

    //Think through the indexing
    if (typeof index !== "undefined") {
      $configManager.insert(config, index + 1);
    } else {
      $configManager.push(config);
    }
    sendConfigurationToGrid();
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

    sendConfigurationToGrid();
  }

  function handleConfigUpdate(e) {
    const { index, newConfig } = e.detail;
    try {
      $configManager[index] = newConfig;
    } catch (e) {
      console.error(e);
    }
    sendConfigurationToGrid();
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

  function handleDragTargetChange(e) {
    draggedIndexes = e.detail.id;
  }

  let dropIndex = undefined;
  function handleDropTargetChange(e) {
    dropIndex = e.detail.drop_target;
  }

  function handleSelectionChange(e) {
    const { value, index } = e.detail;

    const stack = [];

    let n = index;
    do {
      const config = $configManager[n];
      if (config.information.type === "composite_open") {
        stack.push(config);
      } else if (config.information.type === "composite_close") {
        stack.pop();
      }
      config.selected = value;
      ++n;
    } while (stack.length > 0);
  }

  function handleConvertToCodeBlock(e) {
    //Get index of first selected action block
    const index = $configManager.findIndex((e) => e.selected);

    //Create new CodeBlock with merged code
    const codeBlock = new ConfigObject({
      parent: undefined,
      short: "cb",
      script: $configManager.reduce(
        (script, config) =>
          config.selected ? `${script} ${config.script}` : script,
        ""
      ),
    });

    //Check syntax
    if (codeBlock.checkSyntax() === false) {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "luanotok",
        message: `Cannot merge actionblocks with syntax error!`,
      });
      return;
    }

    // Remove selected action blocks
    configManager.update((s) => s.filter((config) => !config.selected));

    // Insert CodeBlock into position
    configManager.update((s) => {
      s.splice(index, 0, codeBlock);
      return s;
    });

    sendConfigurationToGrid();
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

  function handleCopy(e) {
    const clipboard = $configManager.filter((e) => e.selected).makeCopy();
    clipboard.forEach((e) => (e.id = uuidv4()));
    appActionClipboard.set(clipboard);
    Analytics.track({
      event: "Config Action",
      payload: { click: "Copy" },
      mandatory: false,
    });
  }

  function handlePaste(e) {
    let { index } = e.detail;

    if (typeof index === "undefined") {
      index = $configManager.length;
    }

    configManager.update((s) => {
      s.splice(index + 1, 0, ...$appActionClipboard);
      s.forEach((e) => (e.selected = false));
      return s;
    });

    sendConfigurationToGrid();
    Analytics.track({
      event: "Config Action",
      payload: { click: "Paste" },
      mandatory: false,
    });
  }

  function handleRemove(e) {
    configManager.update((s) => s.filter((config) => !config.selected));
    sendConfigurationToGrid();
    Analytics.track({
      event: "Config Action",
      payload: { click: "Remove" },
      mandatory: false,
    });
  }

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

  function handleCopyAll() {
    let callback = function () {
      const current = ConfigTarget.createFrom({ userInput: $user_input });
      const configsLists = [];
      current.events.forEach((e) => {
        const eventType = e.event.value;
        const target = new ConfigTarget({
          device: current.device,
          element: current.element,
          eventType: eventType,
          page: current.page,
        });
        const list = ConfigList.createFrom(target);
        configsLists.push({ eventType: eventType, configs: list });
      });

      controlElementClipboard.set({
        elementType: current.elementType,
        data: configsLists,
      });
      logger.set({
        type: "success",
        mode: 0,
        classname: "elementcopy",
        message: `Events are copied!`,
      });
    };

    logger.set({
      type: "progress",
      mode: 0,
      classname: "elementcopy",
      message: `Copy events from element...`,
    });

    runtime.fetch_element_configuration_from_grid(callback);

    Analytics.track({
      event: "Config Action",
      payload: { click: "Whole Element Copy" },
      mandatory: false,
    });
  }

  function handleOverwriteAll() {
    let clipboard = get(controlElementClipboard);
    const current = ConfigTarget.createFrom({ userInput: $user_input });

    if (current.elementType === clipboard.elementType) {
      current.events.forEach((e) => {
        const eventType = e.event.value;
        const target = new ConfigTarget({
          device: current.device,
          element: current.element,
          eventType: eventType,
          page: current.page,
        });
        const list = clipboard.data.find(
          (e) => e.eventType === eventType
        ).configs;
        list.sendTo({ target: target }).catch((e) => handleError(e));
      });

      const list = clipboard.data.find(
        (e) => events.selected.value === e.eventType
      ).configs;
      configManager.set(list);
    } else {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "rejectoverwrite",
        message: `Overwrite element failed! Current ${current.elementType} control 
          element is not compatible with clipboards ${clipboard.elementType} type.`,
      });
    }

    return;

    //runtime.whole_element_overwrite(clipboard);

    Analytics.track({
      event: "Config Action",
      payload: { click: "Whole Element Overwrite" },
      mandatory: false,
    });
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
          handleChangeEventTab("uiEvents");
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
          handleChangeEventTab("systemEvents");
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
          <ConfigParameters
            {events}
            on:copy-all={handleCopyAll}
            on:overwrite-all={handleOverwriteAll}
          />
          <div class="px-4 flex w-full items-center justify-between">
            <div class="text-gray-500 text-sm">Actions</div>
            <MultiSelect
              on:convert-to-code-block={handleConvertToCodeBlock}
              on:copy={handleCopy}
              on:cut={handleCut}
              on:paste={handlePaste}
              on:remove={handleRemove}
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

            {#each $configManager as config, index (config.id)}
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
