<script>

  import { appSettings } from '../stores/app-settings.store.js';
  import { grid } from '../stores/grid.store.js';

  let fwMismatch = false; 
  let fwVersion;

  grid.subscribe((grid)=>{
    grid.used.forEach(used=>{
      if(JSON.stringify(used.fwVersion) !== JSON.stringify(fwVersion)){
        fwMismatch = true;
      }
    });
  })

  appSettings.subscribe((store)=>{
    fwVersion = store.version;
  });

</script>

<style>


</style>

{#if fwMismatch}
  <div  class="w-full bg-red-500 text-white justify-center items-center text-center p-4">
    <span>Oops, firmware mismatch is detected!</span>
    <button on:click={() => {fwMismatch = true}} class="ml-2  text-white py-1 px-2 border-none focus:outline-none rounded">Dismiss</button>
    <a target="_BLANK" href="https://github.com/IntechStudioDev/grid-fw/releases/tag/{'v'+fwVersion.major+'.'+fwVersion.minor+'.'+fwVersion.patch}" class="bg-red-700 ml-2 font-medium text-white py-1 px-2 border-none hover:bg-red-800 focus:outline-none rounded">Update</a>

  </div>
{/if}