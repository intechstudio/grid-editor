<script>

  import {onMount} from 'svelte';

  import { configStore } from '../../stores/config.store';

  import { GRID_PROTOCOL } from '../../serialport/GridProtocol.js';

  import DropDownInput from '../DropDownInput.svelte';

  export let data;
  export let orderNumber;
  export let moduleInfo;
  export let eventInfo;
  export let selectedElementSettings;

  let validator = [];
  
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
        {value: 'A1', info: 'Reversed Control Number'}
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
        {value: 'A0', info: 'Note'}, 
        {value: 'A1', info: 'Reversed Note'}
      ],
      [
        {value: 'A2', info: 'Velocity'}
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
      if(parseInt(parameter) >= 128 && parseInt(parameter) <= 255){
        type = 'dec';
        let hexstring = '0x' + (+parameter).toString(16).padStart(2, '0');       
        defined = checkForMatchingValue(hexstring, index);
        console.log('here?', parameter,(+parameter).toString(16).padStart(2, '0'),defined)
        if(defined) optionList = MIDIRELATIVE.optionList(hexstring);
      } else if(parameter.startsWith('0x') && parameter.length > 3) {  
        type = 'hex';
        defined = checkForMatchingValue(parameter, index);
      } else {
        defined = 'invalid :(';
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

  function parser(param){
    let parameter;
    if(isNaN(parseInt(param))){
      parameter = param;  
    } else {
      parameter = parseInt(param)
    }
    return parameter
  }

  function sendData(params, num){

    validator[num] = validate_midirelative(params, num);

    const COMMAND = parseInt(data.parameters[0]).toString(16)[0];
    
    const parameters = [
      {'CABLECOMMAND': `${'0'+COMMAND}` },
      {'COMMANDCHANNEL': `${COMMAND+'0'}` },
      {'PARAM1': parser(data.parameters[1])},
      {'PARAM1': parser(data.parameters[2])}
    ];

    let valid = false;
    if(validator.length == 3 && validator.indexOf('invalid :(') == -1 && !validator.includes(undefined)){
      valid = true;
    }
    
    if(valid){
      configStore.save(orderNumber, moduleInfo, eventInfo, selectedElementSettings, GRID_PROTOCOL.configure("MIDIRELATIVE", parameters));
    }
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
    <DropDownInput on:change={()=>{sendData(data.parameters[index], index)}} optionList={parameters} bind:dropDownValue={data.parameters[index]}/>
    <div class="text-white pl-2 flex-grow-0">
      {#if data.name == 'MIDI Relative'}
        {validator[index] ? validator[index] : ''}
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