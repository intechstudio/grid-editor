<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import MidiFace from "./headers/MidiFace.svelte";
  export const header = MidiFace;

  export const information: ActionBlockInformation = {
    short: "gms",
    name: "Midi",
    rendering: "standard",
    category: "midi",
    displayName: "MIDI",
    description: "Send and recieve MIDI message",
    color: categoryColors["midi"] as any,
    defaultLua: "self:gms(-1,-1,-1,-1)",
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5"/><path d="M10.6 3.9v1.6h2.8V3.9"/><circle cx="7.3" cy="12" r="1.05" fill="currentColor" stroke="none"/><circle cx="16.7" cy="12" r="1.05" fill="currentColor" stroke="none"/><path d="M9.4 14.6 8.1 15.9M14.6 14.6l1.3 1.3M12 15.6v1.9"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5"/><path d="M10.6 3.9v1.6h2.8V3.9"/><circle cx="7.3" cy="12" r="1.05" fill="currentColor" stroke="none"/><circle cx="16.7" cy="12" r="1.05" fill="currentColor" stroke="none"/><path d="M9.4 14.6 8.1 15.9M14.6 14.6l1.3 1.3M12 15.6v1.9"/></svg>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
    editName: true,
    version: "2.0",
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import {
    Block,
    BlockRow,
    BlockTitle,
    MeltCombo,
    MeltCheckbox,
    MeltRadio,
  } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { midiCC } from "./_midi.js";
  import { Script, extractParam } from "./_script_parsers.js";
  import { LocalDefinitions } from "../runtime/runtime.store";
  import { ActionData, GridAction, GridEvent } from "./../runtime/runtime";
  import SendFeedback from "../main/user-interface/SendFeedback.svelte";
  import { MusicalNotes } from "../main/panels/MidiMonitor/MidiMonitor.store";
  import { Validator } from "./validators";
  import { Grid } from "../lib/_utils.js";

  export let action: GridAction;

  let event = action.parent as GridEvent;
  let containerWidth = 0;
  $: isWide = containerWidth > 360;

  const dispatch = createEventDispatcher();

  let mounted = false;
  onMount(() => {
    mounted = true;
  });

  const parameterNames = ["Channel", "Command", "Parameter 1", "Parameter 2"];
  const luaValidator = (e: string) => new Validator(e).isLuaValue().Result();

  const validators = [
    { value: true, func: luaValidator }, // channel
    { value: true, func: luaValidator }, // command
    { value: true, func: luaValidator }, // p1
    { value: true, func: luaValidator }, // p2
    { value: true, func: luaValidator }, // nrpn msb
    { value: true, func: luaValidator }, // nrpn lsb
  ];

  let scriptSegments = [];
  let feature1: boolean = false;
  let feature2: boolean = false;
  let mode: number = 0;
  let nrpnMSB: string = "";
  let nrpnLSB: string = "";

  const modes = [
    { title: "Default 7-bit", value: 0 },
    { title: "CC 14-bit", value: 1 },
    { title: "NRPN", value: 2 },
    { title: "NRPN 14-bit", value: 3 },
  ];

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    const gmsContent = extractParam(data.script, "gms");
    const allSegments = Script.toSegments({
      short: data.short,
      script: gmsContent !== null ? `gms(${gmsContent})` : data.script,
    });

    scriptSegments = allSegments.slice(0, 4);
    const modeSegment = allSegments[4];
    mode = modeSegment !== undefined ? parseInt(modeSegment) || 0 : 0;

    if (mode === 2 || mode === 3) {
      const cc = scriptSegments[2];
      if (cc !== calculateNRPNCC(nrpnMSB, nrpnLSB)) {
        nrpnMSB = `(${cc})//128`;
        nrpnLSB = `(${cc})%128`;
      }
    }

    const rxParams = extractParam(data.script, "gmrr");
    if (rxParams !== null) {
      const match = rxParams.match(/\{(true|false),(true|false)\}/);
      feature1 = match ? match[1] === "true" : false;
      feature2 = match ? match[2] === "true" : false;
    } else {
      feature1 = false;
      feature2 = false;
    }
  }

  function sendData() {
    const params = [...scriptSegments];
    if (mode !== 0) {
      params[1] = "176";
      params.push(String(mode));
    }
    const script = Script.toScript({
      short: action.short,
      array: params,
    }); // important to set the function name
    let fullScript = "self:" + script;
    if (feature1 || feature2) {
      const f1 = feature1 ? "true" : "false";
      const f2 = feature2 ? "true" : "false";
      fullScript += ` self:gmrr(-1,${scriptSegments[0]},${scriptSegments[1]},${scriptSegments[2]},{${f1},${f2}},${String(mode)})`;
    }
    dispatch("update-action", {
      short: action.short,
      script: fullScript,
      validationError: validators.some((e) => e.value === false),
    });
  }

  function calculateNRPNCC(msb: string, lsb: string): string {
    if (
      msb.endsWith("//128") &&
      lsb.endsWith("%128") &&
      msb.slice(0, -5) === lsb.slice(0, -4)
    ) {
      let cc = msb.slice(0, -5);
      if (cc.startsWith("(") && cc.endsWith(")")) cc = cc.slice(1, -1);
      return cc;
    }
    return `(${msb})*128+${lsb}`;
  }

  $: handleFeatureChange(feature1, feature2);

  function handleFeatureChange(_f1: boolean, _f2: boolean) {
    if (!mounted) return;
    sendData();
    dispatch("sync");
  }

  $: handleModeChange(mode);

  function handleModeChange(_mode: number) {
    if (!mounted) return;
    sendData();
    dispatch("sync");
  }

  $: if ($event) {
    renderSuggestions();
  }

  type SuggestionValue = { value: string; info: string; key: string };

  // --- helpers ---
  const makeAuto = (info: string, key = "auto"): SuggestionValue => ({
    value: "-1",
    info,
    key,
  });

  const makeChannels = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      value: String(i),
      info: `Channel ${i + 1}`,
      key: `ch_${i}`,
    }));

  const makeCCs = () =>
    Object.entries(midiCC).map(([value, info]) => ({
      value,
      info,
      key: `cc_${value}`,
    }));

  const make14BitCCs = () =>
    Object.entries(midiCC)
      .filter(([value]) => Number(value) <= 31)
      .map(([value, info]) => ({ value, info, key: `cc_${value}` }));

  const makeNotes = () =>
    Array.from({ length: 128 }, (_, i) => ({
      value: String(i),
      info: MusicalNotes.FromInt(i),
      key: `note_${i}`,
    }));

  const baseSuggestions: Array<SuggestionValue[]> = [
    [
      makeAuto(
        `Auto (${Grid.Auto.getMidi(action, Grid.Auto.Value.MIDI_CHANNEL)})`,
      ),
      ...makeChannels(16),
    ],
    [
      { value: "176", info: "Control Change", key: "control_change_messages" },
      { value: "144", info: "Note On", key: "note_on_event" },
      { value: "128", info: "Note Off", key: "note_off_event" },
      { value: "192", info: "Program Change", key: "program_change_messages" },
    ],
    [], // param1 (dynamic)
    [makeAuto("Auto")],
  ];

  let suggestions: SuggestionValue[][] = [];

  function renderSuggestions() {
    const currentCommand = Grid.Auto.getMidi(
      action,
      Grid.Auto.Value.MIDI_COMMAND,
    );

    // find corresponding command once
    const commandEntry = baseSuggestions[1].find(
      (e) => +e.value === currentCommand,
    );
    const autoCommand = makeAuto(
      `Auto (${commandEntry?.info ?? "?"})`,
      commandEntry?.key ?? "control_change_messages",
    );

    const selectedCommand =
      [autoCommand, ...baseSuggestions[1]].find(
        (s) => s.value == scriptSegments[1],
      )?.key ?? "control_change_messages";

    // param1 depends on mode and selected command
    let param1: SuggestionValue[];
    if (mode === 2 || mode === 3) {
      param1 = [];
    } else if (mode === 1) {
      param1 = [
        makeAuto(
          `Auto (${Grid.Auto.getMidi(action, Grid.Auto.Value.MIDI_P1) % 32})`,
        ),
        ...make14BitCCs(),
      ];
    } else {
      switch (selectedCommand) {
        case "control_change_messages":
          param1 = [
            makeAuto(
              `Auto (${Grid.Auto.getMidi(action, Grid.Auto.Value.MIDI_P1)})`,
            ),
            ...makeCCs(),
          ];
          break;
        case "note_on_event":
        case "note_off_event":
          const autoNote = Grid.Auto.getMidi(action, Grid.Auto.Value.MIDI_P1);
          param1 = [
            makeAuto(`Auto (${MusicalNotes.FromInt(autoNote)})`),
            ...makeNotes(),
          ];
          break;
        default:
          param1 = [];
      }
    }

    // fetch local definitions
    const actions = $event.config;
    const index = actions.findIndex((e) => e.id === action.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index,
    });

    // assemble suggestions with "auto" always first
    suggestions = [
      [
        baseSuggestions[0][0],
        ...localDefinitions,
        ...baseSuggestions[0].slice(1),
      ], // channels
      [autoCommand, ...localDefinitions, ...baseSuggestions[1]], // commands
      param1.length > 0
        ? [param1[0], ...localDefinitions, ...param1.slice(1)]
        : [...localDefinitions], // param1
      [
        baseSuggestions[3][0],
        ...localDefinitions,
        ...baseSuggestions[3].slice(1),
      ], // param2
    ];
  }

  $: if ($event || mode !== undefined) {
    renderSuggestions();
  }
</script>

<action-midi
  bind:clientWidth={containerWidth}
  class="flex flex-col w-full py-2 px-2 pointer-events-auto"
>
  <BlockRow>
    <MeltRadio
      options={modes}
      bind:target={mode}
      orientation={isWide ? "horizontal" : "vertical"}
      style="button"
      size={isWide ? "full" : "auto"}
    />
  </BlockRow>
  <Block>
    <BlockTitle>Send MIDI</BlockTitle>
    <BlockRow even>
      <MeltCombo
        title={parameterNames[0]}
        value={scriptSegments[0]}
        suggestions={suggestions[0]}
        validator={validators[0].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          scriptSegments[0] = value;
          validators[0].value = !validationError;
          sendData();
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
      {#if mode === 0}
        <MeltCombo
          title={parameterNames[1]}
          value={scriptSegments[1]}
          suggestions={suggestions[1]}
          validator={validators[1].func}
          on:input={(e) => {
            const { value, validationError } = e.detail;
            scriptSegments[1] = value;
            validators[1].value = !validationError;
            sendData();
          }}
          on:change={() => dispatch("sync")}
          postProcessor={GridScript.shortify}
          preProcessor={GridScript.humanize}
        />
      {/if}
      {#if mode !== 2 && mode !== 3}
        <MeltCombo
          title={parameterNames[2]}
          value={scriptSegments[2]}
          suggestions={suggestions[2]}
          validator={validators[2].func}
          on:input={(e) => {
            const { value, validationError } = e.detail;
            scriptSegments[2] = value;
            validators[2].value = !validationError;
            sendData();
          }}
          on:change={() => dispatch("sync")}
          postProcessor={GridScript.shortify}
          preProcessor={GridScript.humanize}
        />
      {/if}
      <MeltCombo
        title={parameterNames[3]}
        value={scriptSegments[3]}
        suggestions={suggestions[3]}
        validator={validators[3].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          scriptSegments[3] = value;
          validators[3].value = !validationError;
          sendData();
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    </BlockRow>

    {#if mode === 2 || mode === 3}
      <BlockRow>
        <div class="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div class="flex flex-col">
            <MeltCombo
              title="MSB"
              value={nrpnMSB}
              suggestions={suggestions[2]}
              validator={validators[4].func}
              on:input={(e) => {
                const { value, validationError } = e.detail;
                nrpnMSB = value;
                validators[4].value = !validationError;
                scriptSegments[2] = calculateNRPNCC(nrpnMSB, nrpnLSB);
                sendData();
              }}
              on:change={() => dispatch("sync")}
              postProcessor={GridScript.shortify}
              preProcessor={GridScript.humanize}
            />
            <MeltCombo
              title="LSB"
              value={nrpnLSB}
              suggestions={suggestions[2]}
              validator={validators[5].func}
              on:input={(e) => {
                const { value, validationError } = e.detail;
                nrpnLSB = value;
                validators[5].value = !validationError;
                scriptSegments[2] = calculateNRPNCC(nrpnMSB, nrpnLSB);
                sendData();
              }}
              on:change={() => dispatch("sync")}
              postProcessor={GridScript.shortify}
              preProcessor={GridScript.humanize}
            />
          </div>
          <div class="w-7 h-7 fill-white">
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 47.52 477.43 382.39"
            >
              <g
                ><polygon
                  points="101.82,187.52 57.673,143.372 476.213,143.372 476.213,113.372 57.181,113.372 101.82,68.733 80.607,47.519 0,128.126 80.607,208.733"
                /><polygon
                  points="396.82,268.694 375.607,289.907 420,334.301 1.213,334.301 1.213,364.301 420,364.301 375.607,408.694 396.82,429.907 477.427,349.301"
                /></g
              >
            </svg>
          </div>
          <MeltCombo
            title="NRPN CC"
            value={scriptSegments[2]}
            suggestions={suggestions[2]}
            validator={validators[2].func}
            on:input={(e) => {
              const { value, validationError } = e.detail;
              scriptSegments[2] = value;
              validators[2].value = !validationError;
              nrpnMSB = `(${value})//128`;
              nrpnLSB = `(${value})%128`;
              sendData();
            }}
            on:change={() => dispatch("sync")}
            postProcessor={GridScript.shortify}
            preProcessor={GridScript.humanize}
          />
        </div>
      </BlockRow>
    {/if}
  </Block>

  <Block>
    <BlockTitle>Receive MIDI</BlockTitle>
    <BlockRow>
      <MeltCheckbox bind:target={feature1} title="Sync value" />
      <MeltCheckbox bind:target={feature2} title="Sync LED intensity" />
    </BlockRow>
  </Block>

  <div class="mt-2">
    <SendFeedback feedback_context="Midi" />
  </div>
</action-midi>
