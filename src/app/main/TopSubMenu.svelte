<script>
import { transition_in } from 'svelte/internal';


  import { appSettings } from '../main/_stores/app-helper.store';
  import { logger, runtime } from '../runtime/runtime.store';
  import ConfigErase from './ConfigErase.svelte';
  import ConfigStore from './ConfigStore.svelte';

  import {fade} from 'svelte/transition';
  import ConfigDiscard from './ConfigDiscard.svelte';

  let unsaved = 0;

  let color = 'red';

  runtime.unsaved.subscribe(v => unsaved = v);

</script>


<top-sub-menu style="background-color:rgb(25, 26, 32)" class="w-full rounded-tl-lg pt-4 -mt-4 shadow-md flex  text-white">
  
  <div class="h-14 py-2 px-2 bg-secondary w-full relative rounded-tl-lg  flex items-center justify-between">

    <div class="px-4">{$appSettings.activePanel}</div>

    {#if unsaved}
      <div in:fade class="flex items-center">
        <div class="mr-4">Unsaved changed</div>
        <div class="px-4 py-1 flex items-center justify-center rounded-md bg-select-saturate-20 text-yellow-300">{unsaved}</div>
        <ConfigDiscard classes={'ml-4'}/>
      </div>
    {/if}

    <div class="px-4">

      <div class="flex">

        <ConfigErase classes={'mr-1 w-24'}/>

        <ConfigStore classes={'ml-1 w-24'}/>        

      </div> 

    </div>

  </div>

</top-sub-menu>