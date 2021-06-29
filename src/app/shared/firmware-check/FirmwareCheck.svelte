<script>
  import { onMount } from 'svelte';
import UrlButton from '../../main/user-interface/UrlButton.svelte';

  import { appSettings } from '../../main/_stores/app-helper.store';
  import { runtime } from '../../runtime/runtime.store';
  import { openInBrowser } from '../helpers/global-helper.js';

  let fwMismatch = false; 
  let fwVersion;

  runtime.subscribe((store)=>{
    fwMismatch = false;
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
    <UrlButton url={"https://intech.studio/downloads#firmware"}>
      <div slot="button-label">Update</div>
    </UrlButton>
  </div>
{/if}