<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'gsk',
    groupType: 'standard',
    desc: 'Macro',
    icon:`
      <svg width="100%" height="100%"" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1 0H16C16.5523 0 17 0.447715 17 1V16C17 16.5523 16.5523 17 16 17H1C0.447715 17 0 16.5523 0 16V1C0 0.447715 0.447715 0 1 0ZM14 1H3C2.44772 1 2 1.44772 2 2V13C2 13.5523 2.44772 14 3 14H14C14.5523 14 15 13.5523 15 13V2C15 1.44772 14.5523 1 14 1Z" fill="black"/>
        <path d="M4.5 12C4.22386 12 4 12.2239 4 12.5C4 12.7761 4.22386 13 4.5 13H12.5C12.7761 13 13 12.7761 13 12.5C13 12.2239 12.7761 12 12.5 12H4.5Z" fill="black"/>
        <path d="M4.66667 10.318V8.49984H3L5.5 5.31802L8 8.49984H6.33333V10.318H4.66667Z" fill="black"/>
      </svg>
    `
  }
</script>

<script>

  import {afterUpdate, beforeUpdate, createEventDispatcher, onMount} from 'svelte';

  import { slide } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  const dispatch = createEventDispatcher();

  //import { check_for_matching_value, parameter_parser } from './action-helper';

  import * as keyMap from '../../external/macro/map.json';

  console.log(keyMap);

  $: console.log(keyBuffer, caretKeyBuffer);

  export let action;
  export let index;
  export let eventInfo;
  export let elementInfo;

  let validator = [];
  let macroInputField;

  function sendData(){

  }

  let orderChangeTrigger = null;
  onMount(()=>{
    let c = 0;

    //loadMacros();
  })

  afterUpdate(() => {
  
  })

  let keys = '';
  let parameters = [];

  let keydownBuffer = [];

  let caretKeyBuffer = [];
  let keyBuffer = [];

  let keyMerge = [];
  let normalKeys = [];

  let caretArray = [];

  let visibleCaretPos = 0;

  let last_key = undefined;

  function identifyKey(e){

    // if(last_key == 8 && e.keyCode !== 8) caretPos = -1;

    // delete on backspace
    if(e.keyCode == 8 && e.type == 'keydown'){

      let tempKeyBuffer = Array.from(keyBuffer);  

      console.log('CARETKEYBUFFER: ', caretKeyBuffer, 'KEYBUFFER: ', keyBuffer)

      /**
       * if there is caretbuffer array after delete, then we must delete elements from there first and merge with keybuffer accordingly
       * pay extra attention to -1 (caret is on the end) and 0 as its the beginning....
      */
      
      if(caretPos !== -1){

        //console.log(tempKeyBuffer, caretPos, caretKeyBuffer.length)
        if(last_key != 8) {
          tempKeyBuffer.splice(caretPos, 0, ...caretKeyBuffer);
          caretPos = caretPos + caretKeyBuffer.length;
        }

        //console.log('new caretPos',caretPos);

        if(caretPos !== 0){
          tempKeyBuffer.splice(caretPos - 1, 1);
        }

        if(caretPos != 0){
          caretPos -= 1;
          visibleCaretPos = caretPos;
        }

      } else {
        if(caretPos != 0){
          tempKeyBuffer.splice(tempKeyBuffer.length - 1, 1);
        }
      }
      
      keyBuffer = tempKeyBuffer;

      keys = colorize(tempKeyBuffer);
    }

    // filter same keypress type
    if(!e.repeat && e.keyCode != 8){
      if(caretPos !== -1){    
        let key = keyMap.default.find(key => key.js_value == e.keyCode);  
        const f_key = [...caretKeyBuffer].reverse().find(key => key.js_value == e.keyCode);    
        if(!f_key){
          caretKeyBuffer.push({...key, type: e.type});         
        } else if(f_key.type !== e.type) {        
          caretKeyBuffer.push({...key, type: e.type});
        } 
        caretKeyBuffer = cutQuickDownUp(caretKeyBuffer);  
      } else {
        let key = keyMap.default.find(key => key.js_value == e.keyCode);  
        const f_key = [...keyBuffer].reverse().find(key => key.js_value == e.keyCode);    
        if(!f_key){
          keyBuffer.push({...key, type: e.type});         
        } else if(f_key.type !== e.type) {        
          keyBuffer.push({...key, type: e.type});
        }  
        keyBuffer = cutQuickDownUp(keyBuffer)
      }

      // deep copy to create the needed keys from caret and standard array
      let tempKeyBuffer = Array.from(keyBuffer);  
      
      if(caretKeyBuffer.length > 0){
        // merge caretbuffer with keybuffer
        tempKeyBuffer.splice(caretPos, 0, ...caretKeyBuffer);
        // set visible caret when we write between keys
        visibleCaretPos = caretPos + caretKeyBuffer.length;
      } else {
        // visible caret when we append to the end of keys
        visibleCaretPos = tempKeyBuffer.length;
      }
      
      keys = colorize(tempKeyBuffer);

      //console.log(tempKeyBuffer, 'vis caret', visibleCaretPos,  'caret: ', caretPos);
     

    }

    // update last key...
    last_key = e.keyCode;
    
  }

  function addKey(){
    keyBuffer.splice(caretPos, 0, {...selectedKey, type: 'keydownup'});
    console.log('addkey...',caretPos, keyBuffer, selectedKey)
    keys = colorize(keyBuffer);
  }

  function cutQuickDownUp(args){
    // identify if the following element is a pair key, set type and cut point accordingly
    let cuts = [];
    args.forEach((arg,i) => {
      //console.log(arg);
      if(args[i+1]){
        if(arg.info == args[i+1].info && arg.type == 'keydown' && args[i+1].type == 'keyup'){
          arg.type='keydownup';
          cuts.push(i+1);
    }}});

    // make the cuts, remove double elements from keydown-keyup pairs (remove the second, first contains 'keydownup' type for color)
    cuts.forEach(cut => {
      args.splice(cut,1);
    });

    //console.log(cuts, args )

    return args;
  }

  function colorize(args){

    let svg = `
              <svg viewBox="0 0 95 95" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M48.5 0L8 32.5L8 52.5L48.5 20L48.5 0Z" fill="#C4C4C4"/>
                <path d="M48 0L88.5 32.5L88.5 52.5L48 20L48 0Z" fill="#C4C4C4"/>
                <rect x="40" y="14" width="16" height="81" fill="#C4C4C4"/>
              </svg>
              `

    // down = red
    // up = yellow
    // down-up = green

    let coloredKeys = [];

    // set a caret 0
    coloredKeys.push(`<div data-caret="0" class="px-0.5 py-1 h-6 mx-0.5 hover:bg-pick-complementer"></div>`)

    args.forEach((arg,i) => {

      if(arg.type == 'keydownup'){
        coloredKeys.push(`<div class="text-green-500 px-2 m-0.5 text-sm bg-primary flex items-center border cursor-default border-green-500 rounded-md">${arg.info}</div>`)
      }
      else if(arg.type == 'keydown'){
        coloredKeys.push(`<div class="text-red-500 px-2 m-0.5 text-sm bg-primary flex items-center border cursor-default border-red-500 rounded-md">${arg.info} <span style="transform:rotate(180deg)" class="h-4 w-4 ml-1">${svg}</span></div>` + '  ')
      }
      else if(arg.type == 'keyup'){
        coloredKeys.push(`<div class="text-yellow-500 px-2 m-0.5 text-sm bg-primary flex items-center border cursor-default border-yellow-500  rounded-md">${arg.info} <span class="h-4 w-4 ml-1">${svg}</span></div>` + '  ')
      }

      // add a caret pos after each key
      coloredKeys.push(`<div data-caret="${i+1}" class="px-0.5 py-1 h-6 mx-0.5 hover:bg-pick-complementer"></div>`)
    })
    
    return coloredKeys;

  }

  let caretPos = -1;

  function setCaret(e){
    if(e.target.getAttribute('data-caret') !== null){
      keyBuffer.splice(caretPos, 0, ...caretKeyBuffer);
      caretKeyBuffer = [];
      // this is the caret pos used to add new keys in the array
      caretPos = +e.target.getAttribute('data-caret');
      // this caret for the blinking cursor
      visibleCaretPos = caretPos;

      console.log('set caret...',caretPos)

    } else {
      
      if(focus == false){
        keys = [`<div data-caret="0" class="px-0.5 py-1 h-6 mx-0.5 hover:bg-pick-complementer"></div>`];
        visibleCaretPos = 0;
        caretPos = -1;
      }

    }
  }

  let focus = false;

  function clearMacro(){
    keyBuffer = [];
    caretKeyBuffer = [];
    caretPos = undefined;
    keys = ''
    manageMacro();
  }

  function loadMacros(){

    // parseInt('0xff')

    macro = [];
    keys = '';

    for (const objKey in action.parameters) {
      if(objKey.startsWith('KEYCODE')){
        let found = keyMap.default.find(key => parseInt(key.value) == action.parameters[objKey] && key.is_modifier == action.parameters['KEYISMODIFIER'+objKey.slice(-1)]);
        if(found) {
          macro.push(found);
        }
      }
    }

    macro.forEach(key => 
      keys += key.info + '  '
    )

  }

  function manageMacro(){
    parameters = [];

    for (let i = 0; i < 6; i++) {
      
      const key = keyBuffer[i];

      const keyIsModifier = 'KEYISMODIFIER' + (i);
      const keyCode = 'KEYCODE' + (i);

      let obj = {};

      if(key){
        let modifier = 0;
        key.is_modifier ?  modifier = 1 : modifier = 0 ;

        obj[keyIsModifier] = parameter_parser(modifier);
        obj[keyCode] = parameter_parser(key.value)

        parameters.push(obj);
      } else {
        obj[keyIsModifier] = parameter_parser(0);
        obj[keyCode] = parameter_parser(255);
        parameters.push(obj);
      }
    }

    sendData();

  }

  let selectedKey;

</script>


<div class="flex w-full flex-col items-start p-2">
  <div class="text-gray-500 text-sm pb-1">Macro</div>
  <div class="flex w-full p-2">
    <div
      id="idk"  
      bind:this={macroInputField}
      class="{focus ? 'border-select-desaturate-20' : 'border-select'} editableDiv w-full rounded secondary border text-white p-2 flex flex-row flex-wrap focus:outline-none" 
      on:keydown|preventDefault={identifyKey}
      on:keyup|preventDefault={identifyKey}
      contenteditable="true"
      on:click={(e)=>{setCaret(e); focus = true;}}>
      {#each keys as key, i}
        <div data-index={i} class:blink={(visibleCaretPos * 2) === i}>{@html key}</div>
      {/each}
    </div>
  </div>
  <div class="flex w-full items-center justify-between p-2">
    <select bind:value={selectedKey} class="bg-secondary flex flex-grow text-white p-2 focus:outline-none border-select">
      {#each keyMap.default as key}
        <option value={key} class="text-white bg-secondary py-1 ">{key.info}</option>
      {/each}
    </select>
    <button on:click={addKey} class="flex items-center justify-center rounded my-2 ml-2 border-2 border-commit bg-commit hover:bg-commit-saturate-20 text-white px-2 py-0.5">Add</button>
  </div>
  <button on:click={clearMacro} class="flex items-center justify-center rounded m-2 border-select bg-select border-2 hover:bg-red-500 text-white px-2 py-0.5">Clear All</button>

</div>

<style>

  .editableDiv div:last-child {
    margin-right: 0;
  }

  .editableDiv div:first-child {
    margin-left: 0;
  }

  .editableDiv{
    caret-color: transparent;
  }

  @keyframes blink {
    50% {
      opacity: 0.0;
    }
  }

  @-webkit-keyframes blink {
    50% {
      opacity: 0.0;
    }
  }

  .blink {
    background-color: white;
    animation: blink 1s step-start 0s infinite;
    -webkit-animation: blink 1s step-start 0s infinite;
  }

</style>