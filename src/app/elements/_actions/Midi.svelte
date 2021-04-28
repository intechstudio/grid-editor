<script>

  import { onMount, beforeUpdate, afterUpdate, createEventDispatcher } from 'svelte';
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
    scriptSegments = GLUA.scriptToAction({script: action.script, inputLabels})
  };

  function sendData(e, index){
    scriptSegments[index] = e;
    if(!scriptSegments.includes('')){ // if we let here empty strings, unexpexted things happen in _v parsing.      
      const script = _v.arrayToExpression('ms',scriptSegments); // important to set the function name
      dispatch('output', script)
    }
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