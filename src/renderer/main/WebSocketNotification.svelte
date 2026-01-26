<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    MoltenPushButton,
    MoltenInput,
    BlockRow,
  } from "@intechstudio/grid-uikit";
  import { WebSocketTransport } from "../serialport/websocket-transport.js";
  import {
    connection_manager,
    type GridConnection,
  } from "../serialport/serialport.js";

  let websocketUrl = "ws://192.168.7.1/ws";
  let transport: WebSocketTransport | null = null;
  let connection: GridConnection | null = null;
  let status: "disconnected" | "connecting" | "connected" | "error" =
    "disconnected";
  let errorMessage = "";

  function connect() {
    if (transport) {
      disconnect();
    }

    status = "connecting";
    errorMessage = "";

    transport = new WebSocketTransport(websocketUrl);

    connection_manager
      .openTransport(transport)
      .then((conn) => {
        connection = conn;
        status = "connected";
        console.log("[WebSocket] Connected via transport");
      })
      .catch((error) => {
        status = "error";
        errorMessage = error.message || "Connection failed";
        console.error("[WebSocket] Connection error:", error);
        transport = null;
      });
  }

  function disconnect() {
    if (transport) {
      transport.close();
      transport = null;
    }
    connection = null;
    status = "disconnected";
    errorMessage = "";
  }

  onMount(() => {
    console.log("[WebSocket] Notification bar enabled");
  });

  onDestroy(() => {
    console.log("[WebSocket] Notification bar disabled, cleaning up");
    disconnect();
  });
</script>

<div class="w-full bg-secondary text-white">
  <BlockRow>
    <div class="flex items-center gap-2 mx-2">
      <span><b>WebSocket:</b></span>
      <div class="w-64">
        <MoltenInput
          bind:target={websocketUrl}
          placeholder="ws://192.168.7.1/ws"
        />
      </div>
    </div>
    <div class="flex items-center gap-2 mx-2">
      <span>Status:</span>
      {#if status === "disconnected"}
        <span class="text-gray-400">Disconnected</span>
      {:else if status === "connecting"}
        <span class="text-yellow-400">Connecting...</span>
      {:else if status === "connected"}
        <span class="text-green-400">Connected</span>
      {:else if status === "error"}
        <span class="text-red-400">Error: {errorMessage}</span>
      {/if}
    </div>
    <MoltenPushButton text="Connect" click={connect} />
    <MoltenPushButton text="Disconnect" click={disconnect} />
  </BlockRow>
</div>
