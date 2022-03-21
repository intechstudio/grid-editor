<script>
  import { onMount } from 'svelte';
  import { writable, get } from 'svelte/store';

  import { openInBrowser } from '../runtime/app-helper.store';
  import { appSettings } from   '../runtime/app-helper.store';
  import { analytics} from      '../runtime/analytics_influx';
  import { runtime } from       '../runtime/runtime.store';

  

  import { fade, blur, fly, slide, scale } from "svelte/transition";

  const { getGlobal } = require('@electron/remote');
  const trackEvent = getGlobal('trackEvent');

  let fwMismatch = false; 



  const fs = require('fs-extra');  
  const AdmZip = require("adm-zip");
  // const drivelist = require('drivelist');
  const nodeDiskInfo = require('node-disk-info');

  let dotdotdot = "";

  let notificationState = 0; // 1: Mismatch detected, 2: Waiting for enumeration, 3: Bootloader detected, 4: Updating... , 5: Update completed

  appSettings.update(s => {s.firmwareNotificationState = 0; return s;})

  runtime.subscribe((store)=>{

    if (store.length !== 0){
      
      if ($appSettings.firmwareNotificationState !==5){
        appSettings.update(s => {s.firmwareNotificationState = 0; return s;})
      }
    }
    else{
      if ($appSettings.firmwareNotificationState === 1){
        appSettings.update(s => {s.firmwareNotificationState = 2; return s;})
      }
    }

    let gotMismatch = false;

    store.forEach(device=>{

      if (device.fwMismatch === true){
        gotMismatch = true;
      }

      
    });

    if (gotMismatch === true){


      appSettings.update(s => {s.firmwareNotificationState = 1; return s;})

      if (fwMismatch === false){
        trackEvent('firmware-download', 'firmware-download: mismatch detected')
        analytics.track_event("application", "firmwarecheck", "firmware update status", "mismatch detected")
        fwMismatch = true;
      }
      
    }
    else{
      fwMismatch = false;
    }

    
  })



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

    const diskInfo = nodeDiskInfo.getDiskInfoSync()

    //console.log(diskInfo)
    // 3829 MAC ||  11767 new
    // 3965 for Linux and 4059648 for Windows (old bootloader)
    // 7934 for Linux and 8123904 for Windows (new bootloader)

    let gridDrive = diskInfo.find(a => 
      a.blocks === 3965 || a.blocks === 3829 || a.blocks === 4059648 || 
      a.blocks === 7934 || a.blocks === 11767 || a.blocks === 8123904 
      
    );

    let data;

    if (gridDrive !== undefined ){
      try {
        data = fs.readFileSync(gridDrive.mounted + "/INFO_UF2.TXT", {encoding:'utf8', flag:'r'})
      } catch (error) {
        console.warn(error)
      }
    }

    if (data!==undefined){

      // isgrid
      if (data.indexOf("SAMD51N20A-GRID") !== -1){

        bootloader_path = gridDrive.mounted;

        if (uploadProgressText == ""){
          appSettings.update(s => {s.firmwareNotificationState = 3; return s;})
          uploadProgressText = "Grid bootloader is detected! ";

          
          trackEvent('firmware-download', 'firmware-download: bootloader detected')
          analytics.track_event("application", "firmwarecheck", "firmware update status", "bootloader detected")
        }  

        return;

      }

 

    }
    

    // reset path
    if (bootloader_path !== undefined){
      bootloader_path = undefined;
      setTimeout(() => {
        uploadProgressText = "";
        appSettings.update(s => {s.firmwareNotificationState = 0; return s;})
      }, 2000);

    }


  }

  setIntervalAsync(find_bootloader_path, 750);

  async function firmwareDownload(){


    appSettings.update(s => {s.firmwareNotificationState = 4; return s;})

    trackEvent('firmware-download', 'firmware-download: update start')
    analytics.track_event("application", "firmwarecheck", "firmware update status", "update started")


    const version = "v"+process.env.FIRMWARE_REQUIRED_MAJOR+"."+process.env.FIRMWARE_REQUIRED_MINOR+"."+process.env.FIRMWARE_REQUIRED_PATCH
    let link = process.env.FIRMWARE_URL_BEGINING + version + process.env.FIRMWARE_URL_END;

    uploadProgressText = "Downloading firmware image "
    
    let result = ipcRenderer.sendSync('download', {url: link, folder: "temp"});

    await delay(1000);

    if (result === undefined){
      uploadProgressText = "Error: Download failed"
      
      trackEvent('firmware-download', 'firmware-download: download fail')
      analytics.track_event("application", "firmwarecheck", "firmware update status", "download fail")
      await delay(2500);
      
      appSettings.update(s => {s.firmwareNotificationState = 3; return s;})
      return;
    }

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
      analytics.track_event("application", "firmwarecheck", "firmware update status", "update success")

      appSettings.update(s => {s.firmwareNotificationState = 5; return s;})
      
    }
    else{
      console.log("GRID_NOT_FOUND")

      trackEvent('firmware-download', 'firmware-download: update fail')
      analytics.track_event("application", "firmwarecheck", "firmware update status", "update fail")
    }



  }

  function firmwareTroubleshooting(){

    trackEvent('firmware-download', 'firmware-download: troubleshooting'); 
    analytics.track_event("application", "firmwarecheck", "firmware update status", "open troubleshooting")
    
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