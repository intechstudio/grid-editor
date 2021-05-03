<script>
  import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
  import AtomicInput from '../user-interface/AtomicInput.svelte';
  import { _V } from '../user-interface/advanced-input/string-manipulation.js';
  import * as GLUA from '../__action.js';
import { localDefinitions } from '../action-preferences.store';

  const dispatch = createEventDispatcher();

  export let action;
  export let inputSet;
  export let blockAddedOnClick;
  export let index;

  let scriptSegments = [];

  const _v = _V;
  _v.initialize(GLUA.FUNCTIONS);

  $: if(action.script){
    scriptSegments = GLUA.scriptToAction({human: action.human, script: action.script})
  };

  function sendData(e, index){
    scriptSegments[index] = e;
    // important to set the function name = human readable for now
    const script = _v.arrayToExpression(action.human, scriptSegments); 
    dispatch('output', script)
  }

  const _suggestions = [
    // led number
      [
        {value: 'this', info: ''},
        {value: '', info: ''}
      ],
    // layer
      [
        {value: '', info: 'layer'}
      ],
    // intensity or value
      [
        {value: '', info: 'idk'}
      ]
  ];

  let suggestions = [];

  $: if($localDefinitions){
    suggestions = _suggestions.map(s => [...$localDefinitions, ...s])
  }

  onMount(()=>{
    suggestions = _suggestions;
  })


</script>


<action-led-phase class="flex w-full p-2">
  {#each scriptSegments as script, i}
    <div class={'w-1/'+scriptSegments.length + ' atomicInput'}>
      <div class="text-gray-500 text-sm pb-1">{action.parameterNames[i]}</div>
      <AtomicInput {index} inputValue={script} suggestions={suggestions[i]} on:change={(e)=>{sendData(e.detail,i)}}/>
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