<script>

  import { clickOutside } from './helpers/clickOutside.js'

  import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
  
  export let inputValue = '';
  export let optionList = [];

  let disabled = false;
  let displayValue = '';

  $: if(inputValue[0] == '(' && inputValue[inputValue.length-1] == ')'){
    disabled = true;
    displayValue = '(expr)'
  } else {
    displayValue = inputValue;
  }
  
  let focus;

  function handleChange(){
    dispatch('change',displayValue)
  }

</script>

<main class="w-full relative" use:clickOutside on:click-outside={()=>{focus = false}}>
  <input 
    disabled={disabled}
    class:shadow={focus} 
    bind:value={displayValue} 
    on:click={()=>{focus = true}} on:change={handleChange} 
    on:input={(e)=>{focus = false; handleChange()}} type="text" 
    class="w-full bg-secondary text-white p-1 pl-2 rounded-none focus:outline-none">
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