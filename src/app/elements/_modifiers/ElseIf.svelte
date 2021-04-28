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
    scriptSegment = action.script.slice(9, -6);
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
      <AtomicInput inputValue={scriptSegment} {index} customClasses={'bg-opacity-75'} on:change={(e)=>{sendData(e.detail)}}/>
    </div>
  </div>

</else-if-block>