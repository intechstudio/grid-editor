<script>
  import ActionCommands from "../../settings/local/ActionCommands.svelte";
  import { appSettings } from "../../stores/app-settings.store";
  import { fly, fade } from 'svelte/transition';
  
  let selectedAction;
  let selectedEvent;
  let arrayOfSelectableActions = [{code: 'AV7', name: 'MIDI'}, {code: 'HID', name:'Macro'}]

  let events = [{value: '',desc:'bank init'}, {value: '',desc:'down'}, {value: '',desc:'up'}]

  function handleSelectEvent(arg){
    selectedEvent = arg
  }

  function manageActions(arg){

  }

</script>

<div class="flex flex-col bg-primary w-full p-4">

  <div class="pb-2 {$appSettings.configType == 'uiEvents' ? 'block' : 'hidden'}">
    <div class="text-gray-700 py-1 text-sm">
      Selected Element
    </div>

    <div class="flex flex-col relative justify-between font-bold text-white">
      <select class="bg-secondary flex-grow text-white p-2 focus:outline-none">
        {#each [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] as element}
        <option class="text-white bg-secondary py-1">Element {element}</option>
        {/each}
      </select>
    </div>
  </div>
  
  <div class="pb-2">
    <div class="text-gray-700 py-1 text-sm">
      Events
    </div>

    <div class="flex bg-secondary shadow overflow-x-auto">
      {#each events as event}
        <button 
          on:click={()=>{handleSelectEvent(event)}} 
          class="{selectedEvent === event? 'shadow-md bg-pick text-white': 'hover:bg-pick-desaturate-10 text-gray-50'} m-2 p-1 flex-grow border-0 rounded focus:outline-none">
          {event.desc}
        </button>
      {/each}
    </div>
  </div>


  <div class="">


    <div class="flex w-full">
      <div class="flex flex-col xl:flex-row w-full justify-between"> 
      
        <!--
          <ActionCommands
            on:copy={copyActions}
            on:paste={pasteActions}
            on:recall={recallActions}
          />
        -->
      </div>  
    </div>
  </div>

  

</div>
