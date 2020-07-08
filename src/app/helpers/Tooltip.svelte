<script>

  import { fade } from 'svelte/transition';

  export let text = '';

  let tooltip = false;

</script>

<div on:mouseenter={()=>tooltip = true} on:mouseleave={()=>tooltip = false} class="text-white flex relative z-50">
  <div on:click={()=>tooltip = !tooltip} class="w-6 h-6 rounded-full bg-secondary text-xs text-center flex items-center justify-center hover:text-important p-1">?</div>
  {#if tooltip}
    <div transition:fade style="background-color: #2D374D;" class="absolute block left-0 text-base font-normal ml-8 w-64 p-2 rounded shadow-xl">
      {@html text}
    </div>
  {/if}
</div>