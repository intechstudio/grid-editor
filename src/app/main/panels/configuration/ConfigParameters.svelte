<script>
  import { appSettings } from "../../_stores/app-helper.store.js";

  import { runtime, user_input, _runtime_modules } from '../../../runtime/runtime.store.js';
  import { configManagement } from "../../../runtime/config-manager.store.js";
  import { onMount } from "svelte";
  import _utils from "../../../runtime/_utils.js";

  export let element_name = '';
  export let events;
  export let elements;
  export let configs;
  
  let selectedEvent;

  function handleSelectEvent(event){
    selectedEvent = event
    user_input.update_eventtype(event.value);
  }

  function handleSelectElement(element){
    user_input.update_elementnumber(element);
  }

  function copyAllEventConfigsFromSelf(){
    configManagement().element_operations.get_events_actions()
  }

  function overwriteAllEventConfigs(){
   configManagement().element_operations.overwrite_events_actions(); 
  }

  $: selectedEvent = events.selected;


  function updateStringName(e){
    const name = e.target.value;
    let snAction = configs.find(x => x.short == 'sn');

    if(snAction){
      snAction.script = `self.sn='${name}'`;
      runtime.update.one().status('EDITOR_EXECUTE').config({lua: _utils.configMerge({config: configs})}).sendToGrid();
    }
    
  }

  onMount(()=>{
    runtime.hidden(val => {element_name = val.stringname; console.log(element_name)});
  })

</script>

<div class="{selectedEvent || 'pointer-events-none'} flex flex-col bg-primary w-full p-4">
 
  <div class="pb-2 {$appSettings.configType == 'uiEvents' ? 'block' : 'hidden'} flex">

    <div class="w-1/2 p-1">
      <div class="text-gray-500 text-sm py-1">Element Name</div>
      <input
        type="text" 
        bind:value={element_name}
        on:input={updateStringName} 
        class="w-full border bg-secondary border-secondary text-white py-1 pl-2 rounded-none"/>
    </div>

    <div class="w-1/2 p-1">
      <div class="text-gray-500 py-1 text-sm">
        Selected Element
      </div>

      <div class="flex flex-col relative justify-between font-bold text-white">
        <!-- svelte-ignore a11y-no-onchange -->
        <select bind:value={elements.selected} on:change={(e)=>{handleSelectElement(elements.selected)}} class="bg-secondary flex-grow text-white p-2 shadow">
          {#each elements.options.slice(0,-1) as element}
            <option value={element} class="text-white bg-secondary py-1 border-select">Element {element}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  


  <div class="pb-2">
    <div class="py-2 text-sm flex justify-between items-center">
      <div class="text-gray-500">Events</div>
      <div class="flex text-gray-400">
        <div 
          class="px-4 py-0.5 rounded-full cursor-pointer bg-secondary mx-1" 
          on:click={()=>{copyAllEventConfigsFromSelf()}}>
            Copy All
        </div>
        <div 
          class="px-4 py-0.5 rounded-full cursor-pointer bg-secondary ml-1"
          on:click={()=>{overwriteAllEventConfigs()}}>
            Overwrite
        </div>
      </div>
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