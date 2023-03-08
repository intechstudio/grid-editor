import { writable, get } from 'svelte/store';
import { runtime } from "../../../runtime/runtime.store";

//Lookup table for command HEX values
const cmdLookup = new Map([
  ["8", { name: "Note-off",         p1Name: "Note",       p2Name: "Velocity"}],
  ["9", { name: "Note-on",          p1Name: "Note",       p2Name: "Velocity"}],        
  ["A", { name: "Aftertouch",       p1Name: "Note",       p2Name: "Touch"}],
  ["B", { name: "Continous Control",       p1Name: "CTRL No.",   p2Name: "CTRL Val."}],
  ["C", { name: "Patch CNG",        p1Name: "Inst. No.",  p2Name: "N/A"}],
  ["D", { name: "CHN. Press.",      p1Name: "Pressure",   p2Name: "N/A"}],
  ["E", { name: "Pitch Bend",       p1Name: "LSB",        p2Name: "MSB"}]
]);

//Musical notes in order
const musNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

//Retrieves device name from coordinates of the device
function getDeviceName(x, y){
  const rt = get(runtime);
  const currentModule = rt.find( device => device.dx == x && device.dy == y );
  return currentModule.id.slice(0,4);
}

//Retrieves an object with all the user friendly naming
function getCommandNames(int_value){
  if(!Number.isInteger(int_value))
    throw int_value + " is not an integer.";

  let hex = int_value.toString(16);
  return cmdLookup.get(hex[0].toUpperCase());
}

function fillUserFriendlyValues(midi_msg){
  //Defines
  const cp = midi_msg.class_parameters;
  const bp = midi_msg.brc_parameters;

  //Initial Values
  cp.COMMAND_NAME = "Unknown Command";
  cp.DEVICE_NAME = "Unknown Device";
  cp.PARAM1_NAME = "Unknown Parameter";
  cp.PARAM1_VALUE = cp.PARAM1;
  cp.PARAM2_NAME = "Unknown Parameter";
  cp.PARAM2_VALUE = cp.PARAM2;

  try {
    //Get the Device Name from X/Y values
    var device = getDeviceName(bp.SX, bp.SY);
    if(device !== undefined)
      cp.DEVICE_NAME = device;

    //Get command from the lookup table by it's (int) value
    var command = getCommandNames(cp.COMMAND);
    if(command === undefined){
      //Command is not defined
      throw "Command " + cp.COMMAND + " is undefined.";
    }
  }
  catch(e){
    console.log("MIDI parsing error: " + e);
    return;
  }

  //Set user friendly command, and parameter names and values 
  cp.COMMAND_NAME = command.name;
  cp.PARAM1_NAME  = command.p1Name;
  cp.PARAM2_NAME  = command.p2Name;

  //Set default parameter values
  cp.PARAM1_VALUE = cp.PARAM1;
  cp.PARAM2_VALUE = cp.PARAM2;

  //Override default values with command specific values
  switch(command.name){
    case "Aftertouch":
    case "Note-off":
    case "Note-on": 
      cp.PARAM1_VALUE = musNotes[Math.floor(cp.PARAM1 % 12)] + Math.floor(cp.PARAM1 / 12);
      break;
  }
}

function createMidiMonitor(max_val){

  const store = writable([]);

  return {
    ...store,
    update_midi: (descr) => {
      if(descr.class_name !== "MIDI")
        return;

      store.update(s => {
        if(s.length >= max_val){
          s.shift()
        };

        s = [...s, descr];

        //Map user friendly values
        s.forEach( e => fillUserFriendlyValues(e));
        return s;
      })
    }
  }
}

function createSysExMonitor(max_val){
  const store = writable([]);
  return {
    ...store,
    update_sysex: (descr) => {
      if(descr.class_name !== "MIDISYSEX")
        return;

      store.update(s => {
        if(s.length >= max_val){
          s.shift()
        };

        s = [...s, descr];
        return s;
      })
    }
  }
}

export const midi_monitor_store = createMidiMonitor(32);
export const sysex_monitor_store = createSysExMonitor(32);


