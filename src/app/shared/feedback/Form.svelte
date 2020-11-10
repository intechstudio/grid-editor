<script>

  import FormModal from './FormModal.svelte';

 
  let openModal = false;
  let formVisible = true;

</script>

<style>


</style>


{#if formVisible}
  <div class="w-full relative bg-indigo-400 text-white justify-center items-center text-center p-4">
    <span>We @intechstudio do our best to roll out features you find useful.</span>
    <button on:click={() => openModal = ! openModal} class="bg-indigo-700 ml-2 font-medium text-white py-1 px-2 border-none hover:bg-indigo-800 focus:outline-none rounded">Help the development!</button>
    <button on:click={() => formVisible = false} class="absolute right-0 mr-4 hover:bg-gray-500 px-2 py-1 rounded focus:outline-none border-none">Close</button>
  </div>
{/if}

{#if openModal}
  <FormModal on:close={()=>openModal = false} on:success={formVisible = false}/>
{/if}
