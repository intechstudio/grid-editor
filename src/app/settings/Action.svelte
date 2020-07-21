<script>

  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  export let item;
  export let index;

  function handleRemove(){
    dispatch('remove', {
      action: item
    })
  }

</script>

  <div class="w-full flex p-0 m-0 pr-4 justify-start">
    <input type="number" class="mx-2 w-1/2 secondary text-white p-1 rounded-none focus:outline-none ">
    <input type="number" class="mx-2 w-1/2 secondary text-white p-1 rounded-none focus:outline-none ">
    <div on:click={handleRemove} class="block p-2 w-8 h-8  bg-secondary hover:bg-black cursor-pointer">
      <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 1.00001L1.01053 13M12.9895 13L1 1" stroke="#BBBBBB" stroke-width="2"/>
      </svg>
    </div>
  </div>
