
<script>
  import { engine } from '../../../runtime/runtime.store.js';
  import { writable, get } from 'svelte/store';
  import { profileListRefresh, presetListRefresh } from '../../../runtime/app-helper.store.js';

  import Monster from '../../user-interface/Monster.svelte'
  import {attachment} from  '../../user-interface/Monster.store'

  import instructions from "../../../serialport/instructions";

  import { onMount, onDestroy } from 'svelte';


  import TooltipSetter from '../../user-interface/tooltip/TooltipSetter.svelte';
  import TooltipQuestion from '../../user-interface/tooltip/TooltipQuestion.svelte';

  import { appSettings } from '../../../runtime/app-helper.store';
  //import { analytics } from '../../../runtime/analytics_influx';


  /**
  const { getGlobal, dialog } = require('@electron/remote');
  const trackEvent = getGlobal('trackEvent');
  */


  let helperPreviewElement;


  let helperAttachment = writable({
      element: helperPreviewElement,
      scale: 0.7,
      vpos: "50%",
      hpos: "50%"
    });

  onMount(async () => {
    helperAttachment.set({
      element: helperPreviewElement,
      scale: 0.7,
      vpos: "50%",
      hpos: "50%"
    });
  })

  let DEFAULT_PATH = '';

  window.electron.library.defaultDirectory().then(res => {
    console.log(res);
    DEFAULT_PATH = res;
  });

  let download_status = "";
  let download_status_interval;

  let preferences = ['MIDI Monitor', 'Debug', 'Advanced'];

  let window_name = "";
  let window_title = "";

  appSettings.subscribe(s => {

    try{
      window_name = s.activeWindowResult.owner.name;
      window_title = s.activeWindowResult.title;
    }catch(e){

      window_name = "";
      window_title = "";
    }


  })

  async function selectDirectory(){
    appSettings.update(s=>{ s.intervalPause = true; return s;});
    const selectDirectoryResult = await window.electron.library.selectDirectory();
    // if the selected directory fails or cancels, it returns with ''
    if(selectDirectoryResult !== ''){
      appSettings.update(s => {
        s.persistant.profileFolder = selectDirectoryResult
        return s;
      })
    }
    appSettings.update(s=>{ s.intervalPause = false; return s; });        
  }

  async function libraryDownload(){

    //trackEvent('library-download', 'library-download: download start')
    //analytics.track_event("application", "preferences", "profile downloader status", "download started")

    clearTimeout(download_status_interval)

    download_status = "Starting the download..."

    const targetFolder = get(appSettings).persistant.profileFolder;

    await window.electron.library.download(targetFolder, "library")

    profileListRefresh.update(s => {return s+1});
    presetListRefresh.update(s => {return s+1});

    download_status = "Library updated!"

    //trackEvent('library-download', 'library-download: download success')
    //analytics.track_event("application", "preferences", "profile downloader status", "download success")

    download_status_interval = setTimeout(() => {
      download_status = ""
    }, 2500);
    
  }

  async function uxpPhotoshopDownload(){
    await window.electron.library.download(get(appSettings).persistant.profileFolder, "uxpPhotoshop");
  }


  async function viewDirectory(){
    await window.electron.library.viewDirectory(get(appSettings).persistant.profileFolder);
  }  

  async function resetDirectory(){
    appSettings.update(s => { s.persistant.profileFolder = DEFAULT_PATH; return s;})
    await window.electron.library.resetDirectory()
  }

  
  function resetAppSettings(){
    window.electron.resetAppSettings();
  }


  function setModuleRotation(rot){
    $appSettings.persistant.moduleRotation = rot
    //analytics.track_event("application", "preferences", "module rotation", "set to "+rot)
  }

  function setHelperShape(shape){
    $appSettings.persistant.helperShape = shape
    //analytics.track_event("application", "preferences", "helper shape", "set to "+shape)
  }

  function setHelperColor(color){
    $appSettings.persistant.helperColor = color
    //analytics.track_event("application", "preferences", "helper color", "set to "+color)
  }

  function setHelperName(){
    //console.log("name")
    //analytics.track_event("application", "preferences", "helper color", "set to ...")
  }



</script>


  <preferences class="bg-primary flex flex-col h-full w-full text-white p-4 overflow-y-auto">

    <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">
      <div class="pb-2">General Settings</div>
      <div class="flex my-1 flex-col relative text-white">
        <div class="mb-1">Module Rotation</div>
        <div class="flex flex-row"> 
          <button class:selected="{$appSettings.persistant.moduleRotation === 0}" class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setModuleRotation(0)}}>0°</button>     
          <button class:selected="{$appSettings.persistant.moduleRotation === 90}" class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setModuleRotation(90)}}>90°</button>     
          <button class:selected="{$appSettings.persistant.moduleRotation === 180}" class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setModuleRotation(180)}}>180°</button>     
          <button class:selected="{$appSettings.persistant.moduleRotation === 270}" class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setModuleRotation(270)}}>270°</button>
        </div>
      </div>

      <div class="flex w-40 flex-col my-1 relative text-white"> 
        <div class="mb-1">Controller Scaling</div>
        <input type="range" min="1.7" max="2.6" step="0.1" bind:value={$appSettings.size}/>
      </div>



      <div class="flex my-1 relative text-white items-center"> 


        <input class="mr-1" type="checkbox" bind:checked={$appSettings.changeOnContact}>
        <div class="mx-1">Track Physical Grid interaction</div>
        <TooltipQuestion key={"preferences_track_physical"}/>
      </div>


      
    </div>

    <div class="p-4 bg-secondary rounded-lg flex flex-row mb-4">

      <div class="flex my-1 flex-col relative text-white">
        <div class="mb-1">Grid Helper Name</div>
        <div class="flex flex-row"> 
          <input type="text" placeholder="Helper Name" class="bg-primary my-1" on:blur={setHelperName} bind:value={$appSettings.persistant.helperName}/>   
        </div>
        <div class="mb-1">Style</div>
        <div class="flex flex-row"> 
          <button class:selected="{$appSettings.persistant.helperShape === 0}" class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setHelperShape(0)}}>Star</button>     
          <button class:selected="{$appSettings.persistant.helperShape === 1}" class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setHelperShape(1)}}>Play</button>     
          <button class:selected="{$appSettings.persistant.helperShape === 2}" class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setHelperShape(2)}}>Circle</button>     
          <button class:selected="{$appSettings.persistant.helperShape === 3}" class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setHelperShape(3)}}>Wave</button>
        </div>
        <div class="mb-1">Color</div>
        <div class="flex flex-row"> 
          <button class:selected="{$appSettings.persistant.helperColor === 0}" class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setHelperColor(0)}}>Green</button>     
          <button class:selected="{$appSettings.persistant.helperColor === 1}" class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setHelperColor(1)}}>Purple</button>     
          <button class:selected="{$appSettings.persistant.helperColor === 2}" class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setHelperColor(2)}}>Yellow</button>     
          <button class:selected="{$appSettings.persistant.helperColor === 3}" class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setHelperColor(3)}}>Blue</button>
        </div>
      </div>
      
      <div bind:this={helperPreviewElement} class="flex relative my-1 flex-col text-white w-full">

        <Monster  shapeSelected={$appSettings.persistant.helperShape} colorSelected={$appSettings.persistant.helperColor}  attachment={helperAttachment}/>

      </div>
    </div>



    <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">
      <div class="pb-2">User Library</div>  
      <div class="text-gray-400 py-1 mt-1 text-sm"><b>Selected folder:</b> {$appSettings.persistant.profileFolder}</div>
     
      <div class="flex">
        <button on:click={viewDirectory} class="w-1/2 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none relative">
          <div>View in explorer</div> 
          <TooltipSetter key={"profile_select_local_folder"}/>
        </button>
        <button on:click={selectDirectory} class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none relative">
          <div>Select Folder</div> 
          <TooltipSetter key={"profile_select_local_folder"}/>
        </button>
      </div>
      
      <div class="text-gray-400 py-1 mt-1 text-sm"><b>Default folder:</b> {DEFAULT_PATH}</div>
      <button on:click={resetDirectory} class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none relative">
        <div>Reset to Default</div> 
        <TooltipSetter key={"profile_select_local_folder"}/>
      </button>

      <div class="text-gray-400 py-1 mt-1 text-sm"><b>Default Profile & Preset libraries:</b> {download_status}</div>
      <button 
        on:click={()=>{libraryDownload()}} 
        class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none relative">
        Download Library
      </button>

      <div class="text-gray-400 py-1 mt-1 text-sm"><b>Photoshop Plugin</b></div>
      <button 
        on:click={()=>{uxpPhotoshopDownload()}} 
        class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none relative">
        Download UXP Plugin
      </button>  

    </div>



    <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">
      <div class="pb-2">Page Activator</div>  
      <div class="flex py-2 text-white items-center"> 
        <input class="mr-1" type="checkbox" bind:checked={$appSettings.persistant.pageActivatorEnabled}>
        <div class="mx-1">Enable/Disable page activator</div>
      </div>
      <div class="flex py-2 text-white items-center"> 
        <div class="mx-1">Poll interval</div>
        <input class="bg-primary m-1" type="range" min="200" max="2000" step="50" bind:value={$appSettings.persistant.pageActivatorInterval}>
        <div class="mx-1">{$appSettings.persistant.pageActivatorInterval} ms</div>
      </div>

      <div class="text-gray-400 py-1 mt-1 text-sm"><b>Active window:</b> {$appSettings.persistant.pageActivatorEnabled?window_name:"N/A"}</div>

      <div class="text-gray-400 py-1 mt-1 text-sm"><b>Active title:</b> {$appSettings.persistant.pageActivatorEnabled?window_title:"N/A"}</div>
      
      <input type="text" placeholder="Page 0 trigger application" class="bg-primary my-1" bind:value={$appSettings.persistant.pageActivatorCriteria_0}/>
      <input type="text" placeholder="Page 1 trigger application" class="bg-primary my-1" bind:value={$appSettings.persistant.pageActivatorCriteria_1}/>
      <input type="text" placeholder="Page 2 trigger application" class="bg-primary my-1" bind:value={$appSettings.persistant.pageActivatorCriteria_2}/>
      <input type="text" placeholder="Page 3 trigger application" class="bg-primary my-1" bind:value={$appSettings.persistant.pageActivatorCriteria_3}/>


    </div>


    <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">

      <div class="flex py-2 text-white items-center"> 
        <input class="mr-1" type="checkbox" bind:checked={$appSettings.persistant.welcomeOnStartup}>
        <div class="ml-1">Show welcome on startup</div>
      </div>

      <div class="flex py-2 text-white items-center"> 
        <input class="mr-1" type="checkbox" bind:checked={$appSettings.persistant.websocketMonitorEnabled}>
        <div class="mx-1">Enable/Disable websocket monitor</div>
      </div>

      <div class="flex py-2 text-white items-center"> 
        <input class="mr-1" type="checkbox" bind:checked={$appSettings.debugMode}>
        <div class="ml-1">Glitch Debug Mode</div>
      </div>

      <div class="flex flex-col items-start">
        <button 
          on:click={()=>{instructions.sendNVMDefragToGrid()}} 
          disabled={$engine != 'ENABLED'} 
          class="{$engine == 'ENABLED' ? 'hover:bg-red-500 hover:border-red-500' : 'opacity-75'} flex items-center focus:outline-none justify-center rounded my-2 border-select border-2  text-white px-2 py-0.5 ">
          NVM Defrag
        </button>
        
        <button 
          on:click={()=>{instructions.sendNVMEraseToGrid()}} 
          disabled={$engine != 'ENABLED'} 
          class="{$engine == 'ENABLED' ? 'hover:bg-red-500 hover:border-red-500' : 'opacity-75'} flex items-center focus:outline-none justify-center rounded my-2 border-select border-2  text-white px-2 py-0.5">
          NVM Erase
        </button>
        

      </div>

      <button 
        on:click={()=>{engine.set('ENABLED')}} 
        class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2">
        Enable Engine and User Inputs
      </button>

      <button 
        on:click={resetAppSettings} 
        class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2">
        Reset App Settings
      </button>
      
    </div>

  </preferences>


<style>


  button.selected{
    font-weight: bold;
    box-shadow:  inset 0 0 100px #ffffff60;
  }

</style>