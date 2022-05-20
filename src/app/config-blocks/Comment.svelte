<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'c',
    name: 'Comment',
    rendering: 'standard',
    toggleable: false,
    category: 'code',
    desc: 'Comment Block',
    defaultLua: '--[[This Is A Comment]]',
    icon: `
    <span class="block w-full text-black text-center italic font-gt-pressura">--</span>
    `,
    color: '#887880'
  }
</script>

<script>
  import { onMount, createEventDispatcher, onDestroy } from 'svelte'; 
  import AtomicInput from '../main/user-interface/AtomicInput.svelte';
  import { parenthesis } from './_validators';

  export let config = ''
  export let index;

  const dispatch = createEventDispatcher();

  let loaded = false;

  let scriptValue = ''; // local script part

  $: if(config.script && !loaded){
    console.log(config.script)
    scriptValue = config.script.split("--[[")[1].split("]]")[0];
    loaded = true;
  }

  $: if(scriptValue && loaded){
    sendData(scriptValue);
  }

  onDestroy(()=>{
    loaded = false;
  })

  function sendData(e){
    dispatch('output', {short: 'c', script: `--[[${e}]]`})
  }
</script>


<element-name class="flex flex-col w-full p-2">
  <div class="w-full px-2">
    <div class="text-gray-500 text-sm pb-1">Comment</div>
    <input
      type="text" 
      bind:value={scriptValue} 
      class="w-full border bg-secondary border-secondary text-white py-0.5 pl-2 rounded-none"/>
  </div>

</element-name>