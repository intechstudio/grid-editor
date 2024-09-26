<script>
  import { modal } from "./../../modals/modal.store";
  import Export from "./../../modals/Export.svelte";
  import {
    debug_monitor_store,
    debug_lowlevel_store,
    inbound_data_rate_points,
    outbound_data_rate_points,
    inbound_data_rate_history,
    outbound_data_rate_history,
  } from "./DebugMonitor.store";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { fade } from "svelte/transition";
  import { grid } from "@intechstudio/grid-protocol";
  import { writable, readable } from "svelte/store";
  import PolyLineGraph from "../../user-interface/PolyLineGraph.svelte";
  import { incoming_messages } from "../../../serialport/message-stream.store";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { config_panel_blocks } from "../../panels/configuration/Configuration.store";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  const configScriptLength = writable(0);
  const syntaxError = writable(false);
  const incoming_messages_stores = writable([]);

  $: if (typeof $incoming_messages !== "undefined") {
    handleIncomingMessage($incoming_messages);
  }

  function handleIncomingMessage(messages) {
    incoming_messages_stores.set(messages.map((e) => readable(e)));
  }

  $: {
    configScriptLength.set($config_panel_blocks.toConfigScript().length);
    syntaxError.set($config_panel_blocks.checkSyntax());
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

  function handleShowCode(e) {
    modal.show({ component: Export });
  }
</script>

<config-debug
  transition:fade|global={{ duration: 150 }}
  class="w-full h-full flex flex-col p-4 z-10 bg-primary"
>
  <div class="text-white">
    Editor v{$appSettings.version.major}.{$appSettings.version
      .minor}.{$appSettings.version.patch}
  </div>

  <div class="grid grid-cols-[auto_1fr] w-full">
    <div class="flex flex-col">
      <div class="text-white">Syntax: {$syntaxError}</div>
      <div class="flex flex-row">
        <div class="pr-2 text-white">Char Count:</div>
        <div class="text-white">
          <span
            class:text-error={$configScriptLength >=
              grid.getProperty("CONFIG_LENGTH")}
            class:text-yellow-400={$configScriptLength >
              (grid.getProperty("CONFIG_LENGTH") / 3) * 2}
            >{$configScriptLength}
          </span>
        </div>
      </div>
    </div>
    <div class="flex items-center justify-end">
      <MoltenPushButton text="Show Code" click={handleShowCode} />
    </div>
  </div>

  <div class="flex felx-row gap-2 flex-wrap text-white items-center my-4">
    <MoltenPushButton click={clearDebugtext} text="Clear" />
    <MoltenPushButton
      click={() => {
        display = "DEC";
      }}
      text="DEC"
    />
    <MoltenPushButton
      click={() => {
        display = "HEX";
      }}
      text="HEX"
    />
    <MoltenPushButton
      click={() => {
        display = "CHAR";
      }}
      text="CHAR"
    />

    {#if frozen == false}
      <MoltenPushButton text="Freeze" click={freezeDebugtext} />
    {:else}
      <MoltenPushButton text="Unfreeze" click={unfreezeDebugtext} />
    {/if}
  </div>
  <Splitpanes
    theme="modern-theme"
    class="w-full overflow-hidden"
    horizontal="true"
  >
    <Pane class="overflow-hidden bg-primary">
      {#if $debug_monitor_store.length != 0}
        <div class="text-white mt-2">Debug Text:</div>
        <div
          class="flex flex-col font-mono overflow-y-auto text-white bg-secondary m-1 min-h-[200px] h-full"
        >
          {#each $debug_monitor_store as debug, i}
            <span class="debugtexty px-1 py-0.5">{debug}</span>
          {/each}
        </div>
      {/if}
    </Pane>
    <Pane class="overflow-hidden bg-primary">
      {#if $debug_lowlevel_store.length != 0}
        <div class="text-white mt-2">Raw Packet:</div>

        <div
          class="selectable flex flex-col flex-grow min-h-[100px] h-full w-full font-mono overflow-y-auto text-white m-1"
        >
          {#each $debug_lowlevel_store as debug, i}
            <span
              class="px-1 py-0.5 my-1 w-full break-all {debug.direction == 'IN'
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
      {/if}
    </Pane>
    <Pane class="overflow-hidden bg-primary">
      <div class="text-white mt-2">Watched values:</div>
      <div
        class="mb-5 overflow-y-auto bg-secondary bg-opacity-40 flex flex-grow"
      >
        {#if $incoming_messages_stores.length > 0}
          <div class="w-full h-full grid grid-cols-2">
            {#each $incoming_messages_stores as store}
              <div class="m-1">
                <PolyLineGraph incomingData={store} />
              </div>
            {/each}
          </div>
        {:else}
          <div class="flex w-full h-full justify-center items-center">
            <span class="text-white">None</span>
          </div>
        {/if}
      </div>
    </Pane>
  </Splitpanes>

  <div class="inline-flex flex-row bg-primary">
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
        >{Math.floor(
          $outbound_data_rate_history[$inbound_data_rate_history.length - 1] *
            100
        ) / 100}</text
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
        >{Math.floor(
          $inbound_data_rate_history[$inbound_data_rate_history.length - 1] *
            100
        ) / 100}</text
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

  .debugtexty:nth-child(even) {
    @apply bg-select;
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
