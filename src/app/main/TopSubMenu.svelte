<script>

  import { appSettings } from '../main/_stores/app-helper.store';
  import { engine, logger, runtime } from '../runtime/runtime.store';
  import NVMErase from './NVMErase.svelte';
  import PageStore from './PageStore.svelte';

  import {fade} from 'svelte/transition';
  import PageDiscard from './PageDiscard.svelte';
  import PageClear from './PageClear.svelte';

  let unsaved = 0;

  runtime.unsaved.subscribe(v => unsaved = v);

</script>


<top-sub-menu style="background-color:rgb(25, 26, 32)" class="w-full rounded-tl-lg pt-4 -mt-4 shadow-md flex  text-white">
  
  <div class="h-14 py-2 px-2 bg-secondary w-full relative rounded-tl-lg  flex items-center justify-between">

    <div class="px-4">{$appSettings.rightPanel}</div>

    {#if unsaved}
      <div in:fade class="flex items-center">
        <div class="mr-4">Unsaved changed</div>
        <div class="px-4 py-1 flex items-center justify-center rounded-md bg-select-saturate-20 text-yellow-300">{unsaved}</div>
        <PageDiscard classes={'ml-4'}/>
      </div>
    {/if}

    <div class="px-4">

      <div class="flex items-center">

        <div class="mr-6 px-3 py-2 group relative flex items-center justify-center rounded-md bg-select-saturate-10  ">
          <span class="pr-2 text-sm text-gray-200 tracking-wider font-light">{$engine}</span>
          <svg class="w-5 h-5 fill-current {$engine == 'ENABLED' ? 'text-green-500' : 'text-red-500'}" viewBox="0 0 465 385" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24.0009 128.001H382.06L343.03 167.03C338.529 171.531 336 177.635 336 184.001C336 190.366 338.529 196.471 343.03 200.972C347.531 205.473 353.636 208.001 360.001 208.001C366.366 208.001 372.471 205.473 376.972 200.972L456.972 120.972C459.201 118.743 460.969 116.097 462.175 113.185C463.381 110.273 464.002 107.152 464.002 104.001C464.002 100.849 463.381 97.7278 462.175 94.8159C460.969 91.904 459.201 89.2582 456.972 87.0296L376.972 7.02962C372.471 2.52863 366.366 -4.74256e-08 360.001 0C353.636 4.74256e-08 347.531 2.52863 343.03 7.02962C338.529 11.5306 336 17.6353 336 24.0006C336 30.366 338.529 36.4706 343.03 40.9716L382.06 80.0006H24.0009C17.6357 80.0006 11.5312 82.5292 7.03031 87.0301C2.52944 91.5309 0.000873566 97.6354 0.000873566 104.001C0.000873566 110.366 2.52944 116.47 7.03031 120.971C11.5312 125.472 17.6357 128.001 24.0009 128.001Z"/>
            <path d="M440.001 256.001H81.9419L120.972 216.972C125.473 212.471 128.001 206.366 128.001 200.001C128.001 193.635 125.473 187.531 120.972 183.03C116.471 178.529 110.366 176 104.001 176C97.6355 176 91.5309 178.529 87.0299 183.03L7.02987 263.03C4.80114 265.258 3.0332 267.904 1.82701 270.816C0.620819 273.728 0 276.849 0 280.001C0 283.152 0.620819 286.273 1.82701 289.185C3.0332 292.097 4.80114 294.743 7.02987 296.972L87.0299 376.972C91.5309 381.473 97.6355 384.001 104.001 384.001C110.366 384.001 116.471 381.473 120.972 376.972C125.473 372.471 128.001 366.366 128.001 360.001C128.001 353.635 125.473 347.531 120.972 343.03L81.9419 304.001H440.001C446.366 304.001 452.471 301.472 456.971 296.971C461.472 292.47 464.001 286.366 464.001 280.001C464.001 273.635 461.472 267.531 456.971 263.03C452.471 258.529 446.366 256.001 440.001 256.001Z" />
          </svg>  
          <div class="group-hover:visible invisible absolute top-1 mt-8 right-0 bg-thirdery rounded-md px-4 py-2 w-64 z-10 shadow border border-gray-700">
            <p> 
              Indicator of editor engine state.
            </p> 
            <p class="py-2">
              <span class="text-green-500 pt-2">green:</span> enabled <br> 
              <span class="text-red-500 pb-2">red:</span> disabled 
            </p>
            <p>
              This can be reactivated under preferences (cogwheel to left).
            </p>
          </div>
        </div>
        
        <NVMErase classes={'mr-6 w-32'}/>

        <PageClear classes={'mx-1 w-24'}/>

        <PageStore classes={'ml-1 w-24'}/>        

      </div> 

    </div>

  </div>

</top-sub-menu>