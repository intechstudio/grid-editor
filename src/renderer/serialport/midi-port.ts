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
    this.closeAll();
    const out: MIDIOutput[] = [];
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      access.outputs.forEach((e) => {
        out.push(e);
      });

      this.set(access);
      return out;
    } catch (err) {
      console.warn("Failed to list MIDI ports:", err);
      return out;
    }
  }

  public async open(id: string) {
    try {
      let out: MIDIOutput[] = await this.init();
      const port = out.find((e) => e.id === id);
      await port.open();
      console.log(id, "MIDI port is open");
      return true;
    } catch (error) {
      console.warn(`Failed to open MIDI output ${id}:`, error);
      return false;
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
    return get(this._internal)?.outputs ?? (new Map() as MIDIOutputMap);
  }

  public getPort(id: string): MIDIOutput | undefined {
    for (const value of this.outputs.values()) {
      if (value.id === id) {
        return value;
      }
    }
    return undefined;
  }

  public sendMessage(out: MIDIOutput, message: MIDIMessage) {
    out.send([message.cmd | message.ch, message.p1, message.p2]);
  }
}
