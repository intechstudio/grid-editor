<script lang="ts">
  import type { GridModule } from "../../../../runtime/runtime";
  import { profileLoadProgress } from "../../../../runtime/profileLoadProgress";

  export let visible = false;
  export let device: GridModule;

  $: map = $profileLoadProgress;
  $: entry = map && map[`${device.dx},${device.dy}`];
</script>

{#if visible && entry}
  <div
    class="w-full h-full flex flex-col items-center justify-center rounded absolute pointer-events-auto"
    style="background-color: var(--overlay-bg); border-radius: var(--grid-rounding); color: var(--foreground);"
  >
    <div class="flex flex-col items-center gap-2 text-sm">
      {#if !entry.available}
        <span>Profile not available</span>
      {:else if entry.operationTotal === 0}
        <span>Waiting...</span>
      {:else if entry.operationCompleted < entry.operationTotal}
        <span>Loading profile...</span>
        <span>{entry.operationCompleted} / {entry.operationTotal} events</span>
        <div
          class="w-5 h-5 border-2 rounded-full animate-spin"
          style="border-color: var(--foreground); border-top-color: transparent;"
        ></div>
      {:else}
        <span>Done</span>
      {/if}
    </div>
  </div>
{/if}
