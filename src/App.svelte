<script>

  import { fade } from 'svelte/transition';

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
  import { layout } from './app/stores/layout.store.js';
  import { runtime } from './app/stores/runtime.store.js';

  /*
  *   serialport and nodejs
  */

  import SerialPort from './app/core/serialport/SerialPort.svelte'

  /*
  *   svelte components
  */

  import GlobalSettings from './app/settings/global/GlobalSettings.svelte';
  import LocalSettings from './app/settings/local/LocalSettings.svelte';
  import Form from './app/shared/feedback/Form.svelte';
  import Debug from './app/shared/debug/Debug.svelte';
  import Updater from './app/shared/updater/Updater.svelte';
  import Tour from './app/shared/helpers/Tour.svelte';
  import FirmwareCheck from './app/shared/firmware-check/FirmwareCheck.svelte';
  import DragModule from './app/layout/components/DragModule.svelte';
  import RemoveModule from './app/layout/components/RemoveModule.svelte';

  import MODULE from './app/core/grid-modules/MODULE.svelte';

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
  import Titlebar from './app/shared/menu/Titlebar.svelte';
  import PanInfo from './app/shared/menu/PanInfo.svelte';


  /*
  *   variables
  */ 

  // For rendering the "id=grid-cell-x:x;y:y" layout drop area.
  let grid_layout = 5;

  // code base versions
  let fwVersion;

  let raw_serial; // debug purposes

  $: gridsize = $appSettings.size * 106.6 + 10;


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

  onMount(()=>{

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


    appSettings.subscribe((store)=>{
      fwVersion = store.version;
      if(store.layoutMode){
        console.log(store.layoutMode)
        $layout = LAYOUT.drawPossiblePlacementOutlines($runtime, grid_layout);
      } else {
        $layout = LAYOUT.removePossiblePlacementOutlines($layout)
      }
    });
       
    appSettings.update(store => {
      store.selectedDisplay = 'settings';
      return store;
    })
    
  });


</script>

<Tailwindcss />

{#if $appSettings.isElectron}
 <Updater/>
{/if}

{#if !$appSettings.isElectron}
  <Tour/>
{/if}

{#if $appSettings.isElectron}
  <Titlebar>
    <SerialPort 
      bind:runtime={$runtime}
      bind:layout={$layout}
      on:change={(e) => {
        $layout = LAYOUT.drawPossiblePlacementOutlines($runtime, grid_layout)
      }}
      on:coroner={(e)=>{
          runtime.update(grid => {
            grid = e.detail.usedgrid;
            return grid;
          })
          layout.update(cell => {
            let removed = cell.find(c => c.id == e.detail.removed.id)
            removed.id = "";
            removed.isConnectedByUsb = false;
            return cell; 
          });
          $layout = LAYOUT.removeSurroundingPlacementOutlines($layout, e.detail.removed);
        }
      }
    />
  </Titlebar>
{/if}

<main id="app" class="flex w-full h-full flex-row overflow-hidden">

  <section id="main" class="flex flex-col w-full">
    
    {#if $appSettings.isElectron} 
      <FirmwareCheck />

      <Form />
    {/if}
    

    <div id="grid-main-container" style="" class="relative h-full">

      <!-- Info on pan. -->


      <!-- Context menu overwrite. grid is bound to $grid, for instant refresh of layout. -->

      {#if $appSettings.selectedDisplay == 'layout'}
      <!--
        <LayoutMenu bind:grid={$grid} {isMenuOpen} {menuOnModuleWithId} />
        -->
      {/if}

      <!-- This is the Settings part of the code-->

        <div class="absolute mt-2 w-full h-full flex justify-between items-start">
          <div class="flex flex-col">
            <DragModule/> 
            <GlobalSettings/>       
          </div>

          {#if $runtime.length > 0}<PanInfo os={$appSettings.os}/>{/if}
          
          <div class="flex w-4/12 flex-col m-4">
            <LocalSettings/>          
          </div>
        </div>


      <!-- This is the (mostly) Layout part of the code. -->

      <div class="absolute overflow-hidden w-full flex flex-col h-full focus:outline-none border-none outline-none"

        use:dragndrop={true} 

        on:dnd-dragstart={(e)=>{
          let moved = handledrag.start(e);
          if($runtime.length == 0 ){
            current = 'dx:0;dy:0';
          }
          if(moved !== '' || undefined){
            $layout = LAYOUT.removeSurroundingPlacementOutlines($layout, moved);   
          }
        }}

        on:dnd-dragover={(e)=>{
          current = handledrag.over(e);
        }}

        on:dnd-drop={(e)=>{
          // here we get back the dropped module id and drop target
          let data = handledrag.drop(e);
          LAYOUT.addToRuntime($runtime, data.modul, data.id, true);
        }}

        on:dnd-remove={(e)=>{
          let data = handledrag.remove(e)
          // remove ?? 
          $runtime = $runtime.filter(gridController => gridController.id !== data.modul);
          layout.update(cell => {
            cell = cell.map( _cell =>{
              if(_cell.id == data.modul){
                _cell.id = "";
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
          $layout = LAYOUT.drawPossiblePlacementOutlines($runtime, grid_layout);
          console.log($layout, $runtime)
        }}
        > 

        <div bind:this={map} style="top:40%; left:40%;" class="w-full h-full flex relative focus:outline-none border-none outline-none justify-center items-center z-10"
          use:layoutMenu={$appSettings.layoutMode}
          on:menu-open={(e)=>{isMenuOpen = true; menuOnModuleWithId = e.detail.target}}
          on:menu-close={()=>{isMenuOpen = false}}
          >

          {#each $layout as cell}
            <div 
            id="grid-cell-{'dx:'+cell.dx+';dy:'+cell.dy}" 
            style="--cell-size: {gridsize + 'px'}; top:{-1*(cell.dy*106.6*$appSettings.size*1.1) +'px'};left:{(cell.dx*106.6*$appSettings.size*1.1) +'px'};"
            class="cell"
            class:freeToDrop={current == 'dx:'+cell.dx+';dy:'+cell.dy}
            class:canBeUsed={cell.canBeUsed && $appSettings.layoutMode}
            class:fwMismatch={JSON.stringify(cell.fwVersion) !== JSON.stringify(fwVersion)}
            class:restricted-action={invalidDragHighlight && (movedCell.dx === cell.dx) && (movedCell.dy === cell.dy)}
            >

            <MODULE type={cell.id.substr(0,4)} id={cell.id} rotation={cell.rot} />


            </div>
          {/each}    
        </div>
        {#if $appSettings.layoutMode}
          <div in:fade><RemoveModule/></div>
          
        {/if}

      </div>
      
    </div>

    {#if !$appSettings.layoutMode}
      <div class="opacity-25 text-4xl text-white absolute right-0 bottom-0 mr-3 font-roboto font-bold">
        Alpha
      </div>
    {/if}

    
  </section>

  {#if $appSettings.debugMode == true}
    <section id="debug" style="" class="w-1/3 h-full bg-black">
      <Debug {raw_serial} />
    </section>
  {/if}

</main>


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
  
  :global(.flicker) {
   -webkit-animation: flickerAnimation 1s linear infinite;
    animation: flickerAnimation 1s linear infinite;
  }

  @keyframes flickerAnimation {
    0%   { opacity:1; }
    50%  { opacity:0.25; }
    100% { opacity:1; }
  }

  @-webkit-keyframes flickerAnimation{
    0%   { opacity:1; }
    50%  { opacity:0.25; }
    100% { opacity:1; }
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

