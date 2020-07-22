<script>

  import { createEventDispatcher, onMount } from 'svelte';


  import DropDownInput from './DropDownInput.svelte';
  
  const dispatch = createEventDispatcher();

  export let data;
  export let selectedEvent;

  let array = [];

  $: view = array;

  let numberOfParameters = [];

  const makeList = (num) => {
    let array = [];
    for (let i = 0; i < num; i++) {
      array[i] = {id: i, info: 'important'};
    }
    console.log(array);
    return array;
  }

  function MIDIRelativeParameters(){
  }

  function handleRemove(){
    dispatch('remove', {
      action: data
    })
  }

  onMount(()=>{

    console.log('Action: ', selectedEvent, data);

    switch(data.name){
      case 'MIDI Relative': {
        numberOfParameters = makeList(3);

        break;
      }
      case 'LED Intensity': {

        break;
      }
      case 'LED Color': {

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
        <DropDownInput optionList={numberOfParameters} bind:dropDownInput={array[index]}/>
      </div>
    {/each}
  </div>

  <div on:click={handleRemove} class="block p-2 w-8 h-8  bg-secondary hover:bg-black cursor-pointer">
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 1.00001L1.01053 13M12.9895 13L1 1" stroke="#BBBBBB" stroke-width="2"/>
    </svg>
  </div>
</main>

<span class="text-white">{view}</span>