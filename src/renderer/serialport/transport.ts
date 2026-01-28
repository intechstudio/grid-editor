/**
 * GridTransport - Abstract transport layer for Grid device communication.
 *
 * This interface abstracts the underlying transport mechanism (Serial, WebSocket, etc.)
 * allowing the same message processing pipeline to work with different transports.
 *
 * The framing protocol (EOT+LF markers, grid packet encoding) is handled above this layer,
 * so all transports use the same Grid protocol.
 */

export interface GridTransport {
  /**
   * Open the transport connection.
   * For Serial: opens the port with baud rate settings
   * For WebSocket: establishes the WebSocket connection
   */
  open(): Promise<void>;

  /**
   * Close the transport connection.
   */
  close(): Promise<void>;

  /**
   * Check if the transport is currently connected.
   */
  isConnected(): boolean;

  /**
   * Check if the transport write channel is locked/busy.
   * Used by WriteBuffer to manage write scheduling.
   */
  isWriteLocked(): boolean;

  /**
   * Write raw bytes to the transport.
   * The data should already be framed with the Grid protocol (including newline terminator).
   * @param data - The bytes to send
   */
  write(data: Uint8Array): Promise<void>;

  /**
   * Register a callback for incoming raw data chunks.
   * The callback receives raw bytes that need to be accumulated and framed.
   * @param callback - Function called with each data chunk
   */
  onData(callback: (data: Uint8Array) => void): void;

  /**
   * Register a callback for disconnect events.
   * @param callback - Function called when transport disconnects
   */
  onDisconnect(callback: () => void): void;

  /**
   * Get transport information for debugging/logging.
   */
  getInfo(): TransportInfo;
}

export interface TransportInfo {
  type: "serial" | "websocket";
  description: string;
}
