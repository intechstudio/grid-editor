<script>
  import { fade } from "svelte/transition";
  import { midi_monitor_store } from "./MidiMonitor.store";
  import Toggle from "../../user-interface/Toggle.svelte";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { get } from 'svelte/store';
  // ok but slow nice
  let debug = false;
  let containerText = "Last Command";
  let index = 0;
  class MIDIMessageVM {
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
  }

  let lastMIDI = new MIDIMessageVM(...Array(MIDIMessageVM.length).fill("N/A"));

  midi_monitor_store.subscribe(midi => { 
    ++index;
    setLastMessage(midi)
  });

  function setLastMessage(midi){
    if(midi.length > 0){
      let cp = midi.slice(-1)[0].class_parameters;
      let direction = midi.class_instr == "REPORT" ? "RX🡐" : "TX🡒";
      lastMIDI = new MIDIMessageVM(
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

  function onLeave(item, index){
    containerText = "Last Command";
    let ms = get(midi_monitor_store);
    setLastMessage(ms);
  }

  function onEnter(item, index){
    containerText = "Selected Command";
    let ms = get(midi_monitor_store);
    let selected = ms[index];
    let direction = selected.class_instr == "REPORT" ? "RECEIVE" : "TRANSMIT";
    let cp = selected.class_parameters;
      lastMIDI = new MIDIMessageVM(
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

    <div class="flex flex-col w-full">
      {#each $midi_monitor_store as midi}
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
  {:else}
  <Splitpanes horizontal="true" theme="modern-theme" pushOtherPanes={false} class="w-full h-full">
    <Pane class="flex flex-col w-full">
      <div class="flex flex-col h-full w-full overflow-hidden overflow-y-scroll">
        {#each $midi_monitor_store as midi, i}
          <div>
            {#if midi.class_name === "MIDI"}
              <div class="{midi.class_instr == 'REPORT' ? 'text-blue-400' : 'text-green-400'} 
                flex items-start justify-start w-full font-mono ">
                <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                <div class="flex w-full hover:shadow-sm hover:shadow-white" 
                  on:mouseover={() => onEnter(this, i)}
                  on:mouseleave={() => onLeave(this, i)}
                  >
                  <div>{i + index}. {midi.class_parameters.DEVICE_NAME} |</div>
                  <div>(Ch: {midi.class_parameters.CHANNEL}) |</div>
                  <div>{midi.class_parameters.COMMAND_NAME} |</div>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </Pane>
    <Pane minSize={28}>
        <div>{containerText}</div>
        <div>Command: {lastMIDI.command}</div>
        <div class="grid grid-cols-3">
          <div>Device: {lastMIDI.device}</div>
          <div>Channel: {lastMIDI.channel}</div>
          <div>
            Direction: {lastMIDI.direction}
          </div>
        </div>
        <div class="grid grid-cols-2">
          <div class="grid grid-rows-2 content-center m-2">
            <div class="bg-lime-50 rounded-t text-primary text-center">
                {lastMIDI.p1_name}
            </div>
            <div class="border border-lime-50 text-lime-50 rounded-b text-center">
              {lastMIDI.p1_value}
            </div>
          </div>
          <div class="grid grid-rows-2 content-center m-2">
            <div class="bg-lime-50 rounded-t text-primary text-center">
              {lastMIDI.p2_name}
            </div>
            <div class="border border-lime-50 text-lime-50 rounded-b text-center">
              {lastMIDI.p2_value}
            </div>
          </div>
        </div>
      </Pane>
    </Splitpanes>
  {/if}
</div>