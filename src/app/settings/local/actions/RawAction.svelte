<script>

  import {afterUpdate, beforeUpdate, createEventDispatcher, onMount} from 'svelte';

  const dispatch = createEventDispatcher();

  import { GRID_PROTOCOL } from '../../../core/classes/GridProtocol.js';

  import { actionListChange } from '../action-list-change.store.js';

  export let action;
  export let index;

  function sendData(){

    // this is validated by hitting the send button. no extra validation happens, experimental function.

    let _PARAMETERS = action.parameters.split('\n');
    _PARAMETERS = _PARAMETERS.map(param => {
      return param = Array.from(param).map(p => {
        return p.charCodeAt(0);
      })
    });

    let serialized = [];
    _PARAMETERS.forEach(param => {
      serialized.push(...GRID_PROTOCOL.configure_raw(param))
    })

    dispatch('send',{
      action: {
        value: action.value, 
        parameters: serialized
      }, 
      index: index 
    });
  }

  let orderChangeTrigger = null;
  onMount(()=>{
    let c = 0;
    actionListChange.subscribe((change)=>{
      c++;
      if(change !== null && c == 1){
        orderChangeTrigger = true;
        if(change == 'remove'){
          //configStore.remove(index, moduleInfo, eventInfo, inputStore);
        }
      }
      c = 0;
    });
  })

  afterUpdate(() => {
    if(orderChangeTrigger){
      sendData();
    }
  })

</script>


<div class='w-full  dropDownInput'>
  <div class="text-gray-700 text-xs">Raw action input for debug purposes</div>
  <textarea bind:value={action.parameters} class="w-full font-mono secondary text-white border-none p-1 pl-2 rounded-none focus:outline-none"></textarea>
  <button on:click={sendData} class="focus:outline-none cursor-pointer mr-1 text-white border-none border-primary bg-indigo-500 hover:bg-indigo-600 px-2 py-1">Send</button>
</div>


<style>
  .dropDownInput{
    padding-right:0.5rem;
  }

  .dropDownInput:first-child{
    padding-left: 0rem;
  }

  .dropDownInput:last-child{
    padding-left: 0.5rem;
  }

  
</style>