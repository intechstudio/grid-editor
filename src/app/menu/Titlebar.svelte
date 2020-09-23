<script>
  import { onMount } from 'svelte';
  import { appSettings } from '../stores/app-settings.store';
  import { serialComm } from '../serialport/serialport.store';

  let port = [{path: ''}];

  serialComm.subscribe(value => {
    if(value[0]){
      port = value[0];
    }
  })



  onMount(()=>{
    init();
  })

</script>

<main class="text-white bg-primary p-1">
  <div class="draggable flex justify-between">
    <div class="flex">
      <div class="p-1 text-secondary font-gt-pressura tracking-wider ">EDITOR</div>
    </div>
    <div class="flex items-center not-draggable text-sm">
      <button on:click={()=> {debugMode = ! debugMode}} class:bg-highlight={debugMode} class="text-white px-2 py-1 mx-2 rounded border-highlight hover:bg-highlight-400 focus:outline-none ">debug</button>
      <div class="flex mx-2 items-center">
        <div>{port.path}</div>
      </div>
      <div class="flex mx-2 items-center">
        
          {#if port.isOpen}
            <div class="mx-2 rounded-full p-2 w-4 h-4 bg-green-500"></div>
            <div>Connected</div>
          {:else}
            <div class="mx-2 rounded-full p-2 w-4 h-4 bg-red-500"></div>
            <div class="text-red-500">Reconnect Grid!</div>
          {/if}
        
        
      </div>
      <div class="flex mx-2 items-center">
        <div>TX</div>
        <div class="mx-2 rounded-full p-2 w-4 h-4 bg-black"></div>
      </div>
      <div class="flex mx-2 items-center">
        <div>RX</div>
        <div class="mx-2 rounded-full p-2 w-4 h-4 bg-black"></div>
      </div>
    </div>
    
  </div>
</main>

<style>
  .draggable{
    -webkit-app-region:drag;
  }

  .not-draggable{
    -webkit-app-region:no-drag;
  }

</style>