<script lang="ts">
  import {
    user_input,
    type UserInputValue,
  } from "./../../../runtime/user-input.store";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { get, writable, type Writable } from "svelte/store";
  import { debug_monitor_store } from "../DebugMonitor/DebugMonitor.store";
  import {
    midi_stream,
    MidiData,
    type MidiStreamData,
    type MidiStreamItem,
    MidiType,
    SysExData,
  } from "./MidiMonitor.store";
  import { MoltenPushButton, SvgIcon, Toggle } from "@intechstudio/grid-uikit";
  import { GridEvent } from "../../../runtime/runtime";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { Grid } from "../../../lib/_utils";
  import MidiTester from "./MidiTester.svelte";
  import DebugTextList from "../DebugMonitor/DebugTextList.svelte";
  import { copyContextMenu } from "../../_actions/copy-context-menu.action";
  import { onDestroy, onMount, tick } from "svelte";
  import {
    type MidiWorkerCommand,
    type MidiWorkerResponse,
  } from "./midiWorker";
  import VirtualList from "svelte-tiny-virtual-list";

  //Defines
  let debug = false;
  let hover = false;
  let last = undefined;
  let configScriptLength = 0;
  let activity = false;
  let timer = undefined;
  let event: GridEvent;
  let worker: Worker;
  let mounted = false;

  let midiMessageListHeight: number;
  let sysExMessageListHeight: number;
  let debugMessageListHeight: number;

  const maxMessageCount = 1024;

  let lastMidiMessageIndex = 0;
  let lastSysExMessageIndex = 0;
  let lastMidiStreamItemIndex = 0;

  const midi_messages: Writable<(MidiStreamItem & { data: MidiData })[]> =
    writable([]);
  const sysex_messages: Writable<(MidiStreamItem & { data: SysExData })[]> =
    writable([]);

  onMount(() => {
    worker = new Worker(new URL("./midiWorker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = handleWorkerMessage;

    midi_stream.subscribe((s) => {
      if (!mounted) {
        return;
      }
      const incoming = s.last;
      if (typeof incoming === "undefined") {
        return;
      }

      worker.postMessage({ item: incoming } as MidiWorkerCommand);
    });

    for (const item of $midi_stream.buffer) {
      // guard after svelte 5 migration
      if (item) {
        worker.postMessage({ item: item } as MidiWorkerCommand);
      }
    }
    mounted = true;
  });

  onDestroy(() => {
    worker.terminate();
  });

  $: handleUserInputChange($user_input);

  $: configScriptLength = $event?.toLua().length ?? 0;

  $: if ($midi_stream) {
    showActivity();
  }

  $: last = $midi_messages?.at(-1);

  $: if (midiMessageListHeight) {
    handleResize($midi_messages, (value) => (lastMidiMessageIndex = value));
  }
  $: if (sysExMessageListHeight) {
    handleResize($sysex_messages, (value) => (lastSysExMessageIndex = value));
  }
  $: if (debugMessageListHeight) {
    handleResize(
      $midi_stream.buffer,
      (value) => (lastMidiStreamItemIndex = value),
    );
  }

  async function handleWorkerMessage(e: MessageEvent<MidiWorkerResponse>) {
    const { item } = e.data;
    switch (item.type) {
      case MidiType.SYSEX: {
        sysex_messages.update((s) => {
          let result = [...s, item as MidiStreamItem & { data: SysExData }];
          if (result.length > maxMessageCount) {
            result.shift();
          }
          return result;
        });
        break;
      }
      case MidiType.MIDI: {
        midi_messages.update((s) => {
          let result = [...s, item as MidiStreamItem & { data: MidiData }];
          if (result.length > maxMessageCount) {
            result.shift();
          }
          return result;
        });
        break;
      }
    }
  }

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
    let mms = get(midi_messages);
    last = mms[mms.length - 1];
  }

  function onEnterMidiMessage(element) {
    hover = true;
    last = element;
  }

  function handleResize(array: any[], setIndex: (value: number) => void) {
    setIndex(Math.max(array.length - 2, 0));
    requestAnimationFrame(() => {
      setIndex(array.length - 1);
    });
  }

  function onClearClicked() {
    last = undefined;
    midi_stream.clear();
    debug_monitor_store.update((s) => {
      s = [];
      return s;
    });

    midi_messages.set([]);
    sysex_messages.set([]);

    lastMidiMessageIndex = 0;
    lastSysExMessageIndex = 0;
    lastMidiStreamItemIndex = 0;
  }

  function isMIDI(
    message: MidiStreamItem,
  ): message is MidiStreamItem & { data: MidiData } {
    return message.type === MidiType.MIDI;
  }

  function isSysEx(
    message: MidiStreamItem,
  ): message is MidiStreamItem & { data: SysExData } {
    return message.type === MidiType.SYSEX;
  }
</script>

<container data-testid="midi-monitor" class="flex flex-col h-full p-4">
  <div class="flex flex-row w-full text-foreground justify-between">
    <div class="flex text-2xl">MIDI Monitor</div>

    <Toggle bind:value={debug} title="Debug View" />
  </div>
  {#if !debug}
    <div class="py-8 px-6">
      <div
        class="border flex flex-col col-span-3 mb-2"
        style="border-color: var(--border); border-radius: var(--radius);"
      >
        <span class="text-foreground bg-background-muted px-2 truncate"
          >Command</span
        >
        <div
          class="flex flex-row w-full text-foreground justify-between align-center items-center"
        >
          <div class="flex items-center py-1 px-3">
            <span class="flex text-foreground truncate"
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
                class="flex {hover
                  ? 'text-foreground'
                  : 'text-primary'} text-center"
              >
                {hover ? "SELECT" : "LAST"}
              </div>
              <div
                class="ml-2 flex place-self-end self-center {activity
                  ? 'bg-yellow-500'
                  : ' '} rounded-full w-3 h-3"
              ></div>
            </div>
          {/if}
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 my-4 text-center">
        <div
          class="border flex flex-col"
          style="border-color: var(--border); border-radius: var(--radius);"
        >
          <span class="text-foreground bg-background-muted px-1 truncate"
            >Channel</span
          >
          <span class="px-2 text-foreground text-center truncate"
            >{last ? last.data.channel + 1 : "---"}</span
          >
        </div>
        <div
          class="border flex flex-col"
          style="border-color: var(--border); border-radius: var(--radius);"
        >
          <span class="text-foreground bg-background-muted px-1 truncate"
            >Device</span
          >
          <span class="px-2 text-foreground text-center truncate"
            >{last ? last.device.name : "---"}</span
          >
        </div>
        <div
          class="border flex flex-col"
          style="border-color: var(--border); border-radius: var(--radius);"
        >
          <span class="text-foreground bg-background-muted px-1 truncate"
            >Direction</span
          >
          <span class="px-2 text-foreground text-center truncate"
            >{last
              ? last.data.direction == "REPORT"
                ? "Receive"
                : "Transmit"
              : "---"}</span
          >
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 place-items-center">
        <div
          class="border flex flex-col w-44"
          style="border-color: var(--border); border-radius: var(--radius);"
        >
          <div class="flex flex-row w-full text-foreground">
            <span
              class="text-foreground text-center bg-background-muted w-full truncate"
              >{last ? last.data.params.p1.name : "Parameter 1"}</span
            >
          </div>

          <span class="text-foreground text-center truncate"
            >{last
              ? last.data.params.p1.value_alias
                ? last.data.params.p1.value_alias
                : last.data.params.p1.value
              : "---"}</span
          >
        </div>
        <div
          class="border flex flex-col w-44"
          style="border-color: var(--border); border-radius: var(--radius);"
        >
          <div class="flex flex-row w-full text-foreground">
            <span
              class="text-foreground text-center bg-background-muted w-full truncate"
              >{last ? last.data.params.p2.name : "Parameter 2"}</span
            >
          </div>

          <span class="text-foreground text-center truncate"
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
            {#if $appSettings.persistent.midiTesterEnabled}
              <div class="m-4">
                <MidiTester />
              </div>
            {/if}
            <div class="flex w-full font-medium text-foreground pb-2 pt-8">
              MIDI Messages (RAW)
            </div>
            <div class="w-full grid grid-cols-6 text-foreground">
              <div>[X,Y]</div>
              <div>CH</div>
              <div>CMD</div>
              <div>P1</div>
              <div>P2</div>
              <div>DIR</div>
            </div>

            <div
              class="flex flex-col flex-grow bg-background-muted w-full overflow-clip select-text"
              use:copyContextMenu
              bind:clientHeight={debugMessageListHeight}
            >
              {#if lastMidiMessageIndex > 0}
                <VirtualList
                  itemCount={$midi_stream.buffer.length}
                  itemSize={20}
                  height={debugMessageListHeight}
                  scrollDirection="vertical"
                  scrollToIndex={lastMidiStreamItemIndex}
                >
                  <!-- svelte-ignore a11y-no-static-element-interactions -->
                  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                  <div
                    slot="item"
                    let:index
                    let:style
                    {style}
                    class="grid grid-cols-7 items-start justify-start w-full font-mono"
                    style:color={$midi_stream.buffer[index].data.direction ===
                    "REPORT"
                      ? "color-mix(in srgb, var(--foreground) 50%, #2563eb 50%)"
                      : "color-mix(in srgb, var(--foreground) 50%, #16a34a 50%)"}
                  >
                    <div class="col-span-2">
                      [{$midi_stream.buffer[index].device.x}, {$midi_stream
                        .buffer[index].device.y}]
                    </div>
                    {#if isMIDI($midi_stream.buffer[index])}
                      <div>{$midi_stream.buffer[index].data.channel + 1}</div>
                      <div>
                        {$midi_stream.buffer[index].data.command.value}
                      </div>
                      <div>
                        {$midi_stream.buffer[index].data.params.p1.value}
                      </div>
                      <div>
                        {$midi_stream.buffer[index].data.params.p2.value}
                      </div>
                    {:else if isSysEx($midi_stream.buffer[index])}
                      <div class="col-span-4">
                        SysEx: {String.fromCharCode
                          .apply(String, $midi_stream.buffer[index].data.raw)
                          .substr(8)}
                      </div>
                    {/if}
                    <div class="flex items-center">
                      {#if $midi_stream.buffer[index].data.direction == "REPORT"}
                        <span>RX</span>
                        <SvgIcon fill="currentColor" iconPath="arrow_left" />
                      {:else}
                        <span>TX</span>
                        <SvgIcon fill="currentColor" iconPath="arrow_right" />
                      {/if}
                    </div>
                  </div>
                </VirtualList>
              {/if}
            </div>
          {:else}
            <div class="flex w-full text-foreground pb-2">MIDI Messages</div>
            <div
              class="flex h-full bg-background-muted w-full overflow-clip select-text"
              use:copyContextMenu
              bind:clientHeight={midiMessageListHeight}
            >
              {#if lastMidiMessageIndex > 0}
                <VirtualList
                  itemCount={$midi_messages.length}
                  itemSize={20}
                  height={midiMessageListHeight}
                  scrollDirection="vertical"
                  scrollToIndex={lastMidiMessageIndex}
                >
                  <!-- svelte-ignore a11y-no-static-element-interactions -->
                  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                  <div
                    slot="item"
                    let:index
                    let:style
                    {style}
                    class="grid grid-cols-8 gap-2
              transition-transform origin-left duration-100 transform w-full"
                    style:color={$midi_messages[index].data.direction ===
                    "REPORT"
                      ? "color-mix(in srgb, var(--foreground) 50%, #2563eb 50%)"
                      : "color-mix(in srgb, var(--foreground) 50%, #16a34a 50%)"}
                    on:mouseover={() =>
                      onEnterMidiMessage($midi_messages[index])}
                    on:mouseleave={() => onLeaveMidiMessage()}
                  >
                    <div
                      class="flex flex-row gap-1 min-w-fit min-h-fit col-span-2"
                    >
                      <span>{$midi_messages[index].device.name}</span>
                      {#if $midi_messages[index].data.direction == "REPORT"}
                        <SvgIcon fill="currentColor" iconPath="arrow_left" />
                      {:else}
                        <SvgIcon fill="currentColor" iconPath="arrow_right" />
                      {/if}
                    </div>
                    <span class="truncate"
                      >Ch: {$midi_messages[index].data.channel + 1}</span
                    >
                    <span class="truncate"
                      >{$midi_messages[index].data.command.short}</span
                    >
                    <span class="truncate"
                      >{$midi_messages[index].data.params.p1.short}:</span
                    >
                    <span class="truncate"
                      >{$midi_messages[index].data.params.p1.value_alias
                        ? $midi_messages[index].data.params.p1.value_alias
                        : $midi_messages[index].data.params.p1.value}</span
                    >
                    <span class="truncate"
                      >{$midi_messages[index].data.params.p2.short}:</span
                    >
                    <span class="truncate"
                      >{$midi_messages[index].data.params.p2.value}</span
                    >
                  </div>
                </VirtualList>
              {/if}
            </div>
          {/if}
        </div>
      </Pane>
      <Pane size={debug ? 30 : 50}>
        {#if debug}
          <div class="flex flex-col h-full w-full">
            <div
              class="text-foreground flex flex-row pb-2 pt-6 font-medium justify-between"
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
                      : "text-foreground"}
                >
                  {configScriptLength}
                </div>
              </div>
            </div>

            <DebugTextList />
          </div>
        {:else}
          <div class="flex flex-col h-full w-full">
            <div class="flex w-full text-foreground pb-2 pt-6">
              System Exclusive Messages
            </div>
            <div
              class="flex h-full bg-background-muted w-full overflow-clip select-text"
              use:copyContextMenu
              bind:clientHeight={sysExMessageListHeight}
            >
              {#if lastSysExMessageIndex > 0}
                <VirtualList
                  itemCount={$sysex_messages.length}
                  itemSize={20}
                  height={sysExMessageListHeight}
                  scrollDirection="vertical"
                  scrollToIndex={lastSysExMessageIndex}
                >
                  <!-- svelte-ignore a11y-no-static-element-interactions -->
                  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                  <div
                    slot="item"
                    let:index
                    let:style
                    {style}
                    class="font-mono"
                    style:color={$sysex_messages[index].data.direction ===
                    "REPORT"
                      ? "color-mix(in srgb, var(--foreground) 50%, #2563eb 50%)"
                      : "color-mix(in srgb, var(--foreground) 50%, #16a34a 50%)"}
                  >
                    <div class="flex flex-row gap-2">
                      <div class="flex flex-row">
                        <span>{$sysex_messages[index].device.name}</span>
                        {#if $sysex_messages[index].data.direction == "REPORT"}
                          <SvgIcon fill="currentColor" iconPath="arrow_left" />
                        {:else}
                          <SvgIcon fill="currentColor" iconPath="arrow_right" />
                        {/if}
                      </div>

                      <span>
                        {String.fromCharCode
                          .apply(String, $sysex_messages[index].data.raw)
                          .substr(8)}
                      </span>
                    </div>
                  </div>
                </VirtualList>
              {/if}
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
