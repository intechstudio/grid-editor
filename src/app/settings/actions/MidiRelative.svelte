<script>

  import {afterUpdate, beforeUpdate, createEventDispatcher, onMount} from 'svelte';

  const dispatch = createEventDispatcher();

  import { configStore } from '../../stores/config.store';

  import { orderChange } from '../order-change.store.js';

  import { GRID_PROTOCOL } from '../../serialport/GridProtocol.js';

  import DropDownInput from '../DropDownInput.svelte';

  export let data;
  export let orderNumber;
  export let moduleInfo;
  export let eventInfo;
  export let selectedElementSettings;

  let validator = [];

  $: {
    optionList = MIDIRELATIVE.optionList(data.parameters[0]);
  }
    
  const MIDIRELATIVE = {

    CC_PARAMS: ['Control Change', 'Control Number', 'Control Value'],
    NOTE_PARAMS: ['Note On/Off', 'Pitch', 'Velocity'],

    CC_digital: [
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
        if(eventInfo.code[0] == 'A'){
          options = this.CC_analog;
        }else {
          options = this.CC_digital;
        }
        inputLabels = this.CC_PARAMS;
      }else{ // this is also the default;
        if(eventInfo.code[0] == 'A'){
          options = this.NOTE_analog;
        } else {
          options = this.NOTE_digital;
        }
        inputLabels = this.NOTE_PARAMS;
      }
      return options;
    }
  }

  let optionList = [];

  let inputLabels = [];

  function validate_midirelative(PARAMETERS){

    PARAMETERS.forEach((PARAMETER, INDEX) => {
      let type = '';
      let defined = '';
      let humanReadable = '';

      if(INDEX == 0){
        if(parseInt(PARAMETER) >= 128 && parseInt(PARAMETER) <= 255){
          type = 'dec';
          let hexstring = '0x' + (+PARAMETER).toString(16).padStart(2, '0');      
          defined = checkForMatchingValue(hexstring, INDEX);
          if(defined) optionList = MIDIRELATIVE.optionList(hexstring);
        } else if(PARAMETER.startsWith('0x') && parameter.length > 3) {  
          type = 'hex';
          defined = checkForMatchingValue(PARAMETER, INDEX);
        } else {
          defined = 'invalid :(';
          //appears to be a wildcard
        }
      } else if(INDEX == 1){
        if(PARAMETER == 'A0' || PARAMETER == 'A1'){ 
          type = 'tmp param';
          defined = checkForMatchingValue(PARAMETER, INDEX);  
        } else if(+PARAMETER >= 0 && +PARAMETER <= 127 && PARAMETER !== ''){
          type = 'dec';
        } else {
          // wildcard
          defined = 'invalid :('
        }
      } else if(INDEX == 2){
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

    const COMMAND = parseInt(data.parameters[0]).toString(16)[0];

    validate_midirelative(data.parameters);
    
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
    
    dispatch('send',{});
  }

  function checkForMatchingValue(parameter, index) {
    let defined = optionList[index].find(item => item.value === parameter);
    defined ? defined = defined.info : null;
    return defined;
  }


  let orderChangeTrigger = null;
  onMount(()=>{
    let c = 0;
    orderChange.subscribe((change)=>{
      c++;
      
      if(change !== null && c == 1){
        orderChangeTrigger = true;
        console.log(data.name, 'REMOVE', orderNumber);
        if(change == 'remove'){
          //configStore.remove(orderNumber, moduleInfo, eventInfo, selectedElementSettings);
        }
      }
      c = 0;
    });
  })

  afterUpdate(() => {
    if(orderChangeTrigger){
      sendData();
    }
  })

</script>


{#each optionList as parameters, index}
  <div class={'w-1/'+optionList.length + ' dropDownInput'}>
    <div class="text-gray-700 text-xs">{inputLabels[index]}</div>
    <DropDownInput on:change={()=>{sendData()}} optionList={parameters} bind:dropDownValue={data.parameters[index]}/>
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