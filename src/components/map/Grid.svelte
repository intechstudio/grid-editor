<script>
  import {onMount} from 'svelte';
  export let size = 0;
  import PO16 from '../modules/PO16.svelte';
  import PBF4 from '../modules/PBF4.svelte';

  import {dragndrop} from './dnd.action.js';

  let rows = [-1,0,1];
  let columns = [-1,0,1];

  $: cellSize = size * 106.6 + 'px';
  $: marginsize = size * 106.6 * 2 + 'px';

  function allowDrop(e) {
    e.preventDefault();
  }

</script>

<style>

  .cell{
    width: var(--cell-size);
    height: var(--cell-size);
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid gray;
    color:white;
  }



</style>


<div id="0" 
draggable="true" 
use:dragndrop 
>
  <PO16 {size} />
</div>

<div id="2" 
draggable="true" 
use:dragndrop 
>
  <PBF4 {size} />
</div>


<div class="flex flex-row text-white">
{#each columns as column}
    
    <div class="flex flex-col">
      {#each rows as row}
      <div 
        class="cell" 
        style="--cell-size: {cellSize}" 
        on:dragover={allowDrop}
      >
        {column} {row}      
      </div>
      {/each}
    </div>
  
{/each}
</div>
