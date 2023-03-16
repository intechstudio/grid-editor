<script>
  import { fade, slide, fly } from "svelte/transition";
  import Toggle from "../../user-interface/Toggle.svelte";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { get, writable } from 'svelte/store';
  import { debug_monitor_store } from "../DebugMonitor/DebugMonitor.store";
  import { 
    midi_monitor_store,
    sysex_monitor_store,
    maxMidi
  } from "./MidiMonitor.store";
  import { afterUpdate } from 'svelte';
  // ok but slow nice

  //Defines
  const debug_stream = writable([]);
  let debug = false;
  let hover = false;
  let hoverIndex = undefined;
  let last = undefined;
  let midiList;

  afterUpdate(() => {
    if(midiList)
      midiList.scrollTop = midiList.scrollHeight;
  });

  midi_monitor_store.subscribe(() => {
    let mms = get(midi_monitor_store);
    let m = mms.slice(-1).pop();
    if(m) {
      last = m;
      UpdateDebugStream(m, "MIDI");
    }
  });

  sysex_monitor_store.subscribe(() => {
    let sms = get(sysex_monitor_store);
    let m = sms.slice(-1).pop();
    if(m)
      UpdateDebugStream(m, "SYSEX");
  });

  function UpdateDebugStream(item, msg_type){
    debug_stream.update(items => {
      if (items.length >= 32) {
       items.shift();
      }

      item.type = msg_type;
      return [...items, item];
    });
  }

  function onLeaveMidiMessage(item, index){
    hover = false;
    hoverIndex = undefined;
    let mms = get(midi_monitor_store);
    last = mms.slice(-1).pop();
  }

  function onEnterMidiMessage(item, index){
    hover = true;
    hoverIndex = index;
    let ms = get(midi_monitor_store);
    last = ms[index];
  }

  function onClearClicked(){
    debug_monitor_store.update(s => {s = []; return s});
    midi_monitor_store.update(s => {s = []; return s});
    sysex_monitor_store.update(s => {s = []; return s});
    debug_stream.update(s => {s = []; return s});
  }

</script>

<div transition:fade={{ duration: 150 }}
  class="bg-primary flex flex-col h-full">
  <!-- Header -->
  <div class="flex text-white justify-between px-4 py-2">
    <div class="text-2xl">
      MIDI Monitor
    </div>
    <div class="flex items-center">
      <span class="text-white font-medium mr-2">Debug View</span>
      <Toggle bind:toggleValue={debug}/>
    </div>
  </div>

  <div class="flex flex-grow flex-col">
    <!-- Last MIDI Message -->
    {#if !debug}
      <div class="flex-none h-auto px-4 text-white">
        <div class="text-xl">
          <div class="flex flex-cols">
            <span>Displayed Message:</span>
            <div class="w-100 rounded bg-white text-black px-2 ml-2">{hover ? "Selected" : "Last"}</div> 
          </div>
          <div>Command: {last ? last.data.command.name : "N/A"}</div>
          <div class="grid grid-cols-3">
            <div>Device: {last ? last.device.name : "N/A"}</div>
            <div>Channel: {last ? last.data.channel : "N/A"}</div>
            <div>
              Direction: {last ? ( last.data.direction == 'REPORT' ? "RX🡐" : "TX🡒" ) : "N/A"}
            </div>
          </div>
          <div class="grid grid-cols-2 justify-items-center mt-2">
            <div class="grid grid-rows-2 w-4/5 h-20">
              <div class="flex items-center justify-center transition-colors duration-75 {hover ? "bg-pick" : "bg-white"} rounded-t-xl text-primary">
                  {last ? last.data.params.p1.name : "N/A"}
              </div>
              <div class="flex items-center justify-center border transition-colors duration-75 {hover ? "border-pick" : "border-white"} text-lime-50 rounded-b-xl">
                {last ? last.data.params.p1.value : "N/A"}
              </div>
            </div>
            <div class="grid grid-rows-2 w-4/5">
              <div class="flex items-center justify-center transition-colors duration-75 {hover ? "bg-pick" : "bg-white"} rounded-t-xl text-primary">
                {last ? last.data.params.p2.name : "N/A"}
              </div>
              <div class="flex items-center justify-center border transition-colors duration-75 {hover ? "border-pick" : "border-white"} text-lime-50 rounded-b-xl">
                {last ? last.data.params.p2.value : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- MIDI History and Debug View -->
    <Splitpanes class="flex-1 " horizontal="true" theme="modern-theme" pushOtherPanes={false}>
      <Pane class="flex flex-col bg-primary p-4">
        {#if debug}
          <div class="flex w-full font-medium text-white">MIDI Messages</div>
          <div class="w-full grid grid-cols-6 text-white">
            <div>[X,Y]</div>
            <div>CH</div>
            <div>CMD</div>
            <div>P1</div>
            <div>P2</div>
            <div>DIR</div>
          </div>
          <div class="flex flex-col flex-grow overflow-y-auto bg-secondary">
            {#each $debug_stream as message}
              <div class="w-full grid grid-cols-6 flex items-start justify-start w-full font-mono text-green-300">
                <div>[{message.device.x}, {message.device.y}]</div>
                {#if message.type === "MIDI"}
                  <div>{message.data.channel}</div>
                  <div>{message.data.command.value}</div>
                  <div>{message.data.params.p1.value}</div>
                  <div>{message.data.params.p2.value}</div>
                {:else}
                  <div class="col-span-4">SysEx: {String.fromCharCode.apply(String, message.data.raw).substr(8)}</div>
                {/if}
                <div class="flex items-center">
                  {message.data.direction == "REPORT" ? "RX🡐" : "TX🡒"}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="flex w-full font-medium text-white">
            MIDI Messages
          </div>
          <div id="list" class="flex flex-col flex-grow  bg-secondary overflow-y-auto overflow-x-hidden" bind:this={midiList}>
            {#each $midi_monitor_store as midi, i (midi.id)}
              <!-- svelte-ignore a11y-mouse-events-have-key-events -->
              <div on:mouseover={() => onEnterMidiMessage(this, i)} on:mouseleave={() => onLeaveMidiMessage(this, i)}
                class="text-green-300 transition-transform {hover && i == hoverIndex ? "scale-115" : "scale-100"}" 
                in:fly={{ x: -10, duration: 100 }}>
                  <span class="pr-2 text-white">[{midi.device.name}]</span>
                  <span class="pr-2">(Ch: {midi.data.channel})</span>
                  <span class="pr-2">{midi.data.command.short}</span>
                  <span class="pr-2">{midi.data.params.p1.short}</span>
                  <span class="pr-2">{midi.data.params.p1.value}</span>
                  <span class="pr-2">{midi.data.params.p2.short}</span>
                  <span class="pr-2">{midi.data.params.p2.value}</span>
                  <span class="pr-2">{midi.data.direction == 'REPORT' ? "RX🡐" : "TX🡒"}</span>
                </div>
            {/each}
          </div>
        {/if}
      </Pane>
      <Pane class="flex flex-col bg-primary p-4">
        {#if debug}
        <div class="flex w-full font-medium text-white">
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
          <div class="flex w-full font-medium text-white">
            SysEx Messages
          </div>
          <div class="flex flex-col flex-grow overflow-y-auto bg-secondary">
            {#each $sysex_monitor_store as sysex}
              <div class="{sysex.data.direction == 'REPORT' ? 'text-blue-400' : 'text-commit'} font-mono">
                <div class="block">
                    <span>SysEx: {String.fromCharCode.apply(String, sysex.data.raw).substr(8)}</span>
                    <span>{sysex.data.direction == 'REPORT' ? "RX🡐" : "TX🡒"}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </Pane>
    </Splitpanes>
    <!-- Clear Button -->
    <div class="flex flex-none h-400">
      <button 
      class="bg-select hover:bg-select-saturate-10 rounded text-white w-full py-1" 
      on:click={onClearClicked}>
        Clear All
      </button>
    </div>
  </div>
</div>