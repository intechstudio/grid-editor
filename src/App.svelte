<script>

  /*
  *   tailwindcss
  */

  import Tailwindcss from './Tailwindcss.svelte';
  
  /*
  *   top-level stores
  */

  import { appSettings } from './app/stores/app-settings.store';
  import { grid } from './app/stores/grid.store.js';

  /*
  *   serialport and nodejs
  */

  import SerialPort from './app/serialport/SerialPort.svelte'

  /*
  *   svelte components
  */

	import Menu from './app/menu/Menu.svelte';
  import GlobalSettings from './app/settings/GlobalSettings.svelte';
  import ElementSettings from './app/settings/ElementSettings.svelte';
  import MapMode from './app/settings/MapMode.svelte';
  import Form from './app/form/Form.svelte';
  import FirmwareCheck from './app/firmware-check/FirmwareCheck.svelte';
  import DragModule from './app/layout/components/DragModule.svelte';
  import RemoveModule from './app/layout/components/RemoveModule.svelte';
  import LayoutMenu from './app/layout/components/LayoutMenu.svelte';

  import PO16 from './app/modules/PO16.svelte';
  import PBF4 from './app/modules/PBF4.svelte';
  import BU16 from './app/modules/BU16.svelte';
  import EN16 from './app/modules/EN16.svelte';


  /*
  *   layout helper functions
  */

	import { islanding } from './app/layout/islanding.js';
  import { handledrag } from './app/layout/handledrag.js';
  import { LAYOUT } from './app/layout/layout.js';

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

  // For rendering the "id=grid-cell-x:x;y:y" layout drop area.
  let grid_layout = 5;

  let fwVersion;

  $: gridsize = $appSettings.size * 106.6 + 10;

  //

  // The green highlight around grid for valid drop area.
  let current = ''; 
  // Red borders on cell if it's an invalid drag due to dnd-invalid.
  let invalidDragHighlight = false;
  // For adding red border in dnd-invalid.
  let movedCell;
  // Boolean state for right click context-menu override.
  let isMenuOpen = false;
  // Variable for context menu actions (set usb module).
  let menuOnModuleWithId;
  
  // Communicate with exported serialport function.
  let serialPortComponent;
	
  /* 
  *   Render modules which are in the $grid.used array. 
  */
  
  onMount(()=>{

    $grid.layout = LAYOUT.createLayoutGrid(grid_layout);

    initLayout();

    appSettings.subscribe((store)=>{
      fwVersion = store.version;
      if(store.selectedDisplay == 'layout'){
        $grid.layout = LAYOUT.drawPossiblePlacementOutlines($grid, grid_layout);
      } else if(store.selectedDisplay == 'settings'){
        $grid.layout = LAYOUT.removePossiblePlacementOutlines($grid)
      }
    });

  })

  function initLayout(){

    if($grid.used.length > 0){
      $grid.used.forEach(usedCell => {
        let renderCoords = document.getElementById('grid-cell-x:'+usedCell.dx+';y:'+usedCell.dy);
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
    display: flex;
    flex-direction: column;
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

  .fwMismatch{
    animation: blinker 1s linear infinite;
  }

  @keyframes blinker {
    50% { 
      background-color: rgba(255, 0, 0, 1); 
    }
  }
	
</style>

<Tailwindcss />

<SerialPort 
  bind:grid={$grid} 
  bind:this={serialPortComponent}
  on:change={
    $grid.layout = LAYOUT.drawPossiblePlacementOutlines($grid, grid_layout)
  }
  on:coroner={(e)=>{
      grid.update(cell => {
        cell.used = e.detail.usedgrid;
        cell.layout = cell.layout.map( _cell =>{
          if(_cell.id == e.detail.removed.id){
            _cell.id = 'none';
            _cell.isConnectedByUsb = false;
          }
          return _cell; 
        });
        return cell;
      });
      $grid.layout = LAYOUT.removeSurroundingPlacementOutlines($grid.layout, e.detail.removed);
    }
  }
/>

<FirmwareCheck />

<Form />

<div style="" class="relative h-full">

  <!-- Context menu overwrite. grid is bound to $grid, for instant refresh of layout. -->

  {#if $appSettings.selectedDisplay == 'layout'}
    <LayoutMenu bind:grid={$grid} {isMenuOpen} {menuOnModuleWithId} />
  {/if}


  <!-- This is the Settings part of the code-->

  {#if $appSettings.selectedDisplay == 'settings'}
    <div class="absolute w-full h-full flex justify-between items-start">
      <div class="flex flex-col">
        <GlobalSettings
          on:BANKENABLED={(e)=>serialPortComponent.writeSerialPort(e)}
          on:BANKACTIVE={(e)=>serialPortComponent.writeSerialPort(e)}
          on:BANKCOLOR={(e)=>serialPortComponent.writeSerialPort(e)}
        />
      </div>
      <ElementSettings/>
    </div>
  {/if}

  <!-- This is the (mostly) Layout part of the code. -->

  <div class="absolute overflow-hidden w-full flex flex-col h-full"

    use:dragndrop={$appSettings.selectedDisplay} 

    on:dnd-dragstart={(e)=>{
      let moved = handledrag.start(e);
      if(moved !== '' || undefined){
        $grid.layout = LAYOUT.removeSurroundingPlacementOutlines($grid.layout, moved);   
      }
    }}

    on:dnd-dragover={(e)=>{
      current = handledrag.over(e);
    }}

    on:dnd-drop={(e)=>{
      // here we get back the dropped module id and drop target
      let data = handledrag.drop(e);
      LAYOUT.addToUsedgrid($grid, data.modul, data.id, true);
    }}

    on:dnd-remove={(e)=>{
      let data = handledrag.remove(e)
      let _usedgrid = $grid.used.filter(cell => cell.id !== data.modul);
      grid.update(cell => {
        cell.used = _usedgrid;
        cell.layout = cell.layout.map( _cell =>{
          if(_cell.id == data.modul){
            _cell.id = 'none';
            _cell.isConnectedByUsb = false;
          }
          return _cell;
        });
        return cell;
      });
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
      const dragend = handledrag.end(e); 
      current = dragend.current;
      $grid.layout = LAYOUT.drawPossiblePlacementOutlines($grid, grid_layout);
    }}
    >
    
    {#if $appSettings.selectedDisplay == 'layout'}
      <DragModule />     
    {/if}

    <div style="top:40%; left:40%;" class="w-full h-full flex relative justify-center items-center z-10"
      use:layoutMenu={$appSettings.selectedDisplay}
      on:menu-open={(e)=>{isMenuOpen = true; menuOnModuleWithId = e.detail.target}}
      on:menu-close={()=>{isMenuOpen = false}}
      >
      {#each $grid.layout as cell}
        <div 
        id="grid-cell-{'dx:'+cell.dx+';dy:'+cell.dy}" 
        style="--cell-size: {gridsize + 'px'}; top:{-1*(cell.dy*106.6*$appSettings.size*1.1) +'px'};left:{(cell.dx*106.6*$appSettings.size*1.1) +'px'};"
        class="cell"
        class:freeToDrop={current == 'dx:'+cell.dx+';dy:'+cell.dy}
        class:canBeUsed={cell.canBeUsed}
        class:fwMismatch={JSON.stringify(cell.fwVersion) !== JSON.stringify(fwVersion)}
        class:isConnectedByUsb={cell.isConnectedByUsb}
        class:restricted-action={invalidDragHighlight && (movedCell.dx === cell.dx) && (movedCell.dy === cell.dy)}
        >

        {#if cell.id.startsWith('PBF4')}
          <svelte:component this={PBF4} id={cell.id} rotation={cell.rotation}/>
        {:else if cell.id.startsWith('PO16')}
          <svelte:component this={PO16} id={cell.id} rotation={cell.rotation}/>
        {:else if cell.id.startsWith('BU16')}
          <svelte:component this={BU16} id={cell.id} rotation={cell.rotation}/>
        {:else if cell.id.startsWith('EN16')}
          <svelte:component this={EN16} id={cell.id} rotation={cell.rotation}/>
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




