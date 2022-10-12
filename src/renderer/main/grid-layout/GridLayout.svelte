<script>

  import createPanZoom from 'panzoom';

  import { writable, readable, derived } from 'svelte/store';

  import { onMount } from 'svelte';


  import { engine, runtime } from '../../runtime/runtime.store.js';

  import Device from './grid-modules/Device.svelte';

  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

  import { fade, fly } from 'svelte/transition';

  import { openInBrowser } from '../../runtime/app-helper.store';


  import CursorLog from          '../user-interface/cursor-log/CursorLog.svelte';

  //import { getGlobal } from '@electron/remote';
  const trackEvent = function(){} //getGlobal('trackEvent');

  import { analytics } from '../../runtime/analytics_influx';
  import { appSettings } from '../../runtime/app-helper.store';


  //const ipcRenderer = window.sketchyAPI;

  export let classes;

  let map;


  let surface_width = 0;
  let surface_height = 0;


  const surface_origin_x = tweened(0, {
    duration: 400,
    delay: 150,
    easing: cubicOut,
  });  
  
  const surface_origin_y = tweened(0, {
    duration: 400,
    delay: 150,
    easing: cubicOut,
  });

  // $appSettings.size
  $: gridsize = 2.1 * 106.6 + 10;

  let ready = false;

  onMount(()=>{
    createPanZoom(map, {
      bounds: true,
      boundsPadding: 0.1,
      zoomDoubleClickSpeed: 1,  //disable double click zoom
      smoothScroll: false, // disable the smoothing effect
      beforeMouseDown: function(e) {
        // allow mouse-down panning only if altKey is down. Otherwise - ignore
        var shouldIgnore = !e.ctrlKey;
        return shouldIgnore;
      },
      beforeWheel: function(e) {
        // ignore wheel zoom
        var shouldIgnore = !e.ctrlKey //!e.altKey;
        return shouldIgnore;
      }
    });

    ready = true;
  })

  const devices = writable([]);

  runtime.subscribe(rt => {

    let min_x = 0
    let max_x = 0
    let min_y = 0
    let max_y = 0

    rt.forEach((device, i) => {

      let connection_top = 0;
      let connection_bottom = 0;
      let connection_left = 0;
      let connection_right = 0;

      rt.forEach(neighbor => {

        if ((device.dx - neighbor.dx) === 1){
          connection_right = 1;
        }
        if ((device.dx - neighbor.dx) === -1){
          connection_left = 1;
        }

        if ((device.dy - neighbor.dy) === 1){
          connection_bottom = 1;
        }
        if ((device.dy - neighbor.dy) === -1){
          connection_top = 1;
        }

      });


      if (min_x > device.dx){
        min_x = device.dx
      }

      if (min_y > device.dy){
        min_y = device.dy
      }

      if (max_x < device.dx){
        max_x = device.dx
      }

      if (max_y < device.dy){
        max_y = device.dy
      }

      rt[i].fly_x = 100 * (connection_right - connection_left) 
      rt[i].fly_y = 100 * (connection_top - connection_bottom) 


    });

    surface_width = max_x - min_x + 1;
    surface_height = max_y - min_y + 1;

    surface_origin_x.set( (min_x + max_x)/2 );
    surface_origin_y.set( (min_y + max_y)/2 );


    devices.set(rt)

  });



  function refresh(){

    trackEvent('no-module', 'no-module: restart app') 
    analytics.track_event("application", "gridlayout", "no module", "app restart")


    setTimeout(() => {
      //ipcRenderer.sendSync('restart', "foo");
    }, 500);


  }

  function troubleshoot(){
    


    openInBrowser(process.env.DOCUMENTATION_TROUBLESHOOTING_URL)

    trackEvent('no-module', 'no-module: troubleshooting'); 
    analytics.track_event("application", "gridlayout", "no module", "open troubleshooting")

  }

  function calculate_x(x0, y0){
    
    const rot = $appSettings.persistant.moduleRotation/180*Math.PI;

    let x_rot = x0*Math.cos(rot) -y0*Math.sin(rot)

    x_rot -= $surface_origin_x*Math.cos(rot) - $surface_origin_y*Math.sin(rot)

    return ((x_rot)*106.6*$appSettings.size*1.05)
      
  }
  function calculate_y(x0, y0){

    const rot = $appSettings.persistant.moduleRotation/180*Math.PI;


    let y_rot = x0*Math.sin(rot) + y0*Math.cos(rot)

    y_rot -= $surface_origin_x*Math.sin(rot) + $surface_origin_y*Math.cos(rot)

    return -1*((y_rot)*106.6*$appSettings.size*1.05)
  }

  let map_h, map_w;


</script>

<layout-container class="relative flex items-start {classes} h-full { $engine == 'ENABLED' ? 'pointer-events-auto' : 'pointer-events-none'}">

  <grid-layout class="relative overflow-hidden w-full flex flex-col h-full focus:outline-none border-none outline-none"> 

    <div id="grid-map" bind:this={map} bind:clientWidth={map_w} bind:clientHeight={map_h} style="top:{map_h/2-gridsize/2}px; left:{map_w/2-gridsize/2}px;" class="w-full h-full flex absolute focus:outline-none border-none outline-none justify-center items-center">

      {#each $devices as device}
        <div 
          in:fly="{{x: calculate_x(device.fly_x, device.fly_y), y: calculate_y(device.fly_x, device.fly_y), duration: 150 }}" out:fade="{{ duration: 150 }}"

          id="grid-device-{'dx:'+device.dx+';dy:'+device.dy}" 
          style="--device-size: {gridsize + 'px'}; top:{calculate_y(device.dx, device.dy) +'px'};left:{calculate_x(device.dx, device.dy) +'px'};"
          class="device"
          class:fwMismatch={device.fwMismatch}>
        
            <Device type={device.id.substr(0,4)} id={device.id} rotation={device.rot + $appSettings.persistant.moduleRotation/90} />

        </div>
      {/each}    
    </div>

    {#if $devices.length === 0 && ready && $appSettings.firmwareNotificationState === 0}
      <div
      style="top:{map_h/2-gridsize/2}px; left:{map_w/2-gridsize/2}px;" class="w-full h-full flex absolute focus:outline-none border-none outline-none justify-center items-center"
      >
        
        <div in:fade="{{delay: 2000, duration: 1000}}" 
          class="flex w-full h-full items-center justify-center text-white flex-col">
          <div class=" absolute top-0 left-0  p-4 bg-primary rounded shadow w-72">
            <div class="text-xl py-1">Connect your module now!</div>
            <div class="py-1">Try refreshing Editor or check out the troubleshooting guide!</div>
      
            <div class="flex justify-between items-center">
              <button 
                on:click={refresh} 
                class="relative bg-commit mr-3 block hover:bg-commit-saturate-20 text-white mt-3 mb-1 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none">
                <div>Refresh</div>
      
              </button>
            
              <button 
                on:click={troubleshoot} 
                class="relative border block hover:bg-commit-saturate-20 text-white mt-3 mb-1 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none">
                <div>Troubleshooting</div>
              </button>
      
            </div>
          </div>
      
        </div>

      </div>
    {/if}

    <div class="w-full flex flex-row items-center min-h-fit mt-auto">
    <CursorLog/>
    </div>
    
  </grid-layout>  
</layout-container>

<style>

  .device{
    width: var(--device-size);
    height: var(--device-size);
    display: flex;
    position: absolute;
    justify-content: center;
    align-items: center;
  }

  .fwMismatch{
    @apply bg-red-500;
    @apply rounded-lg;
  }

</style>