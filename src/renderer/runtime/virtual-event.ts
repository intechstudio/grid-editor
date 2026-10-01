import type { Subscriber, Unsubscriber } from "svelte/store";
import {
  ActionData,
  EventData,
  GridAction,
  GridElement,
  GridEvent,
  GridOperationType,
} from "./runtime";

// SPIKE — not wired into any UI yet. Validates that a top-level `fst`/`fen`
// ("Function") block pair on an event can be presented as its own GridEvent
// to the existing ActionList/operations.ts machinery, with zero changes to
// either.
//
// Concept: a "virtual event" is just the existing Function block
// (config-blocks/Function_Start.svelte, composite_open/close `fst`/`fen`)
// sitting at indentation 0 in a real event's config. Dragging one in today
// already produces exactly this shape via the normal add-action flow
// (ActionPicker -> compositeLua). This file adds nothing new to the model —
// it only detects that shape and wraps it so it can be driven like any other
// GridEvent.

// Matches Function_Start.svelte's own defaultLua convention
// ("YourFunction = function()"), not system-midi-channel.ts's internal
// "name = function(self)" convention — these are two different features.
// `editName: false` on the fst block lets the user freely edit this whole
// line, including adding parameters (e.g. "OnPress = function(value)") and
// dotted table-field paths (e.g. "self.foo = function(self, bar)"), so both
// are intentionally unconstrained here — everything before "=" is captured
// as the name verbatim.
const NAME_REGEX =
  /^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*=\s*function\s*\([^)]*\)/;

export type VirtualEventDescriptor = {
  name: string;
  fstAction: GridAction;
};

// Depth-walks composite_open/composite_close from openIndex to find the fen
// that actually closes it, so a function body containing its own nested
// composites (if/endif, loops, ...) doesn't confuse the boundary. Mirrors
// the stack walk ActionList.svelte's handleSelectionChange already does.
// Takes a plain action array (rather than a GridEvent) so it also works on
// GridAction.parse() output — e.g. `stored`'s last-known-on-device text —
// whose actions aren't wired to any parent GridEvent.
function findMatchingClose(
  actions: GridAction[],
  openIndex: number,
): number | undefined {
  let depth = 0;
  for (let i = openIndex; i < actions.length; ++i) {
    const type = actions[i].information.type;
    if (type === "composite_open") {
      ++depth;
    } else if (type === "composite_close") {
      --depth;
      if (depth === 0) {
        return i;
      }
    }
  }
  return undefined;
}

// Scans a real event (e.g. the SETUP event) for top-level named Function
// blocks. Does not recurse into nested composites — only indentation-0 `fst`
// blocks count as virtual events.
export function listVirtualEvents(
  host: GridEvent | undefined,
): VirtualEventDescriptor[] {
  if (!host) {
    return [];
  }

  const result: VirtualEventDescriptor[] = [];
  for (let i = 0; i < host.config.length; ++i) {
    const action = host.config[i];
    if (action.short !== "fst" || action.indentation !== 0) {
      continue;
    }
    const match = action.script.match(NAME_REGEX);
    if (!match) {
      continue; // not a named registration we recognize — leave as plain code
    }
    if (findMatchingClose(host.config, i) === undefined) {
      continue; // malformed/unterminated — don't surface a broken tab
    }
    result.push({ name: match[1], fstAction: action });
  }
  return result;
}

// Finds a top-level named Function block by name in a flat, parentless
// action array (GridAction.parse() output), the same shape listVirtualEvents
// detects in a live host.config — but depth has to be tracked manually here
// since ActionData.indentation always reads 0 without a parent GridEvent to
// scan. Used to locate this virtual event's last-stored shape within the
// host's `stored` text, for a scoped hasChanges() (see VirtualGridEvent).
function findNamedBlock(
  actions: GridAction[],
  name: string,
): GridAction[] | undefined {
  let depth = 0;
  for (let i = 0; i < actions.length; ++i) {
    const action = actions[i];
    const type = action.information.type;
    if (type === "composite_open") {
      if (depth === 0 && action.short === "fst") {
        const match = action.script.match(NAME_REGEX);
        if (match && match[1] === name) {
          const closeIndex = findMatchingClose(actions, i);
          if (closeIndex !== undefined) {
            return actions.slice(i, closeIndex + 1);
          }
        }
      }
      ++depth;
    } else if (type === "composite_close") {
      --depth;
    }
  }
  return undefined;
}

// Presents the body of a single top-level Function block as a standalone
// GridEvent. All of GridEvent's own methods that read/write through
// `this.data` (toLua/isValid/hasChanges/getAvailableChars/isLoaded/getInfo/
// getName/store/isStored) are overridden here because they bypass the
// `config` getter and would otherwise silently operate on an empty, inert
// backing store instead of the real slice.
// Body actions keep `.parent === host` always (see `insert()` below), so
// GridAction.indentation — computed by scanning `this.parent.config` — comes
// back relative to the WHOLE host event, one level deeper than it should
// read inside this virtual event's own isolated view (the function's own
// `fst` contributes exactly +1, unconditionally, since listVirtualEvents
// only detects top-level functions). Consumers rendering a VirtualGridEvent's
// actions must subtract this when computing display indentation — see
// ActionList.svelte / DynamicWrapper.svelte's `indentationOffset`.
export const INDENTATION_OFFSET = -1;

export class VirtualGridEvent extends GridEvent {
  private readonly host: GridEvent;
  private readonly fstAction: GridAction;

  constructor(host: GridEvent, fstAction: GridAction) {
    super(host.parent as GridElement, new EventData(host.type));
    this.host = host;
    this.fstAction = fstAction;
  }

  // Re-locates the pair by action identity on every access instead of
  // caching indices, since unrelated edits earlier in `host.config` (another
  // virtual event, a top-level action) shift raw array positions.
  //
  // Returns undefined — rather than throwing — once the block is gone (e.g.
  // the virtual event was just removed). The cached proxy instance (see
  // proxyCache below) can still be the live `$event` of a mounted ActionList
  // for one more reactive tick after its own removal, since the host's
  // config update and the parent component unmounting the stale ActionList
  // aren't the same synchronous step. Every accessor below treats an
  // undefined bounds as "no content" so that brief window renders as empty
  // instead of crashing.
  private bounds(): { start: number; end: number } | undefined {
    const openIndex = this.host.config.findIndex(
      (a) => a.id === this.fstAction.id,
    );
    if (openIndex === -1) {
      return undefined;
    }
    const closeIndex = findMatchingClose(this.host.config, openIndex);
    if (closeIndex === undefined) {
      return undefined;
    }
    return { start: openIndex + 1, end: closeIndex };
  }

  get config(): GridAction[] {
    const bounds = this.bounds();
    return bounds ? this.host.config.slice(bounds.start, bounds.end) : [];
  }

  subscribe(
    run: Subscriber<any>,
    invalidate?: (value?: any) => void,
  ): Unsubscriber {
    // Re-emit whenever the host event changes; our "value" is derived, so
    // just re-run with `this` rather than threading EventData through.
    return this.host.subscribe(() => run(this as any), invalidate);
  }

  // Deliberately does NOT reparent inserted actions to `this`. A body
  // action's `.parent` stays the host event always, for every action
  // (pre-existing or freshly inserted) — see INDENTATION_OFFSET below for
  // why: Multi View can render the host's own ActionList and this virtual
  // event's ActionList side by side at the same time, and GridAction.
  // indentation is computed from `this.parent.config` by scanning array
  // position, so the same action cannot simultaneously report two correct
  // depths under two different parents.
  insert(index: number, ...actions: GridAction[]) {
    const bounds = this.bounds();
    if (!bounds) {
      return Promise.reject({
        value: false,
        text: "Insert failed! Virtual event's function block no longer exists.",
        type: GridOperationType.INSERT_ACTIONS,
        info: this.getInfo(),
      });
    }
    return this.host.insert(bounds.start + index, ...actions);
  }

  remove(...actions: GridAction[]) {
    return this.host.remove(...actions);
  }

  push(...actions: GridAction[]) {
    return this.insert(this.config.length, ...actions);
  }

  sendToGrid() {
    return this.host.sendToGrid();
  }

  async load() {
    return this.host.load();
  }

  toLua() {
    return this.config.map((a) => a.toLua()).join("");
  }

  isValid() {
    return this.config.every((a) => a.isValid());
  }

  isLoaded() {
    return this.host.isLoaded();
  }

  hasChanges() {
    // Scoped to just this virtual event's own fst..fen block, not the whole
    // host — editing some other action (or another virtual event) on the
    // same Setup event must not light up this tab's dot. Compares the
    // block's current Lua against its last-stored shape, found by name in
    // the host's `stored` text (the same source GridEvent.hasChanges() uses
    // for the host's own whole-event comparison).
    const current = getVirtualEventBlock(this.host, this.fstAction)
      .map((a) => a.toLua())
      .join("");
    if (!current) {
      // Block no longer exists (e.g. mid-removal) — nothing to flag.
      return false;
    }

    const storedBlock = findNamedBlock(
      GridAction.parse(this.host.stored),
      this.getName(),
    );
    if (!storedBlock) {
      // Never stored under this name: brand new, or renamed since the last
      // store — either way, that's a real change.
      return true;
    }

    return storedBlock.map((a) => a.toLua()).join("") !== current;
  }

  isStored() {
    return this.host.isStored();
  }

  store() {
    this.host.store();
  }

  getAvailableChars() {
    // Shared budget with the rest of the host event — this is the real
    // hardware constraint, there is no separate quota per virtual event.
    return this.host.getAvailableChars();
  }

  getInfo() {
    return this.host.getInfo();
  }

  getName(): string {
    const match = this.fstAction.script.match(NAME_REGEX);
    return match?.[1] ?? this.host.getName();
  }

  // Overrides GridEvent.realEvent (see runtime.ts) to collapse through to
  // the host instead of returning `this`.
  get realEvent(): GridEvent {
    return this.host;
  }
}

// VirtualGridEvent gets a fresh RuntimeNode id (uuidv4) per construction,
// same as every other RuntimeNode. ActionList.svelte keys its whole subtree
// on `$event?.id` ({#key $event?.id}), so handing it a newly-constructed
// instance on every reactive recompute — which real GridEvents never do,
// they're constructed once in GridElement's constructor — would force a
// destroy/remount of the entire action list on every unrelated change
// anywhere in the element tree. Cache by fstAction identity (stable: insert/
// remove splice the config array but never replace existing GridAction
// instances) so callers that recompute on every tick still get the same
// proxy back. A WeakMap self-heals across hardware reloads, where
// GridEvent.load() reparses the whole config into fresh GridAction
// instances: the old fstAction becomes unreachable and is garbage
// collected, the new one gets its own cache entry.
const proxyCache = new WeakMap<GridAction, VirtualGridEvent>();

export function getVirtualEvent(
  host: GridEvent,
  fstAction: GridAction,
): VirtualGridEvent {
  let proxy = proxyCache.get(fstAction);
  if (!proxy) {
    proxy = new VirtualGridEvent(host, fstAction);
    proxyCache.set(fstAction, proxy);
  }
  return proxy;
}

// Returns the full fst..fen block (inclusive) for a virtual event, as actions
// of `host` — i.e. everything removeActions(host, ...) needs to delete the
// whole virtual event, not just its body (VirtualGridEvent.config excludes
// the fst/fen bookends themselves).
export function getVirtualEventBlock(
  host: GridEvent,
  fstAction: GridAction,
): GridAction[] {
  const openIndex = host.config.findIndex((a) => a.id === fstAction.id);
  if (openIndex === -1) {
    return [];
  }
  const closeIndex = findMatchingClose(host.config, openIndex);
  if (closeIndex === undefined) {
    return [];
  }
  return host.config.slice(openIndex, closeIndex + 1);
}

// Creates a new virtual event: inserts an empty named Function block
// (fst + fen) into `host` at `index` (default: end) via the same shape the
// normal "drag in a Function block" flow already produces, then returns it
// wrapped. Caller is responsible for calling operations.ts's addActions (or
// equivalent) so Analytics/selection stay consistent with every other
// insert path — this is a pure construction helper, not an operation.
export function buildVirtualEventBlocks(
  name: string,
  params: string = "",
): {
  fst: GridAction;
  fen: GridAction;
} {
  const fst = new GridAction(
    undefined,
    new ActionData("fst", `${name} = function(${params})`),
  );
  const fen = new GridAction(undefined, new ActionData("fen", "end"));
  return { fst, fen };
}
