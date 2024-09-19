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
  private _active: GridPort | undefined;

  constructor() {
    this._ports = writable([]);
    this._active = undefined;
  }

  get ports() {
    return this._ports;
  }

  openPort(port: any): Promise<GridPort> {
    return new Promise((resolve, reject) => {
      const existingPort = get(this._ports).find((p) => p.id === port.id);
      if (existingPort) {
        // If the port is already open, return it
        return resolve(existingPort);
      }

      port
        .open({ baudRate: 2000000 })
        .then(() => {
          const current = port as GridPort;
          current.id = uuidv4();
          current.addEventListener("disconnect", () => {
            console.log("Port disconnected:", current);

            const ports = get(this._ports);
            this._ports.set(ports.filter((p) => p.id !== current.id));

            if (this._active?.id === current.id) {
              // If the disconnected port was active, switch to another port
              const remainingPorts = get(this._ports);
              if (remainingPorts.length > 0) {
                this.fetchStream(remainingPorts[0]);
              } else {
                this._active = undefined;
              }
            }
          });

          this._ports.update((store) => {
            store.push(current);
            return store;
          });

          resolve(current);
        })
        .catch(reject);
    });
  }

  get active() {
    return this._active;
  }

  serialWrite(param: Uint8Array) {
    if (!param || !this._active || !this._active.writable) {
      return Promise.reject("Port is not available for writing.");
    }

    return new Promise((resolve, reject) => {
      param.push(10); // Append newline

      const writer = this._active!.writable.getWriter();

      writer
        .write(param)
        .then(() => {
          writer.releaseLock();
          resolve("Data written successfully.");
        })
        .catch(reject);
    });
  }

  async fetchStream(port: GridPort) {
    if (this._active?.id === port.id) {
      return; // Skip if the port is already active
    }

    this._active = port;

    if (!port || !port.readable) {
      console.warn("Invalid port:", port);
      return;
    }

    const reader = port.readable.getReader();
    let rxBuffer: number[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done || this._active !== port) {
          console.log("Stream complete.");
          break;
        }

        if (value) {
          let buffer = Array.from(value);
          rxBuffer.push(...buffer);

          // Handle packet processing and message decoding
          let messageStartIndex = 0;
          for (let i = 0; i < rxBuffer.length; i++) {
            if (rxBuffer[i] === 10) {
              const currentMessage = rxBuffer.slice(messageStartIndex, i);
              messageStartIndex = i + 1;

              // Decode the message (pseudo-code for your logic)
              debug_lowlevel_store.push_inbound(currentMessage);
              let class_array = grid.decode_packet_frame(currentMessage);
              grid.decode_packet_classes(class_array);

              if (class_array) {
                messageStream.deliver_inbound(class_array);
              }
            }
          }
          rxBuffer = rxBuffer.slice(messageStartIndex); // Adjust the buffer
        }
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
    let ports = await navigator.serial.getPorts();

    // Request access only if unopened ports are available
    if (ports.length === 0) {
      const port = await navigator.serial.requestPort({ filters: filter });
      ports = [port];
    }

    // Filter ports based on criteria and exclude already opened ports
    const matchingPorts = ports.filter((port) => {
      const { usbVendorId, usbProductId } = port.getInfo();
      const isMatching = filter.some(
        (f) => f.usbVendorId === usbVendorId && f.usbProductId === usbProductId
      );
      const isOpen = get(connection_manager.ports).some(
        (openedPort) => openedPort.id === port.id
      );
      return isMatching && !isOpen;
    });

    // Attempt to open each matching port
    for (const port of matchingPorts) {
      connection_manager
        .openPort(port)
        .then((port) => {
          if (!connection_manager.active) {
            connection_manager.fetchStream(port);
          }
        })
        .catch((openError) => {
          if (navigator.debugSerial) {
            console.warn("Failed to open port:", openError);
          }
        });
    }
  } catch (listPortsError) {
    if (navigator.debugSerial) {
      console.warn("Failed to list ports:", listPortsError);
    }
  }
};
