<script>
  import {onMount, createEventDispatcher} from 'svelte';
  import AtomicInput from '../app/user-interface/AtomicInput.svelte';

  import { scriptToConfig, configToScript } from '../runtime/_utils.js';
  import { localDefinitions } from '../runtime/runtime.store';

  const dispatch = createEventDispatcher();

  export let action;
  export let inputSet;
  export let blockAddedOnClick;
  export let index;

  let configSegments = [];


  $: if(action.script){
    configSegments = scriptToConfig({human: action.human, script: action.script})
  };

  function sendData(e, index){
    configSegments[index] = e;
    // important to set the function name = human readable for now
    const script = configToScript({human: action.human, array: configSegments}); 
    dispatch('output', script)
  }

  const _suggestions = [
    // led number
      [
        {value: 'to do...', info: 'to do...'},
        {value: 'to do...', info: 'to do...'}
      ],
    // layer
      [
        {value: 'to do...', info: 'layer'}
      ],
    // intensity or value
      [
        {value: 'to do...', info: 'to do...'}
      ]
  ];

  let suggestions = [];

  $: if($localDefinitions){
    suggestions = _suggestions.map(s => [...$localDefinitions, ...s]);
    suggestions = suggestions;
  }

  onMount(()=>{
    suggestions = _suggestions;
  })


</script>


<action-led-phase class="flex w-full p-2">
  {#each configSegments as script, i}
    <div class={'w-1/'+configSegments.length + ' atomicInput'}>
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