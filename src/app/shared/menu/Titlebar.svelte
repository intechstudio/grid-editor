<script>
  import { onMount } from 'svelte';
  import MinMaxClose from './MinMaxClose.svelte';
  import AppInfo from './AppInfo.svelte'
  import {appSettings} from '../../stores/app-settings.store';
import { commIndicator } from '../../core/serialport/serialport.store';
import { messageStore } from '../../stores/message.store';


  export let debugMode;

  let tx, rx;

  onMount(()=>{

    commIndicator.subscribe(values => {
      tx = values.tx;
      rx = values.rx;
    })

  })

  $: {
    appSettings.update((store)=>{
      store.debugMode = debugMode;
      return store;
    })
  }

</script>

<header id="top-bar" class="text-white static top-0 w-full bg-primary p-1">
  <div class="draggable flex justify-between">
    <div class="flex">
      <div class="p-1 text-gray-700 font-gt-pressura tracking-wider">EDITOR</div>
    </div>

    <AppInfo></AppInfo>

    <div class="flex items-center not-draggable text-sm">
      <button 
        on:click={()=> {debugMode = !debugMode}} 
        class:bg-highlight={debugMode} 
        class="text-white px-2 py-1 mx-2 rounded border-highlight hover:bg-highlight-400 focus:outline-none ">
        debug
      </button>

      <slot></slot>

    </div>


    <div class="flex">
      <div class="flex mx-2 items-center text-xs">
        <div class:bg-green-500={tx} class:bg-secondary={!tx} class="mr-2 rounded-full p-2 w-4 h-4"></div>
        <div class="">TX</div>
      </div>

      <div class="flex mx-2 items-center text-xs">
        <div class:bg-green-500={rx} class:bg-secondary={!rx}  class="mr-2 rounded-full p-2 w-4 h-4"></div>
        <div>RX</div>
      </div>

      <div class="flex mx-2 items-center text-xs">
        changed: {$messageStore.changed}
      </div>

      <div class="flex mx-2 items-center text-xs">
        fetched: {$messageStore.fetched}
      </div>

      <div class="flex mx-2 items-center text-xs">
        received: {$messageStore.received}
      </div>

      <div class="flex mx-2 items-center text-xs">
        sent_to_grid: {$messageStore.sent_to_grid}
      </div>
    </div>
    
    <MinMaxClose/>
        
  </div>
</header>

<style>
  :global(.draggable){
    -webkit-app-region:drag;
  }

  :global(.not-draggable){
    -webkit-app-region:no-drag;
  }

</style>