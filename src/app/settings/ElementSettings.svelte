<script>

  import { onMount, onDestroy } from 'svelte';

  import { elementSettings } from './elementSettings.store.js';
  import { grid } from '../stores/grid.store.js';

  import SortableList from './SortableList.svelte';

  import Action from './Action.svelte';


  let originalActions = ['Control Change','Note On','Note Off','LED Color','LED Intensity' ]
  $: availableActions = originalActions;
  $: selectedActions = [];

  const sortList = ev => {selectedActions = ev.detail};

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
      Actions
    </div>

    <SortableList/>

    </div>
  </div>


