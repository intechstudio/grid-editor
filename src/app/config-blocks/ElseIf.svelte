<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'ei',
    name: 'ElseIf',
    groupType: 'modifier',
    desc: 'Else If',
    icon: null
  }
</script>

<script>
  import { createEventDispatcher, onDestroy } from 'svelte';

  import AtomicInput from '../main/user-interface/AtomicInput.svelte';

  const dispatch = createEventDispatcher();

  export let config = ''
  export let index;

  let loaded = false;

  let scriptSegment = ''; // local script part

  $: if(config.script && !loaded){
    scriptSegment = config.script.slice(8, -5);
    loaded = true;
  }

  onDestroy(()=>{
    loaded = false;
  })

  function sendData(e){
    dispatch('output', {short: 'ei', script: `else if ${e} then`})
  }
  
</script>


<else-if-block class="w-full flex flex-col text-white ">

  <div class="pl-2 flex items-center bg-purple-400">
    <div class="font-bold py-1">ELSE IF</div>
    <div class="pl-2 pr-1 flex-grow">
      <input 
      class="py-0.5 pl-1 w-full bg-secondary text-white bg-opacity-75" 
      placeholder="condition" 
      value={scriptSegment}
      on:input={(e)=>{sendData(e.target.value)}}
      > 
    </div>
  </div>

</else-if-block>