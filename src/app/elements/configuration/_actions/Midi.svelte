<script>

  import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
  import DropDownInput from '../../../settings/ui/components/DropDownInput.svelte';
  import AdvancedInput from './advanced-input/AdvancedInput.svelte';

  const dispatch = createEventDispatcher();

  export let action = {parameters: [{'CABLECOMMAND': '01'}, {'COMMANDCHANNEL':'10'},{'PARAM1':'T1'}, {'PARAM2': 'T2'}], name: ''};
  export let index;
  export let advanced;
  export let blockAddedOnClick;
  export let inputSet = [];

  let actionKeys = ['CABLECOMMAND','COMMANDCHANNEL','PARAM1','PARAM2'];
  
  let inputLabels = ['Channel', 'Command', 'Param 1','Param 2'];


  function sendData(){
    
    const parameters = [
      {'CABLECOMMAND': '' },
      {'COMMANDCHANNEL': '' },
      {'PARAM1': ''},
      {'PARAM1': ''}
    ];

    let valid = true;
 
    /**
    for (const key in validator) {
      if(!validator[key]){
        valid = false
      }
    }*/
    
    if(valid){
      dispatch('output', { 
        action: {
          value: action.value, 
          parameters: action.parameters
        }, 
        index: index 
      });
    }
  }

  
  onMount(()=>{
    
  })

  afterUpdate(() => {
  
  })

</script>


{#if advanced}
<action-midi class="flex flex-col w-full p-2">
  {#each actionKeys as actionKey, index}
    <div class="py-2">
      <div class="text-gray-500 text-xs">{inputLabels[index]}</div>
      <AdvancedInput on:change={()=>{sendData()}} {inputSet} {blockAddedOnClick} {index} />
    </div>
  {/each}
</action-midi>
{:else}
<action-midi class="flex w-full p-2">
  {#each actionKeys as actionKey, index}
    <div class={'w-1/'+actionKeys.length + ' dropDownInput'}>
      <div class="text-gray-500 text-xs">{inputLabels[index]}</div>
      <DropDownInput on:change={()=>{sendData()}} inputSet={inputSet[index]} bind:dropDownValue={action.parameters[index][actionKey]}/>
      <div class="text-white pl-2 text-xs tracking-wide flex-grow-0">
        info
      </div>
    </div>
  {/each}
</action-midi>
{/if}

<style>

  .dropDownInput{
    padding-right:0.5rem;
  }

  .dropDownInput:first-child{
    padding-left: 0.5rem;
  }

  /**
  .dropDownInput:last-child{
    padding-left: 0.5rem;
  }
  */
  
</style>