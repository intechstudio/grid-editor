<script>

  import { createEventDispatcher, onMount } from 'svelte';

  import { grid } from './../stores/grid.store.js';

  import DropDownInput from './DropDownInput.svelte';

  import { ACTIONS } from './actions.js';

  const dispatch = createEventDispatcher();

  export let data;
  export let index;


  $: if(data.parameters){
    //let encoded = ACTIONS.encode(data);
    //console.log('ENCODED', encoded);
    //should be working in serial out / serial write
    sendData();
  }

  let optionList = [];

  $: if(data.name == 'MIDI Relative') ACTIONS.MIDIRELATIVE.optionList(data.parameters[0]);

  function handleRemove(){
    dispatch('remove', {
      action: data,
      index: index
    })
  }

  function sendData(encoded){
    dispatch('change', {
      data: data,
      index: index
    })
  }

  function checkForMatchingValue(parameter, index) {
    let defined = optionList[index].find(item => item.value === parameter);
    defined ? defined = defined.info : null;
    return defined;
  }

  function validate_midirelative(parameter, index){

    let type = '';
    let defined = '';
    let humanReadable = '';

    if(index == 0){

      if(parameter.length == 3 && +parameter >= 128 && +parameter <= 255){
    
        type = 'dec';

        let hexstring = '0x' + (+parameter).toString(16).padStart(2, '0');
        
        defined = checkForMatchingValue(hexstring, index);

        if(defined) optionList = ACTIONS.MIDIRELATIVE.optionList(hexstring);


      } else if(parameter.startsWith('0x')) {
        
        type = 'hex';

        defined = checkForMatchingValue(parameter, index);

      } else {

        //defined = 'invalid';
          // appears to be a wildcard

      }

    } else if(index == 1){

      if(parameter == 'A0' || parameter == 'A1'){
        
        type = 'tmp param';

        defined = checkForMatchingValue(parameter, index);
      
      } else if(+parameter >= 0 && +parameter <= 127){

        type = 'dec';

      } else {

        // wildcard

        defined = 'invalid :('
        
      }

    } else if(index == 2){

      if(parameter == 'A2'){
        
        type = 'tmp param';

        defined = checkForMatchingValue(parameter, index);
      
      } else if(+parameter >= 0 && +parameter <= 127){

        type = 'dec';

      } else {

        // wildcard

        defined = 'invalid :('
        
      }
    }

    
    if(defined)
      humanReadable = defined
    else 
      humanReadable = parameter;

    return humanReadable;
  }

  function validate_ledintensity(parameter, index){
    let type = '';
    let defined = '';
    let humanReadable = '';

    if(index == 0){
      if(parameter.length == 3 && +parameter >= 128 && +parameter <= 255){
        type = 'dec';
        let hexstring = '0x' + (+parameter).toString(16).padStart(2, '0');
        defined = checkForMatchingValue(hexstring, index);
      } else if(parameter.startsWith('0x')) {       
        type = 'hex';
        defined = checkForMatchingValue(parameter, index);
      } else {
        defined = 'invalid';
      }
    } else if(index == 1){
      if(parameter == 'A0' || parameter == 'A1'){      
        type = 'tmp param';
        defined = checkForMatchingValue(parameter, index);   
      } else if(+parameter >= 0 && +parameter <= 127){
        type = 'dec';
      } else {
        // wildcard
        defined = 'invalid :(' 
      }
    } else if(index == 2){
      if(parameter == 'A2'){ 
        type = 'tmp param'
        defined = checkForMatchingValue(parameter, index)
      } else if(+parameter >= 0 && +parameter <= 127){
        type = 'dec';
      } else {
        // wildcard
        defined = 'invalid :('      
      }
    }

    
    if(defined)
      humanReadable = defined
    else 
      humanReadable = parameter;

    return humanReadable;
  }

  onMount(()=>{
      switch(data.name){
        case 'MIDI Relative': {  
          optionList = ACTIONS.MIDIRELATIVE.optionList(data.parameters[0].value);
          break;
        }
        case 'LED Intensity': {
          optionList = ACTIONS.optionList(data.name);
          console.log(optionList);
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

<main class="flex flex-col"> 
  
  <div class="w-full flex p-0 m-0 pr-4 mx-2 justify-start">
    <div class="flex">
      {#each optionList as parameters, index}
        <div class={'w-1/'+optionList.length + ' dropDownInput'}>
          <DropDownInput optionList={parameters} bind:dropDownValue={data.parameters[index]}/>
   
          <div class="text-white pl-2 flex-grow-0">
          {#if data.name == 'MIDI Relative'}
            {validate_midirelative(data.parameters[index], index)}
          {:else if data.name == 'LED Intensity'}
            {validate_ledintensity(data.parameters[index], index)}
          {/if}
          
          </div>
      
        </div>
      {/each}
      
    </div>

    <div on:click={handleRemove} class="block p-2 w-8 h-8  bg-secondary hover:bg-black cursor-pointer">
      <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 1.00001L1.01053 13M12.9895 13L1 1" stroke="#BBBBBB" stroke-width="2"/>
      </svg>
    </div>
  </div>

  

</main>

