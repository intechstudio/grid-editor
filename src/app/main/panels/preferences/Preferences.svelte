
<script>
  import { runtime, heartbeat, engine } from '../../../runtime/runtime.store.js';
  import { writable, get } from 'svelte/store';
  import { profileListRefresh } from '../../../runtime/app-helper.store.js';

  import instructions from "../../../serialport/instructions";

  import { onMount, onDestroy } from 'svelte';


  import loadFilesFromDirectory from '../../panels/profiles/Profiles.svelte';

  import TooltipSetter from '../../user-interface/tooltip/TooltipSetter.svelte';

  import { appSettings } from '../../../runtime/app-helper.store';
  import { analytics } from '../../../runtime/analytics_influx';



  const electron = require('electron'); 


  const { getGlobal, dialog } = require('@electron/remote');
  const trackEvent = getGlobal('trackEvent');

  const {shell} = require('electron') // deconstructing assignment
  const fs = require('fs-extra');  
  const AdmZip = require("adm-zip");

  const { ipcRenderer } = require('electron');



  let DEFAULT_PATH = ipcRenderer.sendSync('getProfileDefaultDirectory', 'foo');

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

  function openDirectory(){

    appSettings.update(s=>{ s.intervalPause = true; return s;});

    dialog.showOpenDialog({
        properties: ['openDirectory']
    }).then(dir => {
      if(!dir.canceled){

        appSettings.update(s => {
          s.persistant.profileFolder = dir.filePaths.toString();
          
          // Create the folder if it does not exist
          if(!fs.existsSync(s.persistant.profileFolder)) fs.mkdirSync(s.persistant.profileFolder);

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
      // Create the folder if it does not exist
      if(!fs.existsSync(s.persistant.profileFolder)) fs.mkdirSync(s.persistant.profileFolder);
      return s;
    })
  }

  async function libraryDownload(){


    trackEvent('library-download', 'library-download: download start')
    analytics.track_event("application", "preferences", "profile downloader status", "download started")

    clearTimeout(download_status_interval)

    download_status = "Starting the download..."
    fetch("https://intech.studio/common/github/releases").then(async e => {

      let res = await e.json();

      let link = "https://github.com/intechstudio/grid-profiles/archive/refs/heads/main.zip"
      let result = ipcRenderer.sendSync('download', {url: link, folder: "temp"});
      download_status = "Download completed!"
      let zip = new AdmZip(result);

      let zipEntries = zip.getEntries(); // an array of ZipEntry records

      let profileFilePaths = [];

      zipEntries.forEach(function (zipEntry) {

        if (zipEntry.entryName.endsWith(".json")) {

          profileFilePaths.push(zipEntry.entryName);
        }
      });

      let folder = get(appSettings).persistant.profileFolder;

      zip.extractAllTo(folder + "/temp", /*overwrite*/ true);

      download_status = "Archive extracted!"
      // console.log(profileFilePaths)

      if (profileFilePaths.length !== 0){

        profileFilePaths.forEach(path => {


          let parts = path.split("/")
          let filename = parts[parts.length-1]

          // console.log(path)
          fs.copySync(folder + "/temp/" + path, folder+"/profiles/intech/" + filename)

        })

        download_status = "Profiles copied!"

        profileListRefresh.update(s => {return s+1});
        download_status = "Library updated!"

        trackEvent('library-download', 'library-download: download success')
        analytics.track_event("application", "preferences", "profile downloader status", "download success")

        download_status_interval = setTimeout(() => {
          download_status = ""
        }, 2500);
      }
      else{
     
        trackEvent('library-download', 'library-download: download failed')   
        analytics.track_event("application", "preferences", "profile downloader status", "download fail")
        console.log("GRID_NOT_FOUND")
      }

    });

  }

  function resetAppSettings(){

    ipcRenderer.sendSync('resetAppSettings', 'foo');

    console.log("App settings cleared");

  }


  function setModuleRotation(rot){
    $appSettings.persistant.moduleRotation = rot

    analytics.track_event("application", "preferences", "module rotation", "set to "+rot)
  }


  onMount(async () => {

  })

</script>

  <preferences class="bg-primary flex flex-col h-full w-full text-white p-4 overflow-y-auto">

    <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">
      <div class="pb-2">General Settings</div>
      <div class="flex my-1 flex-col relative text-white">
        <div class="mb-1">Module Rotation</div>
        <div class="flex flex-row"> 
          <button class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setModuleRotation(0)}}>0°</button>     
          <button class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setModuleRotation(90)}}>90°</button>     
          <button class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setModuleRotation(180)}}>180°</button>     
          <button class="w-16 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 relative" on:click={()=>{setModuleRotation(270)}}>270°</button>
        </div>
      </div>

      <div class="flex w-40 flex-col my-1 relative text-white"> 
        <div class="mb-1">Controller Scaling</div>
        <input type="range" min="1.7" max="2.6" step="0.1" bind:value={$appSettings.size}/>
      </div>



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


      
    </div>


    <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">
      <div class="pb-2">User Library</div>  
      <div class="text-gray-400 py-1 mt-1 text-sm"><b>Selected folder:</b> {$appSettings.persistant.profileFolder}</div>
     
      <div class="flex">
        <button on:click={viewDirectory} class="w-1/2 mr-2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none relative">
          <div>View in explorer</div> 
          <TooltipSetter key={"profile_select_local_folder"}/>
        </button>
        <button on:click={openDirectory} class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none relative">
          <div>Select Folder</div> 
          <TooltipSetter key={"profile_select_local_folder"}/>
        </button>
      </div>
      
      <div class="text-gray-400 py-1 mt-1 text-sm"><b>Default folder:</b> {DEFAULT_PATH}</div>
      <button on:click={resetDirectory} class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none relative">
        <div>Reset to Default</div> 
        <TooltipSetter key={"profile_select_local_folder"}/>
      </button>

      <div class="text-gray-400 py-1 mt-1 text-sm"><b>Default profile library:</b> {download_status}</div>
      <button 
        on:click={()=>{libraryDownload()}} 
        class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none relative">
        Download Profile Library
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
      
      <input type="text" placeholder="Page 0 trigger application" class="bg-primary m-1" bind:value={$appSettings.persistant.pageActivatorCriteria_0}/>
      <input type="text" placeholder="Page 1 trigger application" class="bg-primary m-1" bind:value={$appSettings.persistant.pageActivatorCriteria_1}/>
      <input type="text" placeholder="Page 2 trigger application" class="bg-primary m-1" bind:value={$appSettings.persistant.pageActivatorCriteria_2}/>
      <input type="text" placeholder="Page 3 trigger application" class="bg-primary m-1" bind:value={$appSettings.persistant.pageActivatorCriteria_3}/>


    </div>


    <div class="p-4 bg-secondary rounded-lg flex flex-col mb-4">

      <div class="flex py-2 text-white items-center"> 
        <input class="mr-1" type="checkbox" bind:checked={$appSettings.persistant.welcomeOnStartup}>
        <div class="ml-1">Show welcome on startup</div>
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


</style>