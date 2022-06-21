<script>

  import { onDestroy, onMount } from "svelte";
  import {attachment} from "./Monster.store"

  import {windowSize, appSettings} from "../../runtime/app-helper.store"

  
  let shapeSelected = 0;
  let colorSelected = 0;
  let name = "";


  $: {

    if ($appSettings.persistant.helperShape !== undefined){    
      shapeSelected = $appSettings.persistant.helperShape;
    }    
    
    if ($appSettings.persistant.helperColor !== undefined){    
      colorSelected = $appSettings.persistant.helperColor;
    }
    
    name = $appSettings.persistant.helperName;

  }

  // star, play, cycle, wave
  const shapes = [
    `<path d="M100,50c0,5.49-4.45,9.94-9.94,9.94h-16.08l11.37,11.37c3.88,3.87,3.88,10.17,0,14.05-1.94,1.94-4.48,2.91-7.03,2.91s-5.09-.97-7.02-2.91l-11.37-11.37v16.08c0,5.48-4.45,9.94-9.94,9.94s-9.94-4.45-9.94-9.94v-16.08l-11.37,11.37c-1.93,1.94-4.48,2.91-7.02,2.91s-5.09-.97-7.03-2.91c-3.88-3.88-3.88-10.17,0-14.05l11.37-11.37H9.94c-5.48,0-9.94-4.44-9.94-9.94s4.45-9.94,9.94-9.94H26.01l-11.37-11.37c-3.88-3.88-3.88-10.17,0-14.05,3.88-3.88,10.17-3.88,14.05,0l11.37,11.37V9.94c0-5.48,4.45-9.94,9.94-9.94s9.94,4.45,9.94,9.94v30.13h30.13c5.48,0,9.94,4.45,9.94,9.94Z"/>`,
    `<path transform="translate(10,0)" d="M83.58,40.83L15.26,1.38C8.48-2.54,0,2.36,0,10.19V89.09c0,7.83,8.48,12.72,15.26,8.81L83.58,58.44c6.78-3.91,6.78-13.7,0-17.62Z"/>`,
    `<circle cx="50" cy="50" r="50"/>`,
    `<path transform="translate(0,15)"  d="M87.53,69.3c-6.79,0-11.82-3.95-15.01-11.76-3.19,7.81-8.23,11.76-15.01,11.76s-11.82-3.95-15.01-11.75c-3.19,7.8-8.23,11.75-15.01,11.75-7.93,0-13.46-5.39-16.46-16.02-1.35-4.8-2.36-10.78-3.34-16.55-.73-4.29-1.86-11-2.88-14.42C1.88,20.03,0,16.47,0,12.47,0,5.58,5.58,0,12.47,0s11.82,3.95,15.01,11.75C30.67,3.95,35.71,0,42.49,0s11.82,3.95,15.01,11.76c3.19-7.81,8.23-11.76,15.01-11.76,7.93,0,13.46,5.39,16.46,16.02,1.35,4.8,2.37,10.78,3.34,16.55,.73,4.29,1.86,11,2.88,14.42,2.92,2.28,4.81,5.84,4.81,9.84,0,6.89-5.58,12.47-12.47,12.47Zm0-24.95h0ZM12.46,24.95h0Z"/>`
  ]

  const colors = [
    `#68bf7a`,
    `#9889c0`,
    `#f9be21`,
    `#6e9ed4`,
  ];

  const eyeOrigin = [

    {x1: 35, y1: 50, x2: 65, y2: 50},
    {x1: 35, y1: 50, x2: 65, y2: 50},
    {x1: 35, y1: 50, x2: 65, y2: 50},
    {x1: 12, y1: 27, x2: 42, y2: 27}

  ]


  let scale = 1;

  let eyeOriginX1 = 35
  let eyeOriginY1 = 50

  let eyeOriginX2 = 65
  let eyeOriginY2 = 50


  let helperX = -200
  let helperY = -200
  let eyesDX = 0
  let eyesDY = 0

  let lastMouseX = 0;
  let lastMouseY = 0;
  

  let helperElement;

  let helperSleep = true;

  let sleepTimeout;  
  let wakeTimeout;

  $: {
    if($attachment !== undefined){


      if ($attachment.element == null){
        console.log("NULL")
      }


    }
  }
  $: {

    if ($windowSize.window){
      // just to trigger on window change
    }

    if ($attachment !== undefined && $attachment.element !== undefined && $attachment.element !== null){
      
      if ($attachment.element.getBoundingClientRect !== undefined){

        let bounding = $attachment.element.getBoundingClientRect();

        const vpos = $attachment.vpos
        const hpos = $attachment.hpos

        if (vpos !== undefined && vpos.endsWith("%") && !isNaN(parseInt(vpos))){
          helperY = bounding.top + bounding.height/100*parseInt(vpos)
        }
        else{
          helperY = bounding.top
        }

        if (hpos !== undefined && hpos.endsWith("%") && !isNaN(parseInt(hpos))){
          helperX = bounding.left + bounding.width/100*parseInt(hpos)
        }
        else{
          helperX = bounding.left
        }

        if ($attachment.scale !== undefined){
          scale = $attachment.scale
        }
        else{
          scale = 1; 
        }

      }

      refreshEyes();

    }
    else{
      helperX = -200
      helperY = -200
    }

  }

  function refreshEyes(){

    let X = lastMouseX - helperX - 50 + (eyeOrigin[shapeSelected].x1 + eyeOrigin[shapeSelected].x2)/2
    let Y = lastMouseY - helperY - 50 + (eyeOrigin[shapeSelected].y1 + eyeOrigin[shapeSelected].y2)/2

    let dist = Math.sqrt(X*X + Y*Y)

    let rate = Math.sqrt(dist*0.1)*0.5

    eyesDX = X/dist*rate
    eyesDY = Y/dist*rate


  }

  onMount(()=>{


    document.addEventListener("mouseleave", e=>{

      clearTimeout(wakeTimeout);
      wakeTimeout = undefined
      if (sleepTimeout === undefined){
        sleepTimeout = setTimeout(() => { 
          helperSleep = true
          sleepTimeout = undefined
        }, 750);
      
      }

    });



    document.addEventListener("mousemove", e=>{

      clearTimeout(sleepTimeout);
      sleepTimeout = undefined

      if (helperSleep){
        if (wakeTimeout === undefined){
          wakeTimeout = setTimeout(() => { 
            helperSleep = false
            wakeTimeout = undefined
          }, 250);
        }
      }


      lastMouseX = e.clientX;
      lastMouseY = e.clientY; 

      refreshEyes();

    })


  })


</script>

<div class="absolute bg-gray-500 bg-opacity-0" style="z-index: 70; top: {helperY-100/2*scale}px; left: {helperX-100/2*scale}px;">
  <svg bind:this={helperElement} width="{100*scale}" height="{100*scale}" >
  
    <g transform="scale({scale})">

      <g id="b">
        <g id="c">

          <!-- Body shape -->
          <g fill="{colors[colorSelected]}">
          {@html shapes[shapeSelected]}
          </g>

          <g class="{helperSleep?"hidden":""}">

            <!-- Normal Eyes (left) -->
            <circle class="d" cx="{eyeOrigin[shapeSelected].x1}" cy="{eyeOrigin[shapeSelected].y1}" r="9.5"/>
            <circle cx="{eyeOrigin[shapeSelected].x1+eyesDX}" cy="{eyeOrigin[shapeSelected].y1+eyesDY}" r="5"/>

            <!-- Normal Eyes (right) -->
            <circle class="d" cx="{eyeOrigin[shapeSelected].x2}" cy="{eyeOrigin[shapeSelected].y2}" r="9.5"/>
            <circle cx="{eyeOrigin[shapeSelected].x2+eyesDX}" cy="{eyeOrigin[shapeSelected].y2+eyesDY}" r="5"/>


            <!-- Normal Mouth -->
            <path  transform="translate({(eyeOrigin[shapeSelected].x1 + eyeOrigin[shapeSelected].x2)/2-50},{(eyeOrigin[shapeSelected].y1 + eyeOrigin[shapeSelected].y2)/2-50})" class="f"  d="M55,65c0,2.76-2.24,5-5,5s-5-2.24-5-5"/>
          </g>          
          
          <g class="{helperSleep?"":"hidden"}">
            <!-- Sleepy Eyes -->
            <path  transform="translate({(eyeOrigin[shapeSelected].x1 + eyeOrigin[shapeSelected].x2)/2-50},{(eyeOrigin[shapeSelected].y1 + eyeOrigin[shapeSelected].y2)/2-50})"  class="f" d="M43.5,45.75c0,4.69-3.81,8.5-8.5,8.5s-8.5-3.81-8.5-8.5"/>
            <path   transform="translate({(eyeOrigin[shapeSelected].x1 + eyeOrigin[shapeSelected].x2)/2-50},{(eyeOrigin[shapeSelected].y1 + eyeOrigin[shapeSelected].y2)/2-50})" class="f" d="M73.5,45.75c0,4.69-3.81,8.5-8.5,8.5s-8.5-3.81-8.5-8.5"/>

            <!-- Sleepy Mouth -->
            <circle  transform="translate({(eyeOrigin[shapeSelected].x1 + eyeOrigin[shapeSelected].x2)/2-50},{(eyeOrigin[shapeSelected].y1 + eyeOrigin[shapeSelected].y2)/2-50})"  fill="black" stroke="black"   cx="50" cy="65" r="5"/>
          </g>
          
        </g>
      </g>    




    </g>



  </svg> 
</div>


<style>
.d{
  fill:#fff;
}
.e{
  fill:#68bf7a;
}
.f{
  fill:none;
  stroke:#000;
  stroke-linecap:round;
  stroke-miterlimit:10;
  stroke-width:3px;
}
</style>