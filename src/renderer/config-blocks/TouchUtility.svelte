<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation";
  import { touchUtilityInformation } from "./touch/zone-block-info";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = touchUtilityInformation;
</script>

<touch-utility class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  <span class="text-sm text-gray-400">
    Press the utility button, then touch a zone within the mapping window (set
    in Touch Tick) to send only that zone's MIDI, for MIDI learn in your DAW.
    Press again to leave. Without a touch in the window, the page changes when
    the window ends.
  </span>
</touch-utility>
