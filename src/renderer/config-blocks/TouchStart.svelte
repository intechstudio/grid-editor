<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation";
  import { touchStartInformation } from "./touch/zone-block-info";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = touchStartInformation;
</script>

<touch-start class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  <span class="text-sm text-gray-400">
    Starts the touch zones defined above it: touch input, MIDI receive, the
    first LED paint and the Touch Tick timer. Keep it the last block of the
    touch Setup.
  </span>
</touch-start>
