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


  <div 
    class:tour={$tour.selectedName == 'DragModule'} 
    class:changeTour={$tour.selectedName == 'LocalSettings' && toggle} 
    class="w-full flex flex-col justify-start items-start primary p-4 rounded-lg">   

    <div class="absolute invisible">
      
        <PO16/> 

        <PBF4/> 

        <BU16/> 

        <EN16/>

    </div>

    <div class="text-white py-2">Virtual Modules</div>

    {#if true}
      <div in:fade class="w-full mt-2 flex flex-col flex-wrap rounded-lg">

        <div id="drg-PO16" class="cursor-pointer secondary text-white w-full p-2 my-2 hover:bg-purple-600 rounded-lg" draggable="true">
          <div class="pointer-events-none flex justify-between items-center">
            <div class="h-10 w-10 rounded-full">
              <img class="h-10 w-10 rounded-full object-cover" src="./assets/imgs/sm_bu16.jpg" alt="po16">
            </div>
            <div class="p-2">
              PO16
            </div>
          </div>
        </div>

        <div id="drg-PBF4" class="cursor-pointer secondary text-white p-2 my-2 w-full hover:bg-purple-600 rounded-lg" draggable="true">
          <div class="pointer-events-none flex justify-between items-center">
            <div class="h-10 w-10 rounded-full ">
              <img class="h-10 w-10 rounded-full object-cover" src="./assets/imgs/sm_pbf4.jpg" alt="pbf4">
            </div>
            <div class="p-2">
              PBF4
            </div>
          </div>
        </div>

        <div id="drg-BU16" class="cursor-pointer secondary text-white p-2 my-2 w-full  hover:bg-purple-600 rounded-lg" draggable="true">
          <div class="pointer-events-none flex justify-between items-center">
            <div class="h-10 w-10 rounded-full ">
              <img class="h-10 w-10 rounded-full object-cover" src="./assets/imgs/sm_bu16.jpg" alt="bu16">
            </div>
            <div class="p-2">
              BU16
            </div>
          </div>
        </div>

        <div id="drg-EN16" class="cursor-pointer secondary text-white p-2 my-2  w-full hover:bg-purple-600 rounded-lg" draggable="true">
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
