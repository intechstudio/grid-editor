<script>
  import { get } from "svelte/store";

  import { Analytics } from "../../../runtime/analytics.js";

  import { fly, fade } from "svelte/transition";
  import { flip } from "svelte/animate";

  import EventPanel from "./EventPanel.svelte";

  import { setTooltip } from "../../user-interface/tooltip/Tooltip.js";

  import { lua_error_store } from "../DebugMonitor/DebugMonitor.store";

  import {
    runtime,
    logger,
    user_input,
    appActionClipboard,
    controlElementClipboard,
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

  //////////////////////////////////////////////////////////////////////////////
  /////     VARIABLES, LIFECYCLE FUNCTIONS AND TYPE DEFINITIONS       //////////
  //////////////////////////////////////////////////////////////////////////////

  let access_tree = {};
  let isDragged = false;
  let scrollHeight = "100%";
  let draggedIndexes = [];
  let autoScroll;
  let dropIndex = undefined;
  let isSystemEventSelected = false;

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

  $: handleConfigManagerUpdate($configManager);

  $: isSystemEventSelected = $user_input.event.elementnumber == 255;

  //////////////////////////////////////////////////////////////////////////////
  /////////////////       FUNCTION DEFINITIONS        //////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  function updateLocalSuggestions(list) {
    localDefinitions.update(list);
  }

  function sendCurrentConfigurationToGrid() {
    $configManager
      .sendTo({ target: ConfigTarget.createFrom({ userInput: $user_input }) })
      .catch((e) => handleError(e));
  }

  //////////////////////////////////////////////////////////////////////////////
  /////////////////           EVENT HANDLERS          //////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  //TODO: Is there a better way?
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

    if (arg == "systemEvents") {
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

  function handleConfigManagerUpdate(list) {
    if (typeof list === "undefined") {
      return;
    }

    console.log(list);

    const map = ConfigList.getIndentationMap(list);
    for (const i in map) {
      list[i].indentation = map[i];
    }

    updateLocalSuggestions(list);
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
    let { config, index } = e.detail;

    if (typeof index === "undefined") {
      index = $configManager.length;
    }

    configManager.update((s) => {
      s.insert(index + 1, config);
      return s;
    });

    sendCurrentConfigurationToGrid();
  }

  function handleDrop(e) {
    if (typeof dropIndex === "undefined") {
      return;
    }

    const targetIndex = dropIndex;
    dropIndex = undefined;

    //Check for incorrect dropzones
    const firstIndex = draggedIndexes.at(0);
    const lastIndex = draggedIndexes.at(-1);
    if (targetIndex >= firstIndex && targetIndex <= lastIndex + 1) {
      return;
    }

    configManager.update((s) => {
      //Collect dragged configs and mark them for deletion
      const temp = [];
      draggedIndexes.forEach((i) => {
        temp.push(s[i]);
        s[i] = undefined;
      });

      //Insert dragged configs at position
      s.insert(targetIndex, ...temp);

      //Remove marked configs
      s = s.filter((e) => typeof e !== "undefined");
      return s;
    });

    sendCurrentConfigurationToGrid();
  }

  function handleConfigUpdate(e) {
    const { index, short, script } = e.detail;
    configManager.update((s) => {
      const config = s[index];
      config.short = short;
      config.script = script;
      return s;
    });
    sendCurrentConfigurationToGrid();
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

  function handleDropTargetChange(e) {
    const { index } = e.detail;
    dropIndex = index;
  }

  function handleSelectionChange(e) {
    const { value, index } = e.detail;

    configManager.update((s) => {
      const stack = [];
      let n = index;
      do {
        const config = s[n];
        if (config.information.type === "composite_open") {
          stack.push(config);
        } else if (config.information.type === "composite_close") {
          stack.pop();
        }
        config.selected = value;
        ++n;
      } while (stack.length > 0);
      return s;
    });
  }

  function handleConvertToCodeBlock(e) {
    const { configs, index } = e.detail;

    //Create new CodeBlock with merged code
    const codeBlock = new ConfigObject({
      short: "cb",
      script: configs.map((e) => e.script).join(" "),
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

    configManager.update((s) => {
      // Remove selected action blocks
      s = s.filter((config) => !config.selected);
      //Insert CodeBlock into position
      s.insert(index, codeBlock);
      return s;
    });

    sendCurrentConfigurationToGrid();
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
      s.forEach((e) => (e.selected = false));
      s.insert(index + 1, ...$appActionClipboard);
      return s;
    });

    sendCurrentConfigurationToGrid();
    Analytics.track({
      event: "Config Action",
      payload: { click: "Paste" },
      mandatory: false,
    });
  }

  function handleRemove(e) {
    configManager.update((s) => s.filter((config) => !config.selected));
    sendCurrentConfigurationToGrid();
    Analytics.track({
      event: "Config Action",
      payload: { click: "Remove" },
      mandatory: false,
    });
  }

  function handleDrag(e) {
    const configList = document.getElementById("cfg-list");
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

  function handleCopyAll() {
    //Callback function
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

    //Fetching all unloaded elements configuration
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

    Analytics.track({
      event: "Config Action",
      payload: { click: "Whole Element Overwrite" },
      mandatory: false,
    });
  }
</script>

<configuration class="w-full h-full flex flex-col overflow-clip bg-primary">
  <div class="py-5 flex flex-col justify-center">
    <div class="flex flex-row items-start py-2 px-10">
      <button
        use:setTooltip={{
          key: "configuration_ui_events",
          placement: "top",
          class: "w-60 p-4",
        }}
        on:click={() => {
          handleChangeEventTab("uiEvents");
        }}
        class="{!isSystemEventSelected
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
        class="{isSystemEventSelected
          ? 'shadow-md bg-pick text-white'
          : 'hover:bg-pick-desaturate-10 text-gray-50 bg-secondary '} relative m-2 p-1 flex-grow border-0 rounded focus:outline-none w-48"
      >
        <span> System Events </span>
      </button>
    </div>
  </div>

  {#key !isSystemEventSelected}
    <container
      class="flex flex-col h-full"
      in:fly|global={{
        x: !isSystemEventSelected ? -5 : 5,
        opacity: 0.5,
        duration: 200,
        delay: 0,
      }}
    >
      <configs class="w-full h-full flex flex-col px-4 pb-2">
        <div>
          <EventPanel
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
          on:drop={handleDrop}
          on:drag-end={handleDragEnd}
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
            {#each $configManager as config, index (config.id)}
              <anim-block
                animate:flip={{ duration: 300 }}
                in:fade|global={{ delay: 0 }}
              >
                {#if !isDragged}
                  <AddAction
                    on:paste={handlePaste}
                    configs={$configManager}
                    {index}
                    on:new-config={handleConfigInsertion}
                  />
                {:else}
                  <DropZone
                    {index}
                    drag_target={draggedIndexes}
                    on:drop-target-change={handleDropTargetChange}
                  />
                {/if}
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
              </anim-block>
            {/each}
            {#if !isDragged}
              <AddAction
                index={$configManager.length}
                on:paste={handlePaste}
                configs={$configManager}
                on:new-config={handleConfigInsertion}
              />
            {:else}
              <DropZone
                index={$configManager.length}
                drag_target={draggedIndexes}
                on:drop-target-change={handleDropTargetChange}
              />
            {/if}
          </config-list>
        </div>
        <container class="flex flex-col w-full">
          <div class="w-full flex justify-between mb-3">
            <AddAction
              userHelper={true}
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
