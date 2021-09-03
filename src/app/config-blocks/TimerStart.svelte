<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'gtt',
    name: 'TimerStart',
    groupType: 'standard',
    desc: 'Timer Start',
    color: '',
    defaultLua: 'gtt()',
    icon: `
    t
    `
  }
</script>

<script>
  import {onMount, createEventDispatcher, onDestroy} from 'svelte';
  import AtomicInput from '../main/user-interface/AtomicInput.svelte';

  import _utils from '../runtime/_utils.js';

  import AtomicSuggestions from '../main/user-interface/AtomicSuggestions.svelte';

  export let config;

  const dispatch = createEventDispatcher();

  let scriptValue = '';

  const whatsInParenthesis = /\(([^)]+)\)/;

  let loaded = false;

  $: if(config.script && !loaded){

    const matches = whatsInParenthesis.exec(config.script);

    if(matches){
      scriptValue = matches[1];
    } else {
      scriptValue = '';
    }

    loaded = true;

  }

  onDestroy(()=>{
    loaded = false;
  })

  $: if(scriptValue){
    sendData(scriptValue);
  }

  function sendData(e){
    dispatch('output', {short: `sbc`, script:`gtt(${e})`})
  }


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

  const suggestions = [
    [
      {value: '0', info: 'heck hey'}, 
    ]
  ]

</script>


<timer-start class="flex flex-col w-full p-2">

  <div class="w-full px-2">
    <div class="text-gray-500 text-sm pb-1">Timer Delay</div>
    <AtomicInput 
      suggestions={suggestions[0]}
      bind:inputValue={scriptValue} 
      on:active-focus={(e)=>{onActiveFocus(e,0)}} 
      on:loose-focus={(e)=>{onLooseFocus(e,0)}}/>
  </div>

  {#if focusGroup[0]}
    <AtomicSuggestions 
      suggestions={suggestions}  
      on:select={(e)=>{
      scriptValue = e.detail.value;
    }}/>

  {/if}

</timer-start>

<style>
  .atomicInput{
    padding-right:0.5rem;
  }

  .atomicInput:first-child{
    padding-left: 0.5rem;
  }
</style>