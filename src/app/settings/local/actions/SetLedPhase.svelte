<script>
  import { onMount, createEventDispatcher, afterUpdate } from 'svelte';

  const dispatch = createEventDispatcher();

  import { actionListChange } from '../action-list-change.store.js';

  import DropDownInput from '../../ui/components/DropDownInput.svelte';

  import { check_for_matching_value, parameter_parser } from './action-helper';


  export let action;
  export let index;
  export let eventInfo;

  let validator = [];

  let optionList = [];

  $: {
    optionList = SETLEDPHASE.optionList();
  }

  let orderChangeTrigger = null;
  onMount(()=>{
    let c = 0;
    actionListChange.subscribe((change)=>{
      c++;
      console.log( action.name, 'order change subscription', index);
      if(change !== null && c == 1){
        orderChangeTrigger = true;
      }
      c = 0;
    });
  })

  afterUpdate(() => {
    if(orderChangeTrigger){
      sendData();
    }
  })
  
  function sendData(){

    validate_setledphase(action.parameters);

    let param_0;
    let param_2;
    if(action.parameters.NUM != 'A0' && action.parameters.NUM != 'A1'){ param_0 = Number(action.parameters.NUM) } else { param_0 = action.parameters.NUM}
    if(action.parameters.PHA != 'A3' && action.parameters.PHA != 'A7'){ param_2 = Number(action.parameters.PHA) } else { param_2 = action.parameters.PHA}
    const parameters = [
      { 'NUM': parameter_parser(param_0) },
      { 'LAY': action.parameters.LAY },
      { 'PHA': parameter_parser(param_2) },
    ];

    let valid = true;
 
    for (const key in validator) {
      if(validator[key] == 'invalid :(' || validator[key] == undefined){
        valid = false
      }
    }

    if(valid){    
      dispatch('send',{
        action: {
          value: action.value, 
          parameters: parameters
        }, 
        index: index 
      });
    }

    dispatch('send',{});
  }


  function validate_setledphase(PARAMETERS){

    for (const KEY in PARAMETERS) {
      let type = '';
      let defined = '';
      let humanReadable = '';
      if (PARAMETERS.hasOwnProperty(KEY)) {
        const VALUE = PARAMETERS[KEY];

        if(KEY == 'NUM'){
          if(VALUE == 'A0' || VALUE == 'A1'){ 
            type = 'tmp param';
            defined = check_for_matching_value(optionList, VALUE, 0);  
          } else if(+VALUE >= 0 && +VALUE <= 15){
            type = 'dec';
          } else {
            // wildcard
            defined = 'invalid :('
          }
        } 
        else if(KEY == 'LAY'){
          if(VALUE.length > 0 || VALUE[0] == ''){ 
            defined = 'Layer';
          } else {
            defined = 'invalid :(';
          }
        } 
        else if(KEY == 'PHA'){
          if(VALUE == 'A3' || VALUE == 'A7'){ 
            type = 'tmp param';
            defined = check_for_matching_value(optionList, VALUE, 2);  
          } else if(parseInt(VALUE) >= 0 && parseInt(VALUE) <= 255){
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

        validator[KEY] = humanReadable;

      }
    }
    
  }

  const SETLEDPHASE = {
    analog: [
      [
        {value: 'A0', info: 'This LED.'}, 
        {value: 'A1', info: 'Reversed LED.'}, 
      ],
      [
        ''
      ],
      [
        {value: 'A3', info: 'AV8 8-bit'}, 
      ]
    ],
    digital: [
      [
        {value: 'A0', info: 'This LED.'}, 
        {value: 'A1', info: 'Reversed LED.'}, 
      ],
      [
        ''
      ],
      [
        {value: 'A7', info: 'DV8 8-bit'}, 
      ]
    ],

    optionList: function() {
      let options = [];
      if(eventInfo.code[0] == 'A'){
        options = this.analog;
      }else{ // this is also the default;
        options = this.digital;
      }
      return options;
    }
  }

</script>

<div class="flex flex-col w-full">
  <div class="flex w-full text-white">
    <div class=" w-1/3">
      <div class="text-gray-700 text-xs">Element</div>
      <DropDownInput optionList={optionList[0]} on:change={()=>{sendData()}} bind:dropDownValue={action.parameters.NUM}/>
      <div class="text-white pl-2 flex-grow-0">
        {validator.NUM ? validator.NUM : ''}
      </div>
    </div>

    <div class=" w-1/3">
      <div class="text-gray-700 text-xs">Layer</div>
      <DropDownInput optionList={optionList[1]} on:change={()=>{sendData()}} bind:dropDownValue={action.parameters.LAY}/>
      <div class="text-white pl-2 flex-grow-0">
        {validator.LAY ? validator.LAY : ''}
      </div>
    </div>

    <div class="flex w-1/3">
      <div class="px-1">
        <div class="text-gray-700 text-xs">Intensity</div>
        <DropDownInput optionList={optionList[2]} on:change={()=>{sendData()}} bind:dropDownValue={action.parameters.PHA}/>
        <div class="text-white pl-2 flex-grow-0">
          {validator.PHA ? validator.PHA : ''}
        </div>
      </div>
    </div>
  </div>

</div>