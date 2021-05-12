<script>
  import { appSettings } from "../../_stores/app-helper.store.js";

  import { localInputStore } from '../../../runtime/runtime.store.js';
  
  export let events = {options: [], selected: ""};
  export let elements = {options: [], selected: ""};
  
  let selectedAction;
  let selectedEvent;
  let arrayOfSelectableActions = [{code: 'AV7', name: 'MIDI'}, {code: 'HID', name:'Macro'}]


  function handleSelectEvent(arg){
    selectedEvent = arg
  }

  $: selectedEvent = events.selected;


</script>

<div class="flex flex-col bg-primary w-full p-4">

  <div class="pb-2 {$appSettings.configType == 'uiEvents' ? 'block' : 'hidden'}">
    <div class="text-gray-600 py-1 text-sm">
      Selected Element
    </div>

    <div class="flex flex-col relative justify-between font-bold text-white">
      <select bind:value={elements.selected} class="bg-secondary flex-grow text-white p-2 focus:outline-none">
        {#each elements.options as element}
          <option value={element} class="text-white bg-secondary py-1">Element {element}</option>
        {/each}
      </select>
    </div>
  </div>
  
  <div class="pb-2">
    <div class="text-gray-600 py-1 text-sm">
      Events
    </div>

    <div class="flex bg-secondary shadow overflow-x-auto">
      {#each events.options as event}
        <button 
          on:click={()=>{handleSelectEvent(event)}} 
          class="{selectedEvent === event? 'shadow-md bg-pick text-white': 'hover:bg-pick-desaturate-10 text-gray-50'} m-2 p-1 flex-grow border-0 rounded focus:outline-none">
          {event.desc}
        </button>
      {/each}
    </div>
  </div>


</div>
