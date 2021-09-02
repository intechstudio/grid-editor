<script>

  import { tooltip_content } from './tooltip-content.json.js';

  import { fade } from 'svelte/transition';

  import { current_tooltip_store } from '../../_stores/app-helper.store.js';

  export let key = '';
  export let mode = 0;

  let tooltip = false;

  $: setTooltip(tooltip);

  function setTooltip(bool){

    current_tooltip_store.set({key: key, bool: bool})

  }

</script>

<div on:mouseenter={()=>{tooltip = true}} on:mouseleave={()=>{tooltip = false}} style="z-index: 9999;" class="text-white flex h-full items-center absolute right-0 top-0 mr-0.5">
  <div on:click|stopPropagation={()=>{tooltip = !tooltip}} class="w-6 h-6 rounded-full cursor-helper bg-secondary text-xs text-center flex items-center justify-center hover:text-important p-1">?</div>
</div>
