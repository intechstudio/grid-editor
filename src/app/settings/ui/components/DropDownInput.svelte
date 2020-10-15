<script>

  import { clickOutside } from '../helpers/clickOutside.js'

  import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
  
  export let dropDownValue = ''
  export let optionList = [];
  
  let focus;

  function handleChange(){
    dispatch('change',{})
  }

</script>

<main class="w-full relative" use:clickOutside on:click-outside={()=>{focus = false}}>
  <input class:shadow={focus} on:click={()=>{focus = true}} on:change={handleChange} bind:value={dropDownValue} on:input={(e)=>{focus = false; handleChange()}} type="text" class="w-full secondary text-white p-1 pl-2 rounded-none focus:outline-none">
  {#if focus}
    <ul class:shadow={focus} style="max-height:250px" class="scrollbar block border-t overflow-y-auto border-important text-white cursor-pointer absolute bg-secondary w-full z-50">
      {#each optionList as option, index}
        <li on:click={(e)=>{dropDownValue = option.value; focus = false; handleChange()}} class="hover:bg-black p-1 pl-2">{option.info}</li>
      {/each}
    </ul>
  {/if}
</main>

<style>


::-webkit-scrollbar {
    height: 6px;
    width: 6px;
    background: #1e2628;
}

::-webkit-scrollbar-thumb {
    background: #286787;
    -webkit-box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
}

::-webkit-scrollbar-corner {
    background: #1e2628
}

</style>