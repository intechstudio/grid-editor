<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'if',
    name: 'If',
    groupType: 'modifier',
    desc: 'If',
    icon: null
  }
</script>

<script>
  import { createEventDispatcher, onDestroy } from 'svelte';
  import AtomicInput from '../main/user-interface/AtomicInput.svelte';

  export let config = ''
  export let index;

  const dispatch = createEventDispatcher();

  let scriptSegment = ''; // local script part

  let loaded = false;

  $: if(config.script && !loaded){
    scriptSegment = config.script.slice(3, -5);
    loaded = true;
  }

  onDestroy(()=>{
    loaded = false;
  })

  function sendData(e){
    dispatch('output', {short: `if`, script:`if ${e} then`})
  }

</script>


<if-block class="w-full flex flex-col text-white">

  <div class="pl-2 flex items-center bg-purple-400 rounded-t-lg">
    <span class="font-bold py-1">IF</span>
    <div class="pl-2 pr-1 w-full">
      <input 
      class="py-0.5 pl-1 w-full bg-secondary text-white bg-opacity-75" 
      placeholder="condition" 
      value={scriptSegment}
      on:input={(e)=>{sendData(e.target.value)}}
      > 
    </div>
  </div>

</if-block>