<script>


  import { onMount } from "svelte";
  import { fly, fade, slide } from 'svelte/transition';
  import { current_tooltip_store } from "../../../runtime/app-helper.store";
  import { tooltip_content } from "./tooltip-content.json.js";

  import {analytics} from "../../../runtime/analytics_influx"

  import {appSettings, windowSize} from "../../../runtime/app-helper.store"

  export let key = '';

  const TOOLTIP_MAX_HEIGHT = 200;

  let fadein_ended=false;

  let parent_element;
  let tooltip_element;
  let tooltip_text = tooltip_content[key];
  let tooltip_isvisible = false;
  let tooltip_delaydone = false;

  let tooltip_style = ""
  let tooltip_isbelow = false
  let arrow_style = ""


  let innerWidth;
  let innerHeight;

  let ready = false;

  onMount(()=>{

    ready = true

  })

  function appear(node, { duration }) {
		return {
			duration,
			css: t => {
				const eased = elasticOut(t);

				return `
					transform: scale(${eased}) rotate(${eased * 1080}deg);

					color: hsl(
						${Math.trunc(t * 360)},
						${Math.min(100, 1000 - 1000 * t)}%,
						${Math.min(50, 500 - 500 * t)}%
					);`
			}
		};
    
	}


  function calculate_position(){

    if (parent_element === undefined){

      return;

    }

    let docu = {width: window.innerWidth, height: window.innerHeight}
    let parent = parent_element.getBoundingClientRect();
    let self = {width: 200, height: 0}

    let xoffset = 0

    if (parent.left - self.width/2 + parent.width/2 + self.width > docu.width){

      xoffset = docu.width - (parent.left - self.width/2 + parent.width/2 + self.width + 5)
    }

    if (parent.left - self.width/2 + parent.width/2  < 5){
      xoffset = 5-(parent.left - self.width/2 + parent.width/2 )
    }

    if (TOOLTIP_MAX_HEIGHT + parent.top + parent.height < docu.height){

      tooltip_style = `width: ${self.width}px; top: ${parent.top+parent.height}px; left: ${parent.left - self.width/2 + parent.width/2 + xoffset}px; `
      arrow_style = `margin-left: ${self.width/2-10-xoffset}px; `
      tooltip_isbelow = false;

    }else{

      tooltip_style = `width: ${self.width}px; top: ${parent.top}px; left: ${parent.left - self.width/2 + parent.width/2 + xoffset}px; transform: translateY(-100%);  `
      arrow_style = `margin-left: ${self.width/2-10-xoffset}px; `
      tooltip_isbelow = true;
    }

    // bottom: 201
    // height: 30
    // left: 597.734375
    // right: 671.25
    // top: 171
    // width: 73.515625
    // x: 597.734375
    // y: 171

  }

  $: if (tooltip_isvisible && tooltip_delaydone){

    calculate_position()
    analytics.track_event("application", "tooltip", "show tooltip", key)
  }


</script>


<svelte:window bind:innerWidth={innerWidth}  bind:innerHeight={innerHeight} />

<!-- Button Hover -->
{#if tooltip_text !== undefined}
  <div 
    bind:this={parent_element}
    on:mouseenter={()=>{tooltip_isvisible = true; tooltip_delaydone = false}} 
    on:mouseleave={()=>{tooltip_isvisible = false; tooltip_delaydone = false}} 
    on:click={()=>{tooltip_isvisible = false; tooltip_delaydone = false}} 
    class="w-full flex h-full absolute right-0 top-0 " >

    {#if tooltip_isvisible}
      <div 
        in:fade={{duration: 0, delay: 750}} 
        on:introend={()=>{ tooltip_delaydone = true}}
        >
        {#if tooltip_delaydone}
          <div      
            bind:this={tooltip_element}
            on:click|stopPropagation={()=>{}}
            in:fade={{duration: 250}} 
            style="z-index: 50; {tooltip_style}" 
            class="fixed">

            <div
              class="flex-col"
              >
              {#if tooltip_isbelow == false}
                <div 
                  class="arrow-up"
                  style="background-color: rgba(0,0,100,0);  {arrow_style}">
                </div>
              {/if}
              <div 
                class="tooltip-bg text-base flex flex-col px-4 py-4 text-white text-left"
                style="">
                {tooltip_text}
              </div>
              {#if tooltip_isbelow == true}
                <div 
                  class="arrow-down"
                  style="background-color: rgba(0,0,100,0);  {arrow_style}">
                </div>
              {/if}
              
            </div>  
            
          </div>
        {/if}


      </div>

    {/if} 
  </div>



{/if}


<style>
:root {
  --tooltip-bg-color: rgba(14, 20, 24, 0.92);
}

.tooltip-bg{

  background-color: var(--tooltip-bg-color);

}

.arrow-up {
  width: 0; 
  height: 0; 
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid var(--tooltip-bg-color);
}

.arrow-down {
  width: 0; 
  height: 0; 
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid var(--tooltip-bg-color);
}

</style>