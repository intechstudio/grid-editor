<script>
  import { appSettings } from "./../../../runtime/app-helper.store.js";
  import { get } from "svelte/store";
  import ElementSelectionPanel from "./ElementSelectionPanel.svelte";

  import { Analytics } from "../../../runtime/analytics.js";

  import { fly, fade } from "svelte/transition";
  import { flip } from "svelte/animate";
  import * as eases from "svelte/easing";

  import EventPanel from "./EventPanel.svelte";

  import { lua_error_store } from "../DebugMonitor/DebugMonitor.store";

  import { logger, runtime, user_input } from "../../../runtime/runtime.store";

  import {
    ConfigTarget,
    configManager,
    lastOpenedActionblocksInsert,
  } from "./Configuration.store";

  import { configListScrollSize } from "../../_actions/boundaries.action";

  import Toolbar from "./components/Toolbar.svelte";
  import DropZone from "./components/DropZone.svelte";
  import DynamicWrapper from "./components/DynamicWrapper.svelte";
  import Options from "./components/Options.svelte";

  import ExportConfigs from "./components/ExportConfigs.svelte";

  import {
    changeOrder,
    config_drag,
    DragEvent,
  } from "../../_actions/move.action.js";
  import AddActionLine from "./components/AddActionLine.svelte";
  import AddAction from "./components/AddAction.svelte";
  import AddActionButton from "./components/AddActionButton.svelte";
  import { NumberToEventType } from "@intechstudio/grid-protocol";
  import {
    selectAction,
    insertAction,
    updateAction,
    mergeActionToCode,
    copyActions,
    pasteActions,
    removeActions,
    cutActions,
    discardElement,
    overwriteElement,
    copyElement,
    clearElement,
  } from "./configuration-actions";

  //////////////////////////////////////////////////////////////////////////////
  /////     VARIABLES, LIFECYCLE FUNCTIONS AND TYPE DEFINITIONS       //////////
  //////////////////////////////////////////////////////////////////////////////

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

  function handleError(e) {
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

  function handleSelectionChange(e) {
    const { index, value } = e.detail;
    selectAction(index, value);
  }

  function handleConfigInsertion(e) {
    let { index, configs } = e.detail;
    const parent = ConfigTarget.getCurrent();
    insertAction(index, configs, parent.runtimeRef);
    sendCurrentConfigurationToGrid();
  }

  function handleConfigUpdate(e) {
    const { index, config } = e.detail;
    updateAction(index, config);
    sendCurrentConfigurationToGrid();

    const target = ConfigTarget.getCurrent();
    if (typeof target === "undefined") {
      return;
    }

    Analytics.track({
      event: "Config Action",
      payload: {
        click: "Update",
        elementType: target.elementType,
        eventType: NumberToEventType(target.eventType),
        short: config.short,
      },
      mandatory: false,
    });
  }

  function handleConvertToCodeBlock(e) {
    const { index, configs } = e.detail;
    mergeActionToCode(index, configs);
    sendCurrentConfigurationToGrid();
  }

  function handleCopy(e) {
    copyActions();
    Analytics.track({
      event: "Config Action",
      payload: { click: "Copy" },
      mandatory: false,
    });
  }

  function handlePaste(e) {
    let { index } = e.detail;
    pasteActions(index)
      .then(() => {
        sendCurrentConfigurationToGrid();
      })
      .catch((e) => {
        logger.set({
          type: "fail",
          mode: 0,
          classname: "config-limit-reached",
          message: `Paste failed! Config limit reached, shorten your code, or delete actions!`,
        });
      });

    Analytics.track({
      event: "Config Action",
      payload: { click: "Paste" },
      mandatory: false,
    });
  }

  function handleRemove(e) {
    removeActions();
    sendCurrentConfigurationToGrid();
    Analytics.track({
      event: "Config Action",
      payload: { click: "Remove" },
      mandatory: false,
    });
  }

  function handleCut(e) {
    cutActions();
    sendCurrentConfigurationToGrid();
    Analytics.track({
      event: "Config Action",
      payload: { click: "Cut" },
      mandatory: false,
    });
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

  function handleOverwriteElement() {
    const ui = get(user_input);
    overwriteElement({
      dx: ui.dx,
      dy: ui.dy,
      page: ui.pagenumber,
      element: ui.elementnumber,
    }).catch((e) => {
      console.warn(e);
    });

    Analytics.track({
      event: "Config Action",
      payload: { click: "Whole Element Overwrite" },
      mandatory: false,
    });
  }

  function handleDiscardElement() {
    const ui = get(user_input);
    discardElement({
      dx: ui.dx,
      dy: ui.dy,
      page: ui.pagenumber,
      element: ui.elementnumber,
    });

    Analytics.track({
      event: "Config Action",
      payload: { click: "Whole Element Discard" },
      mandatory: false,
    });
  }

  function handleCopyElement() {
    const ui = get(user_input);
    copyElement({
      dx: ui.dx,
      dy: ui.dy,
      page: ui.pagenumber,
      element: ui.elementnumber,
    });

    Analytics.track({
      event: "Config Action",
      payload: { click: "Whole Element Copy" },
      mandatory: false,
    });
  }

  function handleSelectActionBlock(index) {
    const configs = get(configManager);
    const config = configs[index];
    selectAction(index, !config.selected);
  }

  function handleClearElement() {
    const ui = get(user_input);
    clearElement(ui.dx, ui.dy, ui.pagenumber, ui.elementnumber).catch((e) => {
      console.warn(e);
    });

    Analytics.track({
      event: "Config Action",
      payload: { click: "Clear Element" },
      mandatory: false,
    });
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
      <configs class="w-full h-full flex flex-col px-8 pt-4 pb-2 gap-2">
        <ElementSelectionPanel />
        <EventPanel class="flex flex-col w-full " />
        <div class="-mb-2">
          <Toolbar
            on:convert-to-code-block={handleConvertToCodeBlock}
            on:copy={handleCopy}
            on:cut={handleCut}
            on:paste={handlePaste}
            on:remove={handleRemove}
            on:copy-all={handleCopyElement}
            on:overwrite-all={handleOverwriteElement}
            on:discard={handleDiscardElement}
            on:clear-element={handleClearElement}
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
          {#if $configManager.length === 0 && $runtime.modules.length > 0}
            <div class="mt-2">
              <AddAction
                index={0}
                text={"There are no actions configured on this event."}
                on:paste={handlePaste}
                on:new-config={handleConfigInsertion}
              />
            </div>
          {:else}
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
              class="flex flex-col w-full h-auto overflow-y-auto justify-start"
            >
              {#if typeof $config_drag === "undefined"}
                <AddActionLine
                  index={0}
                  on:paste={handlePaste}
                  on:new-config={handleConfigInsertion}
                />
              {:else}
                <DropZone
                  index={0}
                  drag_target={draggedIndexes}
                  thresholdTop={10}
                  thresholdBottom={0}
                  on:drop-target-change={handleDropTargetChange}
                />
              {/if}
              {#each $configManager as config, index (config)}
                <anim-block
                  animate:flip={{ duration: 300, easing: eases.backOut }}
                  in:fade|global={{ delay: 0 }}
                >
                  <div class="flex flex-row justify-between relative">
                    <div
                      class="w-full bg-white absolute h-full opacity-10 pointer-events-none z-10"
                      class:hidden={!config.selected}
                    />

                    <DynamicWrapper
                      {index}
                      {config}
                      action={config.runtimeRef}
                      on:update={handleConfigUpdate}
                      on:replace={handleReplace}
                      on:select={() => {
                        handleSelectActionBlock(index);
                      }}
                    />

                    <div class="z-20 flex items-center mx-2">
                      <Options
                        {index}
                        bind:selected={config.selected}
                        disabled={!config.information.selectable}
                        on:selection-change={handleSelectionChange}
                      />
                    </div>
                  </div>
                  {#key index}
                    {#if typeof $config_drag === "undefined"}
                      {#if ["composite_close", "single"].includes(config.information.type) || ["single"].includes($configManager[index + 1]?.information.type) || !$appSettings.persistent.actionHelperText || typeof config.information.helperText === "undefined"}
                        <AddActionLine
                          index={index + 1}
                          on:paste={handlePaste}
                          on:new-config={handleConfigInsertion}
                        />
                      {:else}
                        <div class="mr-6">
                          <AddAction
                            text={config.information.helperText}
                            index={index + 1}
                            on:paste={handlePaste}
                            on:new-config={handleConfigInsertion}
                          />
                        </div>
                      {/if}
                    {:else}
                      <DropZone
                        index={index + 1}
                        thresholdTop={10}
                        thresholdBottom={10}
                        class={index + 1 == $configManager.length
                          ? "h-full"
                          : ""}
                        drag_target={draggedIndexes}
                        on:drop-target-change={handleDropTargetChange}
                      />
                    {/if}
                  {/key}
                </anim-block>
              {/each}
            </config-list>
          {/if}
        </div>
        <div
          class="w-full flex justify-between mb-3"
          class:invisible={$runtime.modules.length === 0}
        >
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
