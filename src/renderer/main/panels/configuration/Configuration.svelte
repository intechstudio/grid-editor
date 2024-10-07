<script lang="ts">
  import { config_panel_blocks } from "./Configuration.ts";
  import { PasteActionsResult } from "./Configuration";
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
    config_panel_blocks,
    user_input_event,
    lastOpenedActionblocksInsert,
    ActionBlock,
  } from "./Configuration";
  import Toolbar from "./components/Toolbar.svelte";
  import DropZone from "./components/DropZone.svelte";
  import DynamicWrapper from "./components/DynamicWrapper.svelte";
  import ExportConfigs from "./components/ExportConfigs.svelte";
  import {
    changeOrder,
    config_drag,
    DragEvent,
  } from "../../_actions/move.action.js";
  import AddActionLine from "./components/AddActionLine.svelte";
  import AddAction from "./components/AddAction.svelte";
  import AddActionButton from "./components/AddActionButton.svelte";
  import {
    mergeActionsToCode,
    copyActions,
    pasteActions,
    removeActions,
    cutActions,
    discardElement,
    overwriteElement,
    copyElement,
    clearElement,
    addActions,
  } from "../../../runtime/operations";

  //////////////////////////////////////////////////////////////////////////////
  /////     VARIABLES, LIFECYCLE FUNCTIONS AND TYPE DEFINITIONS       //////////
  //////////////////////////////////////////////////////////////////////////////

  let scrollHeight = "100%";
  let draggedIndexes: number[] = [];
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

    const offset = Math.min(...draggedIndexes) > dropIndex ? 0 : -1;

    //Check for incorrect dropzones
    const firstIndex = draggedIndexes.at(0);
    const lastIndex = draggedIndexes.at(-1);
    if (dropIndex >= firstIndex && dropIndex <= lastIndex + 1) {
      return;
    }

    const ui = get(user_input);
    const event = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );

    const blocks = get(config_panel_blocks)
      .map((e) => e.action)
      .filter((e, n) => draggedIndexes.includes(n));

    const trueDropIndex =
      dropIndex - (offset === -1 ? blocks.length - 1 : 0) + offset;

    event.remove(...blocks);
    event.insert(trueDropIndex, ...blocks);
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

  function handleConvertToCodeBlock() {
    const ui = get(user_input);
    const target = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );
    const blocks = get(config_panel_blocks);
    const selected = blocks.filter((e) => e.selected).map((e) => e.action);
    mergeActionsToCode(target, ...selected);
  }

  function handleRemove() {
    const ui = get(user_input);
    const target = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );
    const blocks = get(config_panel_blocks);
    const selected = blocks.filter((e) => e.selected).map((e) => e.action);
    removeActions(target, ...selected);
  }

  function handleCut() {
    const ui = get(user_input);
    const target = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );
    const blocks = get(config_panel_blocks);
    const selected = blocks.filter((e) => e.selected).map((e) => e.action);
    cutActions(target, ...selected);
  }

  function handleAddConfig(e: CustomEvent) {
    const { configs, index } = e.detail;
    const ui = get(user_input);
    const target = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );
    addActions(target, index, ...configs);
  }

  function handleOverwriteElement() {
    const ui = get(user_input);
    const target = runtime.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber
    );
    overwriteElement(target);
  }

  function handleCopyElement() {
    const ui = get(user_input);
    const target = runtime.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber
    );
    copyElement(target);
  }

  function handleCopy() {
    const blocks = get(config_panel_blocks);
    const selected = blocks.filter((e) => e.selected).map((e) => e.action);
    copyActions(...selected);
  }

  function handlePaste(e: CustomEvent) {
    const { index } = e?.detail ?? { index: undefined };
    const ui = get(user_input);
    const target = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );

    pasteActions(target, index);
  }

  function handleClearElement() {
    const ui = get(user_input);
    const target = runtime.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber
    );

    clearElement(target);
  }

  function handleDiscardElement() {
    const ui = get(user_input);
    const element = runtime.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber
    );
    discardElement(element);
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
          use:changeOrder={(this,
          { configs: $config_panel_blocks.map((e) => e.action) })}
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
                  on:new-config={handleAddConfig}
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
                  <DynamicWrapper {index} data={block} />
                  {#if typeof $config_drag === "undefined"}
                    {#if typeof block.action.information.helperText !== "undefined" && ["composite_part", "composite_open"].includes(block.action.information.type) && $config_panel_blocks[index + 1]?.action.indentation === block.action.indentation && $appSettings.persistent.actionHelperText}
                      <div class="mr-6">
                        <AddAction
                          text={block.action.information.helperText}
                          index={index + 1}
                          on:paste={handlePaste}
                          on:new-config={handleAddConfig}
                        />
                      </div>
                    {:else}
                      <AddActionLine
                        index={index + 1}
                        on:paste={handlePaste}
                        on:new-config={handleAddConfig}
                      />
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
            on:paste={handlePaste}
            on:new-config={handleAddConfig}
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
