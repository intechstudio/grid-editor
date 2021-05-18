<script>
  import { appSettings } from "../../_stores/app-helper.store.js";

  import { user_input } from '../../../runtime/runtime.store.js';

  export let events;
  export let elements;
  
  let selectedEvent;

  function handleSelectEvent(event){
    selectedEvent = event
    user_input.update_eventtype(event.value);
  }

  function handleSelectElement(element){
    console.log('change selected element...', element)
    user_input.update_elementnumber(element);
  }

  $: selectedEvent = events.selected; console.log('evts',events);

</script>

<div class="flex flex-col bg-primary w-full p-4">

  <div class="pb-2 {$appSettings.configType == 'uiEvents' ? 'block' : 'hidden'}">
    <div class="text-gray-600 py-1 text-sm">
      Selected Element
    </div>

    <div class="flex flex-col relative justify-between font-bold text-white">
      <!-- svelte-ignore a11y-no-onchange -->
      <select bind:value={elements.selected} on:change={(e)=>{handleSelectElement(elements.selected)}} class="bg-secondary flex-grow text-white p-2 focus:outline-none">
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
          class:dummy={event.desc == undefined}
          class="{(selectedEvent === event) && (event.desc !== undefined) ? 'shadow-md bg-pick text-white': 'hover:bg-pick-desaturate-10 text-gray-50'} m-2 p-1 flex-grow border-0 rounded focus:outline-none">
          {@html event.desc ? event.desc : `<span class="invisible">null</span>`}
        </button>
      {/each}
    </div>
  </div>


</div>

<style>

  .dummy{
    @apply bg-select;
    @apply bg-opacity-50;
  }

</style>