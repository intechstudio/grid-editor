<script>
  import {
    debug_monitor_store,
    debug_lowlevel_store,
    inbound_data_rate_points,
    outbound_data_rate_points,
    inbound_data_rate_history,
    outbound_data_rate_history,
  } from "./WebsocketMonitor.store";
  import _utils from "../../../runtime/_utils";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { wss_send_message } from "../../../runtime/runtime.store";

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

  let websocketMessage = `{zyp: "hy"}`;

  function sendMessage() {
    wss_send_message(websocketMessage);
  }

  function portChange() {
    window.electron.websocket.changePort($appSettings.persistant.wssPort);
  }
</script>

<config-debug class="w-full h-full flex flex-col p-4 z-10 bg-primary">
  <div class="text-white">
    Editor v{$appSettings.version.major}.{$appSettings.version
      .minor}.{$appSettings.version.patch}
  </div>

  <input
    type="number"
    bind:value={$appSettings.persistant.wssPort}
    on:change={portChange}
  />

  <div class="text-white">Websocket Monitor</div>
  <textarea
    spellcheck="false"
    bind:value={websocketMessage}
    class="w-full cursor-default min-h-36 h-36 bg-secondary rounded px-1 my-2 text-white font-mono"
  />

  <button
    class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded"
    on:click={sendMessage}
    >Send
  </button>

  <div class="flex text-white items-center">
    <button
      class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded"
      on:click={clearDebugtext}
      >Clear
    </button>
    <button
      class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded"
      on:click={() => {
        display = "DEC";
      }}
      >DEC
    </button>
    <button
      class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded"
      on:click={() => {
        display = "HEX";
      }}
      >HEX
    </button>
    <button
      class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded"
      on:click={() => {
        display = "CHAR";
      }}
      >CHAR
    </button>

    {#if frozen == false}
      <button
        class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded"
        on:click={freezeDebugtext}
        >Freeze
      </button>
    {:else}
      <button
        class="px-4 py-1 my-4 bg-select hover:bg-select-saturate-10 rounded"
        on:click={unfreezeDebugtext}
        >Unfreeze
      </button>
    {/if}
  </div>

  {#if $debug_monitor_store.length != 0}
    <div class="text-white">Debug Text:</div>
    <div
      class="flex flex-col font-mono overflow-y-auto text-white bg-secondary m-1 min-h-[200px]"
    >
      {#each $debug_monitor_store as debug, i}
        <span class="debugtexty px-1 py-0.5">{debug}</span>
      {/each}
    </div>
  {/if}

  {#if $debug_lowlevel_store.length != 0}
    <div class="text-white">Raw Packet:</div>

    <div
      class="selectable flex flex-col font-mono overflow-y-auto text-white m-1 h-1/2"
    >
      {#each $debug_lowlevel_store as debug, i}
        <span
          class="px-1 py-0.5 my-1 {debug.direction == 'IN'
            ? 'input'
            : 'output'}"
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

  <div class="inline-flex flex-row">
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
</style>
