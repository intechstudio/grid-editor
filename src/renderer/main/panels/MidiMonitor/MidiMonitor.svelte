<script>
  import { fade } from "svelte/transition";
  import { midi_monitor_store, sysex_monitor_store } from "./MidiMonitor.store";
  import Toggle from "../../user-interface/Toggle.svelte";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { get, writable } from 'svelte/store';
  import { debug_monitor_store } from "../DebugMonitor/DebugMonitor.store";

  function handleMessage(e){
    e.detail.forEach(element => {
      console.log(Math.floor(element.size));
    });
  }

  // ok but slow nice

  //Defines
  var containerText;
  var debug;
  const stream = writable([]);
  var midiMessage;

  class MIDIMessage {
    constructor(device, channel, command, p1_name, p1_value, p2_name, p2_value, direction) {
      this.device = device;
      this.channel = channel;
      this.command = command;
      this.p1_name = p1_name;
      this.p1_value = p1_value;
      this.p2_name = p2_name;
      this.p2_value = p2_value;
      this.direction = direction;
    }

    static fromMIDI(midi){
      let cp = midi.class_parameters;
      let direction = midi.class_instr == "REPORT" ? "RX🡐" : "TX🡒";
      return new MIDIMessage(
        cp.DEVICE_NAME,
        cp.CHANNEL,
        cp.COMMAND_NAME,
        cp.PARAM1_NAME,
        cp.PARAM1_VALUE,
        cp.PARAM2_NAME,
        cp.PARAM2_VALUE,
        direction
      );
    }
  }

  //Init Values
  debug = false;
  containerText = "Last Message";
  midiMessage = new MIDIMessage(...Array(MIDIMessage.length).fill("N/A"));

  midi_monitor_store.subscribe(() => {
    let mms = get(midi_monitor_store);
    if(mms.length > 0){
      let last = mms.slice(-1)[0];
      midiMessage = MIDIMessage.fromMIDI(mms.slice(-1)[0]);
      addToStream(last);
    }
  });

  sysex_monitor_store.subscribe(() => {
    let sms = get(sysex_monitor_store);
    if(sms.length > 0){
      let last = sms.slice(-1)[0];
      addToStream(last);
    }
  });

  function addToStream(msg){
    stream.update(items => {
      if (items.length >= 32) {
       items.shift();
      }
      return [...items, msg];
    });
  }

  function onLeaveMidiMessage(item, index){
    containerText = "Last Command";
    let mms = get(midi_monitor_store);
    let last = mms.slice(-1)[0];
    midiMessage = MIDIMessage.fromMIDI(last);
  }

  function onEnterMidiMessage(item, index){
    containerText = "Selected Command";
    let ms = get(midi_monitor_store);
    let selected = ms[index];
    midiMessage = MIDIMessage.fromMIDI(selected);
  }
</script>

<div transition:fade={{ duration: 150 }}
  class="bg-primary flex flex-col h-full">
  <div class="flex flex-col">
    <!-- Panel Header Text -->
    <div class="text-white font-large text-2xl bg-pick pl-4 font-medium">MIDI Monitor</div>
    <!-- Last MIDI Message -->
    <div class="px-4 text-white">
      <div class="text-xl">
        <div>Command: {midiMessage.command}</div>
        <div class="grid grid-cols-3">
          <div>Device: {midiMessage.device}</div>
          <div>Channel: {midiMessage.channel}</div>
          <div>
            Direction: {midiMessage.direction}
          </div>
        </div>
        <div class="flex grid grid-cols-2 justify-items-center mt-2">
          <div class="grid grid-rows-2 w-4/5 h-20">
            <div class="flex items-center justify-center bg-lime-50 rounded-t-xl text-primary">
                {midiMessage.p1_name}
            </div>
            <div class="flex items-center justify-center border border-lime-50 text-lime-50 rounded-b-xl">
              {midiMessage.p1_value}
            </div>
          </div>
          <div class="grid grid-rows-2 w-4/5">
            <div class="flex items-center justify-center bg-lime-50 rounded-t-xl text-primary">
              {midiMessage.p2_name}
            </div>
            <div class="flex items-center justify-center border border-lime-50 text-lime-50 rounded-b-xl">
              {midiMessage.p2_value}
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- History Header -->
    <div class="flex text-white font-large bg-pick pl-4 justify-between">
      <div class="text-white text-2xl font-medium">History</div>
      <div class="flex items-center">
        <span class="text-white font-medium mr-2">Debug View</span>
        <Toggle bind:toggleValue={debug}/>
      </div>
    </div>
    <!-- MIDI History and Debug View -->
  </div>

  <div class="flex-grow overflow-hidden">
    <Splitpanes horizontal="true" theme="modern-theme" pushOtherPanes={false} class="h-full">
      <Pane minSize={20} maxSize={80} class="flex flex-col bg-primary p-4">
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
            {#each $stream as midi}
              <div class="w-full grid grid-cols-6 {midi.class_instr == 'REPORT' ? 'text-blue-400' : 'text-green-400'} 
              flex items-start justify-start w-full font-mono ">
                {#if midi.class_name === "MIDI"}
                  <div>[{midi.brc_parameters.SX},{midi.brc_parameters.SY}]</div>
                  <div>{midi.class_parameters.CHANNEL}</div>
                  <div>{midi.class_parameters.COMMAND}</div>
                  <div>{midi.class_parameters.PARAM1}</div>
                  <div>{midi.class_parameters.PARAM2}</div>
                  <div class="flex items-center">
                    {midi.class_instr == "REPORT" ? "RX🡐" : "TX🡒"}
                  </div>
                {:else}
                  <div>[{midi.brc_parameters.SX},{midi.brc_parameters.SY}]</div>
                  <div class="col-span-4">SysEx: {String.fromCharCode.apply(String, midi.raw).substr(8)}</div>
                  <div class="flex items-center">{midi.class_instr == "REPORT" ? "RX🡐" : "TX🡒"}</div>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <div class="flex w-full font-medium text-white">
            MIDI Messages
          </div>
          <div class="flex flex-col flex-grow  bg-secondary overflow-y-auto">
            {#each $midi_monitor_store as midi, i}
              <!-- svelte-ignore a11y-mouse-events-have-key-events -->
              <div class="{midi.class_instr == 'REPORT' ? 'text-blue-400' : 'text-commit'} 
                flex w-full font-mono"
                on:mouseover={() => onEnterMidiMessage(this, i)}
                on:mouseleave={() => onLeaveMidiMessage(this, i)}
                >
                <span class="pr-4">{midi.class_parameters.DEVICE_NAME}</span>
                <span class="pr-4">(Ch: {midi.class_parameters.CHANNEL})</span>
                <span class="pr-4">{midi.class_parameters.COMMAND_NAME}</span>
                <span class="pr-4">{midi.class_instr == 'REPORT' ? "RX🡐" : "TX🡒"}</span>
              </div>
            {/each}
          </div>
        {/if}
      </Pane>
      <Pane size={40} minSize={20} maxSize={80} class="flex flex-col bg-primary p-4">
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
              <div class="{sysex.class_instr == 'REPORT' ? 'text-blue-400' : 'text-commit'} font-mono">
                <div class="block">
                    <span>SysEx: {String.fromCharCode.apply(String, sysex.raw).substr(8)}</span>
                    <span>{sysex.class_instr == 'REPORT' ? "RX🡐" : "TX🡒"}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </Pane>
    </Splitpanes>
  </div>
</div>