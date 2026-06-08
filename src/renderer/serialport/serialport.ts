import { grid } from "@intechstudio/grid-protocol";

import { debug_lowlevel_store } from "../main/panels/DebugMonitor/DebugMonitor.store.js";
import { v4 as uuidv4 } from "uuid";
import {
  get,
  type Readable,
  type Unsubscriber,
  type Updater,
  type Writable,
  writable,
} from "svelte/store";
import { GridRuntime } from "../runtime/runtime.js";
import { WriteBuffer } from "../runtime/engine.store.js";
import { runtime_manager } from "../runtime/runtime-manager.store.js";
import { GridService } from "../runtime/services.js";
import { appSettings } from "../runtime/app-helper.store.js";
import { type GridTransport } from "./transport.js";
import { SerialTransport } from "./serial-transport.js";

interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
}

function getSerialFilter(): SerialPortFilter[] {
  const configuration = window.ctxProcess.configuration();
  return [
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
    {
      usbVendorId: parseInt(configuration.BOOTLOADER_GRID_D51_VID),
      usbProductId: parseInt(configuration.BOOTLOADER_GRID_D51_PID),
    },
    {
      usbVendorId: parseInt(configuration.BOOTLOADER_GRID_ESP32_VID),
      usbProductId: parseInt(configuration.BOOTLOADER_GRID_ESP32_PID),
    },
    {
      usbVendorId: parseInt(configuration.BOOTLOADER_KNOT_VID),
      usbProductId: parseInt(configuration.BOOTLOADER_KNOT_PID),
    },
  ];
}

export type GridConnection = {
  id: string;
  buffer: WriteBuffer;
  transport: GridTransport;
  virtual: boolean;
};

export class GridConnectionManager implements Readable<GridConnection[]> {
  private _internal: Writable<GridConnection[]> = writable([]);

  public subscribe(
    run: Subscriber<GridConnection[]>,
    invalidate?: (value?: GridConnection[]) => void,
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

  /**
   * Open a connection using a GridTransport.
   * This is the preferred method for establishing connections.
   */
  openTransport(transport: GridTransport): Promise<GridConnection> {
    return new Promise((resolve, reject) => {
      transport
        .open()
        .then(() => {
          const buffer = new WriteBuffer(transport);
          const current: GridConnection = {
            id: uuidv4(),
            transport: transport,
            buffer: buffer,
            virtual: false,
          };

          const incoming = new GridRuntime();
          buffer.messageStream.bind(incoming);
          incoming.connection = current;

          const eventFetcher = new GridService.AutoEventFetcher(incoming);
          eventFetcher.start();

          runtime_manager.add(incoming);
          runtime_manager.setActive(incoming.id);

          this.update((store) => {
            console.log("Transport connected:", transport.getInfo());
            store.push(current);
            return store;
          });

          // Set up disconnect handler
          transport.onDisconnect(() => {
            console.log("Transport disconnected:", transport.getInfo());
            this.update((store) => {
              return store.filter((e) => e.id !== current.id);
            });
            runtime_manager.destroy(incoming);
          });

          // Set up data handler with framing logic
          this.setupFrameHandler(transport, current);

          resolve(current);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  /**
   * Set up the frame detection handler for incoming data.
   * This handles the Grid protocol framing (EOT+LF markers) for all transport types.
   */
  private setupFrameHandler(
    transport: GridTransport,
    connection: GridConnection,
  ): void {
    let rxBuffer: number[] = [];

    transport.onData((chunk: Uint8Array) => {
      // Accumulate incoming bytes
      const buffer = Array.from(chunk);
      for (let i = 0; i < buffer.length; i++) {
        rxBuffer.push(buffer[i]);
      }

      // Detect and process complete frames
      let messageStartIndex = 0;
      let messageStopIndex = 0;

      for (let i = 0; i < rxBuffer.length; i++) {
        if (rxBuffer[i] === 10 && rxBuffer[i - 3] === 4) {
          // newline character found and end-of-transmission character found
          messageStopIndex = i;
          const currentMessage = rxBuffer.slice(
            messageStartIndex,
            messageStopIndex,
          );
          messageStartIndex = i + 1;

          // Decode the message
          debug_lowlevel_store.push_inbound(currentMessage);
          const class_array = grid.decode_packet_frame(currentMessage);
          grid.decode_packet_classes(class_array);

          if (class_array !== false) {
            try {
              connection.buffer.messageStream.deliver_inbound(class_array);
            } catch (e) {
              console.error("MessageStream works too fast (TODO):", e);
            }
          }
        }
      }

      rxBuffer = rxBuffer.slice(messageStartIndex);
    });
  }

  static async tryConnectGrid() {
    if (get(appSettings).persistent.websocketNotificationEnabled) {
      return GridConnectionManager.tryConnectWebSocket();
    } else {
      return GridConnectionManager.tryConnectSerial();
    }
  }

  static async tryConnectSerial() {
    try {
      const filter = getSerialFilter();
      let ports: any[];
      if (import.meta.env.VITE_BUILD_TARGET == "web") {
        const port = await navigator.serial.requestPort({ filters: filter });
        ports = [port];
      } else {
        const port = await navigator.serial.requestPort({ filters: filter });
        if (navigator.debugSerial) {
          console.warn("port:", port);
        }
        ports = await navigator.serial.getPorts();
      }

      const matchingPorts = ports.filter((port) => {
        const { usbVendorId, usbProductId } = port.getInfo();
        return filter.some(
          (f) =>
            f.usbVendorId === usbVendorId && f.usbProductId === usbProductId,
        );
      });

      for (const port of matchingPorts) {
        const transport = new SerialTransport(port);
        connection_manager
          .openTransport(transport)
          .then((connection) => {
            // Connection established
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
  }

  static async tryConnectWebSocket() {
    // WebSocket auto-connect not implemented yet
    // Manual connection is handled by WebSocketNotification component
  }
}

export const connection_manager = new GridConnectionManager();

navigator.tryConnectGrid = GridConnectionManager.tryConnectGrid;
