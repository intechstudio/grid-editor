<script lang="ts">
  import { GridModule, GridRuntime } from "./../../../../runtime/runtime";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { Grid } from "../../../../lib/_utils";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { tooltip } from "../../../_actions/tooltip";
  import { bootloaderRebootRequestedAt } from "../../../firmware_install";

  export let visible = false;
  export let device: GridModule;

  $: runtime = device?.parent as GridRuntime;

  // Counter-rotate so the text stays upright (same as CalibrationOverlay)
  $: deviceRotationDeg = (device?.rot ?? 0) * -90;
  $: totalRotation = Grid.addRotations(
    $appSettings.persistent.moduleRotation,
    $runtime?.rotation ?? 0,
  );
  $: counterRotation = -deviceRotationDeg - totalRotation;

  $: requiredVersion =
    device?.architecture === "esp32"
      ? $appSettings.firmware_esp32_required
      : device?.architecture === "rp2350"
        ? $appSettings.firmware_rp2350_required
        : $appSettings.firmware_d51_required;

  let pending = false;
  let result: string | null = null;
  let failed = false;
  let requestedFor: GridModule | undefined;

  // Query once per device each time the overlay becomes visible
  $: if (visible && device?.fwMismatch && requestedFor !== device) {
    fetchBootloaderInfo(device);
  }
  $: if (!visible) {
    requestedFor = undefined;
  }

  // Bootloader mode works over USB, so only the USB connected module (0,0)
  // can be rebooted into it
  $: isUsbModule = device?.dx === 0 && device?.dy === 0;

  // No tinyuf2 bootloader -> reboot into the ROM bootloader instead
  $: romOnly = result?.startsWith("No Bootloader") ?? false;

  // Paint every LED a fixed color so the ROM bootloader state is visible
  const LED_COLOR_SCRIPT = `for e = 0, #ele - 1 do
  for i = 0, 4 do
    local lix = glag(e, i)
    if lix ~= nil then
      for layer = 0, 2 do
        glc(lix, layer, 0, 0, 0)
      end
    end
  end
end`;

  function handleReboot() {
    if (!isUsbModule) return;
    bootloaderRebootRequestedAt.set(Date.now());
    if (romOnly) {
      device?.execConfigImmediate(LED_COLOR_SCRIPT);
      device?.execConfigImmediate("grrb()");
    } else {
      device?.execConfigImmediate("grtu()");
    }
  }

  async function fetchBootloaderInfo(target: GridModule) {
    requestedFor = target;
    pending = true;
    result = null;
    failed = false;
    try {
      const res = await target.execLUAImmediateAndEvalaute("return gbi()");
      if (requestedFor !== target) return;
      const value = res.value?.[0];
      result =
        typeof value === "string" ? value : JSON.stringify(res.value, null, 2);
    } catch (e) {
      if (requestedFor !== target) return;
      failed = true;
      console.warn("gbi() evaluate failed:", e);
    } finally {
      if (requestedFor === target) pending = false;
    }
  }
</script>

{#if visible && !device?.fwMismatch}
  <container>
    <div
      class="fw-mismatch-overlay-bg text-foreground w-full flex flex-col items-center justify-center rounded h-full absolute pointer-events-auto gap-2 p-3 text-center"
      style="transform: rotate({counterRotation}deg); border-radius: var(--grid-rounding);"
    >
      <span class="font-bold">Up to date!</span>
      <span class="text-foreground-muted text-sm">
        {device?.fwVersion?.major}.{device?.fwVersion?.minor}.{device?.fwVersion
          ?.patch}
      </span>
    </div>
  </container>
{:else if visible}
  <container>
    <div
      class="fw-mismatch-overlay-bg text-foreground w-full flex flex-col items-center justify-center rounded h-full absolute pointer-events-auto gap-2 p-3 text-center"
      style="transform: rotate({counterRotation}deg); border-radius: var(--grid-rounding);"
    >
      <span class="font-bold">Outdated firmware</span>
      <span class="text-foreground-muted text-sm">
        {device.fwVersion?.major}.{device.fwVersion?.minor}.{device.fwVersion
          ?.patch} → {requiredVersion?.major}.{requiredVersion?.minor}.{requiredVersion?.patch}
      </span>
      {#if pending}
        <span class="text-foreground-muted text-sm">Reading bootloader...</span>
      {:else if failed}
        <span class="text-sm text-center">
          Hold the utility button while plugging in the USB cable!
        </span>
      {:else if result !== null}
        <!-- Block is centered in the overlay, its text is left aligned -->
        <div class="flex justify-center w-full">
          <pre
            class="text-xs font-mono whitespace-pre-wrap break-all select-text text-left w-fit max-w-full">{result}</pre>
        </div>
        {#if isUsbModule}
          <MoltenPushButton
            text={romOnly ? "Reboot to ROM bootloader" : "Reboot to TinyUF2"}
            click={handleReboot}
            disabled={!isUsbModule}
          />
        {:else}
          <!-- Disabled buttons don't get hover events, so the wrapper carries the tooltip -->
          <div
            use:tooltip={{
              placement: "top",
              class: "w-60 p-4 z-10",
              text: "Bootloader mode works over USB. Please connect this module via USB to update its firmware!",
            }}
          >
            <MoltenPushButton
              text={romOnly ? "Reboot to ROM bootloader" : "Reboot to TinyUF2"}
              click={handleReboot}
              disabled={true}
            />
          </div>
          <span class="text-sm text-center">
            Hold the utility button while plugging in the USB cable!
          </span>
        {/if}
      {/if}
    </div>
  </container>
{/if}

<style>
  .fw-mismatch-overlay-bg {
    background-color: var(--overlay-bg);
  }
</style>
