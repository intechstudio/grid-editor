<script>
  import ElementSelectionPanel from "./ElementSelectionPanel.svelte";
  import { get } from "svelte/store";

  import { Analytics } from "../../../runtime/analytics.js";

  import { fly, fade } from "svelte/transition";
  import { flip } from "svelte/animate";

  import EventPanel from "./EventPanel.svelte";

  import { lua_error_store } from "../DebugMonitor/DebugMonitor.store";

  import {
    runtime,
    logger,
    user_input,
    appActionClipboard,
    controlElementClipboard,
  } from "../../../runtime/runtime.store.js";

  import { writeBuffer } from "../../../runtime/engine.store.ts";

  import {
    ConfigList,
    ConfigObject,
    ConfigTarget,
    configManager,
    lastOpenedActionblocksInsert,
  } from "./Configuration.store.js";

  import { configListScrollSize } from "../../_actions/boundaries.action";

  import MultiSelect from "./components/MultiSelect.svelte";
  import DropZone from "./components/DropZone.svelte";
  import DynamicWrapper from "./components/DynamicWrapper.svelte";
  import Options from "./components/Options.svelte";

  import ExportConfigs from "./components/ExportConfigs.svelte";

  import {
    changeOrder,
    config_drag,
    DragEvent,
  } from "../../_actions/move.action.js";
  import AddAction from "./components/AddAction.svelte";
  import AddActionButton from "./components/AddActionButton.svelte";

  //////////////////////////////////////////////////////////////////////////////
  /////     VARIABLES, LIFECYCLE FUNCTIONS AND TYPE DEFINITIONS       //////////
  //////////////////////////////////////////////////////////////////////////////

  let access_tree = {};
  let scrollHeight = "100%";
  let draggedIndexes = [];
  let autoScroll;
  let dropIndex = undefined;
  let isSystemEventSelected = false;

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

  $: isSystemEventSelected = $user_input.elementnumber == 255;

  //////////////////////////////////////////////////////////////////////////////
  /////////////////       FUNCTION DEFINITIONS        //////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  function sendCurrentConfigurationToGrid() {
    $configManager
      .sendTo({ target: ConfigTarget.createFrom({ userInput: $user_input }) })
      .catch((e) => handleError(e));
  }

  //////////////////////////////////////////////////////////////////////////////
  /////////////////           EVENT HANDLERS          //////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  function handleConfigManagerUpdate(list) {
    if (typeof list === "undefined") {
      return;
    }
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
    let { configs, index } = e.detail;

    if (typeof index === "undefined") {
      index = $configManager.length;
    }

    try {
      configManager.update((s) => {
        const list = s.makeCopy();
        list.insert(index, ...configs);
        list.checkLength();
        return list;
      });
      sendCurrentConfigurationToGrid();
    } catch (e) {
      console.error(e);
      handleError(e);
    }
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
      if (typeof config !== "undefined") {
        config.short = short;
        config.script = script;
      }
      return s;
    });

    sendCurrentConfigurationToGrid();

    const target = ConfigTarget.getCurrent();
    Analytics.track({
      event: "Config Action",
      payload: {
        action: "Update",
        elementType: target.elementType, //String
        eventType: target.eventType, //Number -> TODO: This should be also a string?
        short: short,
      },
      mandatory: false,
    });
  }

  function handleDragStart(e) {
    config_drag.set(new DragEvent());
  }

  function handleDragEnd(e) {
    config_drag.set(undefined);
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
      //Insert CodeBlock into position
      s.insert(index, codeBlock);
      // Remove selected action blocks
      s = s.filter((config) => !config.selected);
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
      s.insert(index, ...$appActionClipboard.map((e) => e.makeCopy()));

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
    if (typeof $config_drag !== "undefined") {
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
  }

  function handleCopyAll() {
    //Callback function
    const ui = get(user_input);
    logger.set({
      type: "progress",
      mode: 0,
      classname: "elementcopy",
      message: `Copy events from element...`,
    });

    //Fetching all unloaded elements configuration
    const { dx, dy, page, element } = {
      dx: ui.dx,
      dy: ui.dy,
      page: ui.pagenumber,
      element: ui.elementnumber,
    };

    runtime
      .fetch_element_configuration_from_grid(dx, dy, page, element)
      .then(async (desc) => {
        const current = ConfigTarget.createFrom({ userInput: ui });

        const data = [];
        for (const event of current.events) {
          const target = new ConfigTarget({
            device: current.device,
            element: current.element,
            eventType: event.type,
            page: current.page,
          });
          const list = await ConfigList.createFromTarget(target);
          data.push({ eventType: target.eventType, configs: list });
        }

        controlElementClipboard.set({
          elementType: current.elementType,
          data: data,
        });
        logger.set({
          type: "success",
          mode: 0,
          classname: "elementcopy",
          message: `Events are copied!`,
        });
      })
      .catch((e) => {
        console.error(e);
        //TODO: make feedback for fail
      });

    Analytics.track({
      event: "Config Action",
      payload: { click: "Whole Element Copy" },
      mandatory: false,
    });
  }

  function handleOverwriteAll() {
    Analytics.track({
      event: "Config Action",
      payload: { click: "Whole Element Overwrite" },
      mandatory: false,
    });

    let clipboard = get(controlElementClipboard);
    const current = ConfigTarget.createFrom({ userInput: $user_input });

    if (current.elementType !== clipboard.elementType) {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "rejectoverwrite",
        message: `Overwrite element failed! Current ${current.elementType} control 
          element is not compatible with clipboards ${clipboard.elementType} type.`,
      });
      return;
    }

    const promises = [];
    for (const e of current.events) {
      const eventtype = e.type;
      const target = new ConfigTarget({
        device: current.device,
        element: current.element,
        eventType: eventtype,
        page: current.page,
      });
      const list = clipboard.data.find(
        (e) => e.eventType === eventtype
      ).configs;
      promises.push(list.sendTo({ target: target }));
    }
    Promise.all(promises)
      .then(() => {
        ConfigList.createFromTarget(current).then((list) => {
          configManager.set(list);
        });
      })
      .catch((e) => {});
  }

  function handleReplace(e) {
    const { index, config } = e.detail;
    configManager.update((s) => {
      s[index] = config;
      lastOpenedActionblocksInsert(config.short);
      return s;
    });
    sendCurrentConfigurationToGrid();
  }
</script>

<configuration class="w-full h-full flex flex-col bg-primary">
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
      <configs class="w-full h-full flex flex-col px-8 pt-4 pb-2">
        <ElementSelectionPanel />
        <EventPanel
          class="flex flex-col w-full "
          on:copy-all={handleCopyAll}
          on:overwrite-all={handleOverwriteAll}
        />
        <div class="flex w-full items-center justify-between">
          <div class="text-gray-500 text-sm">Actions</div>
          <MultiSelect
            on:convert-to-code-block={handleConvertToCodeBlock}
            on:copy={handleCopy}
            on:cut={handleCut}
            on:paste={handlePaste}
            on:remove={handleRemove}
          />
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
              clearInterval(autoScroll);
            }}
            class="flex flex-col w-full h-auto overflow-y-auto"
          >
            {#each $configManager as config, index (config.id)}
              <anim-block
                animate:flip={{ duration: 300 }}
                in:fade|global={{ delay: 0 }}
              >
                {#key index}
                  {#if typeof $config_drag === "undefined"}
                    <AddAction
                      {index}
                      on:paste={handlePaste}
                      on:new-config={handleConfigInsertion}
                    />
                  {:else}
                    <DropZone
                      {index}
                      thresholdTop={10}
                      thresholdBottom={10}
                      class=""
                      drag_target={draggedIndexes}
                      on:drop-target-change={handleDropTargetChange}
                    />
                  {/if}
                {/key}
                <div class="flex flex-row justify-between">
                  <DynamicWrapper
                    {index}
                    {config}
                    {access_tree}
                    on:update={handleConfigUpdate}
                    on:replace={handleReplace}
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
            {#key $configManager.length}
              {#if typeof $config_drag === "undefined"}
                <AddAction
                  index={$configManager.length}
                  on:paste={handlePaste}
                  on:new-config={handleConfigInsertion}
                />
              {:else}
                <DropZone
                  index={$configManager.length}
                  drag_target={draggedIndexes}
                  thresholdTop={10}
                  thresholdBottom={0}
                  class="h-full"
                  on:drop-target-change={handleDropTargetChange}
                />
              {/if}
            {/key}
          </config-list>
        </div>
        <div class="w-full flex justify-between mb-3">
          <AddActionButton
            index={$configManager.length}
            on:paste={handlePaste}
            on:new-config={handleConfigInsertion}
          />
          <ExportConfigs />
        </div>
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
