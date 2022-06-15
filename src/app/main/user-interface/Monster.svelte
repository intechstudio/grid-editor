<script>

  import { onDestroy, onMount } from "svelte";
  import {attachment} from "./Monster.store"

  import {windowSize} from "../../runtime/app-helper.store"

  let scale = 0.5;

  let helperX = -200
  let helperY = -200
  let eyesX1 = 0
  let eyesY1 = 0
  let eyesX2 = 0
  let eyesY2 = 0

  let helperElement;

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

      eyesX1 = 0;
      eyesY1 = 0;
      eyesX2 = 0;
      eyesY2 = 0;

    });


    document.addEventListener("mousemove", e=>{

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

      let rate = Math.sqrt(agvDist*0.1)*20/15

      eyesX1 = eX1/Math.sqrt(eX1*eX1+eY1*eY1)*rate
      eyesY1 = eY1/Math.sqrt(eX1*eX1+eY1*eY1)*rate

      eyesX2 = eX2/Math.sqrt(eX2*eX2+eY2*eY2)*rate
      eyesY2 = eY2/Math.sqrt(eX2*eX2+eY2*eY2)*rate

    })


  })


</script>

<div class="absolute z-50 bg-red-500" style="top: {helperY-100/2*scale}px; left: {helperX-100/2*scale}px;">
  <svg bind:this={helperElement} width="{100*scale}" height="{100*scale}" >
    <circle cx="{30*scale}" cy="{50*scale}" r="{15*scale}" fill="white" />   
    <circle cx="{70*scale}" cy="{50*scale}" r="{15*scale}" fill="white" />
    <circle cx="{30*scale + eyesX1*scale}" cy="{50*scale + eyesY1*scale}" r="{5*scale}" fill="black" />   
    <circle cx="{70*scale + eyesX2*scale}" cy="{50*scale + eyesY2*scale}" r="{5*scale}" fill="black" />
    Sorry, your browser does not support inline SVG.
  </svg> 
</div>