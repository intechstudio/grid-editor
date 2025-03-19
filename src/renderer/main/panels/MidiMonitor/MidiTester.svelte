<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { GridMIDIManager } from "../../../serialport/midi-port";
  import {
    MeltCombo,
    MeltSelect,
    MoltenInput,
    MoltenPushButton,
  } from "@intechstudio/grid-uikit";

  const manager = new GridMIDIManager();

  const defaultOption = { title: "None", value: "none" };
  let options = [defaultOption];
  let selected = defaultOption.value;
  let disabled = true;

  let command = "144";
  let param1 = "60";
  let param2 = "127";
  let interval = "50 ms";
  let intervalTimeout: NodeJS.Timeout;

  onMount(() => {
    refreshMIDIDevices();
  });

  onDestroy(() => {
    clearInterval(intervalTimeout);
  });

  function refreshMIDIDevices() {
    manager.init().then(async () => {
      options = (
        await Promise.all(
          [...manager.outputs].map(async ([id, midiOutput]) => {
            if (midiOutput.connection === "closed") {
              try {
                await midiOutput.open();
              } catch (error) {
                console.error(`Failed to open MIDI output ${id}:`, error);
                return null;
              }
            }
            return { title: id, value: id };
          })
        )
      ).filter(Boolean); // Remove null values

      disabled = false;
      if (options.length === 0) {
        options = [defaultOption];
        disabled = true;
      }
      selected = options[0].value;
    });
  }

  function handleIntervalChange(e: any) {
    const value = parseInt(e.detail.value.replaceAll("ms", "").trim());
    if (!isNaN(value)) {
      interval = `${value} ms`;
    } else {
      interval = "0 ms";
    }
  }

  function sendMIDIMessage() {
    const out = manager.outputs.get(selected);
    manager.sendMessage(out, { cmd: 0x90, p1: 60, p2: 127 });
  }

  function startMIDIPing() {
    clearInterval(intervalTimeout);
    const time = parseInt(interval.replaceAll("ms", "").trim());
    intervalTimeout = setInterval(sendMIDIMessage, time);
  }

  function stopMIDIPing() {
    clearInterval(intervalTimeout);
  }
</script>

<container class="flex flex-col gap-4">
  <div class=" flex flex-col gap-1">
    <span class="text-white">Target Device:</span>
    <div class="grid grid-cols-[1fr_auto] items-center gap-2 text-white">
      <MeltSelect bind:target={selected} {options} disabled={false} />
      <MoltenPushButton
        click={refreshMIDIDevices}
        text={"Refresh"}
        snap="auto"
      />
    </div>
  </div>

  <div class="flex flex-col gap-1">
    <span class="text-white">Send MIDI Message:</span>
    <div class="grid grid-cols-[1fr_1fr_1fr_auto] gap-x-2 items-center">
      <span class="text-gray-500 text-sm">Command</span>
      <span class="text-gray-500 text-sm">Param1</span>
      <span class="col-span-2 text-gray-500 text-sm">Param2</span>
      <MoltenInput bind:target={command} />
      <MoltenInput bind:target={param1} />
      <MoltenInput bind:target={param2} />
      <MoltenPushButton click={sendMIDIMessage} text={"Send"} snap="auto" />
    </div>
  </div>

  <div class="flex flex-col gap-1">
    <span class="text-white">Periodic MIDI Ping:</span>
    <div class="gap-x-2 items-center grid grid-cols-[1fr_auto_auto]">
      <span class="text-gray-500 text-sm col-span-3">Interval</span>
      <MoltenInput bind:target={interval} on:input={handleIntervalChange} />

      <MoltenPushButton click={startMIDIPing} text={"Start"} snap="auto" />
      <MoltenPushButton click={stopMIDIPing} text={"Stop"} snap="auto" />
    </div>
  </div>
</container>
