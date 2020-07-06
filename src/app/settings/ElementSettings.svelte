<script>

  import { onMount, onDestroy } from 'svelte';

  import { elementSettings } from './elementSettings.store.js';
  import { grid } from '../stores/grid.store.js';

  import Action from './Action.svelte';

  let selectedEvent = '';

  let element_color;

  $: events = [];

  function loadSelectedModuleSettings(){
    elementSettings.subscribe((values)=>{
      $grid.used.forEach(_controller => {
        if(_controller.id == values.moduleId){;
          events = _controller.elementSettings[values.controlNumber];
          console.log(events);
        }
      });
    })
  }

  onMount(()=>{
    loadSelectedModuleSettings();
  })

</script>

<div class="inline-block primary rounded-lg p-4 m-4 z-20">

  <div class="flex flex-col relative justify-between font-bold text-white mx-2">
    <div class="text-xl">Element Settings</div>
    <div class="text-orange-500 py-1">Module: {$elementSettings.moduleId.substr(0,4)}</div>
    <div class="text-orange-500 text-4xl absolute right-0">{$elementSettings.controlNumber}</div>
  </div>

  <div class="mx-2 my-4">
    <div class="text-gray-700 py-1">
      Events
    </div>

    <div class="flex mx-1 secondary rounded-lg shadow">
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

    <div class="flex">
      <select class="secondary flex-grow text-white p-1 mr-1 rounded-none focus:outline-none">
        {#each ['Control Change', 'Note On', 'Note Off'] as action}
          <option class="secondary text-white">{action}</option>
        {/each}
      </select>

      <button class="bg-highlight ml-1 w-32 font-medium text-white py-1 px-2 rounded-none border-none hover:bg-highlight-400 focus:outline-none">Add Action</button>
    </div>

    <div class="flex flex-col">
      <div class="text-white py-2">Control Change</div>
      <div class="flex">
        <input type="number" class="secondary text-white p-1 rounded-none focus:outline-none mr-2">
        <input type="number" class="secondary text-white p-1 rounded-none focus:outline-none mr-2">
        <div class="p-2 w-8 h-8 bg-secondary hover:bg-black cursor-pointer">
          <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 1.00001L1.01053 13M12.9895 13L1 1" stroke="#BBBBBB" stroke-width="2"/>
          </svg>
        </div>
      </div>
    </div>

    </div>
  </div>


