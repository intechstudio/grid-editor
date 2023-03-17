<script>
  import { fade, slide, fly } from "svelte/transition";
  import Toggle from "../../user-interface/Toggle.svelte";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { get, writable } from "svelte/store";
  import { debug_monitor_store } from "../DebugMonitor/DebugMonitor.store";
  import {
    midi_monitor_store,
    sysex_monitor_store,
    maxMidi,
  } from "./MidiMonitor.store";
  import { afterUpdate } from "svelte";
  // ok but slow nice

  //Defines
  const debug_stream = writable([]);
  let debug = false;
  let hover = false;
  let hoverIndex = undefined;
  let last = undefined;
  let midiList;

  afterUpdate(() => {
    if (midiList) midiList.scrollTop = midiList.scrollHeight;
  });

  midi_monitor_store.subscribe(() => {
    let mms = get(midi_monitor_store);
    let m = mms.slice(-1).pop();
    if (m) {
      last = m;
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
    hoverIndex = undefined;
    let mms = get(midi_monitor_store);
    last = mms.slice(-1).pop();
  }

  function onEnterMidiMessage(item, index) {
    hover = true;
    hoverIndex = index;
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

<div class=" flex flex-col h-full justify-between p-4 bg-primary">
  <div class="flex w-full h-full flex-col overflow-auto ">
    <div
      class="flex justify-between items-center p-4 text-white font-medium
      cursor-pointer w-full "
    >
      <div>Session Profiles</div>
    </div>
    <div
      class="flex justify-between items-center p-4 text-white font-medium
      cursor-pointer w-full "
    >
      <div>Session Profiles</div>
    </div>

    <div class="flex grow">
      <Splitpanes
        horizontal="true"
        theme="modern-theme"
        pushOtherPanes={false}
        class=" bg-red-600 "
      >
        <Pane size={30}>
          <div class="flex flex-col overflow-hidden h-full">
            <div class="flex w-full text-white">MIDI Messages</div>
            <div
              class="flex flex-col bg-secondary overflow-y-auto"
              bind:this={midiList}
            >
              {#each $midi_monitor_store as midi, i (midi.id)}
                <div class="flex bg-green-500">test</div>
              {/each}
            </div>
          </div>
        </Pane>
        <Pane size={20}>
          <div class="flex flex-col h-full w-full">
            <div class="flex w-full text-white">MIDI Messages</div>
            <div
              class="flex flex-col bg-secondary overflow-y-auto"
              bind:this={midiList}
            >
              {#each $midi_monitor_store as midi, i (midi.id)}
                <div class="flex bg-green-500">test</div>
              {/each}
            </div>
          </div>
        </Pane>
      </Splitpanes>
    </div>
  </div>
</div>
