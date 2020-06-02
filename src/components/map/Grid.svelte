<script>

  export let size = 0;
  import PO16 from '../modules/PO16.svelte';
  import PBF4 from '../modules/PBF4.svelte';

  import {dragndrop} from './dnd.action.js';

  let rows = [-1,0,1];
  let columns = [-1,0,1];

  $: cellSize = size * 106.6 + 'px';
  $: marginsize = size * 106.6 * 2 + 'px';

  let current;

  function handleDrop(e){
    e.preventDefault();
    current = e.detail
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

  .active{
    background-color: #ff3e00;
		color: white;
  }

</style>


<div class="relative flex flex-row text-white" use:dragndrop on:dnd-dragover={handleDrop} >
  <div id="0" draggable="true">
    <PO16 {size} />
  </div>

  <div id="2" draggable="true">
    <PBF4 {size} />
  </div>

  {#each columns as column} 
    <div class="flex flex-col">
      {#each rows as row}
      <div 
        id={'grid-cell-'+column+''+row}
        class="cell " 
        style="--cell-size: {cellSize}" 
        class:active={current === (column+''+row)}
      >
        
      </div>
      {/each}
    </div>
{/each}
</div>

<div id="grid" class="w-1/2 h-48 bg-white" >


</div>
