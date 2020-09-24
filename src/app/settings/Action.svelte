<script>

  import { createEventDispatcher, onMount } from 'svelte';

  import MidiRelative from './actions/MidiRelative.svelte';
  import MidiAbsolute from './actions/MidiAbsolute.svelte';
  import SetLedColor from './actions/SetLedColor.svelte';

  const dispatch = createEventDispatcher();

  export let data;
  export let index;
  export let selectedElementSettings;
  export let moduleInfo;
  export let eventInfo;

  const components = {
    'MIDI Relative': MidiRelative,
    'MIDI Absolute': MidiAbsolute,
    'LED Color': SetLedColor
  }

  $: if(data.parameters){
    sendData();
  }

  function handleRemove(){
    dispatch('remove', {
      action: data,
      index: index
    })
  }

  function sendData(){
    dispatch('change', {
      data: data,
      index: index
    })
  }

  onMount(()=>{
    console.log('ACTION!');
  })

</script>

<main class="flex flex-col w-full"> 
  
  <div class="w-full flex p-0 mx-2">

    <svelte:component this={components[data.name]} bind:data={data} {moduleInfo} {eventInfo} {selectedElementSettings} />    

    <div>
      <div class="invisible text-xs">Remove</div>
      <div on:click={handleRemove} class="block p-2 w-8 h-8  bg-secondary hover:bg-black cursor-pointer">
        <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 1.00001L1.01053 13M12.9895 13L1 1" stroke="#BBBBBB" stroke-width="2"/>
        </svg>
      </div>
    </div>
  </div>

  

</main>

