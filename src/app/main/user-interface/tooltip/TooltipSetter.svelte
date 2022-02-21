<script>

  /**
   * 
   * Container MUST BE in relative mode!
   * 
   */


  import { current_tooltip_store } from '../../../runtime/app-helper.store.js';

  export let key = '';
  export let mode = 0;

  let tooltip = false;

  $: setTooltip(tooltip);

  function setTooltip(bool){
    current_tooltip_store.set({key: key, bool: bool})
  }

</script>

<!-- Button Hover -->
{#if mode == 1}
  <div 
    on:click|preventDefault={()=>{}} 
    on:mouseenter={()=>{tooltip = true}} 
    on:mouseleave={()=>{tooltip = false}} 
    style="z-index: 30;" 
    class="w-full flex h-full absolute right-0 top-0">
  </div>
{/if}

<!-- Questionmark Hover -->
{#if mode == 2}
  <div 
    on:mouseenter={()=>{tooltip = true}} 
    on:mouseleave={()=>{tooltip = false}} 
    style="z-index: 30;" 
    class="ml-2 text-white flex h-full items-center">
    
    <div 
      on:click|stopPropagation={()=>{tooltip = !tooltip}} 
      class="w-6 h-6 rounded-full cursor-helper bg-secondary text-xs text-center flex items-center justify-center hover:text-important p-1">
      ?
    </div>
  </div>
{/if}

