<script>

  import {onMount} from 'svelte';

  import DropDownInput from '../DropDownInput.svelte';

  export let data;
  
  const MIDIRELATIVE = {
    CC: [
      [
        {value: '0xb0', info: 'Control Change'}, 
        {value: '0x90', info: 'Note On'}, 
        {value: '0x80', info: 'Note Off'}
      ],
      [
        {value: 'A0', info: 'This control element'}, 
        {value: 'A1', info: 'Reversed control element'}
      ],[
        {value: 'A2', info: '7-bit value'}
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
      }else{ // this is also the default;
        options = this.NOTE;
      }
      return options;
    }
  }

  let optionList = [];

  $: if(data.name == 'MIDI Relative') optionList = MIDIRELATIVE.optionList(data.parameters[0]);

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
    <DropDownInput optionList={parameters} bind:dropDownValue={data.parameters[index]}/>
    <div class="text-white pl-2 flex-grow-0">
      {#if data.name == 'MIDI Relative'}
        {validate_midirelative(data.parameters[index], index)}
      {/if}
    </div>
  </div>
{/each}

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