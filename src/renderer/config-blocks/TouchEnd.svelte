<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation";
  import { zoneEndInformation } from "./touch/zone-block-info";
  // Component for the untoggled "header" of the component
  import CompositeFace from "./headers/CompositeFace.svelte";
  export const header = CompositeFace;

  export const information: ActionBlockInformation = zoneEndInformation;
</script>
