import { get, writable } from "svelte/store";
import grid from "../protocol/grid-protocol";
import { serial_write, serial_write_islocked } from "../serialport/serialport";

import instructions from "../serialport/instructions";

export function sendHeartbeat(type: number) {
  // Only add heatbeat into the write buffer if it is not in it already
  if (
    get(writeBuffer).length > 0 &&
    get(writeBuffer)[0].data.descr.class_name === "HEARTBEAT"
  ) {
    return;
  }
  instructions.sendEditorHeartbeat_immediate(type);
}

class BufferElement {
  promise: { resolve: (value?: any) => void; reject: (reason?: any) => void };
  data: any;

  constructor({
    promise,
    data,
  }: {
    promise: { resolve: (value?: any) => void; reject: (reason?: any) => void };
    data: any;
  }) {
    this.promise = promise;
    this.data = data;
  }
}

function createWriteBuffer() {
  let _write_buffer = writable([] as BufferElement[]);

  let write_buffer_busy = false;

  let active_elem: BufferElement | undefined = undefined;

  function module_destroy_handler(dx: Number, dy: Number) {
    // remove all of the elements that match the destroyed module's dx dy
    _write_buffer.update((s) =>
      s.filter(
        (g) =>
          g.data.descr.brc_parameters.DX != dx ||
          g.data.descr.brc_parameters.DY != dy
      )
    );

    // clear the active element if it matches the destroyed module's dx dy
    if (active_elem !== undefined) {
      if (
        active_elem.data.descr.brc_parameters.DX == dx &&
        active_elem.data.descr.brc_parameters.DY == dy
      ) {
        active_elem = undefined;
        writeBufferTryNext();
      }
    }
  }

  function clear() {
    _write_buffer.set([]);

    active_elem = undefined;
    write_buffer_busy = false;
    clearInterval(_fetch_timeout);
  }

  function sendDataToGrid(descr: any) {
    let retval: any = grid.encode_packet(descr);

    serial_write(retval.serial);

    // debugger for message ASCII frames
    let str = "";
    for (let i = 0; i < retval.serial.length; i++) {
      str += String.fromCharCode(retval.serial[i]);
    }

    return { id: retval.id };
  }

  function writeBufferTryNext() {
    if (write_buffer_busy || get(_write_buffer).length == 0) {
      return;
    }

    if (serial_write_islocked() === true) {
      console.log("LOCK", get(_write_buffer).length);
      return;
    }

    write_buffer_busy = true;

    //Is this possible?
    active_elem = get(_write_buffer)[0];
    if (active_elem === undefined) {
      return;
    }

    const buffer: any = active_elem.data;
    // create and send serial, save the ID for validation
    const { id } = sendDataToGrid(active_elem.data.descr);
    if (
      buffer.responseRequired &&
      buffer.filter !== undefined &&
      buffer.filter.class_parameters !== undefined &&
      buffer.filter.class_parameters["LASTHEADER"] !== undefined
    ) {
      buffer.filter.class_parameters["LASTHEADER"] = id;
    }

    _write_buffer.update((s) => {
      s.shift();
      return s;
    });

    if (buffer.responseRequired === true) {
      const responseTimeout = buffer.responseTimeout ?? 1000;
      startFetchTimeout(responseTimeout);
    } else {
      active_elem = undefined;
      write_buffer_busy = false;
    }
  }

  function validate_incoming(descr: any) {
    // check if there is an active_elem availabe
    if (!active_elem) return;

    // check if active_elem has filter
    if (!active_elem.data.hasOwnProperty("filter")) return;

    if (descr.class_name === "HEARTBEAT") {
      return;
    }

    let incomingValid = true;

    const buffer = active_elem.data;
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
      active_elem.promise.resolve(descr);
      active_elem = undefined;
      write_buffer_busy = false;
      clearInterval(_fetch_timeout);
      writeBufferTryNext();
    } else {
      // not matched, maybe later
    }
  }

  let _fetch_timeout: any = undefined;
  function startFetchTimeout(timeout: number) {
    _fetch_timeout = setTimeout(() => {
      fetchTimeoutCallback();
    }, timeout);
  }

  function fetchTimeoutCallback() {
    if (active_elem !== undefined) {
      active_elem.promise.reject(
        `Timeout elapsed on ${active_elem.data.descr.class_name}`
      );
      write_buffer_busy = false;
      executeFirst(active_elem.data);
    }
  }

  function executeFirst(obj: any) {
    return new Promise((resolve, reject) => {
      _write_buffer.update((s) => [
        new BufferElement({ promise: { resolve, reject }, data: obj }),
        ...s,
      ]);
      writeBufferTryNext();
    });
  }

  function executeLast(obj: any) {
    return new Promise((resolve, reject) => {
      _write_buffer.update((s) => [
        ...s,
        new BufferElement({ promise: { resolve, reject }, data: obj }),
      ]);
      writeBufferTryNext();
    });
  }

  return {
    subscribe: _write_buffer.subscribe,
    writeBufferTryNext: writeBufferTryNext,
    executeFirst: executeFirst,
    executeLast: executeLast,
    clear: clear,
    validate_incoming: validate_incoming,
    module_destroy_handler: module_destroy_handler,
  };
}

export const writeBuffer = createWriteBuffer();
