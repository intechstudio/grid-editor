<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'glc',
    name: 'LedColor',
    category: 'led',
    rendering: 'standard',
    color: '#726E60',
    desc: 'Color',
    defaultLua: 'glc(,,,,)',
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 404 404" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M0 202C0 90.4501 90.4501 0 202 0C312.408 0 404 79.7737 404 180.666C404 245.069 351.736 297.333 287.333 297.333H249.68C237.496 297.333 227.68 307.149 227.68 319.333C227.68 325.01 229.708 330 233.104 333.86C239.962 341.32 244 351.165 244 362C244 385.23 225.23 404 202 404C90.4501 404 0 313.55 0 202ZM202 20C101.496 20 20 101.496 20 202C20 302.504 101.496 384 202 384C214.184 384 224 374.184 224 362C224 356.238 221.884 351.185 218.338 347.349L218.267 347.273L218.198 347.195C211.603 339.757 207.68 330.052 207.68 319.333C207.68 296.103 226.45 277.333 249.68 277.333H287.333C340.69 277.333 384 234.023 384 180.666C384 92.9723 303.646 20 202 20ZM148.667 62.667C136.483 62.667 126.667 72.4828 126.667 84.667C126.667 96.8512 136.483 106.667 148.667 106.667C160.85 106.667 170.667 96.851 170.667 84.667C170.667 72.4828 160.851 62.667 148.667 62.667ZM106.667 84.667C106.667 61.4371 125.437 42.667 148.667 42.667C171.897 42.667 190.667 61.4372 190.667 84.667C190.667 107.897 171.896 126.667 148.667 126.667C125.437 126.667 106.667 107.897 106.667 84.667ZM255.333 62.667C243.149 62.667 233.333 72.4828 233.333 84.667C233.333 96.8512 243.149 106.667 255.333 106.667C267.517 106.667 277.333 96.8512 277.333 84.667C277.333 72.4829 267.517 62.667 255.333 62.667ZM213.333 84.667C213.333 61.4372 232.103 42.667 255.333 42.667C278.563 42.667 297.333 61.4371 297.333 84.667C297.333 107.897 278.563 126.667 255.333 126.667C232.103 126.667 213.333 107.897 213.333 84.667ZM84.667 148C72.4828 148 62.667 157.816 62.667 170C62.667 182.184 72.4828 192 84.667 192C96.8504 192 106.667 182.184 106.667 170C106.667 157.816 96.8512 148 84.667 148ZM42.667 170C42.667 146.77 61.4372 128 84.667 128C107.897 128 126.667 146.77 126.667 170C126.667 193.23 107.896 212 84.667 212C61.4372 212 42.667 193.23 42.667 170ZM319.333 148C307.149 148 297.333 157.816 297.333 170C297.333 182.184 307.149 192 319.333 192C331.517 192 341.333 182.184 341.333 170C341.333 157.816 331.517 148 319.333 148ZM277.333 170C277.333 146.77 296.103 128 319.333 128C342.563 128 361.333 146.77 361.333 170C361.333 193.23 342.563 212 319.333 212C296.103 212 277.333 193.23 277.333 170Z" fill="black"/>
    </svg>`
  }
</script>

<script>

/*

@startuml
A -> B : AB-First step 
B -> C : BC-Second step hi   
D -> E : DE-Third step test
@enduml


@startuml
A -> B : AB-First step 

@enduml


*/


  import {onMount, createEventDispatcher, onDestroy} from 'svelte';
  import AtomicInput from '../main/user-interface/AtomicInput.svelte';
  import AtomicSuggestions from '../main/user-interface/AtomicSuggestions.svelte';
  import Toggle from '../main/user-interface/Toggle.svelte';


  import SendFeedback from "../main/user-interface/SendFeedback.svelte"
  
  import validate from './_validators';

  import _utils from '../runtime/_utils.js';
  import { localDefinitions } from '../runtime/runtime.store';

  export let config;
  export let inputSet;
  export let blockAddedOnClick;
  export let index;

  let loaded = false;

  const dispatch = createEventDispatcher();

  const parameterNames = ['LED Number', 'Layer', 'Red', 'Green', 'Blue'];

  let scriptSegments = [];

  let beautyMode = 0;

  let beautify = 1;

  // config.script cannot be undefined
  $: if(config.script && !loaded){

    const _segments = _utils.scriptToSegments({human: config.human, short: config.short, script: config.script});

    // handle legacy and new beautify command
    if(_segments.length == 6){
      beautify = +_segments[5] == 1 ? 0 : 1; // check on number instead of string!
      scriptSegments = _segments.slice(0,-1);
    } else {
      scriptSegments = _segments;
      beautify = 1;
    }

    loaded = true;
  };  

  let sidebarWidth;

  $: updatePicker(sidebarWidth)

  onDestroy(()=>{
    loaded = false;
  })

  
  function changeBeautify(){
    beautyMode = beautify ? 0 : 1;
    sendData();
  }


  function sendData(e, index){
  
    scriptSegments[index] = e;

    const _temp_segments = [...scriptSegments, beautyMode]

    const script = _utils.segmentsToScript({human: config.human, short: config.short, array: _temp_segments}); 

    dispatch('output', {short: config.short, script: script})
    
  }

  const _suggestions = [
    [
      //{value: 'this.ind()', info: 'this led'},
    ],
    [
      {value: '1', info: 'layer 1'},
      {value: '2', info: 'layer 2'}
    ],
    [
      //{value: '255', info: '255'}
    ],
    [
      //{value: '255', info: '255'}
    ],
    [
      //{value: '255', info: '255'}
    ]
  ];

  let suggestions = [];

  $: if($localDefinitions){
    suggestions = _suggestions.map((s,i) => {
      // SKIP LAYER
      if(i != 1){
        return [...$localDefinitions, ...s]
      } else {
        return [ ...s, ...$localDefinitions]
      }
    });
    suggestions = suggestions;
  }


  onMount(()=>{
    suggestions = _suggestions;
    initColorPicker()

    updatePicker()

  })

  let suggestionPlaceMove = false

  let showSuggestions = false;
  let focusedInput = undefined;
  let focusGroup = [];

  function onActiveFocus(event,index){


    if (index<2){
      suggestionPlaceMove = true; 
    }
    else{

      suggestionPlaceMove = false; 
    }
    
    focusGroup[index] = event.detail.focus;
    focusedInput = index;
  }

  function onLooseFocus(event,index){


    focusGroup[index] = event.detail.focus;
    showSuggestions = focusGroup.includes(true);
  }

  


  /* accepts parameters
  * h  Object = {h:x, s:y, v:z}
  * OR 
  * h, s, v
  */
  function HSVtoRGB(h, s, v) {
      var r, g, b, i, f, p, q, t;
      if (arguments.length === 1) {
          s = h.s, v = h.v, h = h.h;
      }
      i = Math.floor(h * 6);
      f = h * 6 - i;
      p = v * (1 - s);
      q = v * (1 - f * s);
      t = v * (1 - (1 - f) * s);
      switch (i % 6) {
          case 0: r = v, g = t, b = p; break;
          case 1: r = q, g = v, b = p; break;
          case 2: r = p, g = v, b = t; break;
          case 3: r = p, g = q, b = v; break;
          case 4: r = t, g = p, b = v; break;
          case 5: r = v, g = p, b = q; break;
      }
      return {
          r: Math.round(r * 255),
          g: Math.round(g * 255),
          b: Math.round(b * 255)
      };
  }


  /* accepts parameters
  * r  Object = {r:x, g:y, b:z}
  * OR 
  * r, g, b
  */
  function RGBtoHSV(r, g, b) {
      if (arguments.length === 1) {
          g = r.g, b = r.b, r = r.r;
      }
      var max = Math.max(r, g, b), min = Math.min(r, g, b),
          d = max - min,
          h,
          s = (max === 0 ? 0 : d / max),
          v = max / 255;

      switch (max) {
          case min: h = 0; break;
          case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
          case g: h = (b - r) + d * 2; h /= 6 * d; break;
          case b: h = (r - g) + d * 4; h /= 6 * d; break;
      }

      return {
          h: h,
          s: s,
          v: v
      };
  }

  let canvas, picker, preview;
  let hue = 0;
  let sat = 0;

  let red = 0
  let gre = 0
  let blu = 0

  function updatePicker(e){

    if (canvas === undefined){
      return; // not initialized yet
    }

    if (isNaN(parseInt(scriptSegments[2])) || isNaN(parseInt(scriptSegments[3]))  || isNaN(parseInt(scriptSegments[4])) ){

      red=255;
      gre=255;
      blu=255;

      picker.style.left = -20 + "px"
      picker.style.top = -20 + "px"


    }
    else{

      // all color components are numbers so we can use the colorpicker

      let hsv = RGBtoHSV(parseInt(scriptSegments[2]), parseInt(scriptSegments[3]), parseInt(scriptSegments[4]))

      var offsets = canvas.getBoundingClientRect();
      var top = offsets.top;
      var left = offsets.left;
      var width = offsets.width;
      var height = offsets.height;

      let x = hsv.h*width;
      let y = (1-hsv.s)*height;

      if (x<0) x=0;
      if (y<0) y=0;
      if (x>width) x=width;
      if (y>height) y=height;

      hue = hsv.h*360
      sat = hsv.s*100

      picker.style.left = x- 3 + "px"
      picker.style.top = y - 6 + "px"

      let color = HSVtoRGB(hue/360, sat/100, 1)
      red = color.r
      gre = color.g
      blu = color.b
    }

  }

  function initColorPicker(){

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(0,0,150,75);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var hGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    hGrad.addColorStop(0 / 6, '#F00');
    hGrad.addColorStop(1 / 6, '#FF0');
    hGrad.addColorStop(2 / 6, '#0F0');
    hGrad.addColorStop(3 / 6, '#0FF');
    hGrad.addColorStop(4 / 6, '#00F');
    hGrad.addColorStop(5 / 6, '#F0F');
    hGrad.addColorStop(6 / 6, '#F00');

    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var vGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    const type = 's'
    
    switch (type) {
      case 's':
        vGrad.addColorStop(0, 'rgba(255,255,255,0)');
        vGrad.addColorStop(1, 'rgba(255,255,255,1)');
        break;
      case 'v':
        vGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vGrad.addColorStop(1, 'rgba(0,0,0,1)');
        break;
                              }
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  }

  function onMouseMove (e) {

    var offsets = canvas.getBoundingClientRect();
    var top = offsets.top;
    var left = offsets.left;
    var width = offsets.width;
    var height = offsets.height;

    let x = e.clientX - left;
    let y = e.clientY - top;

    if (x<0) x=0;
    if (y<0) y=0;
    if (x>width) x=width;
    if (y>height) y=height;

    hue = x/width*360
    sat = (height-y)/height*100

    picker.style.left = x- 3 + "px"
    picker.style.top = y - 6 + "px"

    let color = HSVtoRGB(hue/360, sat/100, 1)
    red = color.r
    gre = color.g
    blu = color.b

    scriptSegments[2] = red
    scriptSegments[3] = gre
    scriptSegments[4] = blu

  }

  function onMouseDown (event) {
    onMouseMove(event)
    addEventListener('mousemove', onMouseMove)
    addEventListener('mouseup', onMouseUp)
  }

  function onMouseUp () {
    removeEventListener('mousemove', onMouseMove)
    removeEventListener('mouseup', onMouseUp)
    
    sendData()
  }
  
  function generateColor () {

    let hsv = {h:Math.random(),s:1,v:1}

    var offsets = canvas.getBoundingClientRect();
    var top = offsets.top;
    var left = offsets.left;
    var width = offsets.width;
    var height = offsets.height;

    let x = hsv.h*width;
    let y = (1-hsv.s)*height;

    if (x<0) x=0;
    if (y<0) y=0;
    if (x>width) x=width;
    if (y>height) y=height;

    hue = hsv.h*360
    sat = hsv.s*100

    picker.style.left = x- 3 + "px"
    picker.style.top = y - 6 + "px"

    let color = HSVtoRGB(hue/360, sat/100, 1)
    red = color.r
    gre = color.g
    blu = color.b

    scriptSegments[2] = red
    scriptSegments[3] = gre
    scriptSegments[4] = blu

    sendData()
  }


</script>

<svelte:window bind:innerWidth={sidebarWidth} />

<config-led-color class="flex flex-col w-full p-2">


  <div class="w-full flex">
    {#each [scriptSegments[0], scriptSegments[1]] as script, i}
      <div class={'w-1/2 atomicInput '}>
        <div class="text-gray-500 text-sm pb-1">{parameterNames[i]}</div>
        <AtomicInput 
          inputValue={script} 
          suggestions={suggestions[i]} 
          on:active-focus={(e)=>{onActiveFocus(e,i)}} 
          on:loose-focus={(e)=>{onLooseFocus(e,i)}} 
          on:change={(e)=>{sendData(e.detail,i)}}/>    
      </div>
    {/each}

  </div>

  {#if (showSuggestions && suggestionPlaceMove==true)}
  <AtomicSuggestions 
    {suggestions} 
    {focusedInput} 
    on:select={(e)=>{
      scriptSegments[e.detail.index] = e.detail.value; 
      sendData(e.detail.value,e.detail.index)
    }}
  />
  {/if}

  <div class="inline-flex relative flex-row p-1 m-1 overflow-hidden">
    <div bind:this={picker} on:mousedown={onMouseDown} class = "absolute -top-10 -left-10">🮻</div>
    <canvas class="w-4/5 mr-1"  bind:this={canvas} on:mousedown={onMouseDown} style="min-height: 30px; height: 30px;" id="myCanvas"></canvas>
    <div bind:this={preview} on:mouseup={generateColor}  class="w-1/5 ml-1 preview flex justify-center items-center" style="background-color: rgb({red}, {gre}, {blu}); min-height: 30px; height: 30px;"></div>
  </div>



  <div class="w-full flex">

    {#each [scriptSegments[2], scriptSegments[3], scriptSegments[4]] as script, i}
      <div class={'w-1/3 atomicInput '}>
        <div class="text-gray-500 text-sm pb-1">{parameterNames[i+2]}</div>
        <AtomicInput 
          inputValue={script} 
          suggestions={suggestions[i+2]} 
          on:active-focus={(e)=>{onActiveFocus(e,i+2)}} 
          on:loose-focus={(e)=>{onLooseFocus(e,i+2)}} 
          on:change={(e)=>{sendData(e.detail,i+2); updatePicker(e)}}/>    
      </div>
    {/each}
  </div>


  {#if (showSuggestions && suggestionPlaceMove==false)}
  <AtomicSuggestions 
    {suggestions} 
    {focusedInput} 
    on:select={(e)=>{
      scriptSegments[e.detail.index] = e.detail.value; 
      sendData(e.detail.value,e.detail.index)
      updatePicker(e)
    }}
  />
  {/if}



  <div class="p-2 flex items-center text-sm text-gray-500">
    <Toggle bind:toggleValue={beautify} on:change={changeBeautify} />
    <div class="pl-2">Beautify is {beautify ? 'on' : 'off'}.</div>
  </div>

  <SendFeedback feedback_context="LedColor"/>

</config-led-color>

<style>



  @keyframes changeLetter {
    0% {
      content: "⚀";
      transform: rotate(0deg);
    }
    18% {
      content: "⚁";
      transform: rotate(20deg);
    }
    36% {
      content: "⚂";
      transform: rotate(30deg);
    }
    52% {
      content: "⚃";
      transform: rotate(20deg);
    }
    69% {
      content: "⚄";
      transform: rotate(0deg);
    }
    86% {
      content: "⚅";
      transform: rotate(-10deg);
    }
  }

  .atomicInput{
    padding-right:0.5rem;
  }

  .atomicInput:first-child{
    padding-left: 0.5rem;
  }
  .preview:hover{
    cursor: pointer;
  }
  .preview:hover::after{
    animation: changeLetter 1s linear infinite;
    content: "⚄";
    font-size: 150%;
  }
</style>