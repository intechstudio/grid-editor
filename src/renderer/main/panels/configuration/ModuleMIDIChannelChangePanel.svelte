<script lang="ts">
  import { MeltSelect } from "@intechstudio/grid-uikit";
  import { ElementType } from "@intechstudio/grid-protocol";
  import { GridElement, GridPage } from "../../../runtime/runtime";
  import {
    moduleMidiChannelState,
    writeModuleMidiChannel,
    type ModuleMidiChannelState,
  } from "../../../runtime/system-midi-channel";

  export let element: GridElement | undefined;

  const AUTO = "auto";
  const EXPRESSION = "custom";
  const channelOptions = [
    { title: "Auto", value: AUTO },
    ...Array.from({ length: 16 }, (_, index) => ({
      title: `Channel ${index + 1}`,
      value: String(index + 1),
    })),
  ];

  let selectedChannel = AUTO;
  let displayedChannel = AUTO;

  $: options =
    selectedChannel === EXPRESSION
      ? [...channelOptions, { title: "Expression", value: EXPRESSION }]
      : channelOptions;

  $: channelState = moduleMidiChannelState(
    element ? (element.parent as GridPage) : undefined,
  );
  $: setSelectedChannel($channelState);

  $: if (selectedChannel !== displayedChannel) {
    displayedChannel = selectedChannel;
    writeSelectedChannel(selectedChannel);
  }

  function setSelectedChannel(state: ModuleMidiChannelState) {
    const value =
      state.kind === "channel"
        ? String(state.value + 1)
        : state.kind === "custom"
          ? EXPRESSION
          : AUTO;
    selectedChannel = value;
    displayedChannel = value;
  }

  function writeSelectedChannel(value: string) {
    if (
      !element ||
      element.type !== ElementType.SYSTEM ||
      value === EXPRESSION
    ) {
      return;
    }

    const channel = value === AUTO ? null : Number(value);
    if (channel === null || Number.isInteger(channel)) {
      writeModuleMidiChannel(
        element.parent as GridPage,
        channel === null ? null : channel - 1,
      );
    }
  }
</script>

{#if element?.type === ElementType.SYSTEM}
  <div
    class="flex flex-col gap-2 w-full text-sm items-start whitespace-nowrap p-3"
  >
    <span>Module MIDI Channel</span>
    <div class="flex w-full" data-testid="system-midi-channel">
      <MeltSelect {options} bind:target={selectedChannel} size="full" />
    </div>
  </div>
{/if}
