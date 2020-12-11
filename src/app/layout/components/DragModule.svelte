<script>

  import PO16 from '../../core/grid-modules/modules/PO16.svelte';
  import PBF4 from '../../core/grid-modules/modules/PBF4.svelte';
  import BU16 from '../../core/grid-modules/modules/BU16.svelte';
  import EN16 from '../../core/grid-modules/modules/EN16.svelte';

  import { fade } from 'svelte/transition';

  import { appSettings } from '../../stores/app-settings.store';
  import { tour } from '../../stores/tour.store';

  let toggle;

  function enableLayoutMode(){
    toggle = ! toggle;
    console.log('enableLayoutMode',toggle);
    appSettings.update(store => { store.layoutMode = toggle; return store});
  }

</script>

<style>
  .rotate{
    animation: rotationAnim 1s;
    animation-fill-mode: forwards;
  }

  @keyframes rotationAnim {
    from{ transform: rotate(0deg);}
    to{ transform: rotate(90deg);}
  }

  .changeTour{
    @apply border-2;
    @apply border-red-500;
  }
</style>

<div class="w-full flex flex-col justify-start items-start">
  <div class:tour={$tour.selectedName == 'DragModule'} class:changeTour={$tour.selectedName == 'LocalSettings' && toggle} class="primary p-4 m-4 rounded-lg z-20">   
    <div class="absolute invisible">
      
        <PO16/> 

        <PBF4/> 

        <BU16/> 

        <EN16/>

    </div>

    <div on:click={enableLayoutMode} class="flex cursor-pointer items-center justify-between">
      <div class="text-white">Virtual Modules</div>
      <div class="ml-4 cursor-pointer focus:outline-none focus:bg-primary border-none w-4 h-4">
        <svg class:rotate={toggle} version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          style="fill:white;enable-background:new 0 0 451.846 451.847;" viewBox="0 0 451.846 451.847"
          xml:space="preserve">
          <g>
            <path d="M345.441,248.292L151.154,442.573c-12.359,12.365-32.397,12.365-44.75,0c-12.354-12.354-12.354-32.391,0-44.744
              L278.318,225.92L106.409,54.017c-12.354-12.359-12.354-32.394,0-44.748c12.354-12.359,32.391-12.359,44.75,0l194.287,194.284
              c6.177,6.18,9.262,14.271,9.262,22.366C354.708,234.018,351.617,242.115,345.441,248.292z"/>
          </g>
        </svg>
      </div>
    </div>
    {#if toggle}
      <div in:fade class="secondary w-full mt-2 flex rounded-lg">

        <div  id="drg-PO16" class="cursor-pointer text-white p-2  hover:bg-purple-600 rounded-lg" draggable="true">
          <div class="pointer-events-none flex justify-between items-center">
            <div class="h-10 w-10 rounded-full">
              <img class="h-10 w-10 rounded-full object-cover" src="./assets/imgs/sm_bu16.jpg" alt="po16">
            </div>
            <div class="p-2">
              PO16
            </div>
          </div>
        </div>

        <div id="drg-PBF4" class="cursor-pointer text-white p-2  hover:bg-purple-600 rounded-lg" draggable="true">
          <div class="pointer-events-none flex justify-between items-center">
            <div class="h-10 w-10 rounded-full ">
              <img class="h-10 w-10 rounded-full object-cover" src="./assets/imgs/sm_pbf4.jpg" alt="pbf4">
            </div>
            <div class="p-2">
              PBF4
            </div>
          </div>
        </div>

        <div id="drg-BU16" class="cursor-pointer text-white p-2  hover:bg-purple-600 rounded-lg" draggable="true">
          <div class="pointer-events-none flex justify-between items-center">
            <div class="h-10 w-10 rounded-full ">
              <img class="h-10 w-10 rounded-full object-cover" src="./assets/imgs/sm_bu16.jpg" alt="bu16">
            </div>
            <div class="p-2">
              BU16
            </div>
          </div>
        </div>

        <div id="drg-EN16" class="cursor-pointer text-white p-2  hover:bg-purple-600 rounded-lg" draggable="true">
          <div class="pointer-events-none flex justify-between items-center">
            <div class="h-10 w-10 rounded-full ">
              <img class="h-10 w-10 rounded-full object-cover" src="./assets/imgs/sm_en16.jpg" alt="en16">
            </div>
            <div class="p-2">
              EN16
            </div>
          </div>
        </div>
        
      </div>
    {/if}
  </div>
</div>