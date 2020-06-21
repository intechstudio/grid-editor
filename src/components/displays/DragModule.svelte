<script>
 
  export let size = 1.5;

  import PO16 from '../modules/PO16.svelte';
  import PBF4 from '../modules/PBF4.svelte';

</script>

<div class="w-full flex flex-col absolute justify-start items-start">
  <div class="primary p-4 m-4 rounded-lg z-20">   
    <div class="absolute invisible">
      <div id="po16" class="controller cursor-pointer" draggable="true" >
        <PO16 {size} /> 
      </div>
      <div id="pbf4" class="controller cursor-pointer" draggable="true">
        <PBF4 {size}/> 
      </div>
    </div>

    <div class="text-white pb-4">Drag Module</div>
    <div class="secondary flex rounded-lg">

      <div id="drg-po16" class="cursor-pointer text-white p-2  hover:bg-purple-600 rounded-lg" draggable="true">
        <div class="pointer-events-none flex justify-between items-center">
          <div class="h-10 w-10 rounded-full">
            <img class="h-10 w-10 rounded-full object-cover" src="../assets/imgs/sm_bu16.jpg" alt="po16">
          </div>
          <div class="p-2 text-primary-900">
            PO16
          </div>
        </div>
      </div>

      <div id="drg-pbf4" class="cursor-pointer text-white p-2  hover:bg-purple-600 rounded-lg" draggable="true">
        <div class="pointer-events-none flex justify-between items-center">
          <div class="h-10 w-10 rounded-full ">
            <img class="h-10 w-10 rounded-full object-cover" src="../assets/imgs/sm_pbf4.jpg" alt="pbf4">
          </div>
          <div class="p-2 text-primary-900">
            PBF4
          </div>
        </div>
      </div>
      
    </div>
  </div>
</div>