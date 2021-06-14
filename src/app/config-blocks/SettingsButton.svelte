<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'sbc',
    name: 'SettingsButton',
    groupType: 'standard',
    desc: 'Button Settings',
    icon: `<span class="block w-full text-center italic font-gt-pressura">BC</span>`,
  }

</script>

<script>

  import { createEventDispatcher, onDestroy } from 'svelte';
  import AtomicInput from '../main/user-interface/AtomicInput.svelte';

  export let config = ''
  export let index;

  const dispatch = createEventDispatcher();

  let scriptValue = ''; // local script part

  const whatsInParenthesis = /\(([^)]+)\)/;

  let loaded = false;

  $: if(config.script){
    const matches = whatsInParenthesis.exec(config.script);
    scriptValue = matches[1]
    loaded = true;
  }

  onDestroy(()=>{
    loaded = false;
  })

  function sendData(e){
    dispatch('output', {short: `sbc`, script:`this.bmo(${e})`})
  }

  const suggestions = [
    [
      {value: '0', info: 'Momentary'}, 
      {value: '1', info: 'Toggle'},
      {value: '2', info: '2-step'},
      {value: '3', info: '3-step'},
    ]
  ]

</script>


<encoder-settings class="flex w-full p-2">
  <div class="w-full px-2">
    <div class="text-gray-500 text-sm pb-1">Button Mode</div>
    <AtomicInput inputValue={scriptValue} {index} suggestions={suggestions[0]} on:change={(e)=>{sendData(e.detail)}}/>
  </div>
</encoder-settings>