<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation";
  import { zoneBlockInformation } from "./touch/zone-block-info";
  // Component for the untoggled "header" of the component
  import ZoneFace from "./headers/ZoneFace.svelte";
  export const header = ZoneFace;

  export const information: ActionBlockInformation =
    zoneBlockInformation("fader");
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GridAction } from "../runtime/runtime";
  import ZoneBlock from "./touch/ZoneBlock.svelte";

  export let action: GridAction;

  const dispatch = createEventDispatcher();
</script>

<ZoneBlock
  {action}
  on:update-action={(e) => dispatch("update-action", e.detail)}
  on:sync={() => dispatch("sync")}
/>
