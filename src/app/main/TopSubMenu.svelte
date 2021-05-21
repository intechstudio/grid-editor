<script>

  import { appSettings } from '../main/_stores/app-helper.store';
  import { runtime } from '../runtime/runtime.store';
  import ConfigErase from './ConfigErase.svelte';
  import ConfigStore from './ConfigStore.svelte';

  let unsaved = 0;

  runtime.unsaved.subscribe(v => unsaved = v);

</script>


<top-sub-menu style="background-color:rgb(25, 26, 32)" class="w-full rounded-tl-lg pt-4 -mt-2 shadow-md flex  text-white">
  
  <div class="h-14 py-2 px-2 bg-secondary w-full rounded-tl-lg  flex items-center justify-between">

    <div class="px-4">{$appSettings.activePanel}</div>

    <div>

      {unsaved ? `Unsaved changed: ${unsaved}` : ''}

    </div>



    <div class="px-4">

      <div class="flex">

        <ConfigErase classes={'mr-1 w-24'}/>

        <ConfigStore classes={'ml-1 w-24'}/>

        

      </div> 

    </div>

  </div>

</top-sub-menu>