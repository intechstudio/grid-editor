import { get, writable } from "svelte/store";
import grid from "../protocol/grid-protocol";
import { serial_write, serial_write_islocked } from "../serialport/serialport";

import instructions from "../serialport/instructions";

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

function createWriteBuffer() {
  let _write_buffer = writable([] as any[]);
  let processingBufferElement = false;

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
    processingBufferElement = false;
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

  class ResponseWaiter {
    private timeoutId: NodeJS.Timeout | null = null;
    private resolve!: (response: GridResponse) => void;
    public promise: Promise<GridResponse>;

    constructor(public bufferelement: any, private duration: number) {
      this.promise = new Promise<GridResponse>((resolve) => {
        this.resolve = resolve;
      });
    }

    waitResponse(): Promise<GridResponse> {
      this.timeoutId = setTimeout(() => {
        const response = new GridResponse(
          ResponseStatus.TIMEOUT,
          null,
          `Timeout with ${this.duration}ms`
        );
        this.resolve(response);
      }, this.duration);

      return this.promise;
    }

    provideResponse(data: any): void {
      if (this.timeoutId !== null) {
        clearTimeout(this.timeoutId);
        const response = new GridResponse(ResponseStatus.OK, data);
        this.resolve(response);
      }
    }

    destroy(): void {
      if (this.timeoutId !== null) {
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

  async function waitResponseFromGrid(
    bufferElement: any,
    timeout: number
  ): Promise<GridResponse> {
    waiter = new ResponseWaiter(bufferElement, timeout);
    return await waiter.waitResponse();
  }

  async function sleep(time: number) {
    await new Promise((resolve) => setTimeout(resolve, time));
  }

  let waiter: ResponseWaiter | undefined = undefined;
  function process(incoming: any) {
    return new Promise<any>(async (resolve, reject) => {
      let processed = false;
      while (!processed) {
        if (
          serial_write_islocked() ||
          processingBufferElement ||
          get(writeBuffer)[0] !== incoming
        ) {
          await sleep(1);
          continue;
        }

        //Serial port is available, we can process the current command
        processingBufferElement = true;
        _write_buffer.update((s) => {
          s.shift();
          return s;
        });

        do {
          const { id } = await sendDataToGrid(incoming.descr);
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
            const result = await waitResponseFromGrid(incoming, timeout);
            switch (result.status) {
              case ResponseStatus.OK: {
                resolve(result.data);
                processed = true;
                break;
              }
              case ResponseStatus.ERROR: {
                reject(result.error);
                break;
              }
              case ResponseStatus.TIMEOUT: {
                console.log(result.error);
                break;
              }
            }
          } else {
            resolve(null);
            processed = true;
          }
        } while (!processed);
      }
      processingBufferElement = false;
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

  function executeFirst(obj: any) {
    return new Promise((resolve, reject) => {
      _write_buffer.update((s) => [obj, ...s]);
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

  function executeLast(obj: any) {
    return new Promise((resolve, reject) => {
      _write_buffer.update((s) => [...s, obj]);
      process(obj)
        .then((res) => {
          resolve(res);
        })
        .catch((e) => {
          console.error("Rejected:", obj.descr.class_name);
          console.error("Reason:", e);
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
