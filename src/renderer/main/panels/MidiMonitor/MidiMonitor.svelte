<script>
  import { fly } from "svelte/transition";
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
  let midiList;

  midi_monitor_store.subscribe(() => {
    let mms = get(midi_monitor_store);
    let m = mms.slice(-1).pop();
    if (m) {
      last = m;
      if (midiList) midiList.scrollTop = midiList.scrollHeight;
      UpdateDebugStream(m, "MIDI");
    }
  });

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
    let ms = get(midi_monitor_store);
    last = ms[index];
  }

  function onClearClicked() {
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
  <div class="flex flex-row w-full text-white justify-between items-center">
    <div class="flex text-2xl">MIDI Monitor</div>
    <div class="flex">
      <span class="text-white font-medium mr-2">Debug View</span>
      <Toggle bind:toggleValue={debug} />
    </div>
  </div>

  {#if !debug}
    <div class="py-8 px-10">
      <div class="border-secondary border flex flex-col col-span-3 mb-2">
        <span class="text-sm text-white bg-secondary px-1">Command</span>
        <div
          class="flex flex-row w-full text-white justify-between align-center items-center"
        >
          <span class="py-1 px-2 text-white"
            >{last ? last.data.command.name : "N/A"}</span
          >
          <div class="py-1 px-2 w-24 text-center rounded">
            <div
              class="w-auto text-primary text-sm bg-white h-6 text-center rounded"
            >
              {hover ? "SELECTED" : "LAST"}
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 mb-2">
        <div class="border-secondary border flex flex-col">
          <div class="flex flex-row w-full text-white">
            <span class="text-sm text-white bg-secondary px-1"
              >{last ? last.data.params.p1.name : "N/A"}</span
            >
            <span class="grow text-right text-sm text-white bg-secondary px-1"
              >[ P1 ]</span
            >
          </div>

          <span class="px-2 text-white text-center"
            >{last ? last.data.params.p1.value : "N/A"}</span
          >
        </div>
        <div class="border-secondary border flex flex-col">
          <div class="flex flex-row w-full text-white">
            <span class="text-sm text-white bg-secondary px-1"
              >{last ? last.data.params.p2.name : "N/A"}</span
            >
            <span class="grow text-right text-sm text-white bg-secondary px-1"
              >[ P2 ]</span
            >
          </div>

          <span class="px-2 text-white text-center"
            >{last ? last.data.params.p2.value : "N/A"}</span
          >
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <div class="border-secondary border flex flex-col">
          <span class="text-sm text-white bg-secondary px-1">Channel</span>
          <span class="px-2 text-white text-center"
            >{last ? last.data.channel : "N/A"}</span
          >
        </div>
        <div class="border-secondary border flex flex-col">
          <span class="text-sm text-white bg-secondary px-1">Device</span>
          <span class="px-2 text-white text-center"
            >{last ? last.device.name : "N/A"}</span
          >
        </div>
        <div class="border-secondary border flex flex-col">
          <span class="text-sm text-white bg-secondary px-1">Direction</span>
          <span class="px-2 text-white text-center"
            >{last
              ? last.data.direction == "REPORT"
                ? "RX🡐"
                : "TX🡒"
              : "N/A"}</span
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
            <div class="flex flex-col grow overflow-y-auto bg-secondary">
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
                  class="text-green-400 hover:text-green-200 transition-transform origin-left hover:scale-105 duration-100 transform scale-100"
                  on:mouseover={() => onEnterMidiMessage(this, i)}
                  on:mouseleave={() => onLeaveMidiMessage(this, i)}
                  in:fly={{ x: -10, duration: 100 }}
                >
                  <span class="pr-2 text-white">[{midi.device.name}]</span>
                  <span class="pr-2">(Ch: {midi.data.channel})</span>
                  <span class="pr-2">{midi.data.command.short}</span>
                  <span class="pr-2">{midi.data.params.p1.short}</span>
                  <span class="pr-2">{midi.data.params.p1.value}</span>
                  <span class="pr-2">{midi.data.params.p2.short}</span>
                  <span class="pr-2">{midi.data.params.p2.value}</span>
                  <span class="pr-2"
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
