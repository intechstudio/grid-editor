<script>
  import { onMount } from 'svelte';
  import UrlButton from '../../main/user-interface/UrlButton.svelte';
  import { writable, get } from 'svelte/store';
  import { appSettings } from '../../main/_stores/app-helper.store';
  import { runtime } from '../../runtime/runtime.store';
  import { openInBrowser } from '../helpers/global-helper.js';

  import { fade, blur, fly, slide, scale } from "svelte/transition";

  let fwMismatch = false; 
  let fwVersion;

  const fs = require('fs-extra');  
  const AdmZip = require("adm-zip");
  const drivelist = require('drivelist');

  let dotdotdot = "";

  let notificationState = 0; // 1: Mismatch detected, 2: Waiting for enumeration, 3: Bootloader detected, 4: Updating... , 5: Update completed

  runtime.subscribe((store)=>{

    if (store.length !== 0){
      fwMismatch = false;
      if (notificationState !==5){
        notificationState = 0;
      }
    }
    else{
      if (notificationState == 1){
        notificationState = 2;
      }
    }

    store.forEach(device=>{
      if(JSON.stringify(device.fwVersion) !== JSON.stringify(fwVersion)){
        fwMismatch = true;
        notificationState = 1;
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

    if (dotdotdot !== "..."){
      dotdotdot += ".";
    }
    else {
      dotdotdot = "";
    }

    const drives = await drivelist.list();

    // "GRID Boot" on linux, "Boot" on windows
    let grid = drives.find(a => a.description.startsWith("GRID Boot") || a.description.startsWith("Boot"))

    if (grid !== undefined && grid.mountpoints.length !== 0){

      let flash_path = grid.mountpoints[0].path

      bootloader_path = flash_path;

      if (uploadProgressText == ""){
        notificationState = 3;
        uploadProgressText = "Grid bootloader is detected! ";
      }

    }
    else{

      if (bootloader_path !== undefined){
        bootloader_path = undefined;
        setTimeout(() => {
          uploadProgressText = "";
          notificationState = 0;
        }, 2000);

      }

    }

  }

  setIntervalAsync(find_bootloader_path, 750);

  async function firmwareDownload(){


    notificationState = 4;


    uploadProgressText = "Fetching firmware download URL "
    fetch("https://intech.studio/common/software/grid-firmware").then(async e => {

      let link = "";
      try{
        let res = await e.json();
        link = res.url;

      }catch(e){

        link = "https://github.com/intechstudio/grid-fw/releases/download/v1.2.10/grid_release.zip"
      }

      uploadProgressText = "Downloading firmware image "

      //ipcRenderer.send('download', res.firmware.url);
      uploadProgressText = "Downloading firmware image "
      let result = ipcRenderer.sendSync('download', {url: link, folder: "temp"});

      console.log(result);


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

      let folder = get(appSettings).persistant.profileFolder + "/temp";


      uploadProgressText = "Decompressing image "
      await delay(1500);

      zip.extractAllTo(folder, /*overwrite*/ true);

      console.log(firmwareFileName)



      uploadProgressText = "Uploading firmware "
      await delay(1500);

      if (bootloader_path !== undefined){

        fs.copySync(folder + "/" + firmwareFileName, bootloader_path + "/" + firmwareFileName)

        uploadProgressText = "Update completed successfully!";


        notificationState = 5;
        
      }
      else{
        console.log("GRID_NOT_FOUND")
      }

    });

  }




</script>

<style>


</style>


{#if notificationState === 1}
  <div  class="w-full bg-red-600 text-white justify-center flex items-center text-center p-4">
    <div class="flex-col">
      <div class="mx-2"><b>Oops, firmware mismatch is detected! </b> </div>
      <div class="mx-2">Reconnect your module in bootloader mode by holding the utility button while plugging in the USB cable! </div>
    </div>  
  </div>
{/if}


{#if notificationState === 2}

  <div  class="w-full bg-red-600 text-white justify-center flex items-center text-center p-4">
    <div class="flex-col">
      <div class="mx-2" ><b>Waiting for the bootloader to enumerate {dotdotdot} </b> </div>
      <div class="mx-2">Connect the module in bootloader mode! </div>
    </div>
    <div in:fade={{delay: 8000}}>
      <UrlButton url={"https://intech.studio/support/docs/firmware-update"}>
        <div slot="button-label">Troubleshooting Options</div>
      </UrlButton>
    </div>
  </div>

{/if}


{#if notificationState === 3}

  <div  class="w-full bg-blue-500 text-white justify-center flex items-center text-center p-4">

    <div class="flex-col">
      <div class="mx-2"><b>{uploadProgressText} </b> {bootloader_path} </div>
      <div class="mx-2">Click Update to start the automatic update process! </div>
    </div>

    <button 
      on:click={firmwareDownload} 
      class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2">
      Update Firmware
    </button>  
  </div>



{/if}

{#if notificationState === 4}

  <div  class="w-full bg-blue-500 text-white justify-center flex items-center text-center p-4">
    <div class="flex-col">
      <div class="mx-2"><b>Update is in progress... </b> </div>
      <div class="mx-2">{uploadProgressText}</div>
    </div>
      
  </div>

{/if}

{#if notificationState === 5}

  <div  class="w-full bg-green-500 text-white justify-center flex items-center text-center p-4">
    <div class="flex-col">
      <div class="mx-2"><b>{uploadProgressText}</b> </div>
      <div class="mx-2">Have fun!</div>
    </div>
  </div>

{/if}