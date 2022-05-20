<script>
  import { get, writable } from 'svelte/store';
  import { appSettings } from '../runtime/app-helper.store';
  import { engine, unsaved_changes } from '../runtime/runtime.store';
  import { writeBuffer } from '../runtime/engine.store';

  import {fade} from 'svelte/transition';


  import instructions from "../serialport/instructions";
  import TooltipSetter from "./user-interface/tooltip/TooltipSetter.svelte";
  import TooltipConfirm from "./user-interface/tooltip/TooltipConfirm.svelte";

  const { getGlobal } = require('@electron/remote'); 
  const trackEvent = getGlobal('trackEvent');

  import { analytics } from "../runtime/analytics_influx"

  function store() {

    trackEvent('page-config', 'page-config: store') 
    analytics.track_event("application", "topsubmenu", "pageconfig", "store")

    instructions.sendPageStoreToGrid();
  }

  function discard() {

    instructions.sendPageDiscardToGrid();

    trackEvent('page-config', 'page-config: discard')
    analytics.track_event("application", "topsubmenu", "pageconfig", "discard")

  }

  function clear() {
    instructions.sendPageClearToGrid();
    
    trackEvent('page-config', 'page-config: clear')
    analytics.track_event("application", "topsubmenu", "pageconfig", "clear")

  }

  // let writeBuffer_length = 0;

  // writeBuffer.subscribe(s=>{
  //   writeBuffer_length = s.length
  // })


  const {Webhook} = require('simple-discord-webhooks');

  function debugWriteBuffer(){

    console.log(get(writeBuffer));
    
    
    //discord
    const webhook = new Webhook(process.env.DISCORD_FEEDBACK_WEBHOOK);
    webhook.send(`######\nWritebuffer\n######\n${JSON.stringify(get(writeBuffer)).substring(0,1000)} `)
        
    trackEvent('writebuffer', 'writebuffer: clear')
    analytics.track_event("application", "topsubmenu", "writebuffer", "clear")


    writeBuffer.clear();
    engine.set('ENABLED');


  }

</script>


<top-sub-menu style="background-color:rgb(25, 26, 32)" class="w-full rounded-tl-lg pt-4 -mt-4 shadow-md flex  text-white">
  
  <div class="h-14 py-2 px-2 bg-secondary w-full relative rounded-tl-lg  flex items-center justify-between">

    <div class="px-4">{$appSettings.rightPanel}</div>

    {#if $unsaved_changes}
      <div in:fade class="flex items-center">
        <div class="mr-4">Unsaved changed</div>
        <div class="px-4 py-1 flex items-center justify-center rounded-md bg-select-saturate-20 text-yellow-300">{$unsaved_changes}</div>
        
        <button 
          on:click={()=>{discard()}} 
          class="relative flex items-center justify-center focus:outline-none rounded my-2 border-select bg-select border-2 hover:bg-yellow-600 hover:border-yellow-600 text-white px-2 py-0.5 ml-4">
          <div>Discard</div>
          <TooltipSetter key={"configuration_header_clear"}/>
        </button>

        </div>
    {/if}

    <div class="px-4">

      <div class="flex items-center">

        <button 
          on:click={debugWriteBuffer}
          class=" relative flex items-center focus:outline-none justify-center rounded my-2 border-select bg-select border-2  text-white px-2 py-0.5 mx-1 w-48 ">
          <span class="pr-2 text-gray-200 tracking-wider">{$engine} {($writeBuffer.length)?("["+$writeBuffer.length+"]"):''}</span>
          <svg class="w-5 h-5 p-0.5 fill-current {$engine == 'ENABLED' ? 'text-green-500' : 'text-red-500'}" viewBox="0 0 465 385" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24.0009 128.001H382.06L343.03 167.03C338.529 171.531 336 177.635 336 184.001C336 190.366 338.529 196.471 343.03 200.972C347.531 205.473 353.636 208.001 360.001 208.001C366.366 208.001 372.471 205.473 376.972 200.972L456.972 120.972C459.201 118.743 460.969 116.097 462.175 113.185C463.381 110.273 464.002 107.152 464.002 104.001C464.002 100.849 463.381 97.7278 462.175 94.8159C460.969 91.904 459.201 89.2582 456.972 87.0296L376.972 7.02962C372.471 2.52863 366.366 -4.74256e-08 360.001 0C353.636 4.74256e-08 347.531 2.52863 343.03 7.02962C338.529 11.5306 336 17.6353 336 24.0006C336 30.366 338.529 36.4706 343.03 40.9716L382.06 80.0006H24.0009C17.6357 80.0006 11.5312 82.5292 7.03031 87.0301C2.52944 91.5309 0.000873566 97.6354 0.000873566 104.001C0.000873566 110.366 2.52944 116.47 7.03031 120.971C11.5312 125.472 17.6357 128.001 24.0009 128.001Z"/>
            <path d="M440.001 256.001H81.9419L120.972 216.972C125.473 212.471 128.001 206.366 128.001 200.001C128.001 193.635 125.473 187.531 120.972 183.03C116.471 178.529 110.366 176 104.001 176C97.6355 176 91.5309 178.529 87.0299 183.03L7.02987 263.03C4.80114 265.258 3.0332 267.904 1.82701 270.816C0.620819 273.728 0 276.849 0 280.001C0 283.152 0.620819 286.273 1.82701 289.185C3.0332 292.097 4.80114 294.743 7.02987 296.972L87.0299 376.972C91.5309 381.473 97.6355 384.001 104.001 384.001C110.366 384.001 116.471 381.473 120.972 376.972C125.473 372.471 128.001 366.366 128.001 360.001C128.001 353.635 125.473 347.531 120.972 343.03L81.9419 304.001H440.001C446.366 304.001 452.471 301.472 456.971 296.971C461.472 292.47 464.001 286.366 464.001 280.001C464.001 273.635 461.472 267.531 456.971 263.03C452.471 258.529 446.366 256.001 440.001 256.001Z" />
          </svg>  
          <TooltipSetter key={"engine_clear"}/>
        </button>
        
        <button 
          on:click={()=>{clear()}} 
          disabled={$engine != 'ENABLED'} 
          class="{$engine == 'ENABLED' ? 'hover:bg-red-500 hover:border-red-500' : 'opacity-75'} relative flex items-center focus:outline-none justify-center rounded my-2 border-select bg-select border-2  text-white px-2 py-0.5 mx-1 w-24">
          <div>Clear</div>
          <TooltipConfirm key={"configuration_header_clear"}/>
          <TooltipSetter key={"configuration_header_clear"}/>
          
        </button>
      

        
        <button 
          on:click={()=>{store()}} 
          disabled={$engine != 'ENABLED'}
          class="{$engine == 'ENABLED' ? 'hover:bg-commit-saturate-20 hover:border-commit-saturate-20' : 'opacity-75'} relative flex items-center justify-center rounded my-2 focus:outline-none border-2 border-commit bg-commit hover:bg-commit-saturate-20 hover:border-commit-saturate-20 text-white px-2 py-0.5 ml-1 w-24">
          <div> Store</div>
          <TooltipSetter key={"configuration_header_store"}/>
        </button>

      </div> 

    </div>

  </div>

</top-sub-menu>