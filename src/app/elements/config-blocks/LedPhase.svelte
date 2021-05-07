<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'glp',
    groupType: 'standard',
    desc: 'LED Value',
    icon: null
  }
</script>

<script>
  import {onMount, createEventDispatcher} from 'svelte';
  import AtomicInput from '../app/user-interface/AtomicInput.svelte';

  import _utils from '../runtime/_utils.js';
  import { localDefinitions } from '../runtime/runtime.store';

  export let config;
  export let inputSet;
  export let blockAddedOnClick;
  export let index;

  const dispatch = createEventDispatcher();

  const parameterNames = ['LED Number', 'Layer', 'Intensity'];

  let scriptSegments = [];

  // config.script cannot be undefined
  $: if(config.script){
    scriptSegments = _utils.scriptToSegments({human: config.human, short: config.short, script: config.script})
  };

  function sendData(e, index){
    scriptSegments[index] = e;
    // important to set the function name = human readable for now
    const script = _utils.segmentsToScript({human: config.human, short: config.short, array: scriptSegments}); 
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


<config-led-phase class="flex w-full p-2">
  {#each scriptSegments as script, i}
    <div class={'w-1/'+scriptSegments.length + ' atomicInput'}>
      <div class="text-gray-500 text-sm pb-1">{parameterNames[i]}</div>
      <AtomicInput {index} inputValue={script} suggestions={suggestions[i]} on:change={(e)=>{sendData(e.detail,i)}}/>
    </div>
  {/each}
</config-led-phase>

<style>
  .atomicInput{
    padding-right:0.5rem;
  }

  .atomicInput:first-child{
    padding-left: 0.5rem;
  }
</style>