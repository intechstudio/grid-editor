<script>

  const { ipcRenderer } = require('electron');

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
  import Titlebar from './app/menu/Titlebar.svelte';
  import GlobalSettings from './app/settings/GlobalSettings.svelte';
  import ElementSettings from './app/settings/ElementSettings.svelte';
  import MapMode from './app/settings/MapMode.svelte';
  import Form from './app/form/Form.svelte';
  import Debug from './app/debug/Debug.svelte';
  import Polygon from './app/debug/Polygon.svelte';
  import FirmwareCheck from './app/firmware-check/FirmwareCheck.svelte';
  import DragModule from './app/layout/components/DragModule.svelte';
  import RemoveModule from './app/layout/components/RemoveModule.svelte';
  import LayoutMenu from './app/layout/components/LayoutMenu.svelte';

  import MODULE from './app/grid-modules/MODULE.svelte';

  import GlobalProfiles from './app/profiles/GlobalProfiles.svelte';


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
  import { dragndrop, selectedDisplay } from './app/layout/actions/dnd.action.js';

  /*
  *   variables
  */ 

  // For rendering the "id=grid-cell-x:x;y:y" layout drop area.
  let grid_layout = 5;

  // code base versions
  let fwVersion;
  let appVersion;

  // self update
  let updateNotification = false;
  let updateReady = false;

  let serial; // debug purposes
  let raw_serial; // debug purposes

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

  async function loadRecentSession(){
    const result = await ipcRenderer.invoke('getStoreValue', 'grid');
    $grid = result;
    startAutoSave();
    return result;
  }

  function startFresh(){
    grid.set({used: [], layout: []})
    $grid.layout = LAYOUT.createLayoutGrid(grid_layout);
    initLayout();
    startAutoSave();
  }

  function startAutoSave(){
    grid.subscribe((grid)=>{
      ipcRenderer.send('setStoreValue-message', grid)
    });
  }

  function restartApp(){
    ipcRenderer.send('restart_app');
  }
  
  onMount(()=>{

    //startFresh();

    appSettings.subscribe((store)=>{
      fwVersion = store.version;
      if(store.selectedDisplay == 'layout'){
        $grid.layout = LAYOUT.drawPossiblePlacementOutlines($grid, grid_layout);
      } else {
        $grid.layout = LAYOUT.removePossiblePlacementOutlines($grid)
      }
    });

    ipcRenderer.on('setStoreValue-reply', (event, arg) => {
      //console.log(arg) // prints "pong"
    });

    

    ipcRenderer.on('update_available', () => {
      ipcRenderer.removeAllListeners('update_available');
      console.log('update available')
      updateNotification = true;
    });
    
    ipcRenderer.on('update_downloaded', () => {
      ipcRenderer.removeAllListeners('update_downloaded');
      console.log('update downloaded')
      updateReady = true;
    });


  });

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

  #notification {
    position: fixed;
    bottom: 20px;
    left: 20px;
    width: 200px;
    padding: 20px;
    border-radius: 5px;
    background-color: white;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  }

  .hidden {
    display: none;
  }
	
</style>

<!--<button class="text-white w-32 p-2 bg-red-500">Get store</button>-->

<Tailwindcss />

<Titlebar/>


{#if $appSettings.debugMode == true}
  <Debug {raw_serial} />
{/if}

<!--
<Filesave></Filesave>
-->

{#if updateNotification}
<div id="notification">    
  {#if updateReady}
    <p id="message">Update Downloaded. It will be installed on restart. Restart now?</p>
    <button class="cursor-pointer" id="restart-button" on:click={restartApp}>
      Restart
    </button>
  {:else}
    <p id="message">A new update is available. Downloading now...</p>
  {/if}
  
  <button id="close-button" class="cursor-pointer" on:click={() => {updateNotification = false}}>
    Close
  </button>
  
</div>
{/if}

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
      <GlobalSettings/>
      <ElementSettings/>
    </div>
  {/if}

  {#if $appSettings.selectedDisplay == 'profiles'}
    <GlobalProfiles/>
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
        class:canBeUsed={cell.canBeUsed && $appSettings.selectedDisplay == 'layout'}
        class:fwMismatch={JSON.stringify(cell.fwVersion) !== JSON.stringify(fwVersion)}
        class:isConnectedByUsb={cell.isConnectedByUsb}
        class:restricted-action={invalidDragHighlight && (movedCell.dx === cell.dx) && (movedCell.dy === cell.dy)}
        >

        <MODULE type={cell.id.substr(0,4)} id={cell.id} rotation={cell.rotation} />


        </div>
      {/each}    
    </div>
    
    {#if $appSettings.selectedDisplay == 'layout'}
      <RemoveModule/>
    {/if}

  </div>
	
</div>

<Menu/>




