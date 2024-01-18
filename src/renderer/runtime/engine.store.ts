import { get, writable } from "svelte/store";
import grid from "../protocol/grid-protocol";
import { serial_write, serial_write_islocked } from "../serialport/serialport";

import { instructions } from "../serialport/instructions";
import { simulateProcess } from "./virtual-engine";
import { BufferElement } from "../serialport/instructions";
import { runtime } from "./runtime.store";
import { virtual_modules } from "./virtual-engine";

function createWriteBuffer() {
  let _write_buffer = writable([] as any[]);
  let busy = false;

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
      waiter?.command.descr.brc_parameters.DX == dx &&
      waiter?.command.descr.brc_parameters.DY == dy
    ) {
      waiter.destroy();
      waiter = undefined;
    }
  }

  function clear() {
    _write_buffer.set([]);
    waiter?.destroy();
    waiter = undefined;
    busy = false;
  }

  function sendDataToGrid(descr: any) {
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

  class ResponseWaiter {
    private timeoutId: NodeJS.Timeout | null = null;
    private resolve!: (response: any) => void;
    private reject!: () => void;
    public promise: Promise<any>;

    constructor(public command: any, private duration: number) {
      this.promise = new Promise<any>((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    }

    waitResponse(): Promise<any> {
      this.timeoutId = setTimeout(() => {
        this.reject();
      }, this.duration);

      return this.promise;
    }

    provideResponse(response: any): void {
      if (this.timeoutId !== null) {
        clearTimeout(this.timeoutId);
        this.resolve(response);
      }
    }

    destroy(): void {
      if (this.timeoutId !== null) {
        clearTimeout(this.timeoutId);
        this.reject(); // Reject the promise to indicate destruction
      }
    }
  }

  async function waitResponseFromGrid(command: any, timeout: number) {
    waiter = new ResponseWaiter(command, timeout);
    try {
      const response = await waiter.waitResponse();
      waiter = undefined;
      return response;
    } catch (error) {
      throw new Error(`Timeout on ${command.descr.class_name} (${timeout}ms)`);
    }
  }

  let waiter: ResponseWaiter | undefined = undefined;
  function processElement(incoming: BufferElement): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      let processed = false;
      while (!processed) {
        if (
          serial_write_islocked() ||
          busy ||
          get(writeBuffer)[0] !== incoming
        ) {
          //WAIT
          await new Promise((resolve) => setTimeout(resolve, 1));
          continue;
        } else {
          busy = true;
        }

        _write_buffer.update((s) => {
          s.shift();
          return s;
        });

        sendDataToGrid(incoming.descr).then(async (res: any) => {
          const { id } = res;
          if (
            incoming.responseRequired &&
            incoming.filter !== undefined &&
            incoming.filter.class_parameters !== undefined &&
            incoming.filter.class_parameters["LASTHEADER"] !== undefined
          ) {
            incoming.filter.class_parameters["LASTHEADER"] = id;
          }

          if (incoming.responseRequired === true) {
            const timeout = incoming.responseTimeout ?? 1000;
            try {
              //console.log("waiting for", command);
              const result = await waitResponseFromGrid(incoming, timeout);
              resolve(result);
            } catch (e) {
              //TIMEOUT
              reject(e);
            }
          } else {
            resolve(null);
          }
          processed = true;
        });
      }
      busy = false;
    });
  }

  function validate_incoming(descr: any) {
    if (typeof waiter === "undefined") return;

    if (!waiter.command.hasOwnProperty("filter")) return;

    if (descr.class_name === "HEARTBEAT") {
      return;
    }

    let incomingValid = true;

    const buffer = waiter.command;
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
      console.log(descr);
      waiter.provideResponse(descr);
    }
  }

  function executeFirst(obj: BufferElement) {
    _write_buffer.update((s) => [obj, ...s]);
    return execute(obj);
  }

  async function executeLast(obj: BufferElement) {
    _write_buffer.update((s) => [...s, obj]);
    return execute(obj);
  }

  async function execute(obj: BufferElement) {
    return new Promise((resolve, reject) => {
      let process: (obj: BufferElement) => Promise<any>;
      if (get(virtual_modules).length > 0) {
        process = simulateProcess;
      } else {
        process = processElement;
      }

      process(obj)
        .then((res) => {
          resolve(res);
        })
        .catch((e) => {
          console.error("Rejected:", obj.descr.class_name);
          console.error("Reason:", e);
          reject(e);
        });
    });
  }

  return {
    subscribe: _write_buffer.subscribe,
    executeFirst: executeFirst,
    executeLast: executeLast,
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
  instructions.sendEditorHeartbeat_immediate(type);
}
