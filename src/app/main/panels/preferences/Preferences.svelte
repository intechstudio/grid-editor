
<script>
  import { runtime, heartbeat, engine } from '../../../runtime/runtime.store.js';

  import { appSettings, preferenceStore } from '../../_stores/app-helper.store.js';

  import NVMDefrag from '../../NVMDefrag.svelte';
  import NVMErase from '../../NVMErase.svelte';
  import { serialComm } from '../../../serialport/serialport.store.js';
  import { onMount } from 'svelte';

  const { ipcRenderer } = require('electron');


  let preferences = ['MIDI Monitor', 'Debug', 'Advanced'];

  let serialList = [];
  serialComm.subscribe(serial => {
    serialList = serial.list;
  })

  let preferredPort;

  function changePreferredPort(path){

    if(path !== 'select your preference...' && path !== undefined){

      ipcRenderer.send('setStoreValue-message', { preferred_serial_port: path });

      if($serialComm.list.find(p => p.port.path == path)){
        serialComm.update(s => {
          s.open = undefined;
          s.isEnabled = false;
          s.preferredPort = path;
          return s;
        })
      }
    }
    
  }

  onMount(async () => {
    preferredPort = await ipcRenderer.invoke('getStoreValue', 'preferred_serial_port');
    if(preferredPort !== undefined) {
      serialComm.update((s)=>{s.preferredPort = preferredPort; return s;});
    }
  })

</script>

  <preferences class="bg-primary flex flex-col h-full w-full text-white p-4">

    <div class="p-4 bg-secondary rounded-lg flex flex-col">

      <div class="flex my-1 relative text-white items-center"> 
        <input class="mr-1" type="checkbox" bind:checked={$appSettings.changeOnContact}>
        <div class="mx-1">Track Physical Grid interaction</div>
        <div class="group">
          <div class="font-roboto-mono text-green-300 font-bold text-sm rounded-full p-2 mx-1 flex items-center justify-center w-6 h-6 bg-black">
            <div>i</div>
          </div>
          <div class="group-hover:visible invisible absolute top-1 mt-4 ml-4 right-0 bg-thirdery rounded-md px-4 py-2 w-64 z-10 shadow border border-gray-700">
            <p> 
              This switches on-off tracking changes of the user interaction with the Grid module. The Editor user interface will only react to mouse clicks.
            </p> 
          </div>
        </div>
      </div>

      <div class="flex w-40 flex-col my-1 relative text-white"> 
        <div class="mb-1">Controller Scaling</div>
        <input type="range" min="1.7" max="2.6" step="0.1" bind:value={$appSettings.size}/>
      </div>
      
    </div>

    <div class="bg-secondary bg-opacity-25 p-4 mt-4 rounded-lg my-2">

      <div class="pb-2">Developer Settings</div>

      <div class="flex py-2 text-white items-center"> 
        <input class="mr-1" type="checkbox" bind:checked={$appSettings.debugMode}>
        <div class="ml-1">Glitch Debug Mode</div>
      </div>

      <div class="text-white flex flex-col items-start py-2">
        <div class="pl-1">
          Select serial port
        </div>
        <div class="pl-1 py-1 text-gray-500">
          {'open: ' + $serialComm.selected}
        </div>
        <select bind:value={preferredPort} class="bg-secondary py-1">
          {#each [{port: {path: 'select your preference...'}},...serialList] as serial}
            <option value={serial.port.path} class="py-1 px-0.5">{serial.port.path}</option>
          {/each}
        </select>
        <button 
          on:click={()=>{changePreferredPort(preferredPort)}}
          class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2">
          Change Serial Port
        </button>      
      </div>

      <div class="flex flex-col items-start">
        <NVMDefrag/>
        <NVMErase/>
      </div>

      <button 
        on:click={()=>{engine.set('ENABLED')}} 
        class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2">
        Enable Engine and User Inputs
      </button>

    </div>

  </preferences>


<style>


</style>