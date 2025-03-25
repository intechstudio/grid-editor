import {
  get,
  Subscriber,
  Unsubscriber,
  Updater,
  writable,
  type Writable,
} from "svelte/store";

export type MIDIMessage = {
  ch: number;
  cmd: number;
  p1: number;
  p2: number;
};

export class GridMIDIManager implements Writable<MIDIAccess | undefined> {
  private _internal: Writable<MIDIAccess | undefined> = writable(undefined);

  constructor() {}

  public subscribe(
    run: Subscriber<MIDIAccess | undefined>,
    invalidate?: (value?: MIDIAccess | undefined) => void,
  ): Unsubscriber {
    return this._internal.subscribe(run, invalidate);
  }

  public set(value: MIDIAccess | undefined) {
    this._internal.set(value);
  }

  public update(updater: Updater<MIDIAccess | undefined>) {
    this._internal.update(updater);
  }

  async init(): Promise<MIDIOutput[]> {
    const out: MIDIOutput[] = [];
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      access.outputs.forEach((e) => {
        //e.close();
        out.push(e);
      });

      this.set(access);
      console.log(get(this._internal));

      console.log("Available MIDI Outputs:", out);
      return out;
    } catch (err) {
      console.error("Failed to list MIDI ports:", err);
      return out;
    }
  }

  public async open(id: string) {
    try {
      console.log(this.outputs);
      //console.log("ASD", access);
      //let out: MIDIOutput = access.outputs.get(id);
      //console.log("what", out);
      //await out.open();
    } catch (error) {
      console.error(`Failed to open MIDI output ${id}:`, error);
      return null;
    }
  }

  public closeAll() {
    const access = get(this._internal);
    if (access) {
      access.outputs.forEach((output) => {
        try {
          output.close();
        } catch (err) {
          console.warn("Failed to close MIDI output:", err);
        }
      });
      this._internal.set(undefined);
      console.log("All MIDI ports closed.");
    }
  }

  get outputs() {
    return get(this._internal)?.outputs ?? new Map();
  }

  public sendMessage(out: MIDIOutput, message: MIDIMessage) {
    out.send([message.cmd | message.ch, message.p1, message.p2]);
  }
}
