<script>
  import { appSettings } from "../../../../runtime/app-helper.store.js";
  export let device = undefined;
  export let visible = false;
</script>

{#if visible}
  {#if (device?.portstate & 1) !== 0}
    <div
      class="absolute top-0 left-1/2 transform -translate-x-1/2 opacity-50 text-white font-bold text-xl bg-green-500 w-20 h-20"
    />
  {/if}

  {#if (device?.portstate & 2) !== 0}
    <div
      class="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-50 text-white font-bold text-xl bg-green-500 w-20 h-20"
    />
  {/if}

  {#if (device?.portstate & 4) !== 0}
    <div
      class="absolute bottom-0 left-1/2 transform -translate-x-1/2 opacity-50 text-white font-bold text-xl bg-green-500 w-20 h-20"
    />
  {/if}

  {#if (device?.portstate & 8) !== 0}
    <div
      class="absolute left-0 top-1/2 transform -translate-y-1/2 opacity-50 text-white font-bold text-xl bg-green-500 w-20 h-20"
    />
  {/if}
{/if}
