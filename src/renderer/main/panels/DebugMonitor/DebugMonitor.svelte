<script lang="ts">
  import {
    debug_monitor_store,
    debug_lowlevel_store,
    inbound_data_rate_points,
    outbound_data_rate_points,
    inbound_data_rate_history,
    outbound_data_rate_history,
  } from "./DebugMonitor.store";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { writable, readable, get } from "svelte/store";
  import PolyLineGraph from "../../user-interface/PolyLineGraph.svelte";
  import { incoming_messages } from "../../../serialport/message-stream.store";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import {
    MoltenPushButton,
    MeltRadio,
    MeltSelect,
  } from "@intechstudio/grid-uikit";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import type { ModuleType } from "@intechstudio/grid-protocol";
  import DebugTextList from "./DebugTextList.svelte";
  import { scrollToBottom } from "../../_actions/scroll.move";
  import SendImmediate from "./SendImmediate.svelte";
  import { copyContextMenu } from "../../_actions/copy-context-menu.action";
  import SendEvaluate from "./SendEvaluate.svelte";
  import SendRaw from "./SendRaw.svelte";

  const incoming_messages_stores = writable([]);

  $: if (typeof $incoming_messages !== "undefined") {
    handleIncomingMessage($incoming_messages);
  }

  function handleIncomingMessage(messages) {
    incoming_messages_stores.set(messages.map((e) => readable(e)));
  }

  let frozen = false;

  function freezeDebugtext() {
    frozen = true;
    debug_monitor_store.freeze();
    debug_lowlevel_store.freeze();
  }

  function unfreezeDebugtext() {
    frozen = false;
    debug_monitor_store.unfreeze();
    debug_lowlevel_store.unfreeze();
  }

  function clearDebugtext() {
    debug_monitor_store.update((s) => {
      s = [];
      return s;
    });
    debug_lowlevel_store.update((s) => {
      s = [];
      return s;
    });
  }

  let display = "CHAR";
  let selectedSend = "evaluate";

  let selectedModule: string = "all";
  let moduleOptions: Array<{ title: string; value: string }> = [];

  function getModuleTypeName(type: ModuleType): string {
    if (typeof type === "object" && type.type) return type.type;
    return String(type);
  }

  function refreshModuleList() {
    const runtime = get(runtime_manager)?.active?.runtime;
    const modules = runtime?.modules || [];

    const newOptions = [
      { title: "All Modules (Global)", value: "all" },
      ...modules.map((module) => ({
        title: `Module [${module.dx}, ${module.dy}] - ${getModuleTypeName(module.type)}`,
        value: `${module.dx},${module.dy}`,
      })),
    ];

    if (selectedModule !== "all") {
      const exists = newOptions.some((opt) => opt.value === selectedModule);
      if (!exists) selectedModule = "all";
    }

    moduleOptions = newOptions;
  }

  onMount(() => {
    refreshModuleList();
  });

  $: target =
    !selectedModule || selectedModule === "all"
      ? { dx: -127, dy: -127 }
      : (() => {
          const [dxStr, dyStr] = selectedModule.split(",");
          return { dx: parseInt(dxStr) || 0, dy: parseInt(dyStr) || 0 };
        })();

  function average(arr) {
    let sum = 0;
    let len = arr.length;

    if (len == 0) {
      return 0;
    }

    arr.forEach((element) => {
      sum += element;
    });

    return Math.floor((sum / len) * 100) / 100;
  }

  function minimum(arr) {
    let len = arr.length;

    if (len == 0) {
      return 0;
    }

    let min = arr[0];

    arr.forEach((element) => {
      if (element < min) {
        min = element;
      }
    });

    return Math.floor(min * 100) / 100;
  }
  function maximum(arr) {
    let len = arr.length;

    if (len == 0) {
      return 0;
    }

    let max = arr[0];

    arr.forEach((element) => {
      if (element > max) {
        max = element;
      }
    });

    return Math.floor(max * 100) / 100;
  }

  function toHexString(byteArray) {
    var s = "";
    byteArray.forEach(function (byte) {
      s += "0x" + ("0" + (byte & 0xff).toString(16)).slice(-2) + " ";
    });
    return s;
  }

  function toCharString(byteArray) {
    let s = "";
    byteArray.forEach(function (byte) {
      s += String.fromCharCode(byte);
    });
    return s;
  }

  function toDecString(byteArray) {
    let s = "";
    byteArray.forEach(function (byte) {
      s += byte + " ";
    });
    return s;
  }
</script>

<config-debug
  transition:fade|global={{ duration: 150 }}
  class="w-full h-full flex flex-col p-4 z-10"
>
  <div class="flex flex-row gap-2 mb-2">
    <div class="flex-grow">
      {#key moduleOptions}
        <MeltSelect
          bind:target={selectedModule}
          options={moduleOptions}
          disabled={false}
        />
      {/key}
    </div>
    <MoltenPushButton click={refreshModuleList} text="Refresh" />
  </div>

  <div class="flex mb-2">
    <MeltRadio
      bind:target={selectedSend}
      style="button"
      orientation="horizontal"
      options={[
        { title: "Evaluate", value: "evaluate" },
        { title: "Immediate", value: "immediate" },
        { title: "Raw", value: "raw" },
      ]}
    />
  </div>

  {#if selectedSend === "immediate"}
    <SendImmediate {target} />
  {:else if selectedSend === "evaluate"}
    <SendEvaluate {target} />
  {:else if selectedSend === "raw"}
    <SendRaw {target} />
  {/if}

  <Splitpanes
    theme="modern-theme"
    class="w-full overflow-hidden"
    horizontal={true}
  >
    <Pane class="overflow-hidden">
      <DebugTextList />
    </Pane>
    <Pane class="overflow-hidden">
      {#if $debug_lowlevel_store.length != 0}
        <div class="flex flex-col w-full h-full">
          <div class="flex flex-row gap-2 text-white items-center my-2">
            <div class="inline-flex">
              <MeltRadio
                bind:target={display}
                style="button"
                orientation="horizontal"
                options={[
                  { title: "DEC", value: "DEC" },
                  { title: "HEX", value: "HEX" },
                  { title: "CHAR", value: "CHAR" },
                ]}
              />
            </div>
            <div class="flex-grow"></div>
            <div class="flex gap-4">
              {#if frozen == false}
                <MoltenPushButton text="Freeze" click={freezeDebugtext} />
              {:else}
                <MoltenPushButton text="Unfreeze" click={unfreezeDebugtext} />
              {/if}
              <MoltenPushButton click={clearDebugtext} text="Clear" />
            </div>
          </div>
          <div class="text-white mt-2">Raw Packet:</div>
          <div
            class="flex flex-grow w-full selectable overflow-y-auto p-1"
            use:scrollToBottom={debug_lowlevel_store}
            use:copyContextMenu
          >
            <div class=" flex flex-col min-h-[100px] font-mono text-white">
              {#each $debug_lowlevel_store as debug, i}
                <span
                  class="px-1 py-0.5 my-1 w-full break-all {debug.direction ==
                  'IN'
                    ? 'input'
                    : 'output'} "
                >
                  {#if display == "DEC"}
                    {toDecString(debug.data)}
                  {:else if display == "HEX"}
                    {toHexString(debug.data)}
                  {:else}
                    {toCharString(debug.data)}
                  {/if}
                </span>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </Pane>
    <Pane>
      <div class="flex flex-col h-full overflow-hidden gap-2 mt-2">
        <div class="text-white">Watched values:</div>
        <div class="flex-grow overflow-y-auto">
          {#if $incoming_messages_stores.length > 0 && $runtime_manager.active.runtime.modules.length > 0}
            <div class="w-full grid grid-cols-2 gap-1">
              {#each $incoming_messages_stores as store}
                <PolyLineGraph incomingData={store} />
              {/each}
            </div>
          {:else}
            <div
              class="flex w-full h-full justify-center items-center bg-secondary"
            >
              <span class="text-white">None</span>
            </div>
          {/if}
        </div>
      </div>
    </Pane>
  </Splitpanes>

  <div class="inline-flex flex-row mt-2">
    <svg width="50%" height="50" viewBox="0 0 100 50">
      <polyline
        id="chart_testchart_0"
        class="outbound chart"
        fill="none"
        points={$outbound_data_rate_points}
      />

      <text
        alignment-baseline="middle"
        text-anchor="middle"
        class="outbound bigsvgtext"
        x="50%"
        y="50%"
        >{Math.floor($outbound_data_rate_history.at(-1) * 100) / 100}</text
      >
      <text
        alignment-baseline="middle"
        text-anchor="middle"
        class="outbound unitsvgtext"
        x="50%"
        y="80%">kbps (TX)</text
      >

      <text
        alignment-baseline="middle"
        class="outbound smallsvgtext"
        x="0"
        y="25%">{maximum($outbound_data_rate_history)}</text
      >
      <text
        alignment-baseline="middle"
        class="outbound smallsvgtext"
        x="0"
        y="50%">{average($outbound_data_rate_history)}</text
      >
      <text
        alignment-baseline="middle"
        class="outbound smallsvgtext"
        x="0"
        y="75%">{minimum($outbound_data_rate_history)}</text
      >
    </svg>

    <svg width="50%" height="50" viewBox="0 0 100 50">
      <polyline
        id="chart_testchart_0"
        class="inbound chart"
        fill="none"
        points={$inbound_data_rate_points}
      />

      <text
        alignment-baseline="middle"
        text-anchor="middle"
        class="inbound bigsvgtext"
        x="50%"
        y="50%"
        >{Math.floor($inbound_data_rate_history.at(-1) * 100) / 100}</text
      >
      <text
        alignment-baseline="middle"
        text-anchor="middle"
        class="inbound unitsvgtext"
        x="50%"
        y="80%">kbps (RX)</text
      >

      <text
        alignment-baseline="middle"
        class="inbound smallsvgtext"
        x="0"
        y="25%">{maximum($inbound_data_rate_history)}</text
      >
      <text
        alignment-baseline="middle"
        class="inbound smallsvgtext"
        x="0"
        y="50%">{average($inbound_data_rate_history)}</text
      >
      <text
        alignment-baseline="middle"
        class="inbound smallsvgtext"
        x="0"
        y="75%">{minimum($inbound_data_rate_history)}</text
      >
    </svg>
  </div>
</config-debug>

<style>
  .chart {
    stroke-width: 1;
  }

  .inbound.chart {
    stroke: rgba(39, 87, 50, 1);
  }

  .outbound.chart {
    stroke: rgba(44, 44, 80, 1);
  }

  .bigsvgtext {
    font-size: 200%;
    font-weight: bolder;
  }
  .inbound.bigsvgtext {
    fill: rgb(83, 191, 108);
  }
  .outbound.bigsvgtext {
    fill: rgb(84, 84, 150);
  }

  .unitsvgtext {
    font-size: 75%;
    font-weight: bolder;
  }
  .inbound.unitsvgtext {
    fill: rgb(83, 191, 108);
  }
  .outbound.unitsvgtext {
    fill: rgb(84, 84, 150);
  }

  .smallsvgtext {
    font-size: 75%;
  }
  .inbound.smallsvgtext {
    fill: rgba(39, 87, 50, 1);
  }
  .outbound.smallsvgtext {
    fill: rgba(44, 44, 80, 1);
  }

  .output {
    background-color: rgba(44, 44, 80, 0.5);
    font-weight: bold;
  }

  .input {
    background-color: rgba(39, 87, 50, 0.5);
    font-weight: bold;
  }

  .selectable {
    user-select: text;
  }

  .splitpanes.modern-theme .splitpanes__pane {
    /*  @apply bg-secondary; */
    position: relative;
    overflow: visible;
  }

  /*betty magic selector*/
  .splitpanes.modern-theme .splitpanes__pane.leftPane {
    overflow: hidden;
  }

  .splitpanes.modern-theme .splitpanes__splitter {
    background-color: #4c4c4c;
    position: relative;
  }
  .splitpanes.modern-theme .splitpanes__splitter:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    transition: opacity 0.3s;
    background-color: #2db9d2;
    width: 200;
    opacity: 0;
    z-index: 1;
  }
  .splitpanes.modern-theme .splitpanes__splitter:hover:before {
    opacity: 1;
  }
  .splitpanes.modern-theme .splitpanes__splitter.splitpanes__splitter__active {
    z-index: 2;
    /* Fix an issue of overlap fighting with a near hovered splitter */
  }
  .modern-theme.splitpanes--vertical > .splitpanes__splitter:before {
    left: -3px;
    right: -3px;
    height: 100%;
    cursor: col-resize;
  }
  .modern-theme.splitpanes--horizontal > .splitpanes__splitter:before {
    top: -3px;
    bottom: -3px;
    width: 100%;
    cursor: row-resize;
  }
  .splitpanes.no-splitter .splitpanes__pane {
    background-color: #0e100f;
  }
  .splitpanes.no-splitter .splitpanes__splitter {
    background-color: #4c4c4c;
    position: relative;
  }
  .no-splitter.splitpanes--horizontal > .splitpanes__splitter:before {
    width: 0.05rem;
    pointer-events: none;
    cursor: none;
  }
  .no-splitter.splitpanes--vertical > .splitpanes__splitter:before {
    height: 0.05rem;
    pointer-events: none;
    cursor: none;
  }
</style>
