<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'gks',
    name: 'Macro',
    groupType: 'standard',
    desc: 'Macro',
    icon:`
      <svg width="100%" height="100%" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1 0H16C16.5523 0 17 0.447715 17 1V16C17 16.5523 16.5523 17 16 17H1C0.447715 17 0 16.5523 0 16V1C0 0.447715 0.447715 0 1 0ZM14 1H3C2.44772 1 2 1.44772 2 2V13C2 13.5523 2.44772 14 3 14H14C14.5523 14 15 13.5523 15 13V2C15 1.44772 14.5523 1 14 1Z" fill="black"/>
        <path d="M4.5 12C4.22386 12 4 12.2239 4 12.5C4 12.7761 4.22386 13 4.5 13H12.5C12.7761 13 13 12.7761 13 12.5C13 12.2239 12.7761 12 12.5 12H4.5Z" fill="black"/>
        <path d="M4.66667 10.318V8.49984H3L5.5 5.31802L8 8.49984H6.33333V10.318H4.66667Z" fill="black"/>
      </svg>
    `
  }
</script>

<script>

  import { createEventDispatcher, onDestroy,} from 'svelte';

  import { clickOutside } from '../main/_actions/click-outside.action';

  const dispatch = createEventDispatcher();

  //import { check_for_matching_value, parameter_parser } from './action-helper';

  import * as keyMap from '../../external/macro/map.json';

  export let config;
  export let index;
  export let eventInfo;
  export let elementInfo;

  let loaded = false;
  let macroInputField;

  $: if(config.script && !loaded){
    macrosToConfig({script: config.script});
  }

  onDestroy(()=>{
    loaded = false;
  })

  function macrosToConfig({script}){
    let array = [];
    let _keys = [];
    try {
      const text = script.split('gks(')[1].slice(0,-1);
      array = text.split(',');
      defaultDelay = array[0] ? array[0] : defaultDelay;
      array = array.slice(1,);
      if(array[0] != ''){
        for (let i = 0; i < array.length; i+=3) {
          if(array[i] != 15){
            const val = '0x'+Number(array[i+2]).toString(16).padStart(2, '0').toUpperCase();
            let f_key = keyMap.default.find(k => k.value == val && array[i] == k.is_modifier);
            _keys.push({...f_key, type: array[i+1] == 0 ? 'keyup' : array[i+1] == 1 ? 'keydown' : array[i+1] == 2 ? 'keydownup' : undefined})
          } else {
            _keys.push({value: array[i+2], info: "delay", js_value: -1, is_modifier: 15, type: 'delay'})
          }
        }
        keyBuffer = _keys;
        keys = colorize(_keys);
        loaded = true;
      }
    } catch (error) {
      console.warn('gsk can\'t be turned to config', script);
    }    
  }

  function sendData(parameters){
    let script = 'gks(' + defaultDelay + ',' + parameters.join(',') + ')';
    dispatch('output', {short: 'gks', script: script})
  }

  let keys = '';
  let parameters = [];
  let caretKeyBuffer = [];
  let keyBuffer = [];
  let visibleCaretPos = -1;
  let last_key = undefined;

  let borderFocus = false;
  let caretFocus = false;

  let caretPos = -1;

  let selectedKey;
  let addonKeyType = 'keydownup';
  let delayKey = 100; // ms
  let defaultDelay = 25; // ms


  function identifyKey(e){

    // delete on backspace
    if(e.keyCode == 8 && e.type == 'keydown'){

      let tempKeyBuffer = Array.from(keyBuffer);  
      
      if(caretPos !== -1){

        //console.log(tempKeyBuffer, caretPos, caretKeyBuffer.length)
        if(last_key != 8) {
          tempKeyBuffer.splice(caretPos, 0, ...caretKeyBuffer);
          caretPos = caretPos + caretKeyBuffer.length;
          caretKeyBuffer = [];
        }

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
          visibleCaretPos = tempKeyBuffer.length;
        }
      }
      
      keyBuffer = tempKeyBuffer;

      keys = colorize(tempKeyBuffer);

      manageMacro();
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
    
      manageMacro();
    }


    // update last key...
    last_key = e.keyCode;
    
  }

  function addKey(){
    if(caretPos == -1){
      keyBuffer.splice(keyBuffer.length, 0, {...selectedKey, type: addonKeyType});
    } else {
      keyBuffer.splice(caretPos, 0, {...selectedKey, type: addonKeyType});
    }
    keys = colorize(keyBuffer);
    visibleCaretPos += 1;
    caretPos += 1;
    manageMacro();
  }

  function addDelay(){
    if(caretPos == -1){
      keyBuffer.splice(keyBuffer.length, 0, {value: delayKey, info: "delay", js_value: -1, is_modifier: 15, type: 'delay'});
    } else {
      keyBuffer.splice(caretPos, 0, {value: delayKey, info: "delay", js_value: -1, is_modifier: 15, type: 'delay'});
    }
    keys = colorize(keyBuffer);
    visibleCaretPos += 1;
    caretPos += 1;
    manageMacro();
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
    coloredKeys.push(`<div data-caret="0" class="px-1 h-6"></div>`)

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
      else if(arg.type == 'delay'){
        coloredKeys.push(`<div class="text-purple-500 px-2 m-0.5 text-sm bg-primary flex items-center border cursor-default border-purple-500 rounded-md">${arg.info + ': ' + arg.value}</div>` + '  ')
      }

      // add a caret pos after each key
      coloredKeys.push(`<div data-caret="${i+1}" class="px-1 h-6"></div>`)
    })
    
    return coloredKeys;

  }


  function setCaret(e){
    if(e.target.getAttribute('data-caret') !== null){
      //console.log('set caret', +e.target.getAttribute('data-caret'))
      keyBuffer.splice(caretPos, 0, ...caretKeyBuffer);
      caretKeyBuffer = [];
      // this is the caret pos used to add new keys in the array
      caretPos = +e.target.getAttribute('data-caret');
      // this caret for the blinking cursor
      visibleCaretPos = caretPos;
    } else {

      if(caretKeyBuffer.length == 0 && caretFocus == false){
        keys = [`<div data-caret="0" class="px-1 h-6"></div>`];
        visibleCaretPos = 0;
        caretPos = -1;
      }

    }
  }


  function clearMacro(){
    keyBuffer = [];
    caretKeyBuffer = [];
    caretPos = -1;
    visibleCaretPos = 0;
    keys = [`<div data-caret="0" class="px-1 h-6"></div>`];
    manageMacro();
  }


  function manageMacro(){

    parameters = [];

    let tempKeyBuffer = Array.from(keyBuffer);

    //console.log('manage...', keyBuffer, caretPos, caretKeyBuffer )

    if(caretPos != -1){
      tempKeyBuffer.splice(caretPos, 0, ...caretKeyBuffer)
    }

    tempKeyBuffer.forEach((key, i) => {

      let code = [];

      if(key.type !== 'delay'){
        code = [ 
          key.is_modifier ? 1 : 0,
          key.type == 'keydown' ? 1 : key.type == 'keyup' ? 0 : key.type == 'keydownup' ? 2 : undefined,
          parseInt(key.value)
        ]
      } else {
        code = [
          15,
          0,
          key.value
        ]
      }

      parameters.push(code);

    });


    sendData(parameters);

  }

</script>


<div       
    use:clickOutside={{useCapture:true}}
    on:click-outside={(e)=>{
      caretFocus = false;
      visibleCaretPos = -1;
      caretPos = -1;
    }}
    class="flex w-full flex-col items-start p-2">
        <div class="text-gray-500 text-sm py-1 pl-2">Macro Input Field</div>
        <div class="flex w-full p-2">
          <div
            use:clickOutside={{useCapture:true}}
            on:click-outside={(e)=>{
              borderFocus = false;
            }}
            id="idk"  
            bind:this={macroInputField}
            class="{borderFocus ? 'border-select-desaturate-20' : 'border-select'} editableDiv w-full rounded secondary border text-white p-2 flex flex-row flex-wrap focus:outline-none" 
            on:keydown|preventDefault={identifyKey}
            on:keyup|preventDefault={identifyKey}
            contenteditable="true"
            on:click={(e)=>{borderFocus = true; caretFocus = true; setCaret(e); }}>
            {#each keys as key, i}
              <div data-index={i} class:blink={(visibleCaretPos * 2) === i} class="{(i + i%2 ) == i ? 'hover:bg-pick-complementer cursor-pointer' : 'cursor-default' } ">{@html key}</div>
            {/each}
          </div>
        </div>
        <div class="flex flex-col w-full items-start p-2">

          <div class="text-gray-500 text-sm pb-1">Add Key</div>

          <div class="flex w-full items-start justify-between">

            <div class="flex flex-col">
              <select bind:value={selectedKey} class="bg-secondary flex flex-grow text-white p-1 focus:outline-none border-select">
                {#each keyMap.default as key}
                  <option value={key} class="text-white bg-secondary py-1 ">{key.info}</option>
                {/each}
              </select>
              <div class="flex mt-1">
                <div on:click={()=>{addonKeyType = 'keyup'}} class="{addonKeyType == 'keyup' ? 'border-yellow-500 text-yellow-500' : 'text-select-desaturate-20 border-select-desaturate-20'} px-2 m-0.5 text-sm bg-primary flex items-center border cursor-default rounded-md">keyup</div>
                <div on:click={()=>{addonKeyType = 'keydown'}} class="{addonKeyType == 'keydown' ? 'border-red-500 text-red-500' : 'text-select-desaturate-20 border-select-desaturate-20'} px-2 m-0.5 text-sm bg-primary flex items-center border cursor-default rounded-md">keydown</div>
                <div on:click={()=>{addonKeyType = 'keydownup'}} class="{addonKeyType == 'keydownup' ? 'border-green-500 text-green-500' : 'text-select-desaturate-20 border-select-desaturate-20'} px-2 m-0.5 text-sm bg-primary flex items-center border cursor-default rounded-md">keydownup</div>
              </div>
            </div>

            <button on:click={addKey} class="flex items-center justify-center rounded border-2 border-commit bg-commit hover:bg-commit-saturate-20 text-white px-2">Add Key</button>
          
          </div>

        </div>

        <div class="flex flex-col w-full items-start p-2">
          <div class="text-gray-500 text-sm pb-1">Delay Key</div>
          <div class="flex items-start justify-between w-full">
            <input bind:value={delayKey} type="number" min="5" max="4000" class="bg-secondary flex flex-grow text-white py-1 px-2 focus:outline-none border-select">
            <button on:click={addDelay} class="flex items-center justify-center rounded ml-2 border-2 border-commit bg-commit hover:bg-commit-saturate-20 text-white px-2">Add Delay</button>
          </div>
        </div>

        <div class="flex w-full flex-col p-2">
          <div class="text-gray-500 text-sm pb-1">Default Delay</div>
          <input bind:value={defaultDelay} on:input={(e)=>{manageMacro()}} type="number" min="5" max="4000" class="bg-secondary w-full flex flex-grow text-white px-2 py-1 focus:outline-none border-select">
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