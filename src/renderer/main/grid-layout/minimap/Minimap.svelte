<script lang="ts">
  import { GridRuntime } from "../../../runtime/runtime";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import MinimapDevice from "./MinimapDevice.svelte";
</script>

<container>
  {#each $runtime_manager.data
    .filter((e) => !e.runtime.virtual)
    .map((e) => e.runtime.findModule(0, 0))
    .filter((e) => e) as connection}
    <MinimapDevice type={connection.type} />
  {/each}
</container>
