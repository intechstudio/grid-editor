<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { GridMIDIManager } from "../../../serialport/midi-port";

  import { get, writable } from "svelte/store";
  import {
    MeltCombo,
    MeltSelect,
    MeltSlider,
    MeltRadio,
    MoltenInput,
    MoltenPushButton,
  } from "@intechstudio/grid-uikit";

  const manager = new GridMIDIManager();

  const defaultOption = { title: "None", value: "none" };
  let options = [defaultOption];
  let selected = defaultOption.value;
  let disabled = true;

  let channel = 0;
  let command = 144;
  let param1 = 60;
  let param2 = 127;
  let interval = 250;

  let mode = writable(0);

  onMount(() => {
    refreshMIDIDevices();
  });

  onDestroy(() => {
    clearInterval(pingInterval);
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
            let name =
              midiOutput.manufacturer +
              (midiOutput.manufacturer.length > 0 ? ": " : "") +
              midiOutput.name;
            return { title: name, value: id };
          }),
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

  function sendMIDIMessage() {
    if (manager === undefined) console.error("PROBLEM");
    const out = manager.outputs.get(selected);
    manager.sendMessage(out, {
      ch: channel,
      cmd: command,
      p1: param1,
      p2: param2,
    });
  }

  let pingInterval: NodeJS.Timeout | undefined;

  $: {
    if ($mode === 3) {
      startMIDIPing();
    } else {
      stopMIDIPing();
    }

    if ($mode === 0) {
    }

    if ($mode === 2) {
      if (param2 !== undefined) {
        // reactively send when param2 changes
        sendMIDIMessage();
      }
    }
  }

  function startMIDIPing() {
    if (interval > 0) {
      pingInterval = setInterval(() => {
        sendMIDIMessage();
      }, interval);
    }
  }

  function stopMIDIPing() {
    if (pingInterval) clearInterval(pingInterval);
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

    <MeltRadio
      bind:target={$mode}
      orientation={"horizontal"}
      options={[
        {
          title: "Disabled",
          value: 0,
        },
        {
          title: "Manual",
          value: 1,
        },
        {
          title: "Auto",
          value: 2,
        },
        {
          title: "Interval",
          value: 3,
        },
      ]}
    />
    <div class="grid grid-cols-[1fr_1fr_1fr_auto] gap-x-2 items-center">
      <span class="text-gray-500 text-sm">Channel</span>
      <span class="text-gray-500 text-sm">Command</span>
      <span class="text-gray-500 text-sm">Param1</span>
      <span class="text-gray-500 text-sm">Param2</span>
      <MoltenInput bind:target={channel} />
      <MoltenInput bind:target={command} />
      <MoltenInput bind:target={param1} />
      <MoltenInput bind:target={param2} />
    </div>

    <div class="flex flex-row items-center mt-2">
      <div class="flex flex-row items-center gap-4">
        <span class="text-gray-500 text-sm">Param1</span>
        <MeltSlider bind:target={param2} min={0} max={127} step={1} />
        <span class="text-white flex whitespace-nowrap">{param2}</span>
      </div>
    </div>

    <div class="flex flex-row items-center mt-2">
      <div class="flex flex-row items-center gap-4">
        <span class="text-gray-500 text-sm">Interval</span>
        <MeltSlider bind:target={interval} min={5} max={500} step={1} />
        <span class="text-white flex whitespace-nowrap">{interval} ms</span>
      </div>
    </div>

    <MoltenPushButton click={sendMIDIMessage} text={"Send"} snap="auto" />
  </div>
</container>
