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



  export let action;
  export let index;
  export let eventInfo;
  export let elementInfo;

  let validator = [];
  let macroInputField;

  function sendData(){
    /**    dispatch('send', { 
      action: {
        value: action.value, 
        parameters: parameters
      }, 
      index: index 
    });
    */

  }

  let orderChangeTrigger = null;
  onMount(()=>{
    let c = 0;

    //loadMacros();
  })

  afterUpdate(() => {
    if(orderChangeTrigger){
      manageMacro();
    }
  })

  let keys = '';
  let parameters = [];

  let keydownBuffer = [];

  let caretKeyBuffer = [];
  let keyBuffer = [];

  let keyMerge = [];
  let normalKeys = [];

  let caretArray = [];

  function putKeyInArray(){

  }

  function identifyKey(e){

    /**
    if(!e.repeat && e.type == 'keydown'){
      if(keydownBuffer.length > 0){
        caretPos += 1;
      }
    }
*/

    // filter same keypress type
    if(!e.repeat){
      if(e.keyCode == 8 && e.type == 'keydown'){
        keys.splice(-2,2); 
        keyBuffer.splice(-2,2);
      } else {     
        if(caretPos){    
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
        tempKeyBuffer.splice(caretPos, 0, ...caretKeyBuffer);
        keys = colorize(tempKeyBuffer)
      }
    }

    /**
    if(!e.repeat && e.type == 'keyup'){
      if(keydownBuffer.length > 1){
        caretPos += 1;
      }
    }
*/
    //manageMacro();
    
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

    console.log(cuts, args )

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
    args.forEach((arg,i) => {
      if(arg.type == 'keydownup'){
        coloredKeys.push(`<div class="text-green-500 px-2 mx-1 bg-primary flex items-center border cursor-default border-green-500 rounded-md">${arg.info}</div>`)
      }
      else if(arg.type == 'keydown'){
        coloredKeys.push(`<div class="text-red-500 px-2 mx-1 bg-primary flex items-center border cursor-default border-red-500 rounded-md">${arg.info} <span style="transform:rotate(180deg)" class="h-4 w-4 ml-1">${svg}</span></div>` + '  ')
      }
      else if(arg.type == 'keyup'){
        coloredKeys.push(`<div class="text-yellow-500 px-2 mx-1 bg-primary flex items-center border cursor-default border-yellow-500  rounded-md">${arg.info} <span class="h-4 w-4 ml-1">${svg}</span></div>` + '  ')
      }
      coloredKeys.push(`<div data-caret="${i}" class="p-1 h-6 hover:bg-highlight"></div>`)
    })
    
    return coloredKeys;

  }

  let caretPos = 0;
  function setCaret(e){
    if(e.target.getAttribute('data-caret') !== null){
      keyBuffer.splice(caretPos, 0, ...caretKeyBuffer);
      caretKeyBuffer = [];
      
      caretPos = +e.target.getAttribute('data-caret')+1;
    } else {
      caretPos = undefined;
    }
  }
  
  function caretToEnd(el){
    el.focus();
    if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
    
    
    /**
    let div = macroInputField;
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(div);
    range.collapse(false);
    console.log(sel)
    sel.removeAllRanges();
    sel.addRange(range);
    div.focus();
    range.detach(); // optimization

    div.scrollTop = div.scrollHeight;
    */
  }

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

</script>


<div class="flex w-full flex-col">
  <div class="w-full flex flex-row items-end">
    <div class="w-full pr-2">
      <div class="text-gray-700 text-xs">Key Type</div>
      <div
        id="idk"
        bind:this={macroInputField}
        class="editableDiv w-full secondary text-white p-2 pl-2 flex flex-row rounded-none focus:outline-none" 
        on:keydown|preventDefault={identifyKey}
        on:keyup|preventDefault={identifyKey}
        contenteditable="true"
        on:click={setCaret}>
        {#each keys as key, i (i)}
          <div data-index={i} class:blink={(caretPos+caretPos-1) == i}>{@html key}</div>
        {/each}
      </div>
    </div>
    <button on:click={caretToEnd}>caret</button>
    <button on:click={clearMacro} class="bg-secondary hover:bg-highlight-400 text-white px-2 py-1 cursor-pointer border-none rounded focus:outline-none mr-2" >Clear</button>
  </div>
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