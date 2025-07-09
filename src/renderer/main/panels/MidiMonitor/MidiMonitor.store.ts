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

export class MidiData {
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

export class SysExData {
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

export enum MidiType {
  "SYSEX",
  "MIDI",
}

export interface MidiStreamItem {
  id: any;
  packetId: number;
  date: number;
  type: MidiType;
  data: MidiData | SysExData;
  device: DeviceInfo;
}

export interface MidiStreamData {
  buffer: Array<MidiStreamItem>;
  last: MidiStreamItem | undefined;
}

function createMidiStream(max_length: number) {
  const defaultValue = { buffer: [], last: undefined };
  const store: Writable<MidiStreamData> = writable(defaultValue);
  return {
    ...store,
    update: (descr: any, device: GridModule) => {
      let incoming: MidiStreamItem;
      switch (descr.class_name) {
        case "MIDI": {
          let bc = descr.brc_parameters;
          let cp = descr.class_parameters;

          incoming = {
            id: uuidv4(),
            packetId: descr.brc_parameters.ID,
            date: Date.now(),
            type: MidiType.MIDI,
            data: new MidiData(
              cp.CHANNEL,
              cp.COMMAND,
              cp.PARAM1,
              cp.PARAM2,
              descr.class_instr,
            ),
            device: new DeviceInfo(device?.type ?? "RX", bc.SX, bc.SY),
          };

          break;
        }
        case "MIDISYSEX": {
          let bc = descr.brc_parameters;
          let cp = descr.class_parameters;

          incoming = {
            id: uuidv4(),
            packetId: descr.brc_parameters.ID,
            date: Date.now(),
            type: MidiType.SYSEX,
            data: new SysExData(cp.CHANNEL, descr.class_instr, descr.raw),
            device: new DeviceInfo(device?.type ?? "RX", bc.SX, bc.SY),
          };

          break;
        }
        default: {
          throw `Invalid incoming descriptor type: ${descr.class_name}`;
        }
      }
      store.update((s) => {
        if (s.buffer.length >= max_length) {
          s.buffer.shift();
        }
        return { buffer: [...s.buffer, incoming], last: incoming };
      });
    },
    clear: () => {
      store.set(defaultValue);
    },
  };
}

export const maxMessageCount = 256;
export const midi_stream = createMidiStream(maxMessageCount);
