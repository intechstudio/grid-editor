import { get, writable } from "svelte/store";
import { grid } from "../protocol/grid-protocol";
import { serial_write, serial_write_islocked } from "../serialport/serialport";

import { instructions } from "../serialport/instructions";
import { simulateProcess } from "./virtual-engine";
import { runtime } from "./runtime.store";
import { virtual_modules } from "./virtual-engine";

export enum InstructionClassName {
  HEARTBEAT = "HEARTBEAT",
  CONFIG = "CONFIG",
  PAGEACTIVE = "PAGEACTIVE",
  PAGECOUNT = "PAGECOUNT",
  PAGESTORE = "PAGESTORE",
  NVMERASE = "NVMERASE",
  NVMDEFRAG = "NVMDEFRAG",
  PAGEDISCARD = "PAGEDISCARD",
  PAGECLEAR = "PAGECLEAR",
}

export enum InstructionClass {
  EXECUTE = "EXECUTE",
  FETCH = "FETCH",
  REPORT = "REPORT",
  ACKNOWLEDGE = "ACKNOWLEDGE",
}

export type BufferElement = {
  descr: {
    brc_parameters: { DX: number; DY: number };
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

enum ResponseStatus {
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
    error: string | null = null
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

  constructor(public bufferelement: any, private timeout: number) {
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
        `Timeout with ${this.timeout}ms`
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
        "Waiting for response was interrupted"
      );
      this.resolve(response);
    }
  }
}

let waiter: ResponseWaiter | undefined = undefined;

function createWriteBuffer() {
  let _write_buffer = writable([] as any[]);

  function module_destroy_handler(dx: Number, dy: Number) {
    // remove all of the elements that match the destroyed module's dx dy
    _write_buffer.update((s) =>
      s.filter(
        (g) =>
          g.descr.brc_parameters.DX != dx || g.descr.brc_parameters.DY != dy
      )
    );

    // clear the active element if it matches the destroyed module's dx dy
    if (
      waiter?.bufferelement.descr.brc_parameters.DX == dx &&
      waiter?.bufferelement.descr.brc_parameters.DY == dy
    ) {
      waiter.destroy();
      waiter = undefined;
    }
  }

  function clear() {
    _write_buffer.set([]);
    waiter?.destroy();
    waiter = undefined;
  }

  function sendDataToGrid(descr: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let retval: any = grid.encode_packet(descr);

      serial_write(retval.serial)
        .then(() => {
          // debugger for message ASCII frames
          let str = "";
          for (let i = 0; i < retval.serial.length; i++) {
            str += String.fromCharCode(retval.serial[i]);
          }

          resolve({ id: retval.id });
        })
        .catch((e) => reject(e));
    });
  }

  async function waitResponseFromGrid(
    bufferElement: any,
    timeout: number
  ): Promise<GridResponse> {
    waiter = new ResponseWaiter(bufferElement, timeout);
    const response = await waiter.waitResponse();
    waiter = undefined;
    return response;
  }

  async function sleep(time: number) {
    await new Promise((resolve) => setTimeout(resolve, time));
  }

  async function sendToGrid(
    bufferElement: BufferElement,
    sendImmediate: boolean = false
  ) {
    return new Promise((resolve, reject) => {
      sendDataToGrid(bufferElement.descr)
        .then(async (result) => {
          const { id } = result;
          if (bufferElement.responseRequired === true && !sendImmediate) {
            const { class_parameters } = bufferElement.filter || {};
            if (class_parameters?.LASTHEADER !== undefined) {
              class_parameters.LASTHEADER = id;
            }
            const timeout = bufferElement.responseTimeout ?? 1000;
            const response = await waitResponseFromGrid(bufferElement, timeout);
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
                console.log(response.error);
                resolve(sendToGrid(bufferElement)); // RETRY recursively until processed
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

  function processElement(current: BufferElement): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const sendImmediate = current.sendImmediate ?? false;
      const waitingResponse = typeof waiter !== "undefined";
      while (
        serial_write_islocked() ||
        get(writeBuffer)[0] !== current ||
        (waitingResponse && !sendImmediate)
      ) {
        if (get(writeBuffer).includes(current)) {
          await sleep(1);
        } else {
          reject(
            `Instruction ${current.descr.class_name} was removed from write buffer.`
          );
          return;
        }
      }

      sendToGrid(current, sendImmediate)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          _write_buffer.update((s) => {
            s.shift();
            return s;
          });
        });
    });
  }

  function validate_incoming(descr: any) {
    if (typeof waiter === "undefined") return;

    if (!waiter.bufferelement.hasOwnProperty("filter")) return;

    if (descr.class_name === "HEARTBEAT") {
      return;
    }

    let incomingValid = true;

    const buffer = waiter.bufferelement;
    // validate BRC, must start with this as every input contains BRC!
    for (const parameter in buffer.filter.brc_parameters) {
      if (
        descr.brc_parameters[parameter] !=
        buffer.filter.brc_parameters[parameter]
      ) {
        incomingValid = false;
      }
    }

    if (descr.class_name === buffer.filter.class_name) {
      for (const parameter in buffer.filter.class_parameters) {
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

  function validateBufferElement(obj: BufferElement) {
    if (obj.responseRequired && obj.sendImmediate) {
      throw "Response required and send immediate can not be used together!";
    }
  }

  function add_first(obj: BufferElement) {
    validateBufferElement(obj);
    _write_buffer.update((s) => [obj, ...s]);
    return execute(obj);
  }

  async function add_last(obj: BufferElement) {
    validateBufferElement(obj);
    _write_buffer.update((s) => [...s, obj]);
    return execute(obj);
  }

  async function execute(obj: BufferElement) {
    return new Promise((resolve, reject) => {
      let process: (obj: BufferElement) => Promise<any>;
      const [dx, dy]: number[] = [
        obj.descr.brc_parameters.DX,
        obj.descr.brc_parameters.DY,
      ];
      const sender: any = get(runtime).find(
        (e: any) => e.dx === dx && e.dy === dy
      )!;

      //TODO: rework instructions into well defined ones,
      //where the checking of virtual_modules is unnecessary
      if (
        sender?.architecture === "virtual" ||
        get(virtual_modules).length > 0
      ) {
        process = simulateProcess;
      } else {
        process = processElement;
      }

      process(obj)
        .then((res) => {
          resolve(res);
        })
        .catch((e) => {
          console.log("Rejected:", obj.descr.class_name);
          console.log("Reason:", e);
          reject(e);
        });
    });
  }

  return {
    subscribe: _write_buffer.subscribe,
    add_fist: add_first,
    add_last: add_last,
    clear: clear,
    validate_incoming: validate_incoming,
    module_destroy_handler: module_destroy_handler,
  };
}

export const writeBuffer = createWriteBuffer();

export function sendHeartbeat(type: number) {
  // Only add heatbeat into the write buffer if it is not in it already
  if (
    get(writeBuffer).length > 0 &&
    get(writeBuffer)[0].descr.class_name === "HEARTBEAT"
  ) {
    return;
  }
  instructions.sendEditorHeartbeat_immediate(type).catch((e) => {
    console.log("EDITOR: Heartbeat skipped...");
  });
}
