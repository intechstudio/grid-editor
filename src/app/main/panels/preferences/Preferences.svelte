
<script>
  import { runtime, heartbeat, engine } from '../../../runtime/runtime.store.js';

  import { appSettings, preferenceStore } from '../../_stores/app-helper.store.js';


  let preferences = ['MIDI Monitor', 'Debug', 'Advanced'];


</script>

  <preferences class="bg-primary flex flex-col h-full w-full text-white p-4">

    <div class="p-4 bg-secondary rounded-lg flex flex-col">

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

    <div class="bg-secondary bg-opacity-25 p-4 mt-4 rounded-lg my-2">

      <div class="pb-2">Developer Settings</div>

      <div class="flex py-2 text-white items-center"> 
        <input class="mr-1" type="checkbox" bind:checked={$appSettings.debugMode}>
        <div class="ml-1">Glitch Debug Mode</div>
      </div>

      <button 
        on:click={()=>{engine.set('ENABLED')}} 
        class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-10 hover:border-select-saturate-10 text-white px-2 py-0.5 mr-2">
        Enable Engine and User Inputs
      </button>

    </div>

  </preferences>


<style>


</style>