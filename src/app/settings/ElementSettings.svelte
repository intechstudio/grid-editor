<script>

  import { onMount, onDestroy } from 'svelte';

  import { elementSettings } from './elementSettings.store.js';
  import { grid } from '../stores/grid.store.js';

  import SortableActions from './SortableActions.svelte';

  import Action from './Action.svelte';
  
  let originalActions = [
    { id: 0, name: 'MIDI Relative' },
    { id: 1, name: 'LED Color' },
    { id: 2, name: 'LED Intensity'}
  ];
  $: availableActions = originalActions;
  $: selectedActions = [];

  let selectedAction = originalActions[0];

  const sortList = ev => {selectedActions = ev.detail};

  let element_color;

  let moduleId = '';

  $: events = [];

  let selectedEvent = '';

  function loadSelectedModuleSettings(){
    elementSettings.subscribe((values)=>{
      $grid.used.forEach(_controller => {
        if(('dx:'+_controller.dx+';dy:'+_controller.dy) == values.position){
          moduleId = _controller.id;
          events = _controller.elementSettings[values.controlNumber];
          selectedEvent = values.selectedEvent;
        }
      });
    })
  }

  function manageActions(action){
    let id;
    selectedActions.length > 0 ? id = selectedActions.length : id = 0;
    selectedActions = [...selectedActions, {id: id, name: action.name}];
    if(availableActions[0] !== '' || availableActions[0] !== undefined){
      return availableActions[0];
    }   
  }

  function handleRemoveAction(e){
    let removedAction = e.detail.action;
    selectedActions = selectedActions.filter(a => a.id !== removedAction.id);
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

  function handleActionChange(e){
    const valueChange = e.detail.change;
    console.log(valueChange);
  }

  onMount(()=>{
    loadSelectedModuleSettings();

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
    <div class="text-gray-700 py-1">
      Events
    </div>

    <div class="flex mx-1 secondary rounded-lg shadow overflow-x-auto">
      {#each events as event}
        <button 
          on:click={()=>{handleSelectEvent(event)}} 
          class:shadow-md={selectedEvent.name === event.name}
          class:bg-highlight={selectedEvent.name === event.name}
          class="m-2 p-1 text-white flex-grow outline-none border-0 rounded hover:bg-highlight-300  focus:outline-none">
          {event.name}
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
        {selectedEvent} 
        let:data 
        let:selectedEvent>
          <Action 
            on:remove={handleRemoveAction} 
            on:change={handleActionChange}
            {data} 
            {selectedEvent}
          />
      </SortableActions>

    </div>
    </div>

  </div>


