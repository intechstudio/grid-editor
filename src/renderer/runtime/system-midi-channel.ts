import { derived, readable, type Readable } from "svelte/store";
import { EventType, EventTypeToNumber } from "@intechstudio/grid-protocol";
import { ActionData, GridAction, GridEvent, GridPage } from "./runtime";

// Single source of truth for the per-page "module MIDI channel" feature.
//
// The channel is NOT cached anywhere — it lives entirely in config, as a Lua
// block on that page's system element (elementIndex 255) SETUP event:
//   midi_auto_ch = function(self) return <0..15> end
// so Clear/Discard/profile-load reset it for free (they rewrite the config),
// and any edit to the system element re-derives the value.

const SYSTEM_ELEMENT_INDEX = 255;

// fst script in both humanized (spaces) and shortified (from hardware) forms.
const FST_SCRIPTS = [
  "midi_auto_ch = function(self)",
  "midi_auto_ch=function(self)",
];
const CB_REGEX = /^return (\d+)$/;

export type ModuleMidiChannelState =
  | { kind: "auto" } // no block present
  | { kind: "custom" } // block present but hand-written (not a plain return)
  | { kind: "channel"; value: number }; // 0-based channel

function systemSetup(page: GridPage | undefined): GridEvent | undefined {
  return page
    ?.findElement(SYSTEM_ELEMENT_INDEX)
    ?.findEvent(EventTypeToNumber(EventType.SETUP));
}

function parseState(setup: GridEvent | undefined): ModuleMidiChannelState {
  if (!setup) {
    return { kind: "auto" };
  }

  const config = setup.config;
  const fstIndex = config.findIndex(
    (a) => a.short === "fst" && FST_SCRIPTS.includes(a.script),
  );
  if (fstIndex === -1) {
    return { kind: "auto" };
  }

  const fenIndex = config.findIndex(
    (a, i) => i > fstIndex && a.short === "fen",
  );
  const endIndex = fenIndex !== -1 ? fenIndex : config.length;
  const cb = config.find(
    (a, i) =>
      i > fstIndex &&
      i < endIndex &&
      a.short === "cb" &&
      CB_REGEX.test(a.script),
  );
  const match = cb?.script.match(CB_REGEX);
  const ch = match ? Number(match[1]) : NaN;
  return Number.isInteger(ch) && ch >= 0 && ch <= 15
    ? { kind: "channel", value: ch }
    : { kind: "custom" };
}

// --- reads (config is authoritative) ---

// Full display state for a page's channel. Pure snapshot.
export function readModuleMidiChannelState(
  page: GridPage | undefined,
): ModuleMidiChannelState {
  return parseState(systemSetup(page));
}

// 0-based channel if a plain in-range block is set, else null (caller falls
// back to its default). Used by Grid.Auto.getMidi.
export function readModuleMidiChannel(
  page: GridPage | undefined,
): number | null {
  const state = parseState(systemSetup(page));
  return state.kind === "channel" ? state.value : null;
}

// Reactive, config-derived view of a page's channel. Derives from the system
// element's SETUP event store, which re-emits on every config change including
// Clear/Discard (they mutate the event inside a batch that suppresses parent
// notifications, so the event store — not the element store — is what fires).
export function moduleMidiChannelState(
  page: GridPage | undefined,
): Readable<ModuleMidiChannelState> {
  const setup = systemSetup(page);
  if (!setup) {
    return readable<ModuleMidiChannelState>({ kind: "auto" });
  }
  return derived(setup, () => parseState(setup));
}

// --- write (single serialize site) ---

// value: 0-based channel to set, or null to clear (Auto). Mutates config and
// pushes to the grid.
export async function writeModuleMidiChannel(
  page: GridPage | undefined,
  value: number | null,
): Promise<void> {
  const setup = systemSetup(page);
  if (!setup) {
    return;
  }

  const fstIndex = setup.config.findIndex(
    (a) => a.short === "fst" && FST_SCRIPTS.includes(a.script),
  );

  // Auto — remove the whole fst..fen block.
  if (value === null) {
    if (fstIndex === -1) {
      return;
    }
    const fenIndex = setup.config.findIndex(
      (a, i) => i > fstIndex && a.short === "fen",
    );
    const endIndex = fenIndex !== -1 ? fenIndex + 1 : fstIndex + 1;
    // Snapshot before mutating; remove one by one to avoid partial rejections.
    const toRemove = [...setup.config.slice(fstIndex, endIndex)];
    for (const action of toRemove) {
      if (setup.config.includes(action)) {
        await setup.remove(action).catch(console.error);
      }
    }
    await setup.sendToGrid();
    return;
  }

  const cbScript = `return ${value}`;

  if (fstIndex === -1) {
    // No block — insert fst / cb / fen at the top.
    const fst = new GridAction(setup, new ActionData("fst", FST_SCRIPTS[0]));
    const cb = new GridAction(setup, new ActionData("cb", cbScript));
    const fen = new GridAction(setup, new ActionData("fen", "end"));
    await setup.insert(0, fst, cb, fen).catch(console.error);
    await setup.sendToGrid();
    return;
  }

  // Block exists — overwrite its first cb (even a hand-written `return 10 + 1`)
  // so we replace rather than stack a second cb; insert one if there is none.
  const fenIndex = setup.config.findIndex(
    (a, i) => i > fstIndex && a.short === "fen",
  );
  const endIndex = fenIndex !== -1 ? fenIndex : setup.config.length;
  const cbIndex = setup.config.findIndex(
    (a, i) => i > fstIndex && i < endIndex && a.short === "cb",
  );
  if (cbIndex !== -1) {
    const cbAction = setup.config[cbIndex];
    await cbAction
      .updateData(new ActionData("cb", cbScript, cbAction.name))
      .catch(console.error);
  } else {
    const cb = new GridAction(setup, new ActionData("cb", cbScript));
    await setup.insert(fstIndex + 1, cb).catch(console.error);
  }
  await setup.sendToGrid();
}
