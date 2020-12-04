<script>

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let radioValue = '';
  export let pairs = [];
  
  function handleChange(arg){
    radioValue = arg;
    dispatch('change',{ })
  }

</script>

<div class="flex border-collapse text-sm cursor-pointer text-gray-700 border-secondary border-2 rounded-lg">
  {#each pairs as pair,i}
    <div 
      class:tab={radioValue == pair.value}
      on:click={()=>{handleChange(pair.value)}} 
      class:rounded-r-none={i == 0}
      class:rounded-l-none={i == 1}
      class="px-2 py-1 w-full transition-all ease-in-out duration-500 text-center rounded-lg rounded-r-none">
      {pair.key}
    </div>
  {/each}
</div>

<style>

  .tab{
    box-shadow: 0 0px 0px 2px #cc5b5b;
    @apply bg-secondary;
    @apply text-white;
  }

</style>