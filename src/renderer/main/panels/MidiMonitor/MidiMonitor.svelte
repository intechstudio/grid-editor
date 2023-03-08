<script>
  import { fade } from "svelte/transition";
  import { midi_monitor_store, sysex_monitor_store } from "./MidiMonitor.store";
  import Toggle from "../../user-interface/Toggle.svelte";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { get, writable } from 'svelte/store';
  import { debug_monitor_store } from "../DebugMonitor/DebugMonitor.store";
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
  class="flex bg-primary justify-start relative w-full h-full flex-col text-white gap-2 p-4 overflow-auto">
  <div class="text-white font-large">MIDI Monitor</div>
  <div class="flex grid grid-cols-2 content-between my-2">
    <div class="text-white font-medium">History</div>
    <div class="justify-self-end flex items-center">
      <span class="text-white font-medium mr-2">Debug View</span>
      <Toggle bind:toggleValue={debug}/>
    </div>
  </div>

  {#if debug}
    <div class="font-mono">
        <div class="w-full grid grid-cols-6">
          <div>[X,Y]</div>
          <div>CH</div>
          <div>CMD</div>
          <div>P1</div>
          <div>P2</div>
          <div>DIR</div>
        </div>
    </div>
    <!-- <div class="flex grid grid-rows-2 w-full h-full"> -->
      <div class="flex flex-col w-full">
        {#each $stream as midi}
          {#if midi.class_name === "MIDI"}
            <div class="{midi.class_instr == 'REPORT' ? 'text-blue-400' : 'text-green-400'} 
              flex items-start justify-start w-full font-mono ">
              <div class="w-full grid grid-cols-6">
                <div>[{midi.brc_parameters.SX},{midi.brc_parameters.SY}]</div>
                <div>{midi.class_parameters.CHANNEL}</div>
                <div>{midi.class_parameters.COMMAND}</div>
                <div>{midi.class_parameters.PARAM1}</div>
                <div>{midi.class_parameters.PARAM2}</div>
                <div class="flex items-center">
                  {midi.class_instr == "REPORT" ? "RX🡐" : "TX🡒"}
                </div>
              </div>
            </div>
          {:else}
            <div class="{midi.class_instr == 'REPORT' ? 'text-blue-400' : 'text-green-400'} 
              flex items-center justify-between w-full font-mono">
              <div class="w-full grid grid-cols-6 ">
                <div>[{midi.brc_parameters.SX},{midi.brc_parameters.SY}]</div>
                <div>SysEx:{String.fromCharCode.apply(String, midi.raw).substr(8)}</div>
                <div class="flex items-center">{midi.class_instr == "REPORT" ? "RX🡐" : "TX🡒"}</div>
              </div>
            </div>
          {/if}
        {/each}
      </div>
      {#if $debug_monitor_store.length != 0}
        <div class="text-white">Debug Text:</div>
        <div
          class="flex flex-col font-mono overflow-y-auto text-white bg-secondary m-1 min-h-[200px]"
        >
          {#each $debug_monitor_store as debug, i}
            <span class="debugtexty px-1 py-0.5 ">{debug}</span>
          {/each}
        </div>
      {/if}
      
    <!-- </div> -->
  {:else}
  <Splitpanes horizontal="true" theme="modern-theme" pushOtherPanes={true} class="w-full h-full">
    <Pane class="flex flex-col w-full">
      <div class="flex flex-col h-full w-full overflow-hidden overflow-y-scroll">
        {#each $midi_monitor_store as midi, i}
          <div>
            <div class="{midi.class_instr == 'REPORT' ? 'text-blue-400' : 'text-green-400'} 
              flex items-start justify-start w-full font-mono ">
              <!-- svelte-ignore a11y-mouse-events-have-key-events -->
              <div class="flex w-full hover:shadow-sm hover:shadow-white" 
                on:mouseover={() => onEnterMidiMessage(this, i)}
                on:mouseleave={() => onLeaveMidiMessage(this, i)}
                >
                <div>{midi.class_parameters.DEVICE_NAME} |</div>
                <div>(Ch: {midi.class_parameters.CHANNEL}) |</div>
                <div>{midi.class_parameters.COMMAND_NAME} |</div>
                <div>{midi.class_instr == 'REPORT' ? "RX🡐" : "TX🡒"}</div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </Pane>
    <Pane>
      <div>SysEx</div>
      <div class="flex flex-col h-full w-full overflow-hidden overflow-y-scroll">
        {#each $sysex_monitor_store as sysex}
          <div>
            <div class="{sysex.class_instr == 'REPORT' ? 'text-blue-400' : 'text-green-400'} 
              flex items-start justify-start w-full font-mono ">
              <!-- svelte-ignore a11y-mouse-events-have-key-events -->
              <div class="flex w-full">
                <div>{String.fromCharCode.apply(String, sysex.raw).substr(8)}</div>
                <div>{sysex.class_instr == 'REPORT' ? "RX🡐" : "TX🡒"}</div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </Pane>
    <Pane>
      <div>
        <div>{containerText}</div>
        <div>Command: {midiMessage.command}</div>
        <div class="grid grid-cols-3">
          <div>Device: {midiMessage.device}</div>
          <div>Channel: {midiMessage.channel}</div>
          <div>
            Direction: {midiMessage.direction}
          </div>
        </div>
        <div class="grid grid-cols-2">
          <div class="grid grid-rows-2 content-center m-2">
            <div class="bg-lime-50 rounded-t text-primary text-center">
                {midiMessage.p1_name}
            </div>
            <div class="border border-lime-50 text-lime-50 rounded-b text-center">
              {midiMessage.p1_value}
            </div>
          </div>
          <div class="grid grid-rows-2 content-center m-2">
            <div class="bg-lime-50 rounded-t text-primary text-center">
              {midiMessage.p2_name}
            </div>
            <div class="border border-lime-50 text-lime-50 rounded-b text-center">
              {midiMessage.p2_value}
            </div>
          </div>
        </div>
      </div>
    </Pane>
  </Splitpanes>
  {/if}
</div>