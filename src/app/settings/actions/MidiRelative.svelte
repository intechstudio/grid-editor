<script>

  import {onMount} from 'svelte';

  import DropDownInput from '../DropDownInput.svelte';

  export let data;
  export let index;
  
  const MIDIRELATIVE = {

    CC_PARAMS: ['Control Change', 'Control Number', 'Control Value'],
    NOTE_PARAMS: ['Note On/Off', 'Pitch', 'Velocity'],

    CC: [
      [
        {value: '0xb0', info: 'Control Change'}, 
        {value: '0x90', info: 'Note On'}, 
        {value: '0x80', info: 'Note Off'}
      ],
      [
        {value: 'A0', info: 'Control Number'}, 
        {value: 'A1', info: 'Reversed control element'}
      ],[
        {value: 'A2', info: 'Control Value'}
      ]
    ],
    NOTE: [
      [
        {value: '0xb0', info: 'Control Change'}, 
        {value: '0x90', info: 'Note On'}, 
        {value: '0x80', info: 'Note Off'}
      ],
      [
        {value: 'A0', info: 'This // Pitch'}, 
        {value: 'A1', info: 'REV This // Pitch'}
      ],
      [
        {value: 'A2', info: '7-bit // Velocity'}
      ],
    ],

    optionList: function(parameter){
      let options = [];
      if(parameter == '0xb0'){
        options = this.CC;
        inputLabels = this.CC_PARAMS;
      }else{ // this is also the default;
        options = this.NOTE;
        inputLabels = this.NOTE_PARAMS;
      }
      return options;
    }
  }

  let optionList = [];

  let inputLabels = [];

  $: if(data.name == 'MIDI Relative') {
    optionList = MIDIRELATIVE.optionList(data.parameters[0]);
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
        if(defined) optionList = MIDIRELATIVE.optionList(hexstring);
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
    optionList = MIDIRELATIVE.optionList(data.parameters[0].value);
  })

</script>


{#each optionList as parameters, index}
  <div class={'w-1/'+optionList.length + ' dropDownInput'}>
    <div class="text-gray-700 text-xs">{inputLabels[index]}</div>
    <DropDownInput optionList={parameters} bind:dropDownValue={data.parameters[index]}/>
    <div class="text-white pl-2 flex-grow-0">
      {#if data.name == 'MIDI Relative'}
        {validate_midirelative(data.parameters[index], index)}
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