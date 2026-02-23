/**
 * VirtualTransport - A no-op transport for virtual/simulated connections.
 *
 * Virtual connections use the ConnectionSimulator instead of real transport,
 * so this transport should never actually be used for I/O operations.
 */

import { type GridTransport, type TransportInfo } from "./transport.js";

export class VirtualTransport implements GridTransport {
  private _connected = false;

  async open(): Promise<void> {
    this._connected = true;
  }

  async close(): Promise<void> {
    this._connected = false;
  }

  isConnected(): boolean {
    return this._connected;
  }

  isWriteLocked(): boolean {
    // Virtual connections are never locked
    return false;
  }

  async write(data: Uint8Array): Promise<void> {
    // Virtual connections don't actually write - they use the simulator
    console.warn("[VirtualTransport] write() called on virtual transport");
  }

  onData(callback: (data: Uint8Array) => void): void {
    // Virtual connections don't receive data - they use the simulator
  }

  onDisconnect(callback: () => void): void {
    // Virtual connections don't disconnect
  }

  getInfo(): TransportInfo {
    return {
      type: "serial", // Report as serial for compatibility
      description: "Virtual (Simulated)",
    };
  }
}
