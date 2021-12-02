<script>
  import { onMount } from 'svelte';
  import UrlButton from '../../main/user-interface/UrlButton.svelte';
  import { writable, get } from 'svelte/store';
  import { appSettings } from '../../main/_stores/app-helper.store';
  import { runtime } from '../../runtime/runtime.store';
  import { openInBrowser } from '../helpers/global-helper.js';

  let fwMismatch = false; 
  let fwVersion;

  const fs = require('fs-extra');  
  const AdmZip = require("adm-zip");
  const drivelist = require('drivelist');

  runtime.subscribe((store)=>{

    if (store.length !== 0){

      fwMismatch = false;
    }

    store.forEach(device=>{
      if(JSON.stringify(device.fwVersion) !== JSON.stringify(fwVersion)){
        fwMismatch = true;
      }
    });
  })

  appSettings.subscribe((store)=>{
    fwVersion = store.version;
  });


  let text = '';

  let uploadProgressText = "";

  onMount(()=>{
    if(process.platform == 'darwin'){
      text = 'Command + Shift + R';
    } else {
      text = 'Ctrl + Shift + R';
    }
  })


  function delay(time) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), time);
    });
  }


  const { ipcRenderer } = require('electron');


  let bootloader_path = undefined;

  const setIntervalAsync = (fn, ms) => {
    fn().then(() => {
      setTimeout(() => setIntervalAsync(fn, ms), ms);
    });
  };

  let find_bootloader_path = async function(){

    const drives = await drivelist.list();

    // "GRID Boot" on linux, "Boot" on windows
    let grid = drives.find(a => a.description.startsWith("GRID Boot") || a.description.startsWith("Boot"))

    if (grid !== undefined && grid.mountpoints.length !== 0){

      let flash_path = grid.mountpoints[0].path

      bootloader_path = flash_path;

      if (uploadProgressText == ""){

        uploadProgressText = "Grid bootloader is detected! Bootloader Path: " + bootloader_path;
      }

    }
    else{

      if (bootloader_path !== undefined){
        bootloader_path = undefined;
        setTimeout(() => {
          uploadProgressText = "";
        }, 2000);

      }

    }

  }

  setIntervalAsync(find_bootloader_path, 500);

  async function firmwareDownload(){
    
    uploadProgressText = "Fetching firmware download URL ..."
    fetch("https://intech.studio/common/github/releases").then(async e => {

      let res = await e.json();

      console.log(res.firmware.url)

      //ipcRenderer.send('download', res.firmware.url);
      uploadProgressText = "Downloading firmware image ..."
      let url = "https://github.com/intechstudio/grid-fw/releases/download/v1.2.9/grid_release_2021-11-25-1515.zip"
      let result = ipcRenderer.sendSync('download', url);

      console.log(result);

      uploadProgressText = "Download complete!"
      await delay(1000);


      let zip = new AdmZip(result);

      let zipEntries = zip.getEntries(); // an array of ZipEntry records

      let firmwareFileName;

      zipEntries.forEach(function (zipEntry) {
          console.log(zipEntry.toString()); // outputs zip entries information
          if (zipEntry.entryName.endsWith(".uf2")) {
            firmwareFileName = zipEntry.entryName;
          }
      });

      let folder = get(appSettings).persistant.profileFolder + "/firmware";


      uploadProgressText = "Decompressing image..."
      await delay(1000);

      zip.extractAllTo(folder, /*overwrite*/ true);

      console.log(firmwareFileName)



      uploadProgressText = "Uploading firmware..."
      await delay(1000);

      if (bootloader_path !== undefined){

        fs.copySync(folder + "/" + firmwareFileName, bootloader_path + "/" + firmwareFileName)

        uploadProgressText = "Update completed successfully!";

        
      }
      else{
        console.log("GRID_NOT_FOUND")
      }

    });

  }




</script>

<style>


</style>


{#if fwMismatch}
  <div  class="w-full bg-red-500 text-white justify-center flex items-center text-center p-4">
    <span class="mx-2">Oops, firmware mismatch is detected!</span>
    <span class="mx-2">Once you updated the firmware to v{$appSettings.version.major}.{$appSettings.version.minor}.{$appSettings.version.patch} hit <span class="font-mono text-sm mx-2 bg-white text-gray-700 px-2 py-1 rounded">{@html text}</span> to reload app!</span>
    <UrlButton url={"https://intech.studio/downloads#firmware"}>
      <div slot="button-label">Update</div>
    </UrlButton>
  </div>
{/if}


{#if uploadProgressText != ""}
  <div  class="w-full {uploadProgressText == "Update completed successfully!"?"bg-green-500":"bg-blue-500"} text-white justify-center flex items-center text-center p-4">
    <span class="mx-2">{uploadProgressText}</span>

    {#if uploadProgressText.startsWith("Grid bootloader is detected!")}
      <button 
        disabled={ (bootloader_path === undefined)}
        on:click={firmwareDownload} 
        class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2">
        Update Firmware
      </button>
    {/if}
  </div>

{/if}