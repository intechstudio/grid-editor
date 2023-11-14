<script>
  export let device = undefined;
</script>

<div
  class="absolute text-center bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-0.5 opacity-10 text-white font-bold text-xs"
>
  {#if device?.arch === "esp32"}
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
