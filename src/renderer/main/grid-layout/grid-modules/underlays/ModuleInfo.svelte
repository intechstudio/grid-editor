<script lang="ts">
  import { Architecture, grid } from "@intechstudio/grid-protocol";
  import { GridModule } from "../../../../runtime/runtime";
  import { user_input } from "../../../../runtime/user-input.store";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { derived, get } from "svelte/store";

  export let visible = true;
  export let device: GridModule = undefined;

  const HWCFG = grid.getProperty("HWCFG");
  const cdHwcfgs = Object.entries(HWCFG)
    .filter(([key]) => key.includes("_CD_"))
    .map(([, val]) => Number(val));
  const ndHwcfgs = Object.entries(HWCFG)
    .filter(([key]) => key.includes("_ND_"))
    .map(([, val]) => Number(val));

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
    {#if device?.architecture !== Architecture.VIRTUAL}
      <span
        style={device?.memorystat > 110
          ? "color: color-mix(in srgb, orange 75%, var(--foreground));"
          : ""}
        >{device?.memorystat == undefined ? "" : device?.memorystat + "k"}</span
      >
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
    {#if $appSettings.persistent.variantLabelEnabled}
      {#if cdHwcfgs.includes(device?.hwcfg)}
        <span class="text-red-500">Center</span>
      {:else if ndHwcfgs.includes(device?.hwcfg)}
        <span class="text-red-500">Smooth</span>
      {:else}
        <span class="text-green-500">Normal</span>
      {/if}
    {/if}
  </div>
{/if}
