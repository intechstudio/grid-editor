<script>
 
  import { onMount } from 'svelte';

  import { appSettings } from   '../runtime/app-helper.store';
  import { runtime } from       '../runtime/runtime.store';

  import { fade } from "svelte/transition";


  let fwMismatch = false; 

  let dotdotdot = "";

  let flagBootloaderCheck = 0;
  let booloaderConnectionCheck = undefined;

  let bootloader_path = undefined;

  const startBootladerCheck = () => {
    booloaderConnectionCheck = setInterval(() => find_bootloader_path(), 750)
  }
  

  appSettings.update(s => {s.firmwareNotificationState = 0; return s;})

  runtime.subscribe((store)=>{
    if (store.length !== 0){
      if ($appSettings.firmwareNotificationState !==5){
        appSettings.update(s => {s.firmwareNotificationState = 0; return s;})
      }
    }
    else {
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

      // only start interval if it is not already started.
      if(flagBootloaderCheck == 0){
        startBootladerCheck()
        flagBootloaderCheck = 1; // flag as started
      }

      if (fwMismatch === false){
        window.electron.analytics.google('firmware-download', {value: 'mismatch detected'})
        window.electron.analytics.influx("application", "firmwarecheck", "firmware update status", "mismatch detected")
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
    if(ctxProcess.platform == 'darwin'){
      text = 'Command + Shift + R';
    } else {
      text = 'Ctrl + Shift + R';
    }
  })

  
  async function find_bootloader_path(){

    bootloader_path = await window.electron.firmware.findBootloaderPath()

    if (bootloader_path !== undefined){
      clearInterval(booloaderConnectionCheck)
      // clear flag
      flagBootloaderCheck = 0;
    }

  }

  window.electron.firmware.onFirmwareUpdate((_event, value) => {

    console.log('fw update event from main...',value);

    if(value.code !== undefined){
      $appSettings.firmwareNotificationState = value.code;

      if(value.code == 5){
        setTimeout(()=> {
          $appSettings.firmwareNotificationState = 0;
        }, 2000)
      }
    }

    if(value.message !== undefined){
      uploadProgressText = value.message;
    }

  })

  async function firmwareDownload(){
    const folder = $appSettings.persistant.profileFolder;
    await window.electron.firmware.firmwareDownload(folder);
  }

  function firmwareTroubleshooting(){
    window.electron.analytics.google('firmware-download', {value:'troubleshooting'}); 
    window.electron.analytics.influx("application", "firmwarecheck", "firmware update status", "open troubleshooting")
    //openInBrowser(process.env.DOCUMENTATION_FIRMWAREUPDATE_URL)
  }


</script>




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
