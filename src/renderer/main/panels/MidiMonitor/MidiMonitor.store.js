import { writable, get } from 'svelte/store';
import { runtime, user_input } from "../../../runtime/runtime.store";

const cmdLookup = new Map([
  ["8", "Note-off"],  ["9", "Note-on"],          ["A", "Aftertouch"], ["B", "Continous CTRL"], 
  ["C", "Patch CNG"], ["D", "Channel Pressure"], ["E", "Pitch Bend"], ["F", "NMC"]
]);

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function test() {
  console.log("yay");
}

function fillUserFriendlyValues(midi_msg){
  let hex = midi_msg.class_parameters.COMMAND.toString(16);
  let command = cmdLookup.get(hex[0].toUpperCase());
  let channel = parseInt(hex[1], 10);

  midi_msg.class_parameters.COMMAND_NAME = command;

  const rt = get(runtime);
  const currentModule = rt.find(
    (device) => device.dx == midi_msg.brc_parameters.SX && device.dy == midi_msg.brc_parameters.SY
  );

  midi_msg.class_parameters.DEVICE_NAME = currentModule.id.slice(0,4);

  switch(command){
    case "Note-on":
      midi_msg.class_parameters.PARAM1_VALUE = notes[Math.floor(midi_msg.PARAM1 % 12)];
  }
}

function createMidiMonitor(){

  const store = writable([]);

  return {
    ...store,
    update_midi: (descr) => {

      store.update(s => {
        if(s.length >= 30){
          s.shift()
        };

        s = [...s, descr];

        //Map user friendly values
        s.forEach( e => {
          e.class_parameters.COMMAND_NAME = undefined;
          e.class_parameters.DEVICE_NAME = undefined;
          e.class_parameters.PARAM1_VALUE = undefined;
          e.class_parameters.PARAM2_VALUE = undefined;
          
          fillUserFriendlyValues(e);
        });
        return s;
      })
    }
  }
}

export const midi_monitor_store = createMidiMonitor();


