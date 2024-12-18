import { grid } from "@intechstudio/grid-protocol";

import { debug_lowlevel_store } from "../main/panels/DebugMonitor/DebugMonitor.store.js";
import { v4 as uuidv4 } from "uuid";
import {
  get,
  Readable,
  Unsubscriber,
  Updater,
  type Writable,
  writable,
} from "svelte/store";
import { Subscriber } from "svelte/motion";
import { GridRuntime } from "../runtime/runtime.js";
import { WriteBuffer } from "../runtime/engine.store.js";
import { MessageStream } from "./message-stream.store.js";

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

export type GridPort = WebSerialPort;

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

export type GridConnection = {
  id: string;
  buffer: WriteBuffer;
  port: GridPort;
  messageStream: MessageStream;
  virtual: boolean;
};

class GridConnectionManager implements Readable<GridConnection[]> {
  private _internal: Writable<GridConnection[]> = writable([]);

  public subscribe(
    run: Subscriber<GridConnection[]>,
    invalidate?: (value?: GridConnection[]) => void
  ): Unsubscriber {
    return this._internal.subscribe(run, invalidate);
  }

  private set(value: GridConnection[]) {
    this._internal.set(value);
  }

  private update(updater: Updater<GridConnection[]>) {
    this._internal.update(updater);
  }

  get ports() {
    return this._internal;
  }

  openPort(port: GridPort): Promise<GridConnection> {
    return new Promise((resolve, reject) => {
      port
        .open({ baudRate: 2000000 })
        .then(() => {
          const buffer = new WriteBuffer(port);
          const messageStream = new MessageStream(buffer);
          const current = {
            id: uuidv4(),
            port: port,
            buffer: buffer,
            messageStream: messageStream,
            virtual: false,
          };

          port.addEventListener("disconnect", (e) => {
            console.log("Port disconnected:", current);
            this.update((store) => {
              return store.filter((e) => e.id !== current.id);
            });
          });

          this.update((store) => {
            console.log("Port connected:", current);
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

  isSerialWriteLocked(port: GridPort) {
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

  serialWrite(param: any, port: GridPort) {
    if (param === undefined) {
      return Promise.reject("Serial Write Error 1.");
    }

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

  async fetchStream(connection: GridConnection) {
    const port = connection.port;
    if (!port || !port.readable) {
      console.warn("Invalid port: ", port);
      return;
    }

    const reader = port.readable.getReader();
    let charsReceived = 0;
    let rxBuffer = [];

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (
          done ||
          !get(this._internal)
            .map((e) => e.port)
            .includes(port)
        ) {
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
              connection.messageStream.deliver_inbound(class_array);
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

  static async tryConnectGrid() {
    return;
    try {
      let ports: any[];
      if (import.meta.env.VITE_WEB_MODE == "true") {
        const port = await navigator.serial.requestPort({ filters: filter });
        ports = [port]; // Add the newly requested port to the list
      } else {
        // Retrieve all available ports. Must requestPort before getPort to allow MACOS to open D51
        const port = await navigator.serial.requestPort({ filters: filter });
        if (navigator.debugSerial) {
          console.warn("port:", port);
        }
        ports = await navigator.serial.getPorts();
      }

      // Filter ports based on the provided filter criteria
      const matchingPorts = ports.filter((port) => {
        const { usbVendorId, usbProductId } = port.getInfo();
        return filter.some(
          (f) =>
            f.usbVendorId === usbVendorId && f.usbProductId === usbProductId
        );
      });

      // Attempt to open each matching port
      for (const port of matchingPorts) {
        connection_manager
          .openPort(port as GridPort)
          .then((connection) => {
            connection_manager.fetchStream(connection);
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
  }
}

export const connection_manager = new GridConnectionManager();

navigator.tryConnectGrid = GridConnectionManager.tryConnectGrid;
