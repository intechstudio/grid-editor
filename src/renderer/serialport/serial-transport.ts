/**
 * SerialTransport - WebSerial implementation of GridTransport.
 *
 * Wraps the WebSerialPort API to provide a unified transport interface.
 */

import { type GridTransport, type TransportInfo } from "./transport";

interface WebSerialPort {
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
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

export class SerialTransport implements GridTransport {
  private port: WebSerialPort;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private dataCallback: ((data: Uint8Array) => void) | null = null;
  private disconnectCallback: (() => void) | null = null;
  private connected = false;
  private readLoopActive = false;

  constructor(port: WebSerialPort) {
    this.port = port;
  }

  async open(): Promise<void> {
    await this.port.open({ baudRate: 2000000 });
    this.connected = true;

    // Set up disconnect listener
    this.port.addEventListener("disconnect", this.handleDisconnect);

    // Note: Read loop is started when onData() is called
  }

  async close(): Promise<void> {
    this.readLoopActive = false;
    this.connected = false;

    if (this.reader) {
      try {
        await this.reader.cancel();
        this.reader.releaseLock();
      } catch (e) {
        console.warn("[SerialTransport] Error closing reader:", e);
      }
      this.reader = null;
    }

    this.port.removeEventListener("disconnect", this.handleDisconnect);

    try {
      await this.port.close();
    } catch (e) {
      console.warn("[SerialTransport] Error closing port:", e);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  isWriteLocked(): boolean {
    if (!this.port || !this.port.writable) {
      return true;
    }
    return this.port.writable.locked;
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.port || !this.port.writable) {
      throw new Error("[SerialTransport] Port not writable");
    }

    if (this.port.writable.locked) {
      throw new Error("[SerialTransport] Port is locked");
    }

    const writer = this.port.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
  }

  onData(callback: (data: Uint8Array) => void): void {
    this.dataCallback = callback;
    // Start reading now that we have a callback to receive data
    if (this.connected && !this.readLoopActive) {
      this.startReadLoop();
    }
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallback = callback;
  }

  getInfo(): TransportInfo {
    const portInfo = this.port.getInfo();
    return {
      type: "serial",
      description: `Serial VID:${portInfo.usbVendorId} PID:${portInfo.usbProductId}`,
    };
  }

  /**
   * Get the underlying WebSerialPort for legacy compatibility.
   * @deprecated Use transport methods instead
   */
  getPort(): WebSerialPort {
    return this.port;
  }

  private handleDisconnect = (): void => {
    console.log("[SerialTransport] Disconnected");
    this.connected = false;
    this.readLoopActive = false;
    if (this.disconnectCallback) {
      this.disconnectCallback();
    }
  };

  private async startReadLoop(): Promise<void> {
    if (!this.port.readable) {
      console.warn("[SerialTransport] Port not readable");
      return;
    }

    this.reader = this.port.readable.getReader();
    this.readLoopActive = true;

    try {
      while (this.readLoopActive) {
        const { done, value } = await this.reader.read();

        if (done || !this.readLoopActive) {
          console.log("[SerialTransport] Read stream complete");
          break;
        }

        if (value && this.dataCallback) {
          this.dataCallback(value);
        }
      }
    } catch (error) {
      console.warn("[SerialTransport] Read error:", error);
    } finally {
      if (this.reader) {
        try {
          this.reader.releaseLock();
        } catch (e) {
          // Ignore release errors
        }
        this.reader = null;
      }
    }
  }
}
