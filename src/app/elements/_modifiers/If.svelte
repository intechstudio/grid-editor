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
    scriptSegment = action.script.slice(3);
    console.log()
    console.log('input of IF component: ',action.script);
  }

  function sendData(e){
    if(e !== ''){ // if we let here empty strings, unexpexted things happen in _v parsing.
      const script = `if${e}` // important to set the function name
      dispatch('output', `if ${e}`)
    }
  }

</script>


<if-block class="w-full flex flex-col text-white">

  <div class="font-bold pl-2 py-1 bg-black rounded-t-lg">IF</div>

  <div class="flex flex-col bg-secondary bg-opacity-25 p-4">
    <div class="text-gray-500 text-sm pb-1">Condition</div>
    <AtomicInput inputValue={scriptSegment} {index} on:change={(e)=>{sendData(e.detail)}}/>
  </div>

</if-block>