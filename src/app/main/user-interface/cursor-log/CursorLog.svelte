<script>

  import { onMount } from "svelte";
  import { fly, fade } from 'svelte/transition';
  import { engine, logger } from "../../../runtime/runtime.store";

  let statusColor = '';
  let logs = [];
  let popup = false;

  let newMsg = undefined;

  let logCleanUp = undefined;

  

  onMount(()=>{
   
    logger.subscribe((log)=>{
      if(log.message != ''){
        popup = true;
        if(logs.map(l => l.classname).includes('pagechange') && log.classname == 'strict'){
          logs = [];
        }
        logs = [...logs, log];
        clearInterval(newMsg);
        newMsg = setTimeout(()=>{
          logs = [];
          popup = false;
        }, 3000);
      }
    });

  });

  $: if(logs.length >= 6){
    logs.shift();  
    logs = logs;
  }

  let devices = {
    number: 0,
    progress: 0,
    disabled: 0,
    enabled: 0
  }

  /**
  engine.subscribe(_devices => {

    devices.number = _devices.length;
    devices.disabled = 0;
    devices.progress = 0;
    devices.enabled = 0;

    _devices.forEach(d => {

      if(d.state == 'ENABLED'){
        devices.enabled += 1;
      }

      if(d.state == 'DISABLED'){
        devices.disabled += 1;
      }
      
      if(d.state == 'PROGRESS'){
        devices.progress += 1;
      }

    })
  })
  */

  export function cursorLog(node, {popup}){

    const div = document.getElementById('cursor-log');

    const width = window.innerWidth;
    const height = window.innerHeight;

    let mouseX, mouseY;

    function moveCursor(){

      let left = 0;

      const rect = node.getBoundingClientRect();

      if(width - (mouseX + rect.width) < 30){
        left = mouseX - 40;
      } else {
        left = mouseX;
      }

      if(height - (mouseY + rect.height) < 0){
        return
      }

      div.style.left = left - (rect.width / 2) + 'px';
      div.style.top = mouseY + 5 + 'px';

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
      class:border-green-600={logs[logs.length-1].type == 'success'}
      class:border-yellow-600={logs[logs.length-1].type == 'alert'}
      class:border-red-600={logs[logs.length-1].type == 'fail'}
      class:border-blue-600={logs[logs.length-1].type == 'progress'}
      class="flex flex-col w-full rounded-lg bg-thirdery shadow border-2 px-4 py-1 text-white">

      <!--
      {#if !logs.map(l => l.classname).includes('pagechange')}
        <div class="py-2 mb-2 border-b border-gray-500">
          {#if devices.enabled !== devices.number}
            {devices.enabled}/{devices.number} {devices.number > 1 ? 'controllers are' : 'controller is'} calculating...
          {:else}
            {devices.number}/{devices.enabled} {devices.number > 1 ? 'controllers are' : 'controller is'} ready!
          {/if}
        </div>
      {/if}
-->
      {#each logs as log}
        <div in:fly={{x: -10, delay: 200}} out:fly={{x: 10, delay: 200}} class="my-1 flex items-center p-0.5">
          <div class="px-2 py-1 bg-primary rounded mr-2">
            {log.type == 'success' ? '✔️' : log.type == 'alert' ? '⚠️' : log.type == 'progress' ? '⏳' : log.type == 'fail' ? '❌' : null}
          </div>
          {log.message}
        </div>
      {/each}

    </div>
  {/if}
</div> 
