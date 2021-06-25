<script>
  import { createEventDispatcher } from "svelte";

  export let suggestions;
  export let focusedInput = 0;

  const dispatch = createEventDispatcher();

  function sendData(value, index){
    dispatch('select', {
      value: value, 
      index, index
    })
  }

</script>


<suggestions class="flex w-full p-2">
  <div class="w-full p-1 neumorph rounded-lg border border-select bg-secondary">
    <ul class="scrollbar max-h-40 overflow-y-scroll  pr-1 text-white cursor-pointer ">
      {#each suggestions[focusedInput] as suggestion, index}
        <li on:click={(e)=>{sendData(suggestion.value,focusedInput)}} class="hover:bg-black p-1 pl-2">{suggestion.info}</li>
      {/each}
    </ul>
  </div>
</suggestions>

<style>

  .neumorph{
    box-shadow:  -2px -2px 10px #242c30,
                2px 2px 10px #303c42;
  }
  

</style>