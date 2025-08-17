<script lang="ts">
  import { run } from 'svelte/legacy';

  import { onDestroy } from "svelte";
  import { GridMIDIManager } from "../../../serialport/midi-port";

  import { get, Unsubscriber, Writable, writable } from "svelte/store";
  import {
    MeltSelect,
    MeltSlider,
    MeltRadio,
    MoltenInput,
    MoltenPushButton,
  } from "@intechstudio/grid-uikit";
  import { logger } from "../../../runtime/runtime.store";

  const manager = new GridMIDIManager();

  const defaultOption = { title: "None", value: "none" };
  let options = $state([defaultOption]);
  let selected = $state(defaultOption.value);
  let disabled = true;

  let channel = $state("0");
  let command = $state("144");
  let param1 = $state("60");
  let param2 = writable("127");
  let unsubParam2: Unsubscriber;
  let interval = $state(250);

  enum TortureMode {
    DISABLED,
    MANUAL,
    AUTO,
    INTERVAL,
  }
  let mode: Writable<TortureMode> = writable(TortureMode.DISABLED);

  onDestroy(() => {
    clearInterval(pingInterval);
    manager.closeAll();
  });

  function refreshMIDIDevices() {
    manager.init().then(async (out) => {
      options = (
        await Promise.all(
          out.map(async (e) => {
            let name =
              e.manufacturer + (e.manufacturer.length > 0 ? ": " : "") + e.name;
            return { title: name, value: e.id };
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
    if (manager === undefined) {
      console.error("Error sending MIDI message...");
    }
    const out = manager.outputs.get(selected);
    manager.sendMessage(out, {
      ch: Number(channel),
      cmd: Number(command),
      p1: Number(param1),
      p2: Number(get(param2)),
    });
  }

  let pingInterval: NodeJS.Timeout | undefined;


  function handleModeChange(value: TortureMode) {
    const port = manager.getPort(selected);
    if (port === undefined) {
      manager.init().then(() =>
        manager.open(selected).then((success) => {
          if (!success) {
            refreshMIDIDevices();
            mode.set(0);
            logger.set({
              message: `Selected device (${options.find((e) => e.value === selected).title}) does not exist. Please select another device!`,
              type: "fail",
            });
            return;
          }
          handleModeChange(value);
        }),
      );
      return;
    }

    if (value === TortureMode.DISABLED) {
      manager.closeAll();
      stopMIDIPing();
    }

    value === TortureMode.INTERVAL ? startMIDIPing() : stopMIDIPing();

    if (value === TortureMode.AUTO) {
      unsubParam2 = param2.subscribe(handleParam2Change);
    } else {
      unsubParam2?.();
    }
  }

  function handleParam2Change(value) {
    if (value) sendMIDIMessage();
  }

  function startMIDIPing() {
    if (interval > 0 && get(mode) === TortureMode.INTERVAL) {
      pingInterval = setTimeout(() => {
        sendMIDIMessage();
        startMIDIPing();
      }, interval);
    }
  }

  function stopMIDIPing() {
    if (pingInterval) clearInterval(pingInterval);
  }
  run(() => {
    handleModeChange($mode);
  });
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
    <div class="relative">
      <div
        class:invisible={$mode !== 0}
        class="border border-black absolute w-full h-full items-center justify-center flex"
      >
        <span class="text-white">MIDI port is closed</span>
      </div>

      <div class:invisible={$mode === 0}>
        <div class="grid grid-cols-[1fr_1fr_1fr_auto] gap-x-2 items-center">
          <span class="text-gray-500 text-sm">Channel</span>
          <span class="text-gray-500 text-sm">Command</span>
          <span class="text-gray-500 text-sm">Param1</span>
          <span class="text-gray-500 text-sm">Param2</span>
          <MoltenInput bind:target={channel} />
          <MoltenInput bind:target={command} />
          <MoltenInput bind:target={param1} />
          <MoltenInput bind:target={$param2} />
        </div>

        <div class="flex flex-row items-center mt-2">
          <div class="flex flex-row items-center gap-4">
            <span class="text-gray-500 text-sm">Param2</span>
            <MeltSlider bind:target={$param2} min={0} max={127} step={1} />
            <span class="text-white flex whitespace-nowrap">{$param2}</span>
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
    </div>
  </div>
</container>
