<script>

  import { onMount, onDestroy } from 'svelte';

  import { elementSettings } from './elementSettings.store.js';
  import { grid } from '../stores/grid.store.js';

  import Action from './Action.svelte';

  let originalActions = ['Control Change', 'Note On', 'Note Off', 'LED Color', 'LED Intensity'];
  $: availableActions = originalActions;
  $: selectedActions = [];

  let selectedEvent = '';

  let element_color;

  let moduleId = '';

  let selectedAction = originalActions[0];

  $: events = [];

  function loadSelectedModuleSettings(){
    elementSettings.subscribe((values)=>{
      $grid.used.forEach(_controller => {
        if(('dx:'+_controller.dx+';dy:'+_controller.dy) == values.position){
          moduleId = _controller.id;
          events = _controller.elementSettings[values.controlNumber];
        }
      });
    })
  }

  function manageActions(action){
    selectedActions = [...selectedActions, action];
    availableActions = availableActions.filter(a => a !== action);
    if(availableActions[0] !== '' || availableActions[0] !== undefined){
      return availableActions[0];
    }
  }

  function handleRemoveAction(e){
    let removedAction = e.detail.action;
    availableActions = [...availableActions, removedAction];
    selectedActions = selectedActions.filter(a => a !== removedAction);
    // should re-enable the add acion button here...
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
          on:click={()=>{selectedEvent = event}} 
          class:shadow-md={selectedEvent === event}
          class:bg-highlight={selectedEvent === event}
          class="m-2 p-1 text-white flex-grow outline-none border-0 rounded hover:bg-highlight-300  focus:outline-none">
          {event.name}
        </button>
      {/each}
    </div>

    <div class="text-gray-700 py-1">
      LED
    </div>

    <div class="flex p-2">
      <div 
        class:border-2="{element_color === 'red'}" 
        on:click="{() => element_color = 'red'}"
        class="shadow bg-red-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{element_color === 'green'}" 
        on:click="{() => element_color = 'green'}"
        class="shadow bg-green-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{element_color === 'blue'}" 
        on:click="{() => element_color = 'blue'}"
        class="shadow bg-blue-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{element_color === 'pink'}" 
        on:click="{() => element_color = 'pink'}"
        class="shadow bg-pink-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{element_color === 'indigo'}" 
        on:click="{() => element_color = 'indigo'}"
        class="shadow bg-indigo-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{element_color === 'yellow'}" 
        on:click="{() => element_color = 'yellow'}"
        class="shadow bg-yellow-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{element_color === 'orange'}" 
        on:click="{() => element_color = 'orange'}"
        class="shadow bg-orange-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
    </div>

    <div class="text-gray-700 py-1">
      Actions
    </div>

    <div class="flex w-full pr-4">
      <select bind:value={selectedAction} class="secondary flex-grow text-white p-1 mr-1 rounded-none focus:outline-none">
        {#each availableActions as action}
          <option class="secondary text-white">{action}</option>
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


    <div class="flex flex-col w-full pt-4">
      {#each selectedActions as action}
        <Action on:remove={handleRemoveAction} {action}/>
      {/each}
    </div>

    </div>
  </div>


