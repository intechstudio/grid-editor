<script>
  export let device = undefined;
  export let visible = false;
  export let elementNumber = undefined;
</script>

{#if visible && elementNumber === 255}
  <div class="w-full h-full pointer-events-none">
    <div
      class="absolute text-center bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-0.5 text-opacity-20 text-white font-bold text-xs"
    >
      {#if device?.architecture === "esp32"}
        E-32<br />
        {"v" +
          device?.fwVersion.major +
          "." +
          device?.fwVersion.minor +
          "." +
          device?.fwVersion.patch}
      {:else}
        D-51<br />
        {"v" +
          device?.fwVersion.major +
          "." +
          device?.fwVersion.minor +
          "." +
          device?.fwVersion.patch}
      {/if}
    </div>
  </div>
{/if}
