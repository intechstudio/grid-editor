<script>


  import { onMount } from "svelte";
  import { fly, fade, slide } from 'svelte/transition';
  import { current_tooltip_store } from "../../../runtime/app-helper.store";
  import { tooltip_content } from "./tooltip-content.json.js";

  export let key = '';
  export let mode = 0;

  const TOOLTIP_MAX_HEIGHT = 200;

  let fadein_ended=false;

  let parent_element;
  let tooltip_element;
  let tooltip_text = tooltip_content[key];
  let tooltip_isvisible = false;
  let tooltip_delaydone = false;

  let tooltip_style = ""
  let arrow_style = ""

  $: if (parent_element){

    try {
      
      calculate_position()
    } catch (error) {
      console.log("tried", error)
    }
  }

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
      arrow_style = `width: 14px; height:14px; margin-left: ${self.width/2-7-xoffset}px; `


    }else{

      tooltip_style = `width: ${self.width}px; top: ${parent.top}px; left: ${parent.left - self.width/2 + parent.width/2 + xoffset}px; transform: translateY(-100%);  `
      arrow_style = `width: 14px; height:14px; margin-left: ${self.width/2-7-xoffset}px; `

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


</script>

<!-- Button Hover -->
{#if mode == 1 && tooltip_text !== undefined}
  <div 
    bind:this={parent_element}
    on:mouseenter={()=>{tooltip_isvisible = true; tooltip_delaydone = false}} 
    on:mouseleave={()=>{tooltip_isvisible = false; tooltip_delaydone = false}} 
    on:click={()=>{tooltip_isvisible = false; tooltip_delaydone = false}} 
    class="w-full flex h-full absolute right-0 top-0">
 
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
              style="background-color: rgba(100,0,0,0.5);"
              class="flex-col"
              >
              <div 
                class=""
                style="background-color: rgba(0,0,100,0.7);  {arrow_style}">
              </div>
              <div 
                class="text-base flex flex-col px-4 py-4 text-white "
                style="background-color: rgba(0,0,0,0.7);">
                {tooltip_text}
              </div>
              <div 
                class=""
                style="background-color: rgba(0,0,100,0.7);  {arrow_style}">
              </div>
              
            </div>  
            
          </div>
        {/if}


      </div>

    {/if} 
  </div>



{/if}

<!-- Questionmark Hover -->
{#if mode == 2 && tooltip_text !== undefined}
    <div 
      on:click|stopPropagation={()=>{tooltip_isvisible = !tooltip_isvisible}} 
      class="w-6 h-6 relative cursor-pointer">
      <div class="w-6 h-6 relative rounded-full bg-secondary text-center text-xs flex items-center justify-center hover:text-important p-1">
        ?
      </div>
      <div 
        bind:this={parent_element}
        on:mouseenter={()=>{tooltip_isvisible = true; tooltip_delaydone = false}} 
        on:mouseleave={()=>{tooltip_isvisible = false; tooltip_delaydone = false}} 
        on:click={()=>{tooltip_isvisible = false; tooltip_delaydone = false}} 
        class="w-full flex h-full absolute right-0 top-0">
    
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
                  class="text-base border-primary flex flex-col bg-thirdery border-2 px-4 py-1 text-white"
                  >
                  123
                  <div class="mt-4">
                    hello
                    {tooltip_text}
                  </div>

                </div>  
                
              </div>
            {/if}


          </div>

        {/if} 
      </div>

    </div>
{/if}

