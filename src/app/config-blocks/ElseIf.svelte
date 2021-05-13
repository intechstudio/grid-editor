<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'ei',
    groupType: 'modifier',
    desc: 'Else If'
  }
</script>

<script>
  import { createEventDispatcher } from 'svelte';

  import AtomicInput from '../main/user-interface/AtomicInput.svelte';

  const dispatch = createEventDispatcher();

  export let config = ''
  export let index;

  let scriptSegment = ''; // local script part


  $: if(action.script){
    scriptSegment = config.script.slice(8, -5);
  }

  function sendData(e){
    dispatch('output', `else if ${e} then`)
  }
</script>


<else-if-block class="w-full flex flex-col text-white ">

  <div class="pl-2 flex items-center bg-yellow-500">
    <div class="font-bold py-1">ELSE IF</div>
    <div class="pl-2 pr-1 flex-grow">
      <AtomicInput inputValue={scriptSegment} {index} customClasses={'bg-opacity-75'} on:change={(e)=>{sendData(e.detail)}}/>
    </div>
  </div>

</else-if-block>