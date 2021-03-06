<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'glc',
    name: 'LedColor',
    groupType: 'standard',
    desc: 'LED Color',
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 404 404" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M0 202C0 90.4501 90.4501 0 202 0C312.408 0 404 79.7737 404 180.666C404 245.069 351.736 297.333 287.333 297.333H249.68C237.496 297.333 227.68 307.149 227.68 319.333C227.68 325.01 229.708 330 233.104 333.86C239.962 341.32 244 351.165 244 362C244 385.23 225.23 404 202 404C90.4501 404 0 313.55 0 202ZM202 20C101.496 20 20 101.496 20 202C20 302.504 101.496 384 202 384C214.184 384 224 374.184 224 362C224 356.238 221.884 351.185 218.338 347.349L218.267 347.273L218.198 347.195C211.603 339.757 207.68 330.052 207.68 319.333C207.68 296.103 226.45 277.333 249.68 277.333H287.333C340.69 277.333 384 234.023 384 180.666C384 92.9723 303.646 20 202 20ZM148.667 62.667C136.483 62.667 126.667 72.4828 126.667 84.667C126.667 96.8512 136.483 106.667 148.667 106.667C160.85 106.667 170.667 96.851 170.667 84.667C170.667 72.4828 160.851 62.667 148.667 62.667ZM106.667 84.667C106.667 61.4371 125.437 42.667 148.667 42.667C171.897 42.667 190.667 61.4372 190.667 84.667C190.667 107.897 171.896 126.667 148.667 126.667C125.437 126.667 106.667 107.897 106.667 84.667ZM255.333 62.667C243.149 62.667 233.333 72.4828 233.333 84.667C233.333 96.8512 243.149 106.667 255.333 106.667C267.517 106.667 277.333 96.8512 277.333 84.667C277.333 72.4829 267.517 62.667 255.333 62.667ZM213.333 84.667C213.333 61.4372 232.103 42.667 255.333 42.667C278.563 42.667 297.333 61.4371 297.333 84.667C297.333 107.897 278.563 126.667 255.333 126.667C232.103 126.667 213.333 107.897 213.333 84.667ZM84.667 148C72.4828 148 62.667 157.816 62.667 170C62.667 182.184 72.4828 192 84.667 192C96.8504 192 106.667 182.184 106.667 170C106.667 157.816 96.8512 148 84.667 148ZM42.667 170C42.667 146.77 61.4372 128 84.667 128C107.897 128 126.667 146.77 126.667 170C126.667 193.23 107.896 212 84.667 212C61.4372 212 42.667 193.23 42.667 170ZM319.333 148C307.149 148 297.333 157.816 297.333 170C297.333 182.184 307.149 192 319.333 192C331.517 192 341.333 182.184 341.333 170C341.333 157.816 331.517 148 319.333 148ZM277.333 170C277.333 146.77 296.103 128 319.333 128C342.563 128 361.333 146.77 361.333 170C361.333 193.23 342.563 212 319.333 212C296.103 212 277.333 193.23 277.333 170Z" fill="black"/>
    </svg>`
  }
</script>

<script>
  import {onMount, createEventDispatcher, onDestroy} from 'svelte';
  import AtomicInput from '../main/user-interface/AtomicInput.svelte';
  import AtomicSuggestions from '../main/user-interface/AtomicSuggestions.svelte';


  import validate from './_validators';

  import _utils from '../runtime/_utils.js';
  import { localDefinitions } from '../runtime/runtime.store';

  export let config;
  export let inputSet;
  export let blockAddedOnClick;
  export let index;

  let loaded = false;

  const dispatch = createEventDispatcher();

  const parameterNames = ['LED Number', 'Layer', 'Red', 'Green', 'Blue'];

  let scriptSegments = [];

  // config.script cannot be undefined
  $: if(config.script && !loaded){
    scriptSegments = _utils.scriptToSegments({human: config.human, short: config.short, script: config.script});
    loaded = true;
  };

  onDestroy(()=>{
    loaded = false;
  })

  function sendData(e, index){

    let valid = 0;
    
    const validator = new validate.check(e);

    const locals = $localDefinitions.map(l => l.value)
    
    scriptSegments[index] = e;
    const script = _utils.segmentsToScript({human: config.human, short: config.short, array: scriptSegments}); 
    dispatch('output', {short: config.short, script: script})
    
    
  }

  const _suggestions = [
    [
      //{value: 'this.ind()', info: 'this led'},
    ],
    [
      {value: '1', info: 'layer 1'},
      {value: '2', info: 'layer 2'}
    ],
    [
      //{value: '255', info: '255'}
    ],
    [
      //{value: '255', info: '255'}
    ],
    [
      //{value: '255', info: '255'}
    ]
  ];

  let suggestions = [];

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


<config-led-color class="flex flex-col w-full p-2">

  <div class="w-full flex">
    {#each scriptSegments as script, i}
      <div class={'w-1/'+scriptSegments.length + ' atomicInput '}>
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

</config-led-color>

<style>
  .atomicInput{
    padding-right:0.5rem;
  }

  .atomicInput:first-child{
    padding-left: 0.5rem;
  }
</style>