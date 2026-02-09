import { writable, type Writable } from "svelte/store";
import { v4 as uuidv4 } from "uuid";
import { GridModule } from "../../../runtime/runtime";
import {
  MidiData,
  SysExData,
  MidiType,
  MusicalNotes,
  getCommandName,
  getParameterNames,
  getCommand,
  type MidiStreamItem,
} from "./midi-types";

// Re-export types so existing consumers don't need to change their imports
export {
  MidiData,
  SysExData,
  MidiType,
  MusicalNotes,
  getCommandName,
  getParameterNames,
  getCommand,
  type MidiStreamItem,
};

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
