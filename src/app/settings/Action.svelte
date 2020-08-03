<script>

  import { createEventDispatcher, onMount } from 'svelte';

  import { grid } from './../stores/grid.store.js';

  import DropDownInput from './DropDownInput.svelte';

  import { ACTIONS } from './actions.js';

  const dispatch = createEventDispatcher();

  export let data;
  export let index;

  $: if(data.parameters){
    sendData();
  }

  let numberOfParameters = [];

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

      switch(data.name){
        case 'MIDI Relative': {  
          numberOfParameters = ACTIONS.MIDIRELATIVE;
          break;
        }
        case 'LED Intensity': {
          numberOfParameters = ACTIONS.LED_INTENSITY;
          break;
        }
        case 'LED Color': {
          numberOfParameters = ACTIONS.LED_COLOR;
          break;
        }
      }

  })

</script>

<style>

  .dropDownInput:first-child{
    margin-left: 0.5rem;
  }

  .dropDownInput:last-child{
    margin-right: 0.5rem;
  }

  .dropDownInput:not(:first-child):not(:last-child){
    margin-right: 0.5rem;
    margin-left: 0.5rem;
  }

</style>

<main class="w-full flex p-0 m-0 pr-4 mx-2 justify-start"> 
  <div class="flex">
    {#each numberOfParameters as parameters, index}
      <div class={'w-1/'+numberOfParameters.length + ' dropDownInput'}>
        <DropDownInput optionList={numberOfParameters[index]} bind:dropDownValue={data.parameters[index]}/>
      </div>
    {/each}
  </div>

  <button on:click={sendData} class="text-white p-2 outline-none">SEND</button>

  <div on:click={handleRemove} class="block p-2 w-8 h-8  bg-secondary hover:bg-black cursor-pointer">
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 1.00001L1.01053 13M12.9895 13L1 1" stroke="#BBBBBB" stroke-width="2"/>
    </svg>
  </div>
</main>