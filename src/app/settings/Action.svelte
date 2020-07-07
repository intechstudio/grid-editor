<script>

  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  export let action;

  function handleRemove(){
    dispatch('remove', {
      action: action
    })
  }

</script>


<div class="text-white py-2">{action}</div>
<div class="flex">
  <input type="number" class="secondary text-white p-1 rounded-none focus:outline-none mr-2">
  <input type="number" class="secondary text-white p-1 rounded-none focus:outline-none mr-2">
  <div on:click={handleRemove} class="p-2 w-8 h-8 bg-secondary hover:bg-black cursor-pointer">
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 1.00001L1.01053 13M12.9895 13L1 1" stroke="#BBBBBB" stroke-width="2"/>
    </svg>
  </div>
</div>