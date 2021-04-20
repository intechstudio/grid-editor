<script>
  import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
  import AtomicInput from '../user-interface/AtomicInput.svelte';
  import { _V } from '../user-interface/advanced-input/string-manipulation.js';
  import * as GLUA from '../__action.js';

  const dispatch = createEventDispatcher();

  export let action = {parameters: [], name: '', value: ''};;
  export let inputSet;
  export let blockAddedOnClick;
  export let index;

  const _v = _V;
  _v.initialize(GLUA.FUNCTIONS);

  let scriptSegments = [];

  let inputLabels = ['LED', 'Layer', 'Intensity'];

  $: if(action.script){
    scriptToAction(action.script)
  };


  function sendData(){

    let valid = true;
    
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

  function scriptToAction(expression = []) {
    let splitExpr = _v.exprSplit(expression);
    let actions = JSON.parse(_v.splitExprToArray(splitExpr));
    scriptSegments = actions;
  } 


</script>


<action-led-phase class="flex w-full p-2">
  {#each scriptSegments as script, index}
    <div class={'w-1/'+scriptSegments.length + ' atomicInput'}>
      <div class="text-gray-500 text-sm pb-1">{inputLabels[index]}</div>
      <AtomicInput {index} inputValue={script}/>
    </div>
  {/each}
</action-led-phase>

<style>
  .atomicInput{
    padding-right:0.5rem;
  }

  .atomicInput:first-child{
    padding-left: 0.5rem;
  }
</style>