<script lang="ts">
  import { PasteActionsResult } from "./configuration-actions";
  import { appSettings } from "./../../../runtime/app-helper.store.js";
  import { get, type Writable } from "svelte/store";
  import ElementSelectionPanel from "./ElementSelectionPanel.svelte";

  import { Analytics } from "../../../runtime/analytics.js";

  import { fly, fade } from "svelte/transition";
  import { flip } from "svelte/animate";
  import * as eases from "svelte/easing";

  import EventPanel from "./EventPanel.svelte";

  import { lua_error_store } from "../DebugMonitor/DebugMonitor.store";

  import { logger, runtime, user_input } from "../../../runtime/runtime.store";

  import {
    config_panel_blocks,
    user_input_event,
    lastOpenedActionblocksInsert,
    ActionBlock,
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
    const ui = get(user_input);
    const target = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );
    target.sendToGrid();
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
    /*
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

    config_panel_blocks.update((s) => {
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
    */
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

  function handleSelectionChange(block: ActionBlock) {
    config_panel_blocks.update((s) => {
      const stack: ActionBlock[] = [];
      let n = s.findIndex((e) => e.action.id === block.action.id);
      const value = block.selected;
      do {
        const current = s[n];
        if (current.action.information.type === "composite_open") {
          stack.push(current);
        } else if (current.action.information.type === "composite_close") {
          stack.pop();
        }
        current.selected = value;
        ++n;
      } while (stack.length > 0);
      return s;
    });
  }

  function handleConfigInsertion(e) {
    let { index, configs } = e.detail;
    /*
    insertAction(index, configs, parent.runtimeRef);
    sendCurrentConfigurationToGrid();
    */
  }

  function handleConfigUpdate(e) {
    const { index, config } = e.detail;
    /*
    updateAction(index, config);
    sendCurrentConfigurationToGrid();

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
    */
  }

  function handleConvertToCodeBlock(e) {
    const { index, configs } = e.detail;
    mergeActionToCode(index, configs);
    sendCurrentConfigurationToGrid();
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
    config_panel_blocks.update((s) => {
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

  function handleCopy() {
    const blocks = get(config_panel_blocks);
    const selected = blocks.filter((e) => e.selected).map((e) => e.action);
    copyActions(selected);
  }

  function handlePaste() {
    const ui = get(user_input);
    const target = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );

    pasteActions(target).catch((e) => {
      const error = e as PasteActionsResult;
      logger.set({
        type: "fail",
        mode: 0,
        classname: "config-limit-reached",
        message: `Paste failed! ${error.text}`,
      });
    });
  }

  function handleClearElement() {
    /*
    const ui = get(user_input);
    clearElement(ui.dx, ui.dy, ui.pagenumber, ui.elementnumber).catch((e) => {
      console.warn(e);
    });

    Analytics.track({
      event: "Config Action",
      payload: { click: "Clear Element" },
      mandatory: false,
    });
    */
  }

  function handleSelectAll() {
    config_panel_blocks.update((s) => {
      if (s.every((e) => e.selected)) {
        s.forEach((e) => (e.selected = false));
        return s;
      }

      s.forEach((e) => (e.selected = true));
      return s;
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
            on:select-all={handleSelectAll}
          />
        </div>

        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          use:changeOrder={(this, { configs: $config_panel_blocks })}
          on:drag-start={handleDragStart}
          on:drag-target={handleDragTargetChange}
          on:drop={handleDrop}
          on:drag-end={handleDragEnd}
          class="flex flex-col h-full relative justify-between"
        >
          {#if $config_panel_blocks.length === 0 && $runtime.modules.length > 0}
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
              {#each $config_panel_blocks as block, index (block.action.id)}
                <anim-block
                  animate:flip={{ duration: 300, easing: eases.backOut }}
                  in:fade|global={{ delay: 0 }}
                >
                  <div class="flex flex-row justify-between relative">
                    <div
                      class="w-full bg-white absolute h-full opacity-10 pointer-events-none z-10"
                      class:hidden={!block.selected}
                    />

                    <DynamicWrapper
                      {index}
                      data={block}
                      on:update={handleConfigUpdate}
                      on:replace={handleReplace}
                      on:select={() => {
                        handleSelectionChange(block);
                      }}
                    />

                    <div class="z-20 flex items-center mx-2">
                      <Options
                        bind:selected={block.selected}
                        disabled={!block.action.information.selectable}
                        on:select={() => handleSelectionChange(block)}
                      />
                    </div>
                  </div>
                  {#if typeof $config_drag === "undefined"}
                    {#if ["composite_close", "single"].includes(block.action.information.type) || ["single"].includes($config_panel_blocks[index + 1]?.action.information.type) || !$appSettings.persistent.actionHelperText || typeof block.action.information.helperText === "undefined"}
                      <AddActionLine
                        index={index + 1}
                        on:paste={handlePaste}
                        on:new-config={handleConfigInsertion}
                      />
                    {:else}
                      <div class="mr-6">
                        <AddAction
                          text={block.action.information.helperText}
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
                      class={index + 1 == $config_panel_blocks.length
                        ? "h-full"
                        : ""}
                      drag_target={draggedIndexes}
                      on:drop-target-change={handleDropTargetChange}
                    />
                  {/if}
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
            index={$config_panel_blocks.length}
            on:pasteconfig_panel}
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
