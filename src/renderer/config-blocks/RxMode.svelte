<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  import { categoryColors } from "./categoryColors";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "rxmd",
    name: "RxMode",
    rendering: "standard",
    category: "function",
    displayName: "RX Mode",
    description: "React to incoming MIDI",
    documentationUrl: "https://docs.intech.studio/wiki/actions/midi/midi-rx",
    color: categoryColors["function"] as any,
    defaultLua: "grxm(0,3) grxm(1,3) grxm(2,0) grxm(3,0)",

    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 21v-9.3"/><circle cx="12" cy="9.6" r="1.8"/><path d="M8.4 6a6.2 6.2 0 0 1 7.2 0M5.8 3.2a10.4 10.4 0 0 1 12.4 0"/></svg>`,
    selectable: true,
    hiddenInMinimalist: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
    editName: true,
    version: "2.0",
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { MeltCheckbox, MeltSelect } from "@intechstudio/grid-uikit";
  import { GridAction, ActionData } from "./../runtime/runtime";
  import { tooltip } from "../main/_actions/tooltip.ts";

  export let action: GridAction;
  const dispatch = createEventDispatcher();

  const typeLabels = [
    {
      label: "MIDI Voice",
      tooltip:
        "Note On/Off, Control Change, Pitch Bend and other standard MIDI voice messages",
    },
    { label: "MIDI Sysex", tooltip: "System Exclusive messages" },
    {
      label: "MIDI RTM",
      tooltip: "Real Time Messages: MIDI clock, start, stop, continue",
    },
    { label: "Event View", tooltip: "Grid internal event view messages" },
  ];

  const presetConfigs: Record<string, number[]> = {
    default: [3, 3, 0, 0],
    default_vsn1: [3, 3, 0, 6],
    midi_sync: [3, 3, 3, 6],
  };

  const presetOptions = [
    { title: "Default", value: "default" },
    { title: "Default (VSN1)", value: "default_vsn1" },
    { title: "MIDI Sync", value: "midi_sync" },
    { title: "Custom", value: "custom" },
  ];

  let selectedPreset = "custom";

  let rxConfig: { forward: boolean; external: boolean; internal: boolean }[] = [
    { forward: false, external: false, internal: false },
    { forward: false, external: false, internal: false },
    { forward: false, external: false, internal: false },
    { forward: false, external: false, internal: false },
  ];

  $: if (!$action.invalid) {
    parseScript($action);
  }

  // Apply preset when selectedPreset changes from the dropdown
  $: if (selectedPreset !== "custom") {
    const modes = presetConfigs[selectedPreset];
    if (modes) {
      const current = rxConfig.map(
        (c) =>
          (c.forward ? 1 : 0) | (c.external ? 2 : 0) | (c.internal ? 4 : 0),
      );
      if (!modes.every((m, i) => m === current[i])) {
        rxConfig = modes.map((m) => ({
          forward: (m & 0x01) !== 0,
          external: (m & 0x02) !== 0,
          internal: (m & 0x04) !== 0,
        }));
        sendData();
        dispatch("sync");
      }
    }
  }

  function syncPresetSelection() {
    const modes = rxConfig.map(
      (c) => (c.forward ? 1 : 0) | (c.external ? 2 : 0) | (c.internal ? 4 : 0),
    );
    const match = (Object.entries(presetConfigs) as [string, number[]][]).find(
      ([, vals]) => vals.every((v, i) => v === modes[i]),
    );
    selectedPreset = match ? match[0] : "custom";
  }

  function parseScript(data: ActionData) {
    const newConfig = [
      { forward: false, external: false, internal: false },
      { forward: false, external: false, internal: false },
      { forward: false, external: false, internal: false },
      { forward: false, external: false, internal: false },
    ];

    const regex = /grxm\((\d+),(\d+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(data.script)) !== null) {
      const type = parseInt(match[1]);
      const mode = parseInt(match[2]);
      if (type >= 0 && type <= 3) {
        newConfig[type].forward = (mode & 0x01) !== 0;
        newConfig[type].external = (mode & 0x02) !== 0;
        newConfig[type].internal = (mode & 0x04) !== 0;
      }
    }
    rxConfig = newConfig;
    syncPresetSelection();
  }

  function buildScript(): string {
    const calls: string[] = [];
    for (let i = 0; i < 4; i++) {
      const c = rxConfig[i];
      const mode =
        (c.forward ? 0x01 : 0) |
        (c.external ? 0x02 : 0) |
        (c.internal ? 0x04 : 0);
      calls.push(`grxm(${i},${mode})`);
    }
    return calls.join(" ");
  }

  function sendData() {
    dispatch("update-action", {
      short: action.short,
      script: buildScript(),
      validationError: false,
    });
  }

  function handleChange() {
    sendData();
    dispatch("sync");
    syncPresetSelection();
  }
</script>

<action-rx-mode class="flex flex-col w-full p-2 pointer-events-auto gap-2">
  <div class="px-2">
    <MeltSelect
      options={presetOptions}
      bind:target={selectedPreset}
      size="full"
      title="Preset"
    />
  </div>
  <div class="flex flex-col gap-1 px-2">
    <div class="flex items-center font-semibold text-gray-400">
      <div class="flex-1">Type</div>
      <div
        class="w-14 shrink-0 text-center"
        use:tooltip={{ text: "Forward from USB" }}
      >
        USB
      </div>
      <div
        class="w-14 shrink-0 text-center"
        use:tooltip={{ text: "Handle External" }}
      >
        Ext
      </div>
      <div
        class="w-14 shrink-0 text-center"
        use:tooltip={{ text: "Handle Internal" }}
      >
        Int
      </div>
    </div>
    {#each typeLabels as { label, tooltip: tip }, i}
      <div class="flex items-center">
        <div class="flex-1" use:tooltip={{ text: tip }}>{label}</div>
        <div class="w-14 shrink-0 flex justify-center">
          <MeltCheckbox
            style="transparent"
            bind:target={rxConfig[i].forward}
            on:change={handleChange}
          />
        </div>
        <div class="w-14 shrink-0 flex justify-center">
          <MeltCheckbox
            style="transparent"
            bind:target={rxConfig[i].external}
            on:change={handleChange}
          />
        </div>
        <div class="w-14 shrink-0 flex justify-center">
          <MeltCheckbox
            style="transparent"
            bind:target={rxConfig[i].internal}
            on:change={handleChange}
          />
        </div>
      </div>
    {/each}
  </div>
</action-rx-mode>
