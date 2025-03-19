import {
  get,
  Subscriber,
  Unsubscriber,
  Updater,
  writable,
  type Writable,
} from "svelte/store";

export type MIDIMessage = {
  cmd: number;
  p1: number;
  p2: number;
};

export class GridMIDIManager implements Writable<MIDIAccess> {
  private _internal: Writable<MIDIAccess> = writable(undefined);

  constructor() {}

  public subscribe(
    run: Subscriber<MIDIAccess>,
    invalidate?: (value?: MIDIAccess) => void
  ): Unsubscriber {
    return this._internal.subscribe(run, invalidate);
  }

  public set(value: MIDIAccess) {
    this._internal.set(value);
  }

  public update(updater: Updater<MIDIAccess>) {
    this._internal.update(updater);
  }

  async init() {
    try {
      // Explicitly destroy previous instance (workaround for Electron caching)
      this._internal.set(undefined);

      const access = await navigator.requestMIDIAccess();
      this._internal.set(access);

      console.log(
        "MIDI Manager initialized:",
        Array.from(access.outputs.values())
      );
    } catch (err) {
      console.error("Failed to get MIDI access:", err);
    }
  }

  get outputs() {
    return get(this._internal).outputs;
  }

  public sendMessage(out: MIDIOutput, message: MIDIMessage) {
    out.send([message.cmd, message.p1, message.p2]);
  }
}
