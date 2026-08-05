/**
 * Pure data types for MIDI monitoring.
 *
 * Extracted from MidiMonitor.store.ts so that midiWorker.ts can import
 * these types without pulling in the full application dependency graph
 * (which includes .svelte files that the vite:worker-import-meta-url
 * plugin cannot parse).
 */

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

export function getCommandName(cmd_int) {
  let cmd = getCommand(cmd_int);
  return cmd?.name;
}

export function getParameterNames(cmd_int) {
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
      name: "Note Off",
      short: "Note Off",
      params: {
        p1: { name: "Note", short: "Note" },
        p2: { name: "Velocity", short: "Velo." },
      },
    },
  ],
  [
    "9",
    {
      name: "Note On",
      short: "Note On",
      params: {
        p1: { name: "Note", short: "Note" },
        p2: { name: "Velocity", short: "Velo." },
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
      name: "Control Change",
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
      name: "Program Change",
      short: "PC",
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
  [
    "F",
    {
      name: "System Exclusive",
      short: "System",
      params: {
        p1: { name: "Manufacturer's ID", short: "Mfr." },
        p2: { name: "Model ID", short: "MID" },
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
export function getCommand(value: number) {
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
  SYSEX,
  MIDI,
}

export interface MidiStreamItem {
  id: any;
  packetId: number;
  date: number;
  type: MidiType;
  data: MidiData | SysExData;
  device: { name: string; x: number; y: number };
}
