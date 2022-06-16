<script>

  import { onDestroy, onMount } from "svelte";
  import {attachment} from "./Monster.store"

  import {windowSize} from "../../runtime/app-helper.store"

  let scale = 1;

  let helperX = -200
  let helperY = -200
  let eyesX1 = 0
  let eyesY1 = 0
  let eyesX2 = 0
  let eyesY2 = 0

  let helperElement;

  let helperSleep = true;

  let sleepTimeout;  
  let wakeTimeout;

  $: {

    if ($windowSize.window){
      // just to trigger on window change
    }

    if ($attachment !== undefined){
      
      if ($attachment.element.getBoundingClientRect !== undefined){

        let bounding = $attachment.element.getBoundingClientRect();

        if ($attachment.position === "left"){

          helperX = bounding.left
          helperY = bounding.top + bounding.height/2
        }
        else if ($attachment.position === "top"){

          helperX = bounding.left + bounding.width/2
          helperY = bounding.top
        }
        else{

          helperX = bounding.left + bounding.width/2
          helperY = bounding.top + bounding.height/2
        }
      }

    }
    else{
      helperX = -200
      helperY = -200
    }

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

      if (helperSleep){
        clearTimeout(sleepTimeout);
        sleepTimeout = undefined
        if (wakeTimeout === undefined){
          wakeTimeout = setTimeout(() => { 
            helperSleep = false
            wakeTimeout = undefined
          }, 250);
        }

      }

      let eX1 = e.clientX - helperX + 10
      let eY1 = e.clientY - helperY    

      let dist1 = Math.sqrt(eX1*eX1 + eY1*eY1)



      let eX2 = e.clientX - helperX - 10
      let eY2 = e.clientY - helperY

      let dist2 = Math.sqrt(eX2*eX2 + eY2*eY2)

      let agvDist = (dist1 + dist2)/2

      if (agvDist > 150){
        eyesX1 = eX1*(150/agvDist)
        eyesY1 = eY1*(150/agvDist)
      }
      else{
        eyesX1 = eX1
        eyesY1 = eY1
      }   

      if (agvDist > 150){

        eyesX2 = eX2*(150/agvDist)
        eyesY2 = eY2*(150/agvDist)
      
      }
      else{
        eyesX2 = eX2
        eyesY2 = eY2
      }

      let rate = Math.sqrt(agvDist*0.1)*0.5

      eyesX1 = eX1/Math.sqrt(eX1*eX1+eY1*eY1)*rate
      eyesY1 = eY1/Math.sqrt(eX1*eX1+eY1*eY1)*rate

      eyesX2 = eX2/Math.sqrt(eX2*eX2+eY2*eY2)*rate
      eyesY2 = eY2/Math.sqrt(eX2*eX2+eY2*eY2)*rate

    })


  })


</script>

<div class="absolute z-50 bg-gray-500 bg-opacity-0" style="top: {helperY-100/2*scale}px; left: {helperX-100/2*scale}px;">
  <svg bind:this={helperElement} width="{100*scale}" height="{100*scale}" >
  
    <g transform="scale({scale})">

      <defs>
        <style>.d{fill:#fff;}.e{fill:#68bf7a;}.f{fill:none;stroke:#000;stroke-linecap:round;stroke-miterlimit:10;stroke-width:3px;}</style>
      </defs>
      <g id="a"/>
      <g id="b">
        <g id="c">
          <path class="e" d="M100,50c0,5.49-4.45,9.94-9.94,9.94h-16.08l11.37,11.37c3.88,3.87,3.88,10.17,0,14.05-1.94,1.94-4.48,2.91-7.03,2.91s-5.09-.97-7.02-2.91l-11.37-11.37v16.08c0,5.48-4.45,9.94-9.94,9.94s-9.94-4.45-9.94-9.94v-16.08l-11.37,11.37c-1.93,1.94-4.48,2.91-7.02,2.91s-5.09-.97-7.03-2.91c-3.88-3.88-3.88-10.17,0-14.05l11.37-11.37H9.94c-5.48,0-9.94-4.44-9.94-9.94s4.45-9.94,9.94-9.94H26.01l-11.37-11.37c-3.88-3.88-3.88-10.17,0-14.05,3.88-3.88,10.17-3.88,14.05,0l11.37,11.37V9.94c0-5.48,4.45-9.94,9.94-9.94s9.94,4.45,9.94,9.94v30.13h30.13c5.48,0,9.94,4.45,9.94,9.94Z"/>
          
          <g class="{helperSleep?"hidden":""}">

            <!-- Normal Eyes (right) -->
            <circle class="d" cx="65" cy="50" r="9.5"/>
            <circle cx="{65+eyesX2}" cy="{50+eyesY2}" r="5"/>

            <!-- Normal Eyes (left) -->
            <circle class="d" cx="35" cy="50" r="9.5"/>
            <circle cx="{35+eyesX1}" cy="{50+eyesY1}" r="5"/>

            <!-- Normal Mouth -->
            <path class="f"  d="M55,65c0,2.76-2.24,5-5,5s-5-2.24-5-5"/>
          </g>          
          
          <g class="{helperSleep?"":"hidden"}">
            <!-- Sleepy Eyes -->
            <path class="f" d="M43.5,45.75c0,4.69-3.81,8.5-8.5,8.5s-8.5-3.81-8.5-8.5"/>
            <path class="f" d="M73.5,45.75c0,4.69-3.81,8.5-8.5,8.5s-8.5-3.81-8.5-8.5"/>

            <!-- Sleepy Mouth -->
            <circle fill="black" stroke="black"   cx="50" cy="65" r="5"/>
          </g>
          
        </g>
      </g>    




    </g>



  </svg> 
</div>