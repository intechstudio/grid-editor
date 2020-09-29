<script>
  import { onMount } from 'svelte';

  import { GRID_PROTOCOL } from '../../serialport/GridProtocol.js';

  import { serialComm } from '../../serialport/serialport.store';

  import { configStore } from '../../stores/config.store';

  import ColorPicker from '../ColorPicker.svelte';

  import DropDownInput from '../DropDownInput.svelte';

  export let data;
  export let orderNumber;
  export let selectedElementSettings;
  export let moduleInfo;
  export let eventInfo;

  let validator = [];

  function sendData(){

    data.parameters[1] = layers;

    validate_setledphase(data.parameters);
    
    let parameterArray = [];
    for (let i = 0; i < data.parameters[1].length; i++) {
      let param_0;
      let param_2;
      if(data.parameters[0] != 'A0' && data.parameters[0] != 'A1'){ param_0 = Number(data.parameters[0]) } else { param_0 = data.parameters[0]}
      if(data.parameters[2] != 'A3' && data.parameters[2] != 'A7'){ param_2 = Number(data.parameters[2]) } else { param_2 = data.parameters[2]}
      const parameters = [
        { 'NUM': param_0 },
        { 'LAY': data.parameters[1][i] },
        { 'PHA': param_2 },
      ];
      parameterArray.push(parameters);
    }


    let serialized = [];
    parameterArray.forEach(p => {
      if(p.valid){
        serialized.push(...GRID_PROTOCOL.configure("LEDPHASE", p.parameters));
      }
    });

    if(serialized.length !== 0){
      configStore.save(orderNumber, moduleInfo, eventInfo, selectedElementSettings, serialized);
    }
  }

  function checkForMatchingValue(parameter, index) {
    let defined = optionList[index].find(item => item.value === parameter);
    defined ? defined = defined.info : null;
    return defined;
  }

  function validate_setledphase(parameters){

    parameters.forEach((parameter, index) => {

      let type = '';
      let defined = '';
      let humanReadable = '';

      if(index == 0){
        if(parameter == 'A0' || parameter == 'A1'){ 
          type = 'tmp param';
          defined = checkForMatchingValue(parameter, index);  
        } else if(+parameter >= 0 && +parameter <= 15){
          type = 'dec';
        } else {
          // wildcard
          defined = 'invalid :('
        }
      } else if(index == 1){
        if(parameter.length > 0 || parameter[0] == ''){ 
          defined = 'Layer';
        } else {
          defined = 'invalid :(';
        }
      } else if(index == 2){
        if(parameter == 'A3' || parameter == 'A7'){ 
          type = 'tmp param';
          defined = checkForMatchingValue(parameter, index);  
        } else if(parseInt(parameter) >= 0 && parseInt(parameter) <= 255){
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

      validator[index] = humanReadable;

    })

    
  }

  let layers = data.parameters[1];

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
      optionList = options;
    }
  }

  let optionList = [];

  onMount(()=>{
    SETLEDPHASE.optionList();
  })

</script>

<div class="flex flex-col w-full">
  <div class="flex w-full text-white">
    <div class=" w-1/3">
      <div class="text-gray-700 text-xs">Element</div>
      <DropDownInput optionList={optionList[0]} on:change={()=>{sendData(data.parameters[0], 0)}} bind:dropDownValue={data.parameters[0]}/>
      <div class="text-white pl-2 flex-grow-0">
        {validator[0] ? validator[0] : ''}
      </div>
    </div>
    <div class="w-1/3">
      <div class="text-gray-700 text-xs">Layer</div>
      <div class="flex justify-around my-1">
        <div class="mx-1 flex ">
          <div class="text-white mr-1">A</div>
          <input bind:group={layers} value={1} on:change={()=>{sendData(layers, 1)}} type="checkbox" class="h-6 w-6">
        </div>
        <div class="mx-1 flex ">
          <div class="text-white pr-1">B</div>
          <input bind:group={layers} value={2} on:change={()=>{sendData(layers, 1)}} type="checkbox" class="h-6 w-6">
        </div>
      </div>
    </div>

    <div class="flex w-1/3">
      <div class="px-1">
        <div class="text-gray-700 text-xs">Intensity</div>
        <DropDownInput optionList={optionList[2]} on:change={()=>{sendData(data.parameters[2], 2)}} bind:dropDownValue={data.parameters[2]}/>
        <div class="text-white pl-2 flex-grow-0">
          {validator[2] ? validator[2] : ''}
        </div>
      </div>
    </div>
  </div>

</div>