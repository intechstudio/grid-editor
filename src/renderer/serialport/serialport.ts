import { grid } from "@intechstudio/grid-protocol";

import { messageStream } from "./message-stream.store.js";

import { debug_lowlevel_store } from "../main/panels/DebugMonitor/DebugMonitor.store.js";
import { v4 as uuidv4 } from "uuid";
import { get, type Writable, writable } from "svelte/store";

const configuration = window.ctxProcess.configuration();

interface WebSerialPort {
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<any> | null;
  writable: WritableStream<any> | null;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
  getInfo(): SerialPortInfo;
}

interface SerialOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: "none" | "even" | "odd";
  bufferSize?: number;
  flowControl?: "none" | "hardware";
}

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

export interface GridPort extends WebSerialPort {
  id: string;
}

const filter: SerialPortInfo[] = [
  {
    usbVendorId: parseInt(configuration.USB_VID_0),
    usbProductId: parseInt(configuration.USB_PID_0),
  },
  {
    usbVendorId: parseInt(configuration.USB_VID_1),
    usbProductId: parseInt(configuration.USB_PID_1),
  },
  {
    usbVendorId: parseInt(configuration.USB_VID_2),
    usbProductId: parseInt(configuration.USB_PID_2),
  },
];

class GridConnectionManager {
  private _ports: Writable<GridPort[]>;
  private _active: GridPort;

  constructor() {
    this._ports = writable([]);
    this._active = undefined;
  }

  get ports() {
    return this._ports;
  }

  openPort(port: any): Promise<GridPort> {
    return new Promise((resolve, reject) => {
      port
        .open({ baudRate: 2000000 })
        .then(() => {
          const current = port as GridPort;
          current.id = uuidv4();
          current.addEventListener("disconnect", (e) => {
            console.log("Port disconnected:", current);

            const ports = get(this._ports);
            this._ports.set(ports.filter((e) => e.id !== current.id));
            if (get(this._ports).length > 0) {
              if (this._active.id === current.id) {
                this.fetchStream(get(this._ports)[0]);
              }
            } else {
              this._active = undefined;
            }
          });

          this._ports.update((store) => {
            store.push(current);
            return store;
          });

          resolve(current);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  disconnectPort() {}

  get active() {
    return this._active;
  }

  isSerialWriteLocked() {
    const port = this.active;
    if (port === undefined || port === null) {
      return true;
    }

    if (port.writable === undefined || port.writable === null) {
      return true;
    }

    if (port.writable.locked === true) {
      return false;
    }
  }

  serialWrite(param) {
    if (param === undefined) {
      return Promise.reject("Serial Write Error 1.");
    }

    const port = this.active;

    if (port === undefined || port === null) {
      return Promise.reject("Serial Write Error 2.");
    }

    if (port.writable === undefined || port.writable === null) {
      return Promise.reject("Serial Write Error 3.");
    }

    return new Promise((resolve, reject) => {
      param.push(10);

      debug_lowlevel_store.push_outbound(param);

      if (port.writable.locked === true) {
        //console.log("SORRY it's locked");
        reject("SORRY it's locked");
        return;
      }

      const writer = port.writable.getWriter();

      const data = new Uint8Array(param);

      writer
        .write(data)
        .then((e) => {
          // Allow the serial port to be closed later.
          writer.releaseLock();
          resolve("Port released");
        })
        .catch((e) => {
          console.log(e);
          reject(e);
        });
    });
  }

  async fetchStream(port: GridPort) {
    if (!port || !port.readable) {
      console.warn("Invalid port: ", port);
      return;
    }

    if (port.id === this.active?.id) {
      return;
    }

    console.log("Fetching", port);

    this._active = port;
    const reader = port.readable.getReader();
    let charsReceived = 0;
    let rxBuffer = [];

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done || this.active !== port) {
          console.log("Stream complete");
          break;
        }

        charsReceived += value.length;
        const chunk = value;

        let buffer = Array.from(chunk);

        for (let i = 0; i < buffer.length; i++) {
          rxBuffer.push(buffer[i]);
        }

        let messageStartIndex = 0;
        let messageStopIndex = 0;

        for (let i = 0; i < rxBuffer.length; i++) {
          if (rxBuffer[i] === 10) {
            // newline character found
            messageStopIndex = i;
            let currentMessage = rxBuffer.slice(
              messageStartIndex,
              messageStopIndex
            );
            messageStartIndex = i + 1;

            // Decode the message
            debug_lowlevel_store.push_inbound(currentMessage);
            let class_array = grid.decode_packet_frame(currentMessage);
            grid.decode_packet_classes(class_array);

            if (class_array !== false) {
              messageStream.deliver_inbound(class_array);
            }
          }
        }

        rxBuffer = rxBuffer.slice(messageStartIndex);
      }
    } catch (error) {
      console.warn("Error reading from serial port:", error);
    } finally {
      reader.releaseLock();
    }
  }
}

export const connection_manager = new GridConnectionManager();

navigator.tryConnectGrid = async () => {
  try {
    // Retrieve all available ports
    const ports: WebSerialPort[] = await navigator.serial.getPorts();

    // Filter ports based on the provided filter criteria
    const matchingPorts = ports.filter((port) => {
      const { usbVendorId, usbProductId } = port.getInfo();
      return filter.some(
        (f) => f.usbVendorId === usbVendorId && f.usbProductId === usbProductId
      );
    });

    console.log(ports);

    // Attempt to open each matching port
    for (const port of matchingPorts) {
      connection_manager
        .openPort(port)
        .then((port) => {
          if (typeof connection_manager.active === "undefined") {
            connection_manager.fetchStream(port);
          }
        })
        .catch((openError) => {
          // Handle any errors that occur when opening the port
          if (navigator.debugSerial) {
            console.warn("Failed to open port:", openError);
          }
        });
    }
  } catch (listPortsError) {
    // Handle any errors that occur when listing the ports
    if (navigator.debugSerial) {
      console.warn("Failed to list ports:", listPortsError);
    }
  }
};
