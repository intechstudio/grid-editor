<script>

  import { onMount, onDestroy } from 'svelte';

  import { elementSettings } from './elementSettings.store.js';
  import { grid } from '../stores/grid.store.js';

  import SortableActions from './SortableActions.svelte';

  import OverlayToggle from '../grid-modules/overlays/OverlayToggle.svelte';

  import Action from './Action.svelte';

  let selectedElementSettings;

  
  let originalActions = [
    { id: 0, name: 'MIDI Relative' },
    { id: 1, name: 'LED Color' },
    { id: 2, name: 'LED Intensity'}
  ];
  let selectedAction = originalActions[0];
  $: availableActions = originalActions;
  $: selectedActions = [];
  
  let element_color;

  let moduleId = '';

  let events = [];

  let selectedEvent = '';

  let controlElementName = '';

  // ElementSettings store subscription

  // main

  function loadSelectedModuleSettings(){
    $grid.used.forEach(_controller => {
      if(('dx:'+_controller.dx+';dy:'+_controller.dy) == selectedElementSettings.position){
        moduleId = _controller.id;
        events = _controller.elementSettings[selectedElementSettings.controlNumber[0]].events.map((cntrl)=>{return cntrl.event.desc});
        selectedEvent = selectedElementSettings.selectedEvent || events[0];
        let elementEvent = _controller.elementSettings[selectedElementSettings.controlNumber[0]].events.find(cntrl => cntrl.event.desc == selectedEvent);
        selectedActions = elementEvent.actions;
        controlElementName = _controller.elementSettings[selectedElementSettings.controlNumber[0]].controlElementName || '';
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
      parameters[i] = ''
      // this is an older approach, where dropdowninput handled objects.. was buggy. 
      // parameters[i] = {value: '', info: ''}
    }
    return {...action, parameters}
  }

  function handleRemoveAction(e){
    const data = e.detail.data;
    const index = e.detail.index;
    grid.update((grid)=>{
      grid.used.map((controller)=>{
        if(('dx:'+controller.dx+';dy:'+controller.dy) == selectedElementSettings.position){
          let elementEvent = controller.elementSettings[selectedElementSettings.controlNumber[0]].events.find(cntrl => cntrl.event.desc == selectedEvent);   
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
          let elementEvent = controller.elementSettings[selectedElementSettings.controlNumber].events.find(cntrl => cntrl.event.desc == selectedEvent);
          elementEvent.actions[index] = {name: data.name, parameters: data.parameters}; 
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
          controller.elementSettings[selectedElementSettings.controlNumber].controlElementName = name;
        }
        return controller;
      })
      return grid; 
    })
  }

  onMount(()=>{
    elementSettings.subscribe((values)=>{
      selectedElementSettings = values;
      loadSelectedModuleSettings();
    });
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
    <div class="text-orange-500 py-1">Module: {moduleId.substr(0,4)}</div>
    <div class="text-orange-500 text-4xl absolute right-0">{$elementSettings.controlNumber}</div>
  </div>

  <div class="mx-2 my-4 w-full">
  
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

  <div class="mx-2 my-4 w-full">
    <div class="text-gray-700 py-1">
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

    <div class="text-gray-700 py-1">
      Actions
    </div>

    <div>

      <div class="flex w-full pr-4 py-4">
        <select bind:value={selectedAction} class="secondary flex-grow text-white p-1 mr-1 rounded-none focus:outline-none">
          {#each availableActions as action}
            <option value={action} class="secondary text-white">{action.name}</option>
          {/each}
        </select>
        <button 
          disabled={selectedAction === undefined} 
          class:disabled={selectedAction === undefined} 
          on:click={()=>{selectedAction = manageActions(selectedAction); }} 
          class="bg-highlight ml-1 w-32 font-medium text-white py-1 px-2 rounded-none border-none hover:bg-highlight-400 focus:outline-none"
          >
            Add Action
          </button>
      </div>

      <SortableActions
        {selectedActions} 
        let:data 
        let:index>
        {#if selectedActions[0].parameters.length > 0}
          <Action 
            on:remove={handleRemoveAction}
            on:change={handleOnChange}
            {data} 
            {index}
          />
        {/if}
      </SortableActions>

    </div>
    </div>

  </div>


