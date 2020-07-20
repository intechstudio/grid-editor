<script>

  import FormModal from './FormModal.svelte';

  let openModal = false;

</script>

<style>


</style>

<div class="w-full bg-indigo-400 text-white justify-center items-center text-center p-4">
  <span>We @intechstudio do our best to roll out features you find useful.</span>
  <button on:click={() => openModal = ! openModal} class="bg-indigo-700 ml-2 font-medium text-white py-1 px-2 border-none hover:bg-indigo-800 focus:outline-none rounded">Help the development!</button>
</div>

{#if openModal}
  <FormModal on:close={()=>openModal = false}/>
{/if}
