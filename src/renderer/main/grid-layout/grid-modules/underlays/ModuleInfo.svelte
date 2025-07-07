<script>
  import { Architecture } from "@intechstudio/grid-protocol";

  export let visible = true;
  export let device = undefined;
</script>

{#if visible && typeof device.architecture !== "undefined"}
  <div
    class="absolute text-center bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-0.5 text-opacity-20 text-white font-bold text-xs"
  >
    {#if device?.architecture === Architecture.VIRTUAL}
      <span class="text-white font-mono">VIRTUAL</span>
    {:else if device?.architecture === "esp32"}
      E-32<br />
      {"v" +
        device?.fwVersion?.major +
        "." +
        device?.fwVersion?.minor +
        "." +
        device?.fwVersion?.patch}
    {:else if device?.architecture === "d51"}
      D-51<br />
      {"v" +
        device?.fwVersion?.major +
        "." +
        device?.fwVersion?.minor +
        "." +
        device?.fwVersion?.patch}
    {/if}
  </div>
{/if}
