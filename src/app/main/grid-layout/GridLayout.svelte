<script>

  import createPanZoom from 'panzoom';

  import { onMount } from 'svelte';

  import { layout, appSettings } from '../_stores/app-helper.store.js';

  import { runtime } from '../../runtime/runtime.store.js';

  import Device from './grid-modules/Device.svelte';

  export let classes;

  let map;

  // code base versions
  let fwVersion;

  // $appSettings.size
  $: gridsize = 2.5 * 106.6 + 10;

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
  })

</script>

<layout-container class="relative flex items-start {classes} h-full">

  <grid-layout class="absolute overflow-hidden w-full flex flex-col h-full focus:outline-none border-none outline-none"> 

    <div id="grid-map" bind:this={map} style="top:0%; left:0%;" class="w-full h-full flex relative focus:outline-none border-none outline-none justify-center items-center z-10">

      {#each $runtime as cell}
        <div 
        id="grid-cell-{'dx:'+cell.dx+';dy:'+cell.dy}" 
        style="--cell-size: {gridsize + 'px'}; top:{-1*(cell.dy*106.6*$appSettings.size*1.1) +'px'};left:{(cell.dx*106.6*$appSettings.size*1.1) +'px'};"
        class="cell"
        class:fwMismatch={JSON.stringify(cell.fwVersion) !== JSON.stringify(fwVersion)}
        >
      
        <Device type={cell.id.substr(0,4)} id={cell.id} rotation={cell.rot} />

        </div>
      {/each}    
    </div>


  </grid-layout>  
</layout-container>
