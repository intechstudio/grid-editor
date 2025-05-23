import { writable, type Writable } from "svelte/store";
import { v4 as uuidv4 } from "uuid";
import { GridModule } from "../../../runtime/runtime";

class DeviceInfo {
  public name: string;
  public x: number;
  public y: number;

  constructor(name: string, dx: number, dy: number) {
    this.name = name;
    this.x = dx;
    this.y = dy;
  }
}

type MidiParameter = {
  name: string;
  short: string;
  value: number;
  value_alias?: string;
};

export class MidiMessage {
  public params: { p1: MidiParameter; p2: MidiParameter };
  public channel: number;
  public command: MidiParameter;
  public direction: string;

  constructor(
    channel: number,
    command: number,
    param1: number,
    param2: number,
    direction: string,
  ) {
    this.channel = channel;
    this.command = {
      name: getCommandName(command),
      value: command,
      short: getCommandShortName(command),
    };

    this.params = {
      p1: {
        name: getParameterNames(command).p1.name,
        short: getParameterNames(command).p1.short,
        value: param1,
      },
      p2: {
        name: getParameterNames(command).p2.name,
        short: getParameterNames(command).p2.short,
        value: param2,
      },
    };

    this.direction = direction;
  }
}

class SysExMessage {
  public channel: number;
  public direction: string;
  public raw: any;
  constructor(channel: number, direction: string, raw: any) {
    this.channel = channel;
    this.direction = direction;
    this.raw = raw;
  }
}

//Lookup table for command HEX values and getter functions

function getCommandName(cmd_int) {
  let cmd = getCommand(cmd_int);
  return cmd?.name;
}

function getParameterNames(cmd_int) {
  let cmd = getCommand(cmd_int);
  return cmd?.params;
}

function getCommandShortName(cmd_int) {
  let cmd = getCommand(cmd_int);
  return cmd?.short;
}

const cmdLookup = new Map([
  [
    "8",
    {
      name: "Note-off",
      short: "Note-off",
      params: {
        p1: { name: "Note", short: "Note" },
        p2: { name: "Velocity", short: "Vel." },
      },
    },
  ],
  [
    "9",
    {
      name: "Note-on",
      short: "Note-on",
      params: {
        p1: { name: "Note", short: "Note" },
        p2: { name: "Velocity", short: "Vel." },
      },
    },
  ],
  [
    "A",
    {
      name: "Aftertouch",
      short: "Aftertouch",
      params: {
        p1: { name: "Note", short: "Note" },
        p2: { name: "Touch", short: "Touch" },
      },
    },
  ],
  [
    "B",
    {
      name: "Continous Control",
      short: "CC",
      params: {
        p1: { name: "Controller Number", short: "Ctrl." },
        p2: { name: "Value", short: "Value" },
      },
    },
  ],
  [
    "C",
    {
      name: "Patch Change",
      short: "Patch",
      params: {
        p1: { name: "Instrument Number", short: "Inst." },
        p2: { name: "N/A", short: "N/A" },
      },
    },
  ],
  [
    "D",
    {
      name: "Channel Pressure",
      short: "Ch. Pressure",
      params: {
        p1: { name: "Pressure", short: "Pressure" },
        p2: { name: "N/A", short: "N/A" },
      },
    },
  ],
  [
    "E",
    {
      name: "Pitch Bend",
      short: "Pitch Bend",
      params: {
        p1: { name: "LSB", short: "LSB" },
        p2: { name: "MSB", short: "MSB" },
      },
    },
  ],
]);

//Musical Notes
export class MusicalNotes {
  static musNotes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  static FromInt(value: number) {
    return this.musNotes[Math.floor(value % 12)] + (Math.floor(value / 12) - 2);
  }
}

//Retrieves an object with all the user friendly naming
function getCommand(value: number) {
  try {
    if (!Number.isInteger(value)) throw value + " is not an integer.";

    let hex = value.toString(16);
    let cmd = cmdLookup.get(hex[0].toUpperCase());

    if (cmd === undefined) throw "Unknown Command (" + value + ")";

    return cmd;
  } catch (e) {
    console.warn("MIDI message parsing error: " + e);
    return {
      name: "Unknown",
      short: value.toString(),
      params: {
        p1: { name: "P1", short: "P1" },
        p2: { name: "P2", short: "P2" },
      },
    };
  }
}

export type MidiMonitorItem = {
  id: any;
  date: number;
  type: string;
  data: MidiMessage;
  device: DeviceInfo;
};

function createMidiMonitor(max_length) {
  const store: Writable<MidiMonitorItem[]> = writable([]);
  return {
    ...store,
    update_midi: (descr: any, device: GridModule) => {
      if (descr.class_name !== "MIDI") return;

      store.update((s) => {
        //Shift store length if max length is reached
        if (s.length >= max_length) {
          s.shift();
        }

        let bc = descr.brc_parameters;
        let cp = descr.class_parameters;

        //Make full MIDI message from raw data (param names, command name, etc.)
        let item = {
          id: uuidv4(),
          date: Date.now(),
          type: "MIDI",
          data: new MidiMessage(
            cp.CHANNEL,
            cp.COMMAND,
            cp.PARAM1,
            cp.PARAM2,
            descr.class_instr,
          ),
          device: new DeviceInfo(device?.type ?? "RX", bc.SX, bc.SY),
        };
        return [...s, item];
      });
    },
  };
}

export type SysExMonitorItem = {
  id: any;
  date: number;
  type: string;
  data: SysExMessage;
  device: DeviceInfo;
};

function createSysExMonitor(max_val) {
  const store: Writable<SysExMonitorItem[]> = writable([]);
  return {
    ...store,
    update_sysex: (descr: any, device: GridModule) => {
      if (descr.class_name !== "MIDISYSEX") return;

      store.update((s) => {
        if (s.length >= max_val) {
          s.shift();
        }

        let bc = descr.brc_parameters;
        let cp = descr.class_parameters;

        let item = {
          id: uuidv4(),
          date: Date.now(),
          type: "SYSEX",
          data: new SysExMessage(cp.CHANNEL, descr.class_instr, descr.raw),
          device: new DeviceInfo(device?.type ?? "RX", bc.SX, bc.SY),
        };

        return [...s, item];
      });
    },
  };
}

export const maxMidi = 128;
export const midi_monitor_store = createMidiMonitor(maxMidi);
export const sysex_monitor_store = createSysExMonitor(maxMidi);
