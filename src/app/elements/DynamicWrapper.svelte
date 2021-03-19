<script>

  import { sineOut } from 'svelte/easing';
  import { fly, fade } from 'svelte/transition';
  import ActionPicker from './configuration/ActionPicker.svelte';

  export let name = 'unnamed';
  export let color = "#000000";
  export let type = 'standard';
  export let drag_start = false;
  export let id = '';
  export let action_id  = '';
  export let draggable = false;

  let toggle = false;

  let visible = false;

  let addAction = false;

  function heightChange(node, {
    delay = 0,
    duration = 200,
    position = 'relative'
    }) {

    let h = +getComputedStyle(node)['height'].slice(0,-2);
    
    return {
      delay,
      duration,
      css: t => {
        return `position: ${position}; height: ${sineOut(t) * h}px;`
      }
    };
  }
// {dragstart ? 'pointer-events-none' : ''}
</script>


<wrapper id="act-{id}" action-id={action_id} class="block border-none outline-none transition-opacity duration-300">
  <div class="flex {drag_start ? 'pointer-events-none' : ''}">
    {#if type == 'standard'}
    <carousel on:click={()=>{toggle = ! toggle;}} class="flex flex-grow text-white">
        <name style="background-color: {color}" class="flex items-center p-2">
          icn
        </name>
      {#if !toggle}
        <span class="pl-4 flex items-center w-full bg-secondary py-2">
          {name}
        </span>
      {/if}
    </carousel>
    {#if toggle}
      <container in:heightChange class="w-full flex bg-secondary bg-opacity-25 rounded-b-lg">
        <fader class="w-full" in:fade={{delay: 200}} out:fade={{delay:0,duration:0}}>
          <slot></slot>
        </fader>
      </container>
    {/if}
    {:else}
      <div class="flex w-full flex-col">
        <slot></slot>
      </div>
    {/if}

    <preferences class="flex px-2 justify-center items-center bg-transparent">
      <svg class="h-6 w-6" viewBox="0 0 8 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 4C8 6.20914 6.20914 8 4 8C1.79086 8 0 6.20914 0 4C0 1.79086 1.79086 0 4 0C6.20914 0 8 1.79086 8 4Z" fill="#ffffff"/>
        <path d="M8 16C8 18.2091 6.20914 20 4 20C1.79086 20 0 18.2091 0 16C0 13.7909 1.79086 12 4 12C6.20914 12 8 13.7909 8 16Z" fill="#ffffff"/>
        <path d="M8 28C8 30.2091 6.20914 32 4 32C1.79086 32 0 30.2091 0 28C0 25.7909 1.79086 24 4 24C6.20914 24 8 25.7909 8 28Z" fill="#ffffff"/>
      </svg>
    </preferences>
  </div>
</wrapper>





<style global>

  carousel:last-child{
    margin-bottom: 0;
  }

</style>
