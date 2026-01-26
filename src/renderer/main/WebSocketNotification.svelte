<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    MoltenPushButton,
    MoltenInput,
    BlockRow,
  } from "@intechstudio/grid-uikit";

  let websocketUrl = "ws://192.168.7.1/ws";
  let socket: WebSocket | null = null;
  let status: "disconnected" | "connecting" | "connected" | "error" =
    "disconnected";
  let errorMessage = "";

  function connect() {
    if (socket) {
      socket.close();
    }

    status = "connecting";
    errorMessage = "";

    socket = new WebSocket(websocketUrl);

    socket.onopen = (event) => {
      status = "connected";
      console.log("[WebSocket] Connection opened:", event);
    };

    socket.onclose = (event) => {
      status = "disconnected";
      console.log("[WebSocket] Connection closed:", event.code, event.reason);
      socket = null;
    };

    socket.onerror = (event) => {
      status = "error";
      errorMessage = "Connection failed";
      console.error("[WebSocket] Error:", event);
    };

    socket.onmessage = (event) => {
      console.log("[WebSocket] Message received:", event.data);
    };
  }

  function disconnect() {
    if (socket) {
      socket.close();
      socket = null;
    }
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
