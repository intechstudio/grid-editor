<script>

  /*
  *   tailwindcss
  */

  import Tailwindcss from './Tailwindcss.svelte';
  
  /*
  *   top-level stores
  */

  import { appSettings } from './app/stores/app-settings.store';
  import { cells } from './app/stores/cells.store.js';

  /*
  *   svelte components
  */

	import Menu from './app/menu/Menu.svelte';
	import ModuleSettings from './app/settings/ModuleSettings.svelte';
  import ElementSettings from './app/settings/ElementSettings.svelte';
  import DragModule from './app/layout/components/DragModule.svelte';
  import RemoveModule from './app/layout/components/RemoveModule.svelte';
  import LayoutMenu from './app/layout/components/LayoutMenu.svelte';

  import PO16 from './app/modules/PO16.svelte';
  import PBF4 from './app/modules/PBF4.svelte';
  import BU16 from './app/modules/BU16.svelte';


  /*
  *   layout helper functions
  */

	import { islanding } from './app/layout/islanding.js';
  import { handledrag } from './app/layout/handledrag.js';
  import { layout } from './app/layout/layout.js';

  /*
  *   svelte functions
  */
  import { onMount } from 'svelte';

  /*
  *   actions
  */
  
  import { layoutMenu } from './app/layout/actions/layout-menu.action.js';
  import { dragndrop } from './app/layout/actions/dnd.action.js';

  /*
  *   variables
  */ 

  export let size = 1.5;

  // For rendering the "id=grid-cell-x:x;y:y" layout drop area.
  let grid = 5;

  $: cellSize = size * 106.6 + 10;

  //

  // The green highlight around cells for valid drop area.
  let current = ''; 
  // Red borders on cell if it's an invalid drag due to dnd-invalid.
  let invalidDragHighlight = false;
  // For adding red border in dnd-invalid.
  let movedCell;
  // Boolean state for right click context-menu override.
  let isMenuOpen = false;
  // Variable for context menu actions (set usb module).
	let menuOnModuleWithId;
	
  /* 
  *   Render modules which are in the $cells.used array. 
  */
  
  onMount(()=>{

    $cells.layout = layout.createLayoutGrid(grid);

    initLayout();

    appSettings.subscribe((store)=>{
      if(store.selectedDisplay == 'layout'){
        $cells.layout = layout.drawPossiblePlacementOutlines($cells, grid);
      } else if(store.selectedDisplay == 'settings'){
        //$cells.layout = layout.removePossiblePlacementOutlines(grid)
      }
    });

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

	:global(body) {
		background-color: #2A3439;
	}

	:global(.primary){
    background-color:#1E2628;
	}
	
  :global(.secondary){
    background-color:#2A3439;
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

<Tailwindcss />


<div style="height: calc(100vh - 1 * 48px);" class="relative">

<!-- Context menu overwrite. Cells is bound to $cells, for instant refresh of layout. -->

{#if $appSettings.selectedDisplay == 'layout'}
  <LayoutMenu bind:cells={$cells} {isMenuOpen} {menuOnModuleWithId} />
{/if}


<!-- This is the Settings part of the code-->

{#if $appSettings.selectedDisplay == 'settings'}
  <div class="absolute w-full h-full flex justify-between items-center">
    <ModuleSettings/>
    <ElementSettings/>
  </div>
{/if}

<!-- This is the (mostly) Layout part of the code. -->

  <div class="absolute overflow-hidden w-full flex flex-col h-full"
  
    use:dragndrop={$appSettings.selectedDisplay} 

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
    
    {#if $appSettings.selectedDisplay == 'layout'}
      <DragModule />     
    {/if}

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

        {#if cell.id.startsWith('pbf4')}
          <svelte:component this={PBF4} id={cell.id}/>
        {:else if cell.id.startsWith('po16')}
          <svelte:component this={PO16} id={cell.id}/>
        {:else if cell.id.startsWith('bu16')}
          <svelte:component this={BU16} id={cell.id}/>
        {/if}

        </div>
      {/each}    
    </div>
    
    {#if $appSettings.selectedDisplay == 'layout'}
      <RemoveModule/>
    {/if}

  </div>
	
</div>

<Menu/>


