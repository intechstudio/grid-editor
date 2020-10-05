<script>

  const { ipcRenderer } = require('electron');
  const { getGlobal } = require('electron').remote;
  const trackEvent = getGlobal('trackEvent');

  /*
  *   tailwindcss
  */

  import Tailwindcss from './Tailwindcss.svelte';

  import createPanZoom from 'panzoom';
  let map;
  
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
  import Commands from './app/settings/Commands.svelte';

  import MODULE from './app/grid-modules/MODULE.svelte';

  import GlobalProfiles from './app/profiles/GlobalProfiles.svelte';

  import MinMaxClose from './app/menu/MinMaxClose.svelte';


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
  import { serialComm } from './app/serialport/serialport.store';
  import { elementSettings } from './app/settings/elementSettings.store';


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
  let updateProgress = 0;

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
    //category, action, label, value
    trackEvent('App', 'Report Version', 'Editor', $appSettings.version);

    createPanZoom(map, {
      bounds: true,
      boundsPadding: 0.1,
      zoomDoubleClickSpeed: 1,  //disable double click zoom
      smoothScroll: false, // disable the smoothing effect
      beforeMouseDown: function(e) {
        // allow mouse-down panning only if altKey is down. Otherwise - ignore
        var shouldIgnore = !e.altKey;
        return shouldIgnore;
      },
      beforeWheel: function(e) {
        // ignore wheel zoom
        var shouldIgnore = true //!e.altKey;
        return shouldIgnore;
      }
      
    });

    //startFresh();

    appSettings.subscribe((store)=>{
      fwVersion = store.version;
      if(store.selectedDisplay == 'layout'){
        $grid.layout = LAYOUT.drawPossiblePlacementOutlines($grid, grid_layout);
      } else {
        $grid.layout = LAYOUT.removePossiblePlacementOutlines($grid)
      }
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

    ipcRenderer.on('update_progress', (event,arg) => {
      updateProgress = Math.floor(arg.percent);
      console.log('update progress...', event, arg)
    });

    
    appSettings.update(store => {
      store.selectedDisplay = 'settings';
      return store;
    })
    
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

  let debugMode;

  $: {
    appSettings.update((store)=>{
      store.debugMode = debugMode;
      return store;
    })
  }

</script>

<Tailwindcss />

<main class="text-white bg-primary p-1">
  <div class="draggable flex justify-between">
    <div class="flex">
      <div class="p-1 text-gray-700 font-gt-pressura tracking-wider ">EDITOR</div>
    </div>

    <div class="flex items-center not-draggable text-sm">
      <button 
        on:click={()=> {debugMode = ! debugMode}} 
        class:bg-highlight={debugMode} 
        class="text-white px-2 py-1 mx-2 rounded border-highlight hover:bg-highlight-400 focus:outline-none ">
        debug
      </button>

      <SerialPort 
        bind:grid={$grid} 
        on:change={$grid.layout = LAYOUT.drawPossiblePlacementOutlines($grid, grid_layout)}
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
  
    </div>

    <MinMaxClose/>
        
  </div>
</main>

{#if $appSettings.debugMode == true}
  <Debug {raw_serial} />
{/if}

  


<!--
<Filesave></Filesave>
-->

{#if updateNotification} <!--updateNotification-->
<div style="z-index:9999;" class="bg-primary fixed text-white shadow rounded-lg left-1 bottom-1">
  <div id="notification" style="width:300px" class="p-4 rounded-lg">    
    {#if updateReady} <!--updateReady-->
      <p class="text-xl pb-2">🥂Update Downloaded!</p>
      <p class="py-2">It will be installed on restart.</p>
      <p class="py-2">Restart now?</p>
      <button class="cursor-pointer relative px-2 py-1 mt-2 mr-2 border-highlight bg-highlight rounded hover:bg-highlight-400 focus:outline-none" id="restart-button" on:click={restartApp}>
        Restart
      </button>
    {:else}
      <p class="text-xl pb-2">✨New update is available! </p>
      <p class="py-2 loading">Downloading in the background {#if updateProgress !== 0 && updateProgress !== undefined}{updateProgress + '%'}{/if}</p>
      {#if updateProgress !== 0 && updateProgress !== undefined}<div style="width:{updateProgress + '%'};" class="rounded my-2 h-1 flex bg-highlight"></div>{/if}
    {/if}
    
    <button id="close-button" class="cursor-pointer relative px-2 py-1 mt-2 border-highlight rounded hover:bg-highlight-400 focus:outline-none" on:click={() => {updateNotification = false}}>
      Close
    </button>
    
  </div>
</div>
{/if}


<FirmwareCheck />

<Form />

<div id="grid-main-container" style="" class="relative h-full">

  <!-- Info on pan. -->


  <!-- Context menu overwrite. grid is bound to $grid, for instant refresh of layout. -->

  {#if $appSettings.selectedDisplay == 'layout'}
    <LayoutMenu bind:grid={$grid} {isMenuOpen} {menuOnModuleWithId} />
  {/if}

  <!-- This is the Settings part of the code-->

  {#if $appSettings.selectedDisplay == 'settings'}
    <div class="absolute w-full h-full flex justify-between items-start">
      <GlobalSettings/>
      {#if $grid.used.length > 0}
        {console.log(process.platform)}
        <div class="flex flex-col text-white ">
          <div class="flex flex-row p-4 m-4 items-center my-2 text-sm z-10 relative">
            <div class="mx-2">Hold</div>
            {#if process.platform == "darwin"}
              <img class="w-10 h-10 p-2 bg-primary rounded-lg shadow-md" alt="mac-alt-key" src="./../public/assets/svgs/mac-alt.svg">
            {:else}
              <img class="w-10 h-10 p-2 bg-primary rounded-lg shadow-md" alt="win-alt-key" src="./../public/assets/svgs/win-alt.svg">
            {/if}
            <div class="mx-2">to pan the control surface.</div>
          </div>    
        </div>
      {/if}
      
      <div class="flex w-4/12 flex-col m-4">
        <ElementSettings/>
        {#if $elementSettings.controlNumber[0] !== undefined}
          <div class="my-2 p-4 bg-primary rounded-lg z-20 w-full">
            <Commands MODE={'LOCAL'}/>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if $appSettings.selectedDisplay == 'profiles'}
    <GlobalProfiles/>
  {/if}

  <!-- This is the (mostly) Layout part of the code. -->

  <div class="absolute overflow-hidden w-full flex flex-col h-full focus:outline-none border-none outline-none"

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
    <div class="flex flex-col absolute">
      <DragModule />     
      
    </div>
    {/if}

    <div bind:this={map} style="top:40%; left:40%;" class="w-full h-full flex relative focus:outline-none border-none outline-none justify-center items-center z-10"
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

<div class="opacity-25 text-4xl text-white absolute right-0 bottom-1 mr-5 mb-5 font-roboto font-bold">
  Alpha
</div>

<Menu/>


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
    background: -webkit-linear-gradient(45deg, #7D4645 0%, rgba(35, 104, 184, 0.29529) 44.71%, rgba(222, 118, 239, 0) 100%);
  }

  .hidden {
    display: none;
  }

  .loading:after {
  content: ' .';
  animation: dots 1s steps(5, end) infinite;}

  @keyframes dots {
    0%, 20% {
      color: rgba(0,0,0,0);
      text-shadow:
        .25em 0 0 rgba(0,0,0,0),
        .5em 0 0 rgba(0,0,0,0);}
    40% {
      color: white;
      text-shadow:
        .25em 0 0 rgba(0,0,0,0),
        .5em 0 0 rgba(0,0,0,0);}
    60% {
      text-shadow:
        .25em 0 0 white,
        .5em 0 0 rgba(0,0,0,0);}
    80%, 100% {
      text-shadow:
        .25em 0 0 white,
        .5em 0 0 white;}
      }

  :global(.draggable){
    -webkit-app-region:drag;
  }

  :global(.not-draggable){
    -webkit-app-region:no-drag;
  }

	
</style>

