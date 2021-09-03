<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'gmbs',
    name: 'MouseButton',
    groupType: 'standard',
    desc: 'Mouse Button',
    defaultLua: 'gmbs()',
    color: '',
    icon: `
    x
    `
  }
</script>

<script>

  import { createEventDispatcher, onDestroy } from 'svelte';
  import AtomicInput from '../main/user-interface/AtomicInput.svelte';
  import AtomicSuggestions from '../main/user-interface/AtomicSuggestions.svelte';

  export let config = ''
  export let index;

  const dispatch = createEventDispatcher();

  let scriptValue = ''; // local script part

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
    dispatch('output', {short: `gmbs`, script:`gmbs(${e})`})
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
      {value: '1', info: 'Left Click'}, 
      {value: '2', info: 'Right Click'},
      {value: '4', info: 'Middle Click'},
    ]
  ]

</script>


<mouse-button class="flex flex-col w-full p-2">
  <div class="w-full px-2">
    <div class="text-gray-500 text-sm pb-1">Mouse Button</div>
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
</mouse-button>