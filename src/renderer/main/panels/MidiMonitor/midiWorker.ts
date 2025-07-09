/// <reference lib="webworker" />
import {
  MidiData,
  MidiStreamItem,
  MidiType,
  MusicalNotes,
} from "./MidiMonitor.store";

const NRPNCC = [99, 98, 38, 6];

function replaceNRPNMessages(messages: Array<MidiStreamItem>) {
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].type !== MidiType.MIDI) {
      continue;
    }

    const data = messages[i].data as MidiData;

    if (data.params.p1.value !== 99) continue;

    const spliceLength =
      messages[i + 3]?.type === MidiType.MIDI &&
      (messages[i + 3]?.data as MidiData | undefined)?.params.p1.value === 38
        ? 4
        : 3;

    const NRPNMessages = messages.slice(i, i + spliceLength);

    if (
      NRPNMessages.length < spliceLength ||
      !NRPNMessages.every((e) =>
        NRPNCC.includes((e.data as MidiData).params.p1.value),
      )
    ) {
      continue;
    }

    const [m1, m2, m3, m4] = messages.splice(i, spliceLength);
    (m1.data as MidiData).command.name += " (NRPN)";
    (m1.data as MidiData).command.short += " (NPRN)";
    (m1.data as MidiData).params.p1.value =
      ((m1.data as MidiData).params.p2.value << 7) +
      (m2.data as MidiData).params.p2.value;
    (m1.data as MidiData).params.p2.value =
      spliceLength === 4
        ? ((m3.data as MidiData).params.p2.value << 7) +
          (m4.data as MidiData).params.p2.value
        : (m3.data as MidiData).params.p2.value;

    messages.splice(i, 0, m1); // Re-insert modified m1
  }

  return messages;
}

function replaceHighResMidiMessages(messages: Array<MidiStreamItem>) {
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].type !== MidiType.MIDI) {
      continue;
    }

    const HiResMessages = messages.slice(i, i + 2);

    if (
      HiResMessages.length !== 2 ||
      !HiResMessages.every(
        (e) =>
          e.type === MidiType.MIDI &&
          (e.data as MidiData).command.short === "CC",
      )
    ) {
      continue;
    }

    const offset_diff =
      (HiResMessages[0].data as MidiData).params.p1.value -
      (HiResMessages[1].data as MidiData).params.p1.value;
    if (offset_diff !== -32) {
      continue;
    }

    // Extract the two messages from the slice
    const [m1, m2] = messages.splice(i, 2);

    // Get the two halves of the high-resolution value
    const upper_value = (m1.data as MidiData).params.p2.value << 7;
    const lower_value = (m2.data as MidiData).params.p2.value;

    // Update display values
    (m1.data as MidiData).command.name += " (14)";
    (m1.data as MidiData).command.short += " (14)";

    // Set the high-resolution message's value
    (m1.data as MidiData).params.p2.value = upper_value + lower_value;

    // Insert the modified message back into the array
    messages.splice(i, 0, m1);
  }

  return messages;
}

//Assign PARAM1 value aliases e.g.: musical note names to Int values
//If possible: display these values instead of the Int values
function assignP1ValueAlias(obj) {
  let p1 = obj.data.params.p1;

  //Does not have alias yet
  if (typeof p1.value_alias === "undefined") {
    switch (p1.name) {
      case "Note":
        p1.value_alias = MusicalNotes.FromInt(p1.value);
        break;
    }
  }
  return obj;
}

export interface MidiWorkerResponse {
  item: MidiStreamItem;
}

export interface MidiWorkerCommand {
  item: MidiStreamItem;
}

function processMidi(incoming: MidiStreamItem): MidiStreamItem {
  assignP1ValueAlias(incoming);
  return incoming;
}

function process(incoming: MidiStreamItem) {
  switch (incoming.type) {
    case MidiType.MIDI: {
      const processed = processMidi(incoming);
      buffer.push(processed);
      break;
    }
    case MidiType.SYSEX: {
      buffer.push(incoming);
      break;
    }
  }
  if (done) {
    setTimeout(flush, FLUSH_INTERVAL);
    done = false;
  }
}

function flush() {
  buffer = replaceNRPNMessages(buffer);
  buffer = replaceHighResMidiMessages(buffer);
  const next = buffer.shift();

  postMessage({ item: next } as MidiWorkerResponse);

  if (buffer.length > 0) {
    setTimeout(flush, FLUSH_INTERVAL);
  } else {
    done = true;
  }
}

const FLUSH_INTERVAL = 4;
let buffer: MidiStreamItem[] = [];
let done = true;

self.onmessage = (event: MessageEvent<MidiWorkerCommand>) => {
  const { item } = event.data;
  process(structuredClone(item));
};

export {};
