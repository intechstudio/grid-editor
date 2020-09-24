<script>

  import {onMount} from 'svelte';

  import DropDownInput from '../DropDownInput.svelte';

  export let data;
  export let index;
  
  const MIDIABSOLUTE = {

    PARAMS: ['Channel', 'Command', 'Parameter 1','Parameter 2'],

    OPTIONS: [
      [
        {value: 'W', info: 'Channel Stuff'}
      ],
      [
        {value: 'Z', info: 'Command Thingy'}
      ],
      [
        {value: 'X', info: 'X'}
      ],[
        {value: 'Y', info: 'Y'}
      ]
    ],
  
  }

  let optionList = [];

  let inputLabels = MIDIABSOLUTE.PARAMS;

  function validate_midiabsolute(parameter, index){

    let type = '';
    let defined = '';
    let humanReadable = '';

    if(index == 0){
      if(parameter.length == 3 && +parameter >= 128 && +parameter <= 255){
        type = 'dec';
        let hexstring = '0x' + (+parameter).toString(16).padStart(2, '0');       
        defined = checkForMatchingValue(hexstring, index);
        if(defined) optionList = MIDIABSOLUTE.optionList(hexstring);
      } else if(parameter.startsWith('0x')) {  
        type = 'hex';
        defined = checkForMatchingValue(parameter, index);
      } else {
        //defined = 'invalid';
        //appears to be a wildcard
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

  function checkForMatchingValue(parameter, index) {
    let defined = optionList[index].find(item => item.value === parameter);
    defined ? defined = defined.info : null;
    return defined;
  }

  onMount(()=>{
    optionList = MIDIABSOLUTE.OPTIONS;
  })

</script>


{#each optionList as parameters, index}
  <div class={'w-1/'+optionList.length + ' dropDownInput'}>
    <div class="text-gray-700 text-xs">{inputLabels[index]}</div>
    <DropDownInput optionList={parameters} bind:dropDownValue={data.parameters[index]}/>
    <div class="text-white pl-2 flex-grow-0">
      {#if data.name == 'MIDI Absolute'}
        {validate_midiabsolute(data.parameters[index], index)}
      {/if}
    </div>
  </div>
{/each}

<style>
  .dropDownInput{
    padding-right:0.5rem;
  }

  .dropDownInput:first-child{
    padding-left: 0rem;
  }

  .dropDownInput:last-child{
    padding-left: 0.5rem;
  }

  
</style>