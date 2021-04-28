<script>
  import { onMount, beforeUpdate, afterUpdate, createEventDispatcher } from 'svelte';
  import { _V } from '../user-interface/advanced-input/string-manipulation.js';
  import * as GLUA from '../__action.js';
  import AtomicInput from '../user-interface/AtomicInput.svelte';

  const dispatch = createEventDispatcher();

  export let action = ''
  export let index;

  let scriptSegment = ''; // local script part

  const _v = _V;
  _v.initialize(GLUA.FUNCTIONS);

  $: if(action.script){
    scriptSegment = action.script.slice(4, -6);
  }

  function sendData(e){
    if(e !== ''){ // if we let here empty strings, unexpexted things happen in _v parsing.
      dispatch('output', `if (${e}) then`)
    }
  }

</script>


<if-block class="w-full flex flex-col text-white">

  <div class="pl-2 flex items-center bg-yellow-500 rounded-t-lg">
    <span class="font-bold py-1">IF</span>
    <div class="pl-2 pr-1 w-full">
      <AtomicInput inputValue={scriptSegment} {index} customClasses={'bg-opacity-75 rounded-tr-lg'} on:change={(e)=>{sendData(e.detail)}}/>
    </div>
  </div>

</if-block>