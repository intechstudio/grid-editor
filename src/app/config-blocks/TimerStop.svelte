<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'gtp',
    name: 'TimerStop',
    groupType: 'standard',
    desc: 'TimerStop',
    color: '',
    defaultLua: 'gtp()',
    icon: `
    t
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

  const parameterNames = ['LED Number', 'Layer', 'Intensity'];

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

  const _suggestions = [];

  let suggestions = [];

  $: if($localDefinitions){
   
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