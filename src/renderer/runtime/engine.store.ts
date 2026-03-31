import {
  get,
  type Readable,
  type Unsubscriber,
  type Updater,
  type Writable,
  writable,
} from "svelte/store";
import { grid } from "@intechstudio/grid-protocol";
import { type GridTransport } from "../serialport/transport.js";
import { appSettings } from "./app-helper.store";
import { ConnectionSimulator } from "./connection-simulator";
import { MessageStream } from "../serialport/message-stream.store";
import { logger } from "./runtime.store";
import { debug_lowlevel_store } from "../main/panels/DebugMonitor/DebugMonitor.store";
import { runtime_manager } from "./runtime-manager.store";

export enum InstructionClassName {
  HEARTBEAT = "HEARTBEAT",
  IMMEDIATE = "IMMEDIATE",
  CONFIG = "CONFIG",
  PAGEACTIVE = "PAGEACTIVE",
  PAGECOUNT = "PAGECOUNT",
  PAGESTORE = "PAGESTORE",
  NVMERASE = "NVMERASE",
  NVMDEFRAG = "NVMDEFRAG",
  PAGEDISCARD = "PAGEDISCARD",
  PAGECLEAR = "PAGECLEAR",
  LEDPREVIEW = "LEDPREVIEW",
  EVENTPREVIEW = "EVENTPREVIEW",
  NAMEPREVIEW = "NAMEPREVIEW",
}

export enum InstructionClass {
  EXECUTE = "EXECUTE",
  FETCH = "FETCH",
  REPORT = "REPORT",
  ACKNOWLEDGE = "ACKNOWLEDGE",
  NACKNOWLEDGE = "NACKNOWLEDGE",
}

export type BufferElement = {
  id: number;
  virtual: boolean;
  descr: {
    brc_parameters: { DX: number; DY: number; ROT?: number };
    class_name: InstructionClassName;
    class_instr: InstructionClass;
    class_parameters: {
      TYPE?: number;
      HWCFG?: number;
      VMAJOR?: number;
      VMINOR?: number;
      VPATCH?: number;
      VERSIONMAJOR?: number;
      VERSIONMINOR?: number;
      VERSIONPATCH?: number;
      PAGENUMBER?: number;
      ELEMENTNUMBER?: number;
      EVENTTYPE?: number;
      ACTIONLENGTH?: number;
      ACTIONSTRING?: string;
    };
  };
  // If set to true, no other BufferElements are
  // processed until response is received and processed.
  // Default value is false if not set.
  responseRequired?: boolean;
  // After the timeout that is defined here, the BufferElement is re-sent to
  // modules. After timeout, the BufferElement is not removed from queue.
  // Default value is 1000ms if not set.
  responseTimeout?: number;
  // Response required and send immediate can not be used together
  sendImmediate?: boolean;
  // If set, these bytes are sent as-is instead of encoding via grid.encode_packet.
  rawBytes?: Uint8Array;
  filter?: {
    PAGEDISCARD_ACKNOWLEDGE?: {
      LASTHEADER: unknown;
    };
    brc_parameters?: { SX: number; SY: number };
    class_name: InstructionClassName;
    class_instr: InstructionClass;
    class_parameters?: {
      PAGENUMBER?: number;
      ELEMENTNUMBER?: number;
      EVENTTYPE?: number;
      LASTHEADER?: unknown;
    };
  };
};

export enum ResponseStatus {
  OK = 0,
  TIMEOUT = 1,
  ERROR = 2,
}

class GridResponse {
  public status: ResponseStatus;
  public data?: any | null;
  public error?: string | null;

  constructor(
    status: ResponseStatus,
    data: any = null,
    error: string | null = null,
  ) {
    this.status = status;
    this.data = data;
    this.error = error;
  }
}

class ResponseWaiter {
  private timeoutId: NodeJS.Timeout | null = null;
  private resolve!: (response: GridResponse) => void;
  public promise: Promise<GridResponse>;
  public startTimestamp: number | undefined = undefined;
  public stopTimestamp: number | undefined = undefined;
  public duration: number | undefined = undefined; //Time between start and stop

  constructor(
    public bufferelement: any,
    private timeout: number,
  ) {
    this.promise = new Promise<GridResponse>((resolve) => {
      this.resolve = resolve;
    });
  }

  public waitResponse(): Promise<GridResponse> {
    this.startTimestamp = Date.now();
    this.timeoutId = setTimeout(() => {
      const response = new GridResponse(
        ResponseStatus.TIMEOUT,
        null,
        `Timeout with ${this.timeout}ms`,
      );
      this.resolve(response);
    }, this.timeout);

    return this.promise;
  }

  public provideResponse(data: any): void {
    if (this.timeoutId !== null) {
      this.stopTimestamp = Date.now();
      this.duration = this.stopTimestamp! - this.startTimestamp!;
      clearTimeout(this.timeoutId);
      const response = new GridResponse(ResponseStatus.OK, data);
      this.resolve(response);
    }
  }

  public destroy(): void {
    if (this.timeoutId !== null) {
      this.stopTimestamp = Date.now();
      this.duration = this.stopTimestamp! - this.startTimestamp!;
      clearTimeout(this.timeoutId);
      const response = new GridResponse(
        ResponseStatus.ERROR,
        null,
        "Waiting for response was interrupted",
      );
      this.resolve(response);
    }
  }
}

let waiter: ResponseWaiter | undefined = undefined;

export type PendingBufferProcess = {
  obj: BufferElement;
  result: Promise<any>;
};

export type WriteBufferData = {
  array: BufferElement[];
  current: PendingBufferProcess | undefined;
};

export class WriteBuffer implements Readable<WriteBufferData> {
  private _internal: Writable<WriteBufferData>;
  private _transport: GridTransport;
  public readonly simulator = new ConnectionSimulator();

  public readonly messageStream: MessageStream;

  constructor(transport: GridTransport) {
    this._transport = transport;
    this.messageStream = new MessageStream(this);
    this._internal = writable({
      array: [],
      current: undefined,
    });
  }

  public subscribe(
    run: Subscriber<WriteBufferData>,
    invalidate?: (value?: WriteBufferData) => void,
  ): Unsubscriber {
    return this._internal.subscribe(run, invalidate);
  }

  private set(value: WriteBufferData) {
    this._internal.set(value);
  }

  private update(updater: Updater<WriteBufferData>) {
    this._internal.update(updater);
  }

  public module_destroy_handler(dx: Number, dy: Number) {
    // remove all of the elements that match the destroyed module's dx dy
    this.update((s) => {
      s.array = s.array.filter(
        (g) =>
          g.descr.brc_parameters.DX != dx || g.descr.brc_parameters.DY != dy,
      );
      return s;
    });

    // clear the active element if it matches the destroyed module's dx dy
    if (
      waiter?.bufferelement.descr.brc_parameters.DX == dx &&
      waiter?.bufferelement.descr.brc_parameters.DY == dy
    ) {
      waiter.destroy();
      waiter = undefined;
    }
  }

  public clear() {
    this.set({ array: [], current: undefined });
    waiter?.destroy();
    waiter = undefined;
  }

  public sendDataToGrid(descr: any, rawBytes?: Uint8Array): Promise<any> {
    return new Promise((resolve, reject) => {
      let serial: number[];
      let id: any = null;

      if (rawBytes) {
        serial = Array.from(rawBytes);
      } else {
        const retval: any = grid.encode_packet(descr);
        retval.serial.push(10);
        serial = retval.serial;
        id = retval.id;
      }

      debug_lowlevel_store.push_outbound(serial);

      this._transport
        .write(new Uint8Array(serial))
        .then(() => resolve({ id }))
        .catch((e) => reject(e));
    });
  }

  public sendRawDataToGrid(
    data: Uint8Array,
    options?: {
      dx?: number;
      dy?: number;
      responseRequired?: boolean;
      filter?: any;
      responseTimeout?: number;
    },
  ): Promise<any> {
    const bufferElement: BufferElement = {
      id: 0,
      virtual: false,
      rawBytes: data,
      descr: {
        brc_parameters: { DX: options?.dx ?? -127, DY: options?.dy ?? -127 },
        class_name: InstructionClassName.IMMEDIATE,
        class_instr: InstructionClass.EXECUTE,
        class_parameters: {},
      },
      responseRequired: options?.responseRequired,
      filter: options?.filter,
      responseTimeout: options?.responseTimeout,
    };
    return this.add_last(bufferElement);
  }

  public async waitResponseFromGrid(
    bufferElement: any,
    timeout: number,
  ): Promise<GridResponse> {
    waiter = new ResponseWaiter(bufferElement, timeout);
    const response = await waiter.waitResponse();
    waiter = undefined;
    return response;
  }

  public async sleep(time: number) {
    await new Promise((resolve) => setTimeout(resolve, time));
  }

  public async sendToGrid(
    bufferElement: BufferElement,
    sendImmediate: boolean = false,
  ) {
    return new Promise((resolve, reject) => {
      this.sendDataToGrid(bufferElement.descr, bufferElement.rawBytes)
        .then(async (result) => {
          const { id } = result;
          if (bufferElement.responseRequired === true && !sendImmediate) {
            const { class_parameters } = bufferElement.filter || {};
            if (class_parameters?.LASTHEADER !== undefined) {
              class_parameters.LASTHEADER = id;
            }
            const timeout = bufferElement.responseTimeout ?? 1000;
            const response = await this.waitResponseFromGrid(
              bufferElement,
              timeout,
            );
            switch (response.status) {
              case ResponseStatus.OK: {
                resolve(response.data);
                break;
              }
              case ResponseStatus.ERROR: {
                reject(response.error);
                break;
              }
              case ResponseStatus.TIMEOUT: {
                resolve(this.sendToGrid(bufferElement)); // RETRY recursively until processed
                break;
              }
            }
          } else {
            resolve(null);
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  public processElement(current: BufferElement): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const sendImmediate =
        (current.sendImmediate ?? false) &&
        get(appSettings).persistent.sendHeartbeatImmediate;

      while (
        this._transport.isWriteLocked() ||
        get(this._internal).array[0] !== current ||
        (typeof waiter !== "undefined" && !sendImmediate)
      ) {
        if (get(this._internal).array.includes(current)) {
          await this.sleep(1);
        } else {
          reject(
            `Instruction ${current.descr.class_name} was removed from write buffer.`,
          );
          return;
        }
      }

      await this.sleep(10);
      this.sendToGrid(current, sendImmediate).then(resolve).catch(reject);
    });
  }

  public validate_incoming(descr: any) {
    if (typeof waiter === "undefined") return;

    if (!waiter.bufferelement.hasOwnProperty("filter")) return;

    if (descr.class_name === "HEARTBEAT") {
      return;
    }

    const buffer = waiter.bufferelement;

    // validate BRC, must start with this as every input contains BRC!
    let brcValid = true;
    for (const parameter in buffer.filter.brc_parameters) {
      if (
        descr.brc_parameters[parameter] !=
        buffer.filter.brc_parameters[parameter]
      ) {
        brcValid = false;
      }
    }

    if (!brcValid) return;

    if (descr.class_instr === InstructionClass.NACKNOWLEDGE) {
      if (descr.class_name === buffer.filter.class_name) {
        const filterLastHeader = buffer.filter.class_parameters?.LASTHEADER;
        if (
          filterLastHeader === undefined ||
          filterLastHeader == descr.class_parameters?.LASTHEADER
        ) {
          console.log("NACKNOWLEDGE received", descr);
          waiter.destroy();
        }
      }
      return;
    }

    let incomingValid = true;

    if (descr.class_name === buffer.filter.class_name) {
      for (const parameter in buffer.filter.class_parameters) {
        if (parameter === "LASTHEADER") continue;
        if (
          descr.class_parameters[parameter] !=
          buffer.filter.class_parameters[parameter]
        ) {
          incomingValid = false;
        }
      }
    } else {
      incomingValid = false;
    }

    if (incomingValid) {
      waiter.provideResponse(descr);
    }
  }

  public validateBufferElement(obj: BufferElement) {
    if (obj.responseRequired && obj.sendImmediate) {
      throw "Response required and send immediate can not be used together!";
    }
    const { DX, DY } = obj.descr.brc_parameters;
    const modules = get(runtime_manager).active?.runtime?.modules ?? [];
    const available =
      DX === -127 && DY === -127
        ? modules.length > 0
        : modules.some((m) => m.dx === DX && m.dy === DY);
    if (!available) {
      throw `Module [${DX}, ${DY}] is not connected`;
    }
  }

  public add_first(obj: BufferElement) {
    this.validateBufferElement(obj);
    this.update((s) => {
      s.array = [obj, ...s.array];
      return s;
    });
    return this.execute(obj);
  }

  public async add_last(obj: BufferElement) {
    this.validateBufferElement(obj);
    this.update((s) => {
      s.array = [...s.array, obj];
      return s;
    });
    return this.execute(obj);
  }

  public async execute(obj: BufferElement) {
    const promise = new Promise((resolve, reject) => {
      let promise: Promise<any>;
      if (obj.virtual) {
        promise = this.simulator.simulateProcess(obj);
      } else {
        promise = this.processElement(obj);
      }

      promise
        .then((res) => {
          resolve(res);
        })
        .catch((e) => {
          console.warn("Rejected:", obj.descr.class_name);
          console.warn("Reason:", e);
          reject(e);
        })
        .finally(() => {
          this.update((s) => {
            s.array.shift();
            return s;
          });
        });
    });

    this._internal.update((s) => {
      s.current = {
        obj: obj,
        result: promise,
      };
      return s;
    });
    return promise;
  }
}
