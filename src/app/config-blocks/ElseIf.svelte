<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'elseif',
    groupType: 'modifier',
    desc: 'Else If'
  }
</script>

<script>
  import { createEventDispatcher } from 'svelte';

  import AtomicInput from '../main/user-interface/AtomicInput.svelte';

  const dispatch = createEventDispatcher();

  export let action = ''
  export let index;

  let configSegment = ''; // local script part


  $: if(action.script){
    configSegment = action.script.slice(9, -6);
  }

  function sendData(e){
    if(e !== ''){ // if we let here empty strings, unexpexted things happen in _v parsing.
      dispatch('output', `else if (${e}) then`)
    }
  }
</script>


<else-if-block class="w-full flex flex-col text-white ">

  <div class="pl-2 flex items-center bg-yellow-500">
    <div class="font-bold py-1">ELSE IF</div>
    <div class="pl-2 pr-1 flex-grow">
      <AtomicInput inputValue={configSegment} {index} customClasses={'bg-opacity-75'} on:change={(e)=>{sendData(e.detail)}}/>
    </div>
  </div>

</else-if-block>