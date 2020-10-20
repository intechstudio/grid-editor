<script>
  import { onMount } from 'svelte';

  import { appSettings } from '../../stores/app-settings.store.js';
  import { runtime } from '../../stores/runtime.store.js';

  let fwMismatch = false; 
  let fwVersion;

  runtime.subscribe((store)=>{
    store.forEach(gridController=>{
      if(JSON.stringify(gridController.fwVersion) !== JSON.stringify(fwVersion)){
        fwMismatch = true;
      }
    });
  })

  appSettings.subscribe((store)=>{
    fwVersion = store.version;
  });


  let text = '';

  onMount(()=>{
    if(process.platform == 'darwin'){
      text = 'Command + Shift + R';
    } else {
      text = 'Ctrl + Shift + R';
    }
  })
</script>

<style>


</style>

{#if fwMismatch}
  <div  class="w-full bg-red-500 text-white justify-center flex items-center text-center p-4">
    <span class="mx-2">Oops, firmware mismatch is detected!</span>
    <span class="mx-2">Once you updated the firmware hit <span class="font-mono text-sm mx-2 bg-white text-gray-700 px-2 py-1 rounded">{@html text}</span> to reload app!</span>
    <a target="_BLANK" href="https://github.com/IntechStudioDev/grid-fw/releases/tag/{'v'+fwVersion.major+'.'+fwVersion.minor+'.'+fwVersion.patch}" class="bg-red-700 ml-2 font-medium text-white py-1 px-2 border-none hover:bg-red-800 focus:outline-none rounded">Update</a>
  </div>
{/if}