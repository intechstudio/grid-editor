<script lang="ts">
  import { Architecture } from "@intechstudio/grid-protocol";
  import { GridModule } from "../../../../runtime/runtime";
  import { user_input } from "../../../../runtime/user-input.store";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { derived, get } from "svelte/store";

  export let visible = true;
  export let device: GridModule = undefined;

  const page = derived([device, user_input], ([$device, $user_input]) =>
    device.findPage($user_input.pagenumber),
  );
  const totalEventCount = get(page).control_elements.reduce(
    (a, c) => a + c.events.length,
    0,
  );
  const loadedEventCount = derived(page, ($page) =>
    $page.control_elements.reduce(
      (a, c) => a + c.events.reduce((a, c) => a + (c.isLoaded() ? 1 : 0), 0),
      0,
    ),
  );
</script>

{#if visible && typeof device.architecture !== "undefined"}
  <div
    class="absolute text-foreground-muted flex flex-col font-mono items-center bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-0.5 text-opacity-20 font-bold text-xs pointer-events-none"
  >
    {#if $appSettings.persistent.eventsLoaded}
      <div class="flex flex-row">
        <span>{$loadedEventCount}/{totalEventCount}</span>
      </div>
    {/if}
    {#if device?.architecture === Architecture.VIRTUAL}
      <span>VIRTUAL</span>
    {:else if device?.architecture === "esp32"}
      <span>E-32 </span>
    {:else if device?.architecture === "d51"}
      <span>D-51 </span>
    {/if}
    {#if device?.architecture !== Architecture.VIRTUAL}
      <span
        >{"v" +
          device?.fwVersion?.major +
          "." +
          device?.fwVersion?.minor +
          "." +
          device?.fwVersion?.patch}</span
      >
    {/if}
  </div>
{/if}
