<script>
import { transition_in } from 'svelte/internal';


  import { appSettings } from '../main/_stores/app-helper.store';
  import { logger, runtime } from '../runtime/runtime.store';
  import ConfigErase from './ConfigErase.svelte';
  import ConfigStore from './ConfigStore.svelte';

  import {fade} from 'svelte/transition';

  let unsaved = 0;

  let message = '';

  runtime.unsaved.subscribe(v => unsaved = v);

  logger.subscribe(s => {
    console.log('HERE', s)
    message = s.message;
    setTimeout(()=>{
      message = '';
    }, 2500)
  })

</script>


<top-sub-menu style="background-color:rgb(25, 26, 32)" class="w-full rounded-tl-lg pt-4 -mt-2 shadow-md flex  text-white">
  
  <div class="h-14 py-2 px-2 bg-secondary w-full relative rounded-tl-lg  flex items-center justify-between">

    <div class="px-4">{$appSettings.activePanel}</div>

    {#if unsaved}
      <div in:fade class="flex items-center">
        <div class="mr-4">Unsaved changed</div>
        <div class="px-4 py-1 flex items-center justify-center rounded-md bg-select-saturate-20 text-yellow-300">{unsaved}</div>
        <button on:click={()=>{runtime.unsaved.set(0)}} class="ml-4 flex items-center justify-center rounded my-2 border-select bg-select border-2 hover:bg-yellow-600 hover:border-yellow-700 text-white px-2 py-0.5">Discard Changes</button>
      </div>
    {/if}

    {#if message}
      <div in:fade class="bg-red-500 text-sm absolute top-20 right-1/2 text-white leading-relaxed tracking-wide p-4 rounded-md text-center">{message}</div>
    {/if}

    <div class="px-4">

      <div class="flex">

        <ConfigErase classes={'mr-1 w-24'}/>

        <ConfigStore classes={'ml-1 w-24'}/>        

      </div> 

    </div>

  </div>

</top-sub-menu>