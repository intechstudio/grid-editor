
<script>
  import { runtime, heartbeat, engine } from '../../../runtime/runtime.store.js';

  import { appSettings, preferenceStore } from '../../_stores/app-helper.store.js';


  let preferences = ['MIDI Monitor', 'Debug', 'Advanced'];


</script>

  <preferences class="bg-primary flex h-full w-full text-white p-4">

    <div class="flex flex-col">

      <div class="flex flex-col my-2">
        
        <div class="flex justify-between items-center">
          <div>Editor Heartbeat</div>
          <div class="py-0.5 px-2 text-white bg-secondary rounded">{$heartbeat.editor}</div>
        </div>

        <input bind:value={$heartbeat.editor} min="150" max="1000" type="range">

      </div>

      <div class="flex flex-col my-2">
        <div class="flex justify-between items-center">
          <div>Grid Heartbeat</div>
          <div class="py-0.5 px-2 text-white bg-secondary rounded">{$heartbeat.grid}</div>
        </div>

        <input bind:value={$heartbeat.grid} min="150" max="1000" type="range">
      </div>

      <div class="flex my-1 text-white items-center"> 
        <input class="mr-1" type="checkbox" bind:checked={$appSettings.changeOnContact}>
        <div class="ml-1">Track physical Grid interaction</div>
      </div>

      <div class="flex my-1 text-white items-center"> 
        <input class="mr-1" type="checkbox" bind:checked={$appSettings.debugMode}>
        <div class="ml-1">Glitch debug mode</div>
      </div>

      <button 
        on:click={()=>{engine.set('ENABLED')}} 
        class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-select bg-select hover:bg-select-saturate-20 hover:border-select-saturate-20 text-white px-2 py-0.5 mr-2">
        Enable Engine and User Inputs
      </button>

    </div>

  </preferences>


<style>


</style>