<script lang="ts">
  import { derived } from "svelte/store";
  import { appSettings } from "../../runtime/app-helper.store";
  import { getMockRuntime } from "../../runtime/mock-module";
  import GridLayout from "../grid-layout/GridLayout.svelte";
  import ModulConnectionDialog from "./ModulConnectionDialog.svelte";
  import FirmwareUpdatePanel from "./FirmwareUpdatePanel.svelte";

  const runtime = getMockRuntime();
  const scale = derived(
    appSettings,
    ($appSettings) => 1 * $appSettings.persistent.size,
  );
</script>

<!-- Shown only while no module is connected: a module-sized mock module with
a permanent overlay holding either the "no connected modules" dialog or the
bootloader / firmware update flow. -->
<div class={$$props.class}>
  <div class="relative">
    <div class="pointer-events-none">
      <GridLayout {runtime} {scale} interactive={false} />
    </div>
    <!-- Same border as a real module (underlays/ModuleBorder.svelte) -->
    <div
      class="absolute top-0 left-0 w-full h-full border-2 pointer-events-none"
      style="border-color: var(--border); border-radius: var(--radius);"
    ></div>
    <div
      class="absolute inset-0 flex items-center justify-center"
      style="background-color: color-mix(in srgb, var(--background) 80%, transparent); border-radius: var(--radius);"
    >
      {#if $appSettings.firmwareNotificationState >= 3}
        <FirmwareUpdatePanel compact />
      {:else}
        <ModulConnectionDialog compact />
      {/if}
    </div>
  </div>
</div>
