<script>

  import { islanding } from './islanding.js';
  import { handledrag } from './handledrag.js';
  import { layout } from './layout.js';

  import {onMount} from 'svelte';

  export let size = 1.5;

  import { layoutMenu } from './menu.action.js';

  import PO16 from '../modules/PO16.svelte';
  import PBF4 from '../modules/PBF4.svelte';

  import DragModule from './DragModule.svelte';
  import RemoveModule from './RemoveModule.svelte';

  import { dragndrop } from './dnd.action.js';
  import { cells } from './cells.store.js';

  let grid = 5;

  $: cellSize = size * 106.6 + 10;

  let usedCells = []

  // the green highlight around cells for valid drop area
  let current = '';
  let centerDrag = false;
  let invalidDragHighlight = false;
  let movedCell;

  let isMenuOpen = false;

  let menuOnModuleWithId;
 

  // Render modules which are in the $cells.used array.

  onMount(()=>{

    $cells.layout = [...layout.createLayoutGrid(5)];

    initLayout();

    layout.drawPossiblePlacementOutlines($cells)

  })

  function initLayout(){

    if($cells.used.length > 0){
      $cells.used.forEach(usedCell => {
        let renderCoords = document.getElementById('grid-cell-x:'+usedCell.coords.x+';y:'+usedCell.coords.y);
        var nodeCopy = document.getElementById(usedCell.id.substr(0,4)).cloneNode(true);
        nodeCopy.id = genModulId(usedCell.id.substr(0,4));
        renderCoords.appendChild(nodeCopy);
      });
    }
  }


</script>

<style>

  #context-menu{
    position:fixed;
    z-index:9999;
    width:200px;
    transform:scale(0);
    transform-origin:top left;
  }
  
  #context-menu .item {
    padding: 8px 10px;
    font-size:15px;
    cursor: pointer;
    color:#eee;
  }

  #context-menu .item:hover{
    background-color: black;
  }

  #context-menu .item:first-child:hover {
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
  }

  #context-menu .item:last-child:hover {
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
  }

  #context-menu.active{
    transform:scale(1);
  }

  .cell{
    width: var(--cell-size);
    height: var(--cell-size);
    display: flex;
    position: absolute;
    justify-content: center;
    align-items: center;
    
  }

  .freeToDrop{
    border: 2px dashed green !important;
  }

  .restricted-action{
    background-color:rgba(255, 0, 0, 0);
    border-radius: 10px;
    animation: restricedFade .5s ease-out forwards; 
  }

  .canBeUsed{
    border: 1px solid rgba(0,0,0,0.25);
  }

  .isConnectedByUsb{
    background-color: rgba(0, 75, 225, 0.25);
  }

  @keyframes restricedFade {
    0%,100% { background-color: rgba(255, 0, 0, 0);}
    50% { background-color: rgba(255, 0, 0, 1); }
  }

  @keyframes fadein {
    0%,100% { border-color: rgba(0, 255, 0, 0); }
    50% { border-color:rgba(0, 255, 0, 1); }
  }


</style>

<!-- Context menu overwrite. -->

<div 
  id="context-menu"
  class:active={isMenuOpen}
  class="rounded-lg primary border border-gray-700 shadow-lg"
  >
  <div class="item" on:click={layout.setUsbConnectedModule($cells,menuOnModuleWithId)}>USB Connected Module</div>
  <div class="item">Module Information</div>
</div>


<!-- This is the Layout settings part of the code. -->

  <div class="relative overflow-hidden w-full flex flex-col h-full"
  
    use:dragndrop 

    on:dnd-dragover={(e)=>{
      current = handledrag.over(e);
    }}

    on:dnd-drop={(e)=>{
      // here we get back the dropped module id and drop target
      let data = handledrag.drop(e);
      layout.addToUsedCells($cells, data.modul, data.id);
    }}

    on:dnd-remove={handledrag.remove}

    on:dnd-dragstart={(e)=>{
      handledrag.start(e);
      $cells.layout = layout.drawPossiblePlacementOutlines($cells, grid)
    }}

    on:dnd-invalid={(e)=>{
      let data = handledrag.invalid(e);
      if(data !== undefined){ 
        invalidDragHighlight = data.centerDragHighlight;
        movedCell = data.movedCell;
        setTimeout(()=>{invalidDragHighlight = false},500)
      }  
    }}

    on:dnd-dragend={(e)=>{
      const dragend = handledrag.end(e, $cells); 
      current = dragend.current;
      (dragend.cells.used !== undefined) ? $cells.used = dragend.cells.used : null;
      $cells.layout = layout.drawPossiblePlacementOutlines($cells, grid);
    }}
    >
    
    <DragModule {size}/>     

    <div style="top:40%; left:40%;" class="w-full h-full flex relative justify-center items-center z-10"
      use:layoutMenu 
      on:menu-open={(e)=>{isMenuOpen = true; menuOnModuleWithId = e.detail.target}}
      on:menu-close={()=>{isMenuOpen = false}}
      >
      {#each $cells.layout as cell}
        <div 
        id="grid-cell-{'x:'+cell.coords.x+';y:'+cell.coords.y}" 
        style="--cell-size: {cellSize + 'px'}; top:{-1*(cell.coords.y*106.6*size*1.1) +'px'};left:{(cell.coords.x*106.6*size*1.1) +'px'};"
        class="cell"
        class:freeToDrop={current == 'x:'+cell.coords.x+';y:'+cell.coords.y}
        class:canBeUsed={cell.canBeUsed}
        class:isConnectedByUsb={cell.isConnectedByUsb}
        class:restricted-action={invalidDragHighlight && (movedCell.coords.x === cell.coords.x) && (movedCell.coords.y === cell.coords.y)}
        >
        </div>
      {/each}    
    </div>
    
    <RemoveModule/>

  </div>