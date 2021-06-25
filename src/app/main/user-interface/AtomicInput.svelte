<script>

  import { activeDropDown } from '../_stores/app-helper.store.js';

  import { clickOutside } from '../_actions/click-outside.action.js'

  import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
  
  export let inputValue = '';
  export let suggestions = [];
  export let customClasses = '';
  export let suggestionInfo = true;
  export let config_index;

  let edited = false;

  let disabled = false;
  let infoValue = '';

  $: if(inputValue){
    infoValue = suggestions.find(s => String(s.value).trim() == String(inputValue).trim());
    infoValue ? infoValue = infoValue.info : ''   
  }

  let focus;

  function handleChange(){
    dispatch('change', inputValue);
  }

  function handleClick(){
    focus = true;
    dispatch('focus', {
      detail: {
        focus: true
      }
    });
  }
  
  export function dimensions(node){

    const handleResize = event => {

      console.log(event);

      node.dispatchEvent(
        new CustomEvent('double-click')
      )

      if (node && !node.contains(event.target) && !event.defaultPrevented) {
        //console.log('DBL', node, event.target)
      }
    }

    node.addEventListener('resize', handleResize, true);
    

    return {
      update: () => {

      },
      destroy: () => {

      }
    }

  }

</script>

<div use:dimensions class="w-full relative" use:clickOutside={{useCapture:false}} on:click-outside={()=>{focus = false}}>

  <input 
    disabled={disabled}
    class:shadow={focus} 
    bind:value={inputValue} 
    on:click={handleClick} 
    on:change={handleChange} 
    on:input={(e)=>{focus = false; handleChange()}} 
    type="text" 
    class="{customClasses} w-full border-l-2 {focus ? 'border-commit' : 'border-secondary'} bg-secondary text-white py-0.5 pl-2 rounded-none"
  >

  {#if suggestionInfo}<div class="{infoValue ? 'text-gray-500' : 'text-yellow-400'} text-sm py-1">{infoValue}</div>{/if}



  {#if focus}
    <ul class:shadow={focus} class="h-56 sticky scrollbar block border-t overflow-y-scroll  border-important text-white cursor-pointer bg-secondary">
      {#each suggestions as suggestion, index}
        <li on:click={(e)=>{infoValue=suggestion.info; focus = false; inputValue = suggestion.value; handleChange()}} class="hover:bg-black p-1 pl-2">{suggestion.info}</li>
      {/each}
    </ul>
  {/if}


</div>

<style>
  .extra{
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  }
  

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