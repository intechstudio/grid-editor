<script>

  import { onMount } from "svelte";
  import { fly, fade } from 'svelte/transition';
  import { engine, logger } from "../../../runtime/runtime.store";

  let statusColor = '';
  let logs = [];
  let popup = false;

  let [logClear, popupWindow] = [undefined, undefined];
  

  onMount(()=>{
   
    logger.subscribe((log)=>{
      if(log.message != ''){

        popup = true;

        if(logs.map(l => l.classname).includes('pagechange') && log.classname == 'strict'){
          logs = [];
        }

        clearInterval(logClear);
        clearInterval(popupWindow);

        logs = [...logs, log];

        popupWindow = setTimeout(()=>{
          popup = false;
        }, 3250);
             
        logClear = setTimeout(()=>{
          logs = [];
        }, 3000);

      }
    });

  });

  $: if(logs.length >= 6){
    logs.shift();  
    logs = logs;
  }

  let engine_state = 0;
  
  engine.subscribe(_engine_state => {

    engine_state = _engine_state;

  })


  export function cursorLog(node, {popup}){

    const div = document.getElementById('cursor-log');

    const width = window.innerWidth;
    const height = window.innerHeight;

    let mouseX, mouseY;

    function moveCursor(){

      let [TOP, LEFT] = [0, 0];

      const rect = node.getBoundingClientRect();

      let [placeleft_X, placeleft_Y] = [ width - mouseX, height - mouseY ]; // the place left before going out of frame

      if((placeleft_X - rect.width) < 0 ){
        
        LEFT = mouseX + (placeleft_X - rect.width);
      } else {
        LEFT = mouseX;
      }


      if((placeleft_Y - rect.height) < 0){
        TOP = mouseY + (placeleft_Y - rect.height - 30);
      } else {
        TOP = mouseY;
      }

      div.style.left = LEFT + 'px';
      div.style.top = TOP + 'px';

    }

    function handleMouseMove(e){

      mouseX = e.clientX;
      mouseY = e.clientY;

      moveCursor();

    }

    document.addEventListener('mousemove', handleMouseMove);

    return {
      update(popup){
        if(popup) moveCursor();
      },
      destroy() {
        document.removeEventListener('mousemove', handleMouseMove);
      }
    }
  }

</script>



<div id="cursor-log" style="z-index:9999;" use:cursorLog={{popup}} class="absolute">
  {#if popup}
    <div 
      transition:fade={{duration: 200}} 
      class:border-primary={logs.length == 0}
      class:border-green-600={logs[logs.length-1]?.type == 'success'}
      class:border-yellow-600={logs[logs.length-1]?.type == 'alert'}
      class:border-red-600={logs[logs.length-1]?.type == 'fail'}
      class:border-blue-600={logs[logs.length-1]?.type == 'progress'}
      class="flex flex-col w-full rounded-lg bg-thirdery shadow border-2 px-4 py-1 text-white">

      <div class="py-2 mb-2 border-b border-gray-500">
        {#if engine_state == 'DISABLED'}
          <p class="calculating">Grid engine is calculating<span>.</span><span>.</span><span>.</span></p>
        {:else}
          Grid engine is enabled!
        {/if}
      </div>

      {#each logs as log, i (log.n)}
        <div in:fly={{x: -10, delay: 200 * i}} out:fly={{x: 10, delay: 200 * i}} class="my-1 flex items-center p-0.5">
          <div class="px-2 py-1 bg-primary rounded mr-2">
            {log.type == 'success' ? '✔️' : log.type == 'alert' ? '⚠️' : log.type == 'progress' ? '⏳' : log.type == 'fail' ? '❌' : null}
          </div>
          {log.message}
        </div>
      {/each}

    </div>
  {/if}
</div> 

<style>

    @keyframes blink {
      /**
      * At the start of the animation the dot
      * has an opacity of .2
      */
      0% {
        opacity: .2;
      }
      /**
      * At 20% the dot is fully visible and
      * then fades out slowly
      */
      20% {
        opacity: 1;
      }
      /**
      * Until it reaches an opacity of .2 and
      * the animation can start again
      */
      100% {
        opacity: .2;
      }
    }

    .calculating span {
        /**
        * Use the blink animation, which is defined above
        */
        animation-name: blink;
        /**
        * The animation should take 1.4 seconds
        */
        animation-duration: 1.4s;
        /**
        * It will repeat itself forever
        */
        animation-iteration-count: infinite;
        /**
        * This makes sure that the starting style (opacity: .2)
        * of the animation is applied before the animation starts.
        * Otherwise we would see a short flash or would have
        * to set the default styling of the dots to the same
        * as the animation. Same applies for the ending styles.
        */
        animation-fill-mode: both;
    }

    .calculating span:nth-child(2) {
        /**
        * Starts the animation of the third dot
        * with a delay of .2s, otherwise all dots
        * would animate at the same time
        */
        animation-delay: .2s;
    }

    .calculating span:nth-child(3) {
        /**
        * Starts the animation of the third dot
        * with a delay of .4s, otherwise all dots
        * would animate at the same time
        */
        animation-delay: .4s;
    }

</style>
