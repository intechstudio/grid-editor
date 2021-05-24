<script>

  import { actionPrefStore } from '../_stores/app-helper.store.js';

  import { clickOutside } from '../_actions/click-outside.action.js'

  import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
  
  export let inputValue = '';
  export let suggestions = [];
  export let customClasses = '';
  export let suggestionInfo = true;
  export let index;

  let edited = false;

  let disabled = false;
  let infoValue = '';

  $: if(inputValue){
    infoValue = suggestions.find(s => String(s.value).trim() == String(inputValue).trim());
    infoValue ? infoValue = infoValue.info : ''   
  }

  let focus;

  function handleChange(){
    console.log('sent out?', inputValue);
    dispatch('change', inputValue )
  }

</script>

<div class="w-full relative" use:clickOutside on:click-outside={()=>{focus = false}}>
  {#if disabled}<div on:click={()=>{actionPrefStore.showAdvanced(index, true);}} class="absolute cursor-pointer right-0 {$actionPrefStore.advanced.visible ? 'invisible' : 'flex'} items-center rounded-full py-0.5 px-2 text-white text-xs bg-green-600 hover:bg-green-700">Edit</div>{/if}
  <input 
    disabled={disabled}
    class:shadow={focus} 
    bind:value={inputValue} 
    on:click={()=>{focus = true}} on:change={handleChange} 
    on:input={(e)=>{focus = false; handleChange()}} type="text" 
    class="{customClasses} w-full bg-secondary text-white py-0.5 pl-2 rounded-none focus:outline-none">
  
    {#if focus}
      <ul class:shadow={focus} style="max-height:250px; min-width:100px;z-index:9000;" class="fixed scrollbar block border-t overflow-y-auto border-important text-white cursor-pointer w-auto bg-secondary">
        {#each suggestions as suggestion, index}
          <li on:click={(e)=>{infoValue=suggestion.info; focus = false; inputValue = suggestion.value; handleChange()}} class="hover:bg-black p-1 pl-2">{suggestion.value + ' | ' + suggestion.info}</li>
        {/each}
      </ul>
    {/if}

    {#if suggestionInfo}<div class="{infoValue ? 'text-gray-500' : 'text-yellow-400'} text-sm py-1">{infoValue}</div>{/if}
  </div>

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