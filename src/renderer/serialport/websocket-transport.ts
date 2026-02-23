/**
 * WebSocketTransport - WebSocket implementation of GridTransport.
 *
 * Wraps the browser WebSocket API to provide a unified transport interface
 * for Grid device communication over network.
 */

import { type GridTransport, type TransportInfo } from "./transport.js";

export class WebSocketTransport implements GridTransport {
  private url: string;
  private socket: WebSocket | null = null;
  private dataCallback: ((data: Uint8Array) => void) | null = null;
  private disconnectCallback: (() => void) | null = null;
  private connected = false;

  constructor(url: string) {
    this.url = url;
  }

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);
        this.socket.binaryType = "arraybuffer";

        this.socket.onopen = () => {
          console.log("[WebSocketTransport] Connected to", this.url);
          this.connected = true;
          resolve();
        };

        this.socket.onerror = (event) => {
          console.error("[WebSocketTransport] Connection error:", event);
          if (!this.connected) {
            reject(new Error("WebSocket connection failed"));
          }
        };

        this.socket.onclose = (event) => {
          console.log(
            "[WebSocketTransport] Disconnected:",
            event.code,
            event.reason,
          );
          this.connected = false;
          if (this.disconnectCallback) {
            this.disconnectCallback();
          }
        };

        this.socket.onmessage = (event) => {
          if (this.dataCallback && event.data instanceof ArrayBuffer) {
            this.dataCallback(new Uint8Array(event.data));
          } else if (this.dataCallback && typeof event.data === "string") {
            // Handle text messages by converting to bytes
            const encoder = new TextEncoder();
            this.dataCallback(encoder.encode(event.data));
          }
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  async close(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && this.socket?.readyState === WebSocket.OPEN;
  }

  isWriteLocked(): boolean {
    // WebSocket doesn't have a lock mechanism like serial
    return !this.isConnected();
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("[WebSocketTransport] Socket not connected");
    }
    this.socket.send(data);
  }

  onData(callback: (data: Uint8Array) => void): void {
    this.dataCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallback = callback;
  }

  getInfo(): TransportInfo {
    return {
      type: "websocket",
      description: `WebSocket ${this.url}`,
    };
  }
}
