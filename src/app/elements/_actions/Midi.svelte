<script>

  import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
  import AtomicInput from '../user-interface/AtomicInput.svelte';
  import { _V } from '../user-interface/advanced-input/string-manipulation.js';
  import * as GLUA from '../__action.js';

  const dispatch = createEventDispatcher();

  export let action = ''//{parameters: [{'CABLECOMMAND': '01'}, {'COMMANDCHANNEL':'10'},{'PARAM1':'T1'}, {'PARAM2': 'T2'}], name: ''};
  export let index;

  let scriptSegments = [];
  
  let inputLabels = ['Channel', 'Command', 'Param 1','Param 2'];

  const _v = _V;
  _v.initialize(GLUA.FUNCTIONS);

  $: if(action.script){
    scriptToAction(action.script)
  };

  function sendData(e, index){
    scriptSegments[index] = e;
    const script = _v.arrayToExpression('ms',scriptSegments);
    dispatch('output', script)
  }

  function scriptToAction(expression = []) {
    let actions = inputLabels.map(i => ''); // make empty array for right amount of input fields
    const splitExpr = _v.exprSplit(expression);
    const jsonArray = _v.splitExprToArray(splitExpr);
    if(_v.isJson(jsonArray)){
      actions = JSON.parse(_v.splitExprToArray(splitExpr));
    } else {
      console.error('error with json, continue.')
    }
    scriptSegments = actions;
  }

</script>


<action-midi class="flex w-full p-2">
  {#each scriptSegments as script, index}
    <div class={'w-1/'+scriptSegments.length + ' atomicInput'}>
      <div class="text-gray-500 text-sm pb-1">{inputLabels[index]}</div>
      <AtomicInput inputValue={script} {index} on:change={(e)=>{sendData(e.detail,index)}}/>
    </div>
  {/each}
</action-midi>

<style>

  .atomicInput{
    padding-right:0.5rem;
  }

  .atomicInput:first-child{
    padding-left: 0.5rem;
  }
  
</style>