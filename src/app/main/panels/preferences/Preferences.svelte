
<script>
  import { runtime, heartbeat } from '../../../runtime/runtime.store.js';

  import { appSettings, preferenceStore } from '../../_stores/app-helper.store.js';


  let preferences = ['MIDI Monitor', 'Debug', 'Advanced'];

  let selectedTab = preferences[0];


  function close(){
    appSettings.update( store => {
      store.preferences = false;
      return store;
    })
  }

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

    </div>

  </preferences>


<style>


</style>