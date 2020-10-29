<script>

  import {afterUpdate, beforeUpdate, createEventDispatcher, onMount} from 'svelte';

  const dispatch = createEventDispatcher();

  import { actionListChange } from '../action-list-change.store.js';

  import DropDownInput from '../../ui/components/DropDownInput.svelte';

  import { check_for_matching_value, parameter_parser } from './action-helper';

  export let action;
  export let index;
  export let eventInfo;

  let validator = [];
  let actionKeys = ['COMMANDCHANNEL','PARAM1','PARAM2']

  $: {
    optionList = MIDIRELATIVE.optionList(action.parameters.COMMANDCHANNEL);
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
      if(parameter == '176'){
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

    for (const KEY in PARAMETERS) {
      let type = '';
      let defined = '';
      let humanReadable = '';
      if (PARAMETERS.hasOwnProperty(KEY)) {
        const VALUE = PARAMETERS[KEY];
        if(KEY == 'COMMANDCHANNEL'){
          if(parseInt(VALUE) >= 128 && parseInt(VALUE) <= 255){
            type = 'dec';
            let hexstring = '0x' + (+VALUE).toString(16).padStart(2, '0');      
            defined = check_for_matching_value(optionList, hexstring, 0);
            if(defined) optionList = MIDIRELATIVE.optionList(hexstring);
          } else if(VALUE.startsWith('0x') && parameter.length > 3) {  
            type = 'hex';
            defined = check_for_matching_value(optionList, VALUE, 0);
          } else {
            defined = 'invalid :(';
            //appears to be a wildcard,
          }
        }
        else if(KEY == 'PARAM1'){
          if(VALUE == 'A0' || VALUE == 'A1'){ 
            type = 'tmp param';
            defined = check_for_matching_value(optionList, VALUE, 1);  
          } else if(+VALUE >= 0 && +VALUE <= 127 && VALUE !== ''){
            type = 'dec';
          } else {
            // wildcard
            defined = 'invalid :('
          }
        }
        else if(KEY == 'PARAM2'){
          if(VALUE == 'A2' || VALUE == 'A6'){    
            type = 'tmp param';
            defined = check_for_matching_value(optionList, VALUE, 2);
          } else if(VALUE >= 0 && VALUE <= 127 && VALUE !== ''){
            type = 'dec';
          } else {
            // wildcard
            defined = 'invalid :(' 
          }
        }

        if(defined)
          humanReadable = defined
        else 
          humanReadable = VALUE;
        
        validator[KEY] = humanReadable;
      }
    }
  }


  function sendData(){

    const COMMAND = parseInt(action.parameters.COMMANDCHANNEL).toString(16)[0];

    validate_midirelative(action.parameters);
    
    const parameters = [
      {'CABLECOMMAND': `${'0'+COMMAND}` },
      {'COMMANDCHANNEL': `${COMMAND+'0'}` },
      {'PARAM1': parameter_parser(action.parameters.PARAM1)},
      {'PARAM2': parameter_parser(action.parameters.PARAM2)}
    ];

    let valid = true;
 
    for (const key in validator) {
      if(validator[key] == 'invalid :(' || validator[key] == undefined){
        valid = false
      }
    }

    console.log(parameters);
    if(valid){
      dispatch('send', { 
        action: {
          value: action.value, 
          parameters: parameters
        }, 
        index: index 
      });
    }
    
  }

  let orderChangeTrigger = null;
  onMount(()=>{
    let c = 0;
    actionListChange.subscribe((change)=>{
      c++;
      if(change !== null && c == 1){
        orderChangeTrigger = true;
        if(change == 'remove'){
          //configStore.remove(index, moduleInfo, eventInfo, inputStore);
        }
      }
      c = 0;
    });

    validate_midirelative(action.parameters);

  })

  afterUpdate(() => {
    if(orderChangeTrigger){
      sendData();
    }
  })

</script>

{#each actionKeys as actionKey, index}
  <div class={'w-1/'+actionKeys.length + ' dropDownInput'}>
    <div class="text-gray-700 text-xs">{inputLabels[index]}</div>
    <DropDownInput on:change={()=>{sendData()}} optionList={optionList[index]} bind:dropDownValue={action.parameters[actionKey]}/>
    <div class="text-white pl-2 flex-grow-0">
      {#if action.name == 'MIDI Dynamic'}
        {validator[actionKey] ? validator[actionKey] : ''}
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