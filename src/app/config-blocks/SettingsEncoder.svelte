<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'sec',
    name: 'SettingsEncoder',
    groupType: 'standard',
    desc: 'Encoder Settings',
    icon: `<span class="block w-full text-center italic font-gt-pressura">EC</span>`,
  }

</script>

<script>

  import { createEventDispatcher, onDestroy } from 'svelte';
  import AtomicInput from '../main/user-interface/AtomicInput.svelte';

  export let config = ''
  export let index;
  export let humanScript;

  const dispatch = createEventDispatcher();

  let scriptValue = ''; // local script part

  const whatsInParenthesis = /\(([^)]+)\)/;

  let loaded = false;

  $: if(config.script){
    console.log(humanScript)
    const matches = whatsInParenthesis.exec(humanScript);
    scriptValue = matches[1]
    loaded = true;
  }

  onDestroy(()=>{
    loaded = false;
  })

  function sendData(e){
    dispatch('output', {short: `sec`, script:`this.emo(${e})`})
  }

  const suggestions = [
    [
      {value: '0', info: 'Absolute'}, 
      {value: '1', info: 'Relative BinOffset'},
      {value: '2', info: 'Relative 2\'s Comp'}
    ]
  ]

</script>


<encoder-settings class="flex w-full p-2">
  <div class="w-full px-2">
    <div class="text-gray-500 text-sm pb-1">Encoder Mode</div>
    <AtomicInput inputValue={scriptValue} {index} suggestions={suggestions[0]} on:change={(e)=>{sendData(e.detail)}}/>
  </div>
</encoder-settings>