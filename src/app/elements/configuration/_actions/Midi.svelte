<script>

  import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
  import DropDownInput from '../../../settings/ui/components/DropDownInput.svelte';

  const dispatch = createEventDispatcher();

  export let action = {parameters: {0:'0', 1: '1', 2: '2', 3: '3'}, name: ''};
  export let index;
  export let eventInfo;
  export let elementInfo;

  let validator = [];

  let actionKeys = ['CABLECOMMAND','COMMANDCHANNEL','PARAM1','PARAM2'];
  
  let inputLabels = ['Channel', 'Command', 'Param 1','Param 2'];

  let optionList = [['0','1'], ['no'], ['yes'], ['ok']]

  function sendData(){
    
    const parameters = [
      {'CABLECOMMAND': '' },
      {'COMMANDCHANNEL': '' },
      {'PARAM1': ''},
      {'PARAM1': ''}
    ];

    let valid = true;
 
    for (const key in validator) {
      if(!validator[key]){
        valid = false
      }
    }
    
    if(valid){
      dispatch('send', { 
        action: {
          value: action.value, 
          parameters: parameters
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


<action-midi class="flex w-full p-2">
  {#each actionKeys as actionKey, index}
    <div class={'w-1/'+actionKeys.length + ' dropDownInput'}>
      <div class="text-gray-700 text-xs">{inputLabels[index]}</div>
      <DropDownInput on:change={()=>{sendData()}} optionList={optionList[index]} bind:dropDownValue={action.parameters[actionKey]}/>
      <div class="text-white pl-2 text-xs tracking-wide flex-grow-0">
        info
      </div>
    </div>
  {/each}
</action-midi>

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