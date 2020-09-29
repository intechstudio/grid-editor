<script>

  import {onMount} from 'svelte';

  import DropDownInput from '../DropDownInput.svelte';

  import { configStore } from '../../stores/config.store';

  import { GRID_PROTOCOL } from '../../serialport/GridProtocol.js';

  export let data;
  export let orderNumber;
  export let moduleInfo;
  export let eventInfo;
  export let selectedElementSettings;

  $: {
    // for order number change
    console.log(orderNumber);
    optionList = MIDIABSOLUTE.optionList(data.parameters[1]);
    sendData();
  }

  let validator = [];

  const build_array = () => {
    let arr = [];
    for (let i = 0; i < 15; i++) {
      arr[i] = {value: i.toString(), info: `${'Ch. ' + i}`}
    }
    return arr;
  }
  
  const MIDIABSOLUTE = {

    PARAMS: ['Channel', 'Command', 'Parameter 1','Parameter 2'],

    CC_digital: [
      build_array(),
      [
        {value: '0xb0', info: 'Control Change'}, 
        {value: '0x90', info: 'Note On'}, 
        {value: '0x80', info: 'Note Off'}
      ],
      [
        {value: 'A0', info: 'Control Number'}, 
        {value: 'A1', info: 'Reversed Control Number'}
      ],[
        {value: 'A6', info: 'Control Value'}
      ]
    ],
    NOTE_digital: [
      build_array(),
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
        {value: 'A6', info: 'Velocity'}
      ],
    ],
    CC_analog: [
      build_array(),
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
    NOTE_analog: [
      build_array(),
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
        console.log(eventInfo);
        if(eventInfo.code[0] == 'A'){
          options = this.CC_analog;
        }else {
          options = this.CC_digital;
        }
      }else{ // this is also the default;
        if(eventInfo.code[0] == 'A'){
          options = this.NOTE_analog;
        } else {
          options = this.NOTE_digital;
        }
      }
      inputLabels = this.PARAMS;
      return options;
    }
  
  }

  let optionList = [];

  let inputLabels = MIDIABSOLUTE.PARAMS;

  function validate_midiabsolute(PARAMETERS){

    PARAMETERS.forEach((PARAMETER, INDEX) => {
      let type = '';
      let defined = '';
      let humanReadable = '';

    if(INDEX == 0){
      if(parseInt(PARAMETER) >= 0 && parseInt(PARAMETER) <= 15){
        type = 'dec';
      } else {
        defined = 'invalid :(';
        //appears to be a wildcard
      }
    } else if(INDEX == 1){
      if(parseInt(PARAMETER) >= 128 && parseInt(PARAMETER) <= 255){
        type = 'dec';
        let hexstring = '0x' + (+PARAMETER).toString(16).padStart(2, '0');      
        console.log('hexstring',hexstring); 
        defined = checkForMatchingValue(hexstring, INDEX);
        if(defined) optionList = MIDIABSOLUTE.optionList(hexstring);
      } else if(PARAMETER.startsWith('0x') && parameter.length > 3) {  
        type = 'hex';
        defined = checkForMatchingValue(PARAMETER, INDEX);
      } else {
        defined = 'invalid :(';
        //appears to be a wildcard
      }
    } else if(INDEX == 2){
      if(PARAMETER == 'A0' || PARAMETER == 'A1'){ 
        type = 'tmp param';
        defined = checkForMatchingValue(PARAMETER, INDEX);  
      } else if(+PARAMETER >= 0 && +PARAMETER <= 127 && PARAMETER !== ''){
        type = 'dec';
      } else {
        // wildcard
        defined = 'invalid :('
      }
    } else if(INDEX == 3){
      if(PARAMETER == 'A2' || PARAMETER == 'A6'){    
        type = 'tmp param';
        defined = checkForMatchingValue(PARAMETER, INDEX);
      } else if(PARAMETER >= 0 && PARAMETER <= 127 && PARAMETER !== ''){
        type = 'dec';
      } else {
        // wildcard
        defined = 'invalid :(' 
      }
    }

    if(defined)
      humanReadable = defined
    else 
      humanReadable = PARAMETER;

    validator[INDEX] = humanReadable;

  });

}

  function checkForMatchingValue(parameter, index) {
    let defined = optionList[index].find(item => item.value === parameter);
    defined ? defined = defined.info : null;
    return defined;
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

  function sendData(){

    validate_midiabsolute(data.parameters)

    const CHANNEL = parseInt(data.parameters[0]).toString(16).padStart(2,'0')[1];
    const COMMAND = parseInt(data.parameters[1]).toString(16)[0];
    
    const parameters = [
      {'CABLECOMMAND': `${'0'+COMMAND}` },
      {'COMMANDCHANNEL': `${COMMAND+CHANNEL}` },
      {'PARAM1': parser(data.parameters[2])},
      {'PARAM1': parser(data.parameters[3])}
    ];

    let valid = false;
    if(validator.length == 4 && validator.indexOf('invalid :(') == -1 && !validator.includes(undefined)){
      valid = true;
    }

    if(valid){
      configStore.save(orderNumber, moduleInfo, eventInfo, selectedElementSettings, GRID_PROTOCOL.configure("MIDIABSOLUTE", parameters));
    }
  }


  onMount(()=>{
    optionList = MIDIABSOLUTE.optionList(data.parameters[1]);
  })

</script>


{#each optionList as parameters, index}
  <div class={'w-1/'+optionList.length + ' dropDownInput'}>
    <div class="text-gray-700 text-xs">{inputLabels[index]}</div>
    <DropDownInput on:change={()=>{sendData()}} optionList={parameters} bind:dropDownValue={data.parameters[index]}/>
    <div class="text-white pl-2 flex-grow-0">
      {#if data.name == 'MIDI Absolute'}
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