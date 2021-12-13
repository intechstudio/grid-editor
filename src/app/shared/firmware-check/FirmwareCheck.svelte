<script>
  import { onMount } from 'svelte';
  import UrlButton from '../../main/user-interface/UrlButton.svelte';
  import { writable, get } from 'svelte/store';
  import { appSettings, analytics_track_string_event, analytics_track_number_event } from '../../main/_stores/app-helper.store';
  import { runtime } from '../../runtime/runtime.store';
  import { openInBrowser } from '../helpers/global-helper.js';

  import { fade, blur, fly, slide, scale } from "svelte/transition";

  const { getGlobal } = require('electron').remote;
  const trackEvent = getGlobal('trackEvent');

  let fwMismatch = false; 
  let fwVersion;

  const fs = require('fs-extra');  
  const AdmZip = require("adm-zip");
  const drivelist = require('drivelist');

  let dotdotdot = "";

  let notificationState = 0; // 1: Mismatch detected, 2: Waiting for enumeration, 3: Bootloader detected, 4: Updating... , 5: Update completed

  appSettings.update(s => {s.firmwareNotificationState = 0; return s;})

  runtime.subscribe((store)=>{

    if (store.length !== 0){
      fwMismatch = false;
      if ($appSettings.firmwareNotificationState !==5){
        appSettings.update(s => {s.firmwareNotificationState = 0; return s;})
      }
    }
    else{
      if ($appSettings.firmwareNotificationState === 1){
        appSettings.update(s => {s.firmwareNotificationState = 2; return s;})
      }
    }

    store.forEach(device=>{
      if(JSON.stringify(device.fwVersion) !== JSON.stringify(fwVersion)){
        
        appSettings.update(s => {s.firmwareNotificationState = 1; return s;})
        if (fwMismatch === false){
          trackEvent('firmware-download', 'firmware-download: mismatch detected')
          analytics_track_string_event("firmware", "auto_update", "mismatch detected")
        }
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
        appSettings.update(s => {s.firmwareNotificationState = 3; return s;})
        uploadProgressText = "Grid bootloader is detected! ";

        
        trackEvent('firmware-download', 'firmware-download: bootloader detected')
        analytics_track_string_event("firmware", "auto_update", "bootloader detected")
      }

    }
    else{

      if (bootloader_path !== undefined){
        bootloader_path = undefined;
        setTimeout(() => {
          uploadProgressText = "";
          appSettings.update(s => {s.firmwareNotificationState = 0; return s;})
        }, 2000);

      }

    }

  }

  setIntervalAsync(find_bootloader_path, 750);

  async function firmwareDownload(){


    appSettings.update(s => {s.firmwareNotificationState = 4; return s;})

    trackEvent('firmware-download', 'firmware-download: update start')
    analytics_track_string_event("firmware", "auto_update", "update start")

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

        trackEvent('firmware-download', 'firmware-download: update success')
        analytics_track_string_event("firmware", "auto_update", "update success")

        appSettings.update(s => {s.firmwareNotificationState = 5; return s;})
        
      }
      else{
        console.log("GRID_NOT_FOUND")

        trackEvent('firmware-download', 'firmware-download: update fail')
        analytics_track_string_event("firmware", "auto_update", "update fail")
      }

    });

  }

  function firmwareTroubleshooting(){

    trackEvent('firmware-download', 'firmware-download: troubleshooting'); 
    analytics_track_string_event("firmware", "auto_update", "troubleshooting")
    
    openInBrowser("https://intech.studio/support/docs/firmware-update")

  }


</script>

<style>


</style>



{#if $appSettings.firmwareNotificationState === 1}
  <div  class="w-full bg-red-600 text-white justify-center flex items-center text-center p-4">
    <div class="flex-col">
      <div class="mx-2"><b>Oops, firmware mismatch is detected! </b> </div>
      <div class="mx-2">Reconnect your module in bootloader mode by holding the utility button while plugging in the USB cable! </div>
    </div>  
  </div>
{/if}


{#if $appSettings.firmwareNotificationState === 2}

  <div  class="w-full bg-red-600 text-white justify-center flex items-center text-center p-4">
    <div class="flex-col">
      <div class="mx-2" ><b>Waiting for the bootloader to enumerate {dotdotdot} </b> </div>
      <div class="mx-2">Connect the module in bootloader mode! </div>
    </div>
    <div in:fade={{delay: 8000}}>
      <button 
        on:click={firmwareTroubleshooting} 
        class="bg-red-700 hover:bg-red-800 ml-2 py-1 px-2 border-none font-medium text-white focus:outline-none rounded">
        <div>Troubleshooting Options</div>
      </button>

    </div>
  </div>

{/if}


{#if $appSettings.firmwareNotificationState === 3}

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

{#if $appSettings.firmwareNotificationState === 4}

  <div  class="w-full bg-blue-500 text-white justify-center flex items-center text-center p-4">
    <div class="flex-col">
      <div class="mx-2"><b>Update is in progress... </b> </div>
      <div class="mx-2">{uploadProgressText}</div>
    </div>
      
  </div>

{/if}

{#if $appSettings.firmwareNotificationState === 5}

  <div  class="w-full bg-green-500 text-white justify-center flex items-center text-center p-4">
    <div class="flex-col">
      <div class="mx-2"><b>{uploadProgressText}</b> </div>
      <div class="mx-2">Have fun!</div>
    </div>
  </div>

{/if}