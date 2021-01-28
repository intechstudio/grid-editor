<script>

  import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';

  const dispatch = createEventDispatcher();

  import DropDownInput from '../../ui/components/DropDownInput.svelte';
  import { GRID_PROTOCOL } from '../../../core/classes/GridProtocol.js';
  import { actionListChange } from '../action-list-change.store.js';
  import { check_for_matching_value, parameter_parser } from './action-helper';
  import { buildOptionList } from './parameter-map';

  export let action;
  export let index;
  export let eventInfo;
  export let elementInfo;

  let validator = [];

  let actionKeys = ['CABLECOMMAND','COMMANDCHANNEL','PARAM1','PARAM2'];
  
 // let optionList = buildOptionList(elementInfo, eventInfo, action);

  let inputLabels = ['Channel', 'Command', 'Param 1','Param 2'];

  function sendData(){

    //validate_midiabsolute(action.parameters)

    // -1 on channel, beacuse it works 0..15
    const CHANNEL = parseInt(action.parameters.CABLECOMMAND-1).toString(16).padStart(2,'0')[1]; 
    const COMMAND = parseInt(action.parameters.COMMANDCHANNEL).toString(16)[0];
    
    const parameters = [
      {'CABLECOMMAND': `${'0'+COMMAND}` },
      {'COMMANDCHANNEL': `${COMMAND+CHANNEL}` },
      {'PARAM1': parameter_parser(action.parameters.PARAM1)},
      {'PARAM1': parameter_parser(action.parameters.PARAM2)}
    ];

    console.log(parameters);

    let valid = true;
 
    for (const key in validator) {
      if(validator[key] == 'invalid :(' || validator[key] == undefined){
        valid = false
      }
    }
    
    /**
    if(valid){
      dispatch('send', { 
        action: {
          value: action.value, 
          parameters: parameters
        }, 
        index: index 
      });
    }
    */
  }

  let orderChangeTrigger = null;
  onMount(()=>{
    let c = 0;
    actionListChange.subscribe((change)=>{    
      c++;
      if(change !== null && c == 1){
        orderChangeTrigger = true;
      }
      c = 0;
    });

    /**
    const cablecommand = action.parameters.COMMANDCHANNEL % 16;
    const commandchannel = (action.parameters.CABLECOMMAND % 16) * 16;
    action.parameters.COMMANDCHANNEL = commandchannel;
    action.parameters.CABLECOMMAND = cablecommand + 1;
    //validate_midiabsolute(action.parameters)
    */
  })

  afterUpdate(() => {
    if(orderChangeTrigger){
      sendData('orderchange');
    }
  })

  let MIDImode = 'static';

  function setMIDIMode(mode){
    MIDImode = mode;
  }

</script>

<div class="flex flex-col">
  <div class="flex flex-row">
    <tab 
      on:click={()=>{setMIDIMode('static')}} 
      class:bg-secondary={MIDImode == 'static'}
      class:alterbg={MIDImode != 'static'}
      class="text-white cursor-pointer px-2 py-1 rounded-t-lg" >
      Static
    </tab>

    <tab 
      on:click={()=>{setMIDIMode('dynamic')}}
      class:bg-secondary={MIDImode == 'dynamic'}
      class:alterbg={MIDImode != 'dynamic'}
      class="text-white cursor-pointer px-2 py-1 rounded-t-lg" >
      Dynamic
    </tab>
  </div>
  <div class="flex bg-secondary flex-row">
    {#each actionKeys as actionKey, index}
      <div class={'w-1/'+actionKeys.length + ' dropDownInput'}>
        <div class="text-gray-500 uppercase text-sm leading-normal tracking-wide pb-2 pt-4">{inputLabels[index]}</div>
        <DropDownInput/>
        <div class="text-gray-500 pl-2 py-2 text-xs tracking-wide flex-grow-0">
          he
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .dropDownInput{
    padding-right:0.5rem;
  }

  .dropDownInput:first-child{
    padding-left: 0.5rem;
  }

  .dropDownInput:last-child{
    padding-left: 0.0rem;
  }

  .alterbg{
    background-color:rgb(25, 26, 32);
  }
  
</style>