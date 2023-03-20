<script>
  import { beforeUpdate, afterUpdate } from "svelte";
  import Toggle from "../../user-interface/Toggle.svelte";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { get, writable } from "svelte/store";
  import { debug_monitor_store } from "../DebugMonitor/DebugMonitor.store";
  import { midi_monitor_store, sysex_monitor_store } from "./MidiMonitor.store";
  // ok but slow nice

  //Defines
  const debug_stream = writable([]);
  let debug = false;
  let hover = false;
  let last = undefined;
  let midiList = undefined;
  let activity = false;
  let timer = undefined;

  beforeUpdate(() => {});

  afterUpdate(() => {
    //test = false;
  });

  midi_monitor_store.subscribe(() => {
    let mms = get(midi_monitor_store);
    let m = mms.slice(-1).pop();
    if (m) {
      last = m;
      if (midiList) midiList.scrollTop = midiList.scrollHeight;
      UpdateDebugStream(m, "MIDI");
    }
  });

  function showActivity() {
    activity = true;
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      activity = false;
    }, 250);
  }

  sysex_monitor_store.subscribe(() => {
    let sms = get(sysex_monitor_store);
    let m = sms.slice(-1).pop();
    if (m) UpdateDebugStream(m, "SYSEX");
  });

  function UpdateDebugStream(item, msg_type) {
    debug_stream.update((items) => {
      if (items.length >= 32) {
        items.shift();
      }
      showActivity();
      item.type = msg_type;
      return [...items, item];
    });
  }

  function onLeaveMidiMessage(item, index) {
    hover = false;
    let mms = get(midi_monitor_store);
    last = mms.slice(-1).pop();
  }

  function onEnterMidiMessage(item, index) {
    hover = true;
    showActivity();
    let ms = get(midi_monitor_store);
    last = ms[index];
  }

  function onClearClicked() {
    last = undefined;
    debug_monitor_store.update((s) => {
      s = [];
      return s;
    });
    midi_monitor_store.update((s) => {
      s = [];
      return s;
    });
    sysex_monitor_store.update((s) => {
      s = [];
      return s;
    });
    debug_stream.update((s) => {
      s = [];
      return s;
    });
  }
</script>

<div class="flex flex-col h-full p-4 bg-primary">
  <div class="flex flex-row w-full text-white justify-between">
    <div class="flex text-2xl">MIDI Monitor</div>
    <div class="flex items-center">
      <span class="text-white font-medium mr-2">Debug View</span>
      <Toggle bind:toggleValue={debug} />
    </div>
  </div>

  {#if !debug}
    <div class="py-8 px-6">
      <div class="border-gray-700 border rounded flex flex-col col-span-3 mb-2">
        <span class="text-lg text-white bg-secondary px-2">Command</span>
        <div
          class="flex flex-row w-full text-white justify-between align-center items-center"
        >
          <div class="flex items-center py-1 px-3">
            <span class="flex text-xl text-white "
              >{last ? last.data.command.name : "Waiting for MIDI..."}</span
            >
          </div>
          {#if last}
            <div
              class="grid grid-cols-2 items-center rounded-lg text-center transition-width duration-200 mr-2 {hover
                ? 'bg-green-400 w-24'
                : 'bg-white w-20'}"
            >
              <div
                class="flex ml-3 mr-1 z-10 {hover
                  ? 'text-white'
                  : 'text-primary'} text-center"
              >
                {hover ? "SELECT" : "LAST"}
              </div>
              <div
                class="flex place-self-end self-center {activity
                  ? 'bg-yellow-500'
                  : 'bg-primary'} rounded-full w-3 h-3 mr-2"
              />
            </div>
          {/if}
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 my-4 text-center">
        <div class="border-gray-700 border rounded flex flex-col">
          <span class="text-lg text-white bg-secondary px-1">Channel</span>
          <span class="px-2 text-xl text-white text-center"
            >{last ? last.data.channel : "---"}</span
          >
        </div>
        <div class="border-gray-700 border rounded flex flex-col">
          <span class="text-lg text-white bg-secondary px-1">Device</span>
          <span class="px-2 text-xl text-white text-center"
            >{last ? last.device.name : "---"}</span
          >
        </div>
        <div class="border-gray-700 border rounded flex flex-col">
          <span class="text-lg text-white bg-secondary px-1">Direction</span>
          <span class="px-2 text-xl text-white text-center"
            >{last
              ? last.data.direction == "REPORT"
                ? "Receive"
                : "Transmit"
              : "---"}</span
          >
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 place-items-center">
        <div class="border-gray-700 border rounded flex flex-col w-44">
          <div class="flex flex-row w-full text-white">
            <span class="text-lg text-white text-center bg-secondary w-full"
              >{last ? last.data.params.p1.name : "Parameter 1"}</span
            >
          </div>

          <span class="text-xl text-white text-center"
            >{last ? last.data.params.p1.value : "---"}</span
          >
        </div>
        <div class="border-gray-700 border rounded flex flex-col w-44">
          <div class="flex flex-row w-full text-white">
            <span class="text-lg text-white text-center bg-secondary w-full"
              >{last ? last.data.params.p2.name : "Parameter 2"}</span
            >
          </div>

          <span class="text-xl text-white text-center"
            >{last ? last.data.params.p2.value : "---"}</span
          >
        </div>
      </div>
    </div>
  {/if}

  <div class="overflow-hidden flex flex-col h-full">
    <Splitpanes
      horizontal="true"
      theme="modern-theme"
      pushOtherPanes={false}
      class="h-full w-full"
    >
      <Pane size={50}>
        <div class="flex flex-col overflow-hidden h-full">
          {#if debug}
            <div class="flex w-full font-medium text-white pb-2 pt-8">
              MIDI Messages (RAW)
            </div>
            <div class="w-full grid grid-cols-6 text-white">
              <div>[X,Y]</div>
              <div>CH</div>
              <div>CMD</div>
              <div>P1</div>
              <div>P2</div>
              <div>DIR</div>
            </div>
            <div
              class="flex flex-col grow overflow-y-auto bg-secondary"
              bind:this={midiList}
            >
              {#each $debug_stream as message}
                <div
                  class="grid grid-cols-6 items-start justify-start w-full font-mono text-green-300"
                >
                  <div>[{message.device.x}, {message.device.y}]</div>
                  {#if message.type === "MIDI"}
                    <div>{message.data.channel}</div>
                    <div>{message.data.command.value}</div>
                    <div>{message.data.params.p1.value}</div>
                    <div>{message.data.params.p2.value}</div>
                  {:else}
                    <div class="col-span-4">
                      SysEx: {String.fromCharCode
                        .apply(String, message.data.raw)
                        .substr(8)}
                    </div>
                  {/if}
                  <div class="flex items-center">
                    {message.data.direction == "REPORT" ? "RX🡐" : "TX🡒"}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="flex w-full text-white pb-2">MIDI Messages</div>
            <div
              class="flex flex-col h-full bg-secondary overflow-y-auto overflow-x-hidden"
              bind:this={midiList}
            >
              {#each $midi_monitor_store as midi, i (midi.id)}
                <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                <div
                  class="grid grid-cols-8 text-green-400 hover:text-green-200 transition-transform origin-left hover:scale-105 duration-100 transform scale-100"
                  on:mouseover={() => onEnterMidiMessage(this, i)}
                  on:mouseleave={() => onLeaveMidiMessage(this, i)}
                >
                  <span class="text-white">[{midi.device.name}]</span>
                  <span class="">(Ch: {midi.data.channel})</span>
                  <span class="">{midi.data.command.short}</span>
                  <span class="">{midi.data.params.p1.short}:</span>
                  <span class="">{midi.data.params.p1.value}</span>
                  <span class="">{midi.data.params.p2.short}:</span>
                  <span class="">{midi.data.params.p2.value}</span>
                  <span class=""
                    >{midi.data.direction == "REPORT" ? "RX🡐" : "TX🡒"}</span
                  >
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </Pane>
      <Pane size={50}>
        <div class="flex flex-col h-full w-full">
          {#if debug}
            <div class="flex w-full font-medium text-white pb-2 pt-6">
              Debug Text
            </div>
            <div class="flex flex-col flex-grow overflow-y-auto bg-secondary">
              {#if $debug_monitor_store.length != 0}
                {#each $debug_monitor_store as debug, i}
                  <span class="font-mono text-white debugtexty">{debug}</span>
                {/each}
              {/if}
            </div>
          {:else}
            <div class="flex w-full text-white pb-2 pt-6">
              System Exclusive Messages
            </div>
            <div
              class="flex flex-col h-full bg-secondary overflow-y-auto overflow-x-hidden"
            >
              {#each $sysex_monitor_store as sysex}
                <div
                  class="{sysex.data.direction == 'REPORT'
                    ? 'text-blue-400'
                    : 'text-green-400'} font-mono"
                >
                  <div class="block">
                    <span class="text-white">SysEx: </span>
                    <span
                      >{String.fromCharCode
                        .apply(String, sysex.data.raw)
                        .substr(8)}</span
                    >
                    <span
                      >{sysex.data.direction == "REPORT" ? "RX🡐" : "TX🡒"}</span
                    >
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </Pane>
    </Splitpanes>
  </div>
  <div class="flex pt-4 pb-12">
    <button
      class="bg-select hover:bg-select-saturate-10 rounded text-white w-full p-1"
      on:click={onClearClicked}
    >
      Clear All
    </button>
  </div>
</div>
