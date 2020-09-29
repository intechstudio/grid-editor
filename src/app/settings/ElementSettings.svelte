<script>

  import { onMount, onDestroy } from 'svelte';

  import { elementSettings } from './elementSettings.store.js';
  import { grid } from '../stores/grid.store.js';
  import { configStore } from '../stores/config.store.js';

  import SortableActions from './SortableActions.svelte';

  import OverlayToggle from '../grid-modules/overlays/OverlayToggle.svelte';

  import Action from './Action.svelte';
  import { GRID_PROTOCOL } from '../serialport/GridProtocol.js';
  import { serialComm } from '../serialport/serialport.store.js';

  let selectedElementSettings;

  let originalActions = [
    { id: 0, name: 'MIDI Relative' },
    { id: 1, name: 'MIDI Absolute'},
    { id: 2, name: 'LED Color' },
    { id: 3, name: 'LED Phase' },
  ];
  let selectedAction = originalActions[0];
  $: availableActions = originalActions;
  $: selectedActions = [];
  
  let element_color;

  let moduleId = '';

  let moduleInfo;
  let eventInfo;

  let events = [];

  let selectedEvent = '';

  let controlElementName = '';

  // copy-c and copy-v

  let copiedActions;

  // ElementSettings store subscription

  // main

  function loadSelectedModuleSettings(){
    $grid.used.forEach(_controller => {
      if(('dx:'+_controller.dx+';dy:'+_controller.dy) == selectedElementSettings.position){
        moduleInfo = _controller;
        moduleId = _controller.id;  
        events = _controller.banks[selectedElementSettings.bank][selectedElementSettings.controlNumber[0]].events.map((cntrl)=>{return cntrl.event.desc});
        selectedEvent = selectedElementSettings.selectedEvent || events[0];
        let elementEvent = _controller.banks[selectedElementSettings.bank][selectedElementSettings.controlNumber[0]].events.find(cntrl => cntrl.event.desc == selectedEvent);
        if(elementEvent !== undefined){
          selectedActions = elementEvent.actions;
          eventInfo = elementEvent.event;
        }
        controlElementName = _controller.banks[selectedElementSettings.bank][selectedElementSettings.controlNumber[0]].controlElementName || '';
      }
    });
  }

  function manageActions(action){
    selectedActions = [...selectedActions, initActionParameters(action.name)];
    if(availableActions[0] !== '' || availableActions[0] !== undefined){
      return availableActions[0];
    }   
  }

  function initActionParameters(actionName){
    let action = {name: actionName}
    let parameters = [];
    for (let i = 0; i < 3; i++) {
      parameters[i] = '';
    }
    return {...action, parameters}
  }

  function handleRemoveAction(e){
    const data = e.detail.data;
    const index = e.detail.index;
    grid.update((grid)=>{
      grid.used.map((controller)=>{
        if(('dx:'+controller.dx+';dy:'+controller.dy) == selectedElementSettings.position){
          let elementEvent = controller.banks[selectedElementSettings.bank][selectedElementSettings.controlNumber[0]].events.find(cntrl => cntrl.event.desc == selectedEvent);   
          elementEvent.actions.splice(index,1);
          selectedActions = elementEvent.actions; // update this list too. does kill smooth animations
        }
        return controller;
      })
      return grid;
    })
  }

  function handleFocus(e){
    focus = true;
  }

  function handleSelectEvent(event){
    elementSettings.update((values)=>{
      values.selectedEvent = event;
      return values;
    })
  }

  function handleOnChange(e){
    const data = e.detail.data;
    const index = e.detail.index;
    grid.update((grid)=>{
      grid.used.map((controller)=>{
        if(('dx:'+controller.dx+';dy:'+controller.dy) == selectedElementSettings.position){
          let elementEvent = controller.banks[selectedElementSettings.bank][selectedElementSettings.controlNumber[0]].events.find(cntrl => cntrl.event.desc == selectedEvent);
          if(elementEvent !== undefined){
            elementEvent.actions[index] = {name: data.name, parameters: data.parameters}; 
          }
        }
        return controller;
      })
      return grid;   
    });

  }

  function handleControlElementNaming(name){
    // PROBABLY RUNS TOO MANY TIMES, TRY ONBLUR AND OTHER DEBOUNCING METHODS
    grid.update((grid)=>{
      grid.used.map((controller)=>{
        if(('dx:'+controller.dx+';dy:'+controller.dy) == selectedElementSettings.position){
          controller.banks[selectedElementSettings.bank][selectedElementSettings.controlNumber[0]].controlElementName = name;
        }
        return controller;
      })
      return grid; 
    })
  }

  function copyActions(){
    $grid.used.forEach(controller => {
      if(('dx:'+controller.dx+';dy:'+controller.dy) == selectedElementSettings.position){
        let elementEvent = controller.banks[selectedElementSettings.bank][selectedElementSettings.controlNumber[0]].events.find(cntrl => cntrl.event.desc == selectedEvent);
        copiedActions = elementEvent.actions;
      }
    });
  }

  function pasteActions(){
    grid.update((grid)=>{
      grid.used.map((controller)=>{
        if(('dx:'+controller.dx+';dy:'+controller.dy) == selectedElementSettings.position){
          let elementEvent = controller.banks[selectedElementSettings.bank][selectedElementSettings.controlNumber[0]].events.find(cntrl => cntrl.event.desc == selectedEvent);
          const newActions = JSON.parse(JSON.stringify(copiedActions)); // deep copy of object.
          elementEvent.actions = newActions;
        }
        return controller;
      });   
      return grid;
    });
    loadSelectedModuleSettings();
  }

  onMount(()=>{
    elementSettings.subscribe((values)=>{
      selectedElementSettings = values;
      loadSelectedModuleSettings();
    });

    configStore.subscribe((store)=>{

      if(store[moduleId] !== undefined){

        const actions = store[moduleId][selectedElementSettings.bank][eventInfo.value];
        
        const config = [
          { BANKNUMBER: selectedElementSettings.bank },
          { ELEMENTNUMBER: selectedElementSettings.controlNumber[0] },
          { EVENTTYPE: eventInfo.value }
        ]

        let array = [];
        actions.forEach(a => {
          array.push(...a);
        });

        const serialized = GRID_PROTOCOL.serialize_actions(config, array);
        serialComm.write(GRID_PROTOCOL.encode(moduleInfo,'','',serialized))
      }
    })

  })

  


</script>

<style>

  .disabled{
    background-color:#c1c1c1;
    cursor: not-allowed;
  }

</style>




<div class="inline-block primary rounded-lg p-4 m-4 z-20 w-1/3">
  <div class="flex flex-col relative justify-between font-bold text-white m-2">
    <div class="text-xl">Element Settings</div>
    <div class="text-orange-500 py-1">Module: {moduleId == '' ? '-' : moduleId.substr(0,4)}</div>
    <div class="text-orange-500 text-4xl absolute right-0">{$elementSettings.controlNumber[0] == undefined ? '-' : $elementSettings.controlNumber[0]}</div>
  </div>

  {#if $elementSettings.controlNumber[0] !== undefined}
  

  <div class="flex flex-col px-2 my-4 w-full">
  
    <div class="text-gray-700 flex py-1">
      <div>Name</div>
      <OverlayToggle type={'controlName'}/>
    </div>
    
    <input 
      bind:value={controlElementName}
      on:input={e => handleControlElementNaming(controlElementName)}
      type="text" 
      class="w-full secondary text-white p-1 pl-2 rounded-none focus:outline-none" 
      placeholder="Your name for this control element...">
    
  </div>

  <div class="flex flex-col">
    <div class="text-gray-700 py-1 mx-2">
      Events
    </div>

    <div class="flex mx-1 secondary rounded-lg shadow overflow-x-auto">
      {#each events as event}
        <button 
          on:click={()=>{handleSelectEvent(event)}} 
          class:shadow-md={selectedEvent === event}
          class:bg-highlight={selectedEvent === event}
          class="m-2 p-1 text-white flex-grow outline-none border-0 rounded hover:bg-highlight-300  focus:outline-none">
          {event}
        </button>
      {/each}
    </div>


  
    <div class="mx-2 my-4">

      <div class="text-gray-700 py-1">
        Actions
      </div>

      <div class="flex w-full">

          <div class="flex flex-col xl:flex-row w-full justify-between"> 

            <div class="flex w-full xl:w-2/3">         
              <select bind:value={selectedAction} class="secondary flex-grow text-white p-1 mr-2 rounded-none focus:outline-none">
                {#each availableActions as action}
                  <option value={action} class="secondary  text-white">{action.name}</option>
                {/each}
              </select>
              <button 
                disabled={selectedAction === undefined} 
                class:disabled={selectedAction === undefined} 
                on:click={()=>{selectedAction = manageActions(selectedAction); }} 
                class="bg-highlight w-32 font-medium text-white py-1 px-2 rounded-none border border-highlight hover:bg-highlight-400 focus:outline-none"
                >
                Add Action
              </button>
            </div>
     
            <div class="flex mt-2 xl:mt-0">
              <button on:click={(e)=>{copyActions()}} class="mr-2 text-gray-200 w-16 text-center p-1 border rounded-none border-highlight hover:bg-highlight-400 focus:outline-none">Copy</button>
              <button on:click={(e)=>{pasteActions()}} class="text-gray-200 w-16 text-center p-1 border rounded-none border-highlight hover:bg-highlight-400 focus:outline-none">Paste</button>
            </div>

          </div>  
      </div>

      

      <SortableActions
        {selectedActions} 
        let:data 
        let:orderNumber
        >
        {#if selectedActions[0].parameters.length > 0}
          <Action 
            on:remove={handleRemoveAction}
            on:change={handleOnChange}
            {data} 
            {orderNumber}
            {moduleInfo}
            {eventInfo}
            {selectedElementSettings}
          />
        {/if}
      </SortableActions>

    </div>
  </div>
  {:else}
  <div class="px-2 my-4 w-full text-gray-700">Select a control element to start configuration!</div>
  {/if}
</div>



