<script lang="ts">
  import {
    user_input,
    UserInputValue,
  } from "./../../../runtime/user-input.store";
  import Toggle from "../../user-interface/Toggle.svelte";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { derived, get } from "svelte/store";
  import { debug_monitor_store } from "../DebugMonitor/DebugMonitor.store";
  import {
    midi_monitor_store,
    sysex_monitor_store,
    MusicalNotes,
    MidiMonitorItem,
    SysExMonitorItem,
  } from "./MidiMonitor.store";
  import { MoltenPushButton, SvgIcon } from "@intechstudio/grid-uikit";
  import { GridEvent } from "../../../runtime/runtime";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import { Grid } from "../../../lib/_utils";
  import MidiTester from "./MidiTester.svelte";
  import DebugTextList from "../DebugMonitor/DebugTextList.svelte";
  import { scrollToBottom } from "../../_actions/scroll.move";

  let event: GridEvent;

  $: handleUserInputChange($user_input);

  function handleUserInputChange(ui: UserInputValue) {
    const active = get(runtime_manager).active.runtime;
    event = active.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype,
    );
  }

  let configScriptLength = 0;

  function replaceNRPNMessages(messages: MidiMonitorItem[]) {
    const NRPNCC = [99, 98, 38, 6];

    for (let i = 0; i < messages.length; i++) {
      if (messages[i].data.params.p1.value !== 99) continue;

      const spliceLength = messages[i + 3]?.data.params.p1.value === 38 ? 4 : 3;
      const NRPNMessages = messages.slice(i, i + spliceLength);

      if (
        NRPNMessages.length < spliceLength ||
        !NRPNMessages.every((e) => NRPNCC.includes(e.data.params.p1.value))
      ) {
        continue;
      }

      const [m1, m2, m3, m4] = messages.splice(i, spliceLength);
      m1.data.command.name += " (NRPN)";
      m1.data.command.short += " (NPRN)";
      m1.data.params.p1.value =
        (m1.data.params.p2.value << 7) + m2.data.params.p2.value;
      m1.data.params.p2.value =
        spliceLength === 4
          ? (m3.data.params.p2.value << 7) + m4.data.params.p2.value
          : m3.data.params.p2.value;

      messages.splice(i, 0, m1); // Re-insert modified m1
    }

    return messages;
  }

  function replaceHighResMidiMessages(messages: MidiMonitorItem[]) {
    for (let i = 0; i < messages.length; i++) {
      const HiResMessages = messages.slice(i, i + 2);

      if (
        HiResMessages.length !== 2 ||
        !HiResMessages.every((e) => e.data.command.short === "CC")
      ) {
        continue;
      }

      const offset_diff =
        HiResMessages[0].data.params.p1.value -
        HiResMessages[1].data.params.p1.value;
      if (offset_diff !== -32) {
        continue;
      }

      // Extract the two messages from the slice
      const [m1, m2] = messages.splice(i, 2);

      // Get the two halves of the high-resolution value
      const upper_value = m1.data.params.p2.value << 7;
      const lower_value = m2.data.params.p2.value;

      // Update display values
      m1.data.command.name += " (14)";
      m1.data.command.short += " (14)";

      // Set the high-resolution message's value
      m1.data.params.p2.value = upper_value + lower_value;

      // Insert the modified message back into the array
      messages.splice(i, 0, m1);
    }

    return messages;
  }

  const debug_stream = derived(
    [midi_monitor_store, sysex_monitor_store],
    ([$midi_monitor_store, $sysex_monitor_store]) => {
      return [
        ...$midi_monitor_store.map((e) => structuredClone(e)),
        ...$sysex_monitor_store.map((e) => structuredClone(e)),
      ].sort((a, b) => a.date - b.date);
    },
  );

  //Human readable midi store
  const human_midi_store = derived(
    [midi_monitor_store],
    ([$midi_monitor_store]) => {
      let result = replaceNRPNMessages(
        $midi_monitor_store.map((e) => structuredClone(e)),
      );
      result = replaceHighResMidiMessages(result);
      result.forEach((e) => {
        e = assignP1ValueAlias(e);
      });
      return result;
    },
  );

  $: {
    configScriptLength = $event?.toLua().length ?? 0;
  }

  //Defines
  let debug = false;
  let hover = false;
  let last = undefined;

  let activity = false;
  let timer = undefined;

  //Assign PARAM1 value aliases e.g.: musical note names to Int values
  //If possible: display these values instead of the Int values
  function assignP1ValueAlias(obj) {
    let p1 = obj.data.params.p1;

    //Does not have alias yet
    if (typeof p1.value_alias === "undefined") {
      switch (p1.name) {
        case "Note":
          p1.value_alias = MusicalNotes.FromInt(p1.value);
          break;
      }
    }
    return obj;
  }

  $: if ($sysex_monitor_store || $human_midi_store) {
    showActivity();
  }

  $: last = $human_midi_store?.at(-1);

  function showActivity() {
    activity = true;
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      activity = false;
    }, 250);
  }

  function onLeaveMidiMessage() {
    hover = false;
    let mms = get(human_midi_store);
    last = mms[mms.length - 1];
  }

  function onEnterMidiMessage(element) {
    hover = true;
    last = element;
  }

  function onClearClicked() {
    last = undefined;
    debug_monitor_store.update((s) => {
      s = [];
      return s;
    });
    midi_monitor_store.update((s) => {
      s = [];
      return s;
    });
    sysex_monitor_store.update((s) => {
      s = [];
      return s;
    });
  }

  const isMIDI = (
    msg: MidiMonitorItem | SysExMonitorItem,
  ): msg is MidiMonitorItem => msg.type === "MIDI";
</script>

<container data-testid="midi-monitor" class="flex flex-col h-full p-4">
  <div class="flex flex-row w-full text-white justify-between">
    <div class="flex text-2xl">MIDI Monitor</div>
    <div class="flex items-center">
      <span class="text-white font-medium mr-2">Debug View</span>
      <Toggle bind:toggleValue={debug} />
    </div>
  </div>
  {#if !debug}
    <div class="py-8 px-6">
      <div class="border-gray-700 border rounded flex flex-col col-span-3 mb-2">
        <span class="text-white bg-secondary px-2 truncate">Command</span>
        <div
          class="flex flex-row w-full text-white justify-between align-center items-center"
        >
          <div class="flex items-center py-1 px-3">
            <span class="flex text-white truncate"
              >{last ? last.data.command.name : "Waiting for MIDI..."}</span
            >
          </div>
          {#if last}
            <div
              class="items-center px-2 mx-2 flex flex-row rounded-lg text-center transition-width duration-200 {hover
                ? 'bg-green-400'
                : 'bg-white'}"
            >
              <div
                class="flex {hover ? 'text-white' : 'text-primary'} text-center"
              >
                {hover ? "SELECT" : "LAST"}
              </div>
              <div
                class="ml-2 flex place-self-end self-center {activity
                  ? 'bg-yellow-500'
                  : ' '} rounded-full w-3 h-3"
              />
            </div>
          {/if}
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 my-4 text-center">
        <div class="border-gray-700 border rounded flex flex-col">
          <span class="text-white bg-secondary px-1 truncate">Channel</span>
          <span class="px-2 text-white text-center truncate"
            >{last ? last.data.channel + 1 : "---"}</span
          >
        </div>
        <div class="border-gray-700 border rounded flex flex-col">
          <span class="text-white bg-secondary px-1 truncate">Device</span>
          <span class="px-2 text-white text-center truncate"
            >{last ? last.device.name : "---"}</span
          >
        </div>
        <div class="border-gray-700 border rounded flex flex-col">
          <span class="text-white bg-secondary px-1 truncate">Direction</span>
          <span class="px-2 text-white text-center truncate"
            >{last
              ? last.data.direction == "REPORT"
                ? "Receive"
                : "Transmit"
              : "---"}</span
          >
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 place-items-center">
        <div class="border-gray-700 border rounded flex flex-col w-44">
          <div class="flex flex-row w-full text-white">
            <span class="text-white text-center bg-secondary w-full truncate"
              >{last ? last.data.params.p1.name : "Parameter 1"}</span
            >
          </div>

          <span class="text-white text-center truncate"
            >{last
              ? last.data.params.p1.value_alias
                ? last.data.params.p1.value_alias
                : last.data.params.p1.value
              : "---"}</span
          >
        </div>
        <div class="border-gray-700 border rounded flex flex-col w-44">
          <div class="flex flex-row w-full text-white">
            <span class="text-white text-center bg-secondary w-full truncate"
              >{last ? last.data.params.p2.name : "Parameter 2"}</span
            >
          </div>

          <span class="text-white text-center truncate"
            >{last ? last.data.params.p2.value : "---"}</span
          >
        </div>
      </div>
    </div>
  {/if}

  <div class="overflow-hidden flex flex-col h-full">
    <Splitpanes
      horizontal={true}
      theme="modern-theme"
      pushOtherPanes={false}
      class="h-full w-full"
    >
      <Pane size={debug ? 70 : 50}>
        <div class="flex flex-col overflow-hidden h-full">
          {#if debug}
            <div class="m-4">
              <MidiTester />
            </div>
            <div class="flex w-full font-medium text-white pb-2 pt-8">
              MIDI Messages (RAW)
            </div>
            <div class="w-full grid grid-cols-6 text-white">
              <div>[X,Y]</div>
              <div>CH</div>
              <div>CMD</div>
              <div>P1</div>
              <div>P2</div>
              <div>DIR</div>
            </div>
            <div
              class="flex flex-col grow overflow-y-auto bg-secondary"
              use:scrollToBottom={debug_stream}
            >
              {#each $debug_stream as message}
                <div
                  class="grid grid-cols-7 items-start justify-start w-full font-mono {message
                    .data.direction == 'REPORT'
                    ? 'text-blue-600 '
                    : 'text-green-400 '}"
                >
                  <div class="col-span-2">
                    [{message.device.x}, {message.device.y}]
                  </div>
                  {#if isMIDI(message)}
                    <div>{message.data.channel + 1}</div>
                    <div>{message.data.command.value}</div>
                    <div>{message.data.params.p1.value}</div>
                    <div>{message.data.params.p2.value}</div>
                  {:else}
                    <div class="col-span-4">
                      SysEx: {String.fromCharCode
                        .apply(String, message.data.raw)
                        .substr(8)}
                    </div>
                  {/if}
                  <div class="flex items-center">
                    {#if message.data.direction == "REPORT"}
                      <span>RX</span>
                      <SvgIcon fill="#FFF" iconPath="arrow_left" />
                    {:else}
                      <span>TX</span>
                      <SvgIcon fill="#FFF" iconPath="arrow_right" />
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="flex w-full text-white pb-2">MIDI Messages</div>
            <div
              class="flex flex-col h-full bg-secondary overflow-y-auto overflow-x-hidden"
              use:scrollToBottom={human_midi_store}
            >
              {#each $human_midi_store as midi}
                <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                  class="grid grid-cols-8 gap-2 {midi.data.direction == 'REPORT'
                    ? 'text-blue-600 hover:text-blue-400'
                    : 'text-green-400 hover:text-green-200'}
                  transition-transform origin-left hover:scale-105 duration-100 transform scale-100"
                  on:mouseover={() => onEnterMidiMessage(midi)}
                  on:mouseleave={() => onLeaveMidiMessage()}
                >
                  <div
                    class="flex flex-row gap-1 min-w-fit min-h-fit col-span-2"
                  >
                    <span class="text-white">{midi.device.name}</span>
                    {#if midi.data.direction == "REPORT"}
                      <SvgIcon
                        fill="#FFF"
                        iconPath="arrow_left"
                        width={14}
                        height={14}
                      />
                    {:else}
                      <SvgIcon
                        fill="#FFF"
                        iconPath="arrow_right"
                        width={14}
                        height={14}
                      />
                    {/if}
                  </div>
                  <span class="truncate">Ch: {midi.data.channel + 1}</span>
                  <span class="truncate">{midi.data.command.short}</span>
                  <span class="truncate">{midi.data.params.p1.short}:</span>
                  <span class="truncate"
                    >{midi.data.params.p1.value_alias
                      ? midi.data.params.p1.value_alias
                      : midi.data.params.p1.value}</span
                  >
                  <span class="truncate">{midi.data.params.p2.short}:</span>
                  <span class="truncate">{midi.data.params.p2.value}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </Pane>
      <Pane size={debug ? 30 : 50}>
        {#if debug}
          <div class="flex flex-col h-full w-full">
            <div
              class="text-white flex flex-row pb-2 pt-6 font-medium justify-between"
            >
              <div>Debug Text</div>
              <div class="flex flex-row">
                <div class="pr-2">Char Count:</div>
                <div
                  class={configScriptLength >= Grid.Protocol.maxScriptLength
                    ? "text-error"
                    : configScriptLength >=
                        (Grid.Protocol.maxScriptLength / 3) * 2
                      ? "text-yellow-400"
                      : "text-white"}
                >
                  {configScriptLength}
                </div>
              </div>
            </div>

            <DebugTextList />
          </div>
        {:else}
          <div class="flex flex-col h-full w-full">
            <div class="flex w-full text-white pb-2 pt-6">
              System Exclusive Messages
            </div>
            <div
              class="flex flex-col h-full bg-secondary overflow-y-auto overflow-x-hidden"
              use:scrollToBottom={sysex_monitor_store}
            >
              {#each $sysex_monitor_store as sysex}
                <div
                  class="{sysex.data.direction == 'REPORT'
                    ? 'text-blue-400'
                    : 'text-green-400'} font-mono"
                >
                  <div class="flex flex-row gap-2">
                    <div class="flex flex-row text-white">
                      <span>{sysex.device.name}</span>
                      {#if sysex.data.direction == "REPORT"}
                        <SvgIcon fill="#FFF" iconPath="arrow_left" />
                      {:else}
                        <SvgIcon fill="#FFF" iconPath="arrow_right" />
                      {/if}
                    </div>

                    <span>
                      {String.fromCharCode
                        .apply(String, sysex.data.raw)
                        .substr(8)}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </Pane>
    </Splitpanes>
  </div>
  <div class="flex pt-4 pb-12">
    <MoltenPushButton text="Clear All" snap={"full"} click={onClearClicked} />
  </div>
</container>
