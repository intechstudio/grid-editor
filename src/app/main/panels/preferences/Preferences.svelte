
<script>
  import { runtime, heartbeat, engine } from '../../../runtime/runtime.store.js';
  import { writable, get } from 'svelte/store';
  import { appSettings, preferenceStore } from '../../_stores/app-helper.store.js';

  import NVMDefrag from '../../NVMDefrag.svelte';
  import NVMErase from '../../NVMErase.svelte';
  import { serialComm } from '../../../serialport/serialport.store.js';
  import { onMount, onDestroy } from 'svelte';

  import TooltipSetter from '../../user-interface/tooltip/TooltipSetter.svelte';
    
  const os = require ('os');
  const username = os.userInfo ().username;
  console.log("Username:", username);

  const electron = require('electron'); 
  const {shell} = require('electron') // deconstructing assignment
  const fs = require('fs'); 

  const { ipcRenderer } = require('electron');


  // Importing dialog module using remote 
  const dialog = electron.remote.dialog; 

  let DEFAULT_PATH = ipcRenderer.sendSync('getProfileDefaultDirectory', 'foo');
  
  function firmwareDownload(){

    ipcRenderer.send('download', 'foo');

  }

  let preferences = ['MIDI Monitor', 'Debug', 'Advanced'];

  let serialList = [];
  serialComm.subscribe(serial => {
    serialList = serial.list;
  })

  let preferredPort;


  function openDirectory(){

    appSettings.update(s=>{ s.intervalPause = true; return s;});

    dialog.showOpenDialog({
        properties: ['openDirectory']
    }).then(dir => {
      if(!dir.canceled){

        appSettings.update(s => {
          s.persistant.profileFolder = dir.filePaths.toString();
          
          
          appSettings.update(s=>{ s.intervalPause = false; return s; });
          return s;
        })

      }
      appSettings.update(s=>{ s.intervalPause = false; return s; });
    }).catch(err => {
        console.log(err)
        appSettings.update(s=>{ s.intervalPause = false; return s; });
    });


   

  }

  function viewDirectory(){

   shell.openPath(get(appSettings).persistant.profileFolder) 
  }  

  function resetDirectory(){

    appSettings.update(s => {

      s.persistant.profileFolder = DEFAULT_PATH;
      return s;
    })
  }


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

    <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">
      <div class="pb-2">General Settings</div>
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


    <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">
      <div class="pb-2">Profile Library</div>  
      <div class="text-gray-400 py-1 mt-1 text-sm"><b>Selected folder:</b> {$appSettings.persistant.profileFolder}</div>
     
      <div class="flex">
        <button on:click={viewDirectory} class="w-1/2 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none relative">
          <div>View in explorer</div> 
          <TooltipSetter mode={1} key={"profile_select_local_folder"}/>
        </button>
        <button on:click={openDirectory} class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none relative">
          <div>Select Folder</div> 
          <TooltipSetter mode={1} key={"profile_select_local_folder"}/>
        </button>
      </div>
      
      <div class="text-gray-400 py-1 mt-1 text-sm"><b>Default folder:</b> {DEFAULT_PATH}</div>
      <button on:click={resetDirectory} class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none relative">
        <div>Reset to Default</div> 
        <TooltipSetter mode={1} key={"profile_select_local_folder"}/>
      </button>

    </div>



    <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">
      <div class="pb-2">Page Activator</div>  
      <div class="flex py-2 text-white items-center"> 
        <input class="mr-1" type="checkbox" bind:checked={$appSettings.persistant.pageActivatorEnabled}>
        <div class="mx-1">Enable/Disable page activator</div>
      </div>


      <div class="text-gray-400 py-1 mt-1 text-sm"><b>Active window:</b> {$appSettings.activeWindowResult.owner.name}</div>

      <div class="text-gray-400 py-1 mt-1 text-sm"><b>Active title:</b> {$appSettings.activeWindowResult.title}</div>
      
      <input type="text" placeholder="Page 0 trigger application" class="bg-primary m-1" bind:value={$appSettings.persistant.pageActivatorCriteria_0}/>
      <input type="text" placeholder="Page 1 trigger application" class="bg-primary m-1" bind:value={$appSettings.persistant.pageActivatorCriteria_1}/>
      <input type="text" placeholder="Page 2 trigger application" class="bg-primary m-1" bind:value={$appSettings.persistant.pageActivatorCriteria_2}/>
      <input type="text" placeholder="Page 3 trigger application" class="bg-primary m-1" bind:value={$appSettings.persistant.pageActivatorCriteria_3}/>


    </div>


    <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">

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

      <button 
        on:click={firmwareDownload} 
        class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2">
        firmwareDownload
      </button>

    </div>

  </preferences>


<style>


</style>