<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'gmms',
    name: 'MouseMove',
    groupType: 'standard',
    desc: 'Mouse Move',
    defaultLua: 'gmms(,)',
    color: '',
    icon: `
    x
    `
  }
</script>

<script>
  import {onMount, createEventDispatcher, onDestroy} from 'svelte';
  import AtomicInput from '../main/user-interface/AtomicInput.svelte';

  import _utils from '../runtime/_utils.js';
  import { localDefinitions } from '../runtime/runtime.store';

  import AtomicSuggestions from '../main/user-interface/AtomicSuggestions.svelte';

  export let config;

  let loaded = false;

  const dispatch = createEventDispatcher();

  const parameterNames = ['Axis', 'Position'];

  let scriptSegments = [];

  // config.script cannot be undefined
  $: if(config.script && !loaded){
    scriptSegments = _utils.scriptToSegments({short: config.short, script: config.script});
    loaded = true;
  };

  onDestroy(()=>{
    loaded = false;
  })

  function sendData(e, index){

    scriptSegments[index] = e;
    // important to set the function name = human readable for now
    const script = _utils.segmentsToScript({human: config.human, short: config.short, array: scriptSegments}); 
    dispatch('output', {short: config.short, script: script})
    
  }

  let suggestions = [];

  const _suggestions = [
    [
      {value: '1', info: 'X'},
      {value: '2', info: 'Y'},
      {value: '3', info: 'Mouse Wheel'},
    ],
    [
      {value: '1', info: 'Help'},
      {value: '2', info: 'Help'}
    ],

  ];

  $: if($localDefinitions){
    suggestions = _suggestions.map((s,i) => {
      // SKIP LAYER
      if(i != 1){
        return [...$localDefinitions, ...s]
      } else {
        return [ ...s, ...$localDefinitions]
      }
    });
    suggestions = suggestions;
  }


  onMount(()=>{
    suggestions = _suggestions;
  })

  let showSuggestions = false;
  let focusedInput = undefined;
  let focusGroup = [];

  function onActiveFocus(event,index){
    focusGroup[index] = event.detail.focus;
    focusedInput = index;
  }

  function onLooseFocus(event,index){
    focusGroup[index] = event.detail.focus;
    showSuggestions = focusGroup.includes(true);
  }


</script>


<config-led-phase class="flex flex-col w-full p-2">

  <div class="w-full flex">
    {#each scriptSegments as script, i}
      <div class={'w-1/'+scriptSegments.length + ' atomicInput'}>
        <div class="text-gray-500 text-sm pb-1">{parameterNames[i]}</div>
        <AtomicInput 
          inputValue={script} 
          suggestions={suggestions[i]} 
          on:active-focus={(e)=>{onActiveFocus(e,i)}} 
          on:loose-focus={(e)=>{onLooseFocus(e,i)}} 
          on:change={(e)=>{sendData(e.detail,i)}}/>
      </div>
    {/each}
  </div>

  {#if showSuggestions}

    <AtomicSuggestions 
      {suggestions} 
      {focusedInput} 
      on:select={(e)=>{
        scriptSegments[e.detail.index] = e.detail.value; 
        sendData(e.detail.value,e.detail.index)
      }}
    />

  {/if}
</config-led-phase>

<style>
  .atomicInput{
    padding-right:0.5rem;
  }

  .atomicInput:first-child{
    padding-left: 0.5rem;
  }
</style>