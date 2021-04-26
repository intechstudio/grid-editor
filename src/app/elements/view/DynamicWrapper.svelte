<script>
  import { sineOut } from 'svelte/easing';
  import { fly, fade } from 'svelte/transition';

  import { actionPrefStore } from '../action-preferences.store';

  export let action = '' //{desc: 'unnamed', type: 'standard', id: ''};
  export let index = undefined;
  export let drag_start = false;

  export let toggle = false;
  const color = () => "rgb(" + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + ","+ Math.floor(Math.random() * 256) + ")";

  const icons = [
    {
      action: 'Macro', 
      svg: `
      <svg width="100%" height="100%"" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1 0H16C16.5523 0 17 0.447715 17 1V16C17 16.5523 16.5523 17 16 17H1C0.447715 17 0 16.5523 0 16V1C0 0.447715 0.447715 0 1 0ZM14 1H3C2.44772 1 2 1.44772 2 2V13C2 13.5523 2.44772 14 3 14H14C14.5523 14 15 13.5523 15 13V2C15 1.44772 14.5523 1 14 1Z" fill="black"/>
        <path d="M4.5 12C4.22386 12 4 12.2239 4 12.5C4 12.7761 4.22386 13 4.5 13H12.5C12.7761 13 13 12.7761 13 12.5C13 12.2239 12.7761 12 12.5 12H4.5Z" fill="black"/>
        <path d="M4.66667 10.318V8.49984H3L5.5 5.31802L8 8.49984H6.33333V10.318H4.66667Z" fill="black"/>
      </svg>`
    },
    {
      action: 'MIDI',
      svg: `
      <svg width="100%" height="100%" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M0.5 12.5C0.5 5.87294 5.87285 0.5 12.5 0.5C19.1274 0.5 24.5 5.87295 24.5 12.5C24.5 19.1275 19.1273 24.5 12.5 24.5C5.87287 24.5 0.5 19.1275 0.5 12.5ZM14.2071 23.3683L14.1413 22.8877C14.0304 22.0784 13.3373 21.4554 12.5003 21.4554C11.6623 21.4554 10.9695 22.0782 10.8585 22.8874L10.7925 23.3683C11.3489 23.455 11.9192 23.5 12.5 23.5C13.0806 23.5 13.6508 23.455 14.2071 23.3683ZM12.5001 2.46309C6.95685 2.46309 2.46281 6.95713 2.46281 12.5C2.46281 17.1783 5.66475 21.11 9.99693 22.2218C10.3636 21.193 11.3442 20.4554 12.5003 20.4554C13.6558 20.4554 14.6363 21.1933 15.0029 22.2221C19.3352 21.11 22.5371 17.1783 22.5371 12.5C22.537 6.9571 18.0433 2.46309 12.5001 2.46309ZM10.5432 6.33504C10.543 5.2543 11.4194 4.37819 12.5 4.37819C13.5809 4.37819 14.4568 5.25461 14.4568 6.33522C14.4568 7.41632 13.5802 8.29231 12.5001 8.29231C11.4191 8.29231 10.543 7.41615 10.5432 6.33504ZM12.5 5.37819C11.9715 5.37819 11.543 5.80679 11.5432 6.33504C11.543 6.86363 11.9711 7.29231 12.5001 7.29231C13.028 7.29231 13.4568 6.86399 13.4568 6.33522C13.4568 5.80668 13.0284 5.37819 12.5 5.37819ZM6.75623 6.75671C7.52044 5.99251 8.75968 5.99254 9.52391 6.75707C10.2884 7.52134 10.2878 8.76052 9.52415 9.52427C8.75967 10.2887 7.52074 10.2889 6.75643 9.5242C5.99204 8.76001 5.99209 7.52083 6.75623 6.75671ZM8.81667 7.46404C8.44294 7.09017 7.83697 7.09019 7.46333 7.46382C7.0897 7.83745 7.0897 8.44344 7.46353 8.81708C7.83718 9.19091 8.44297 9.19122 8.81703 8.81717C9.19041 8.44374 9.19041 7.83758 8.81667 7.46404ZM15.476 6.75778C16.24 5.9935 17.4794 5.9935 18.2432 6.75767C19.0074 7.52177 19.0074 8.76092 18.243 9.52514C17.4786 10.2898 16.2394 10.2893 15.4755 9.5255C14.711 8.76103 14.7109 7.52204 15.476 6.75778ZM17.536 7.46467C17.1627 7.09118 16.5566 7.0911 16.1831 7.46493C15.8091 7.83848 15.8086 8.44435 16.1826 8.81839C16.556 9.1918 17.162 9.19202 17.5357 8.81817C17.9096 8.44445 17.9095 7.83822 17.536 7.46467ZM4.3767 12.4998C4.3767 11.4193 5.2531 10.5431 6.33377 10.543C7.41486 10.543 8.29092 11.4194 8.29092 12.4998C8.29092 13.5807 7.41486 14.4567 6.33381 14.4567C5.25315 14.4567 4.3767 13.581 4.3767 12.4998ZM6.33381 11.543C5.80519 11.5431 5.3767 11.9718 5.3767 12.4998C5.3767 13.0284 5.80516 13.4567 6.33381 13.4567C6.86264 13.4567 7.29092 13.0283 7.29092 12.4998C7.29092 11.9717 6.86259 11.543 6.33381 11.543ZM16.7091 12.4998C16.7091 11.4193 17.5853 10.5431 18.6661 10.543C19.7471 10.543 20.6231 11.4194 20.6231 12.4998C20.6231 13.5806 19.7473 14.4567 18.6661 14.4567C17.5855 14.4567 16.7091 13.581 16.7091 12.4998ZM18.6661 11.543C18.1375 11.5431 17.7091 11.9717 17.7091 12.4998C17.7091 13.0284 18.1375 13.4567 18.6661 13.4567C19.1949 13.4567 19.6231 13.0284 19.6231 12.4998C19.6231 11.9717 19.1948 11.543 18.6661 11.543Z" fill="black"/>
        <path d="M11.5432 6.33504C11.543 5.80679 11.9715 5.37819 12.5 5.37819C13.0284 5.37819 13.4568 5.80668 13.4568 6.33522C13.4568 6.86399 13.028 7.29231 12.5001 7.29231C11.9711 7.29231 11.543 6.86363 11.5432 6.33504Z" fill="black"/>
        <path d="M16.1831 7.46493C16.5566 7.0911 17.1627 7.09118 17.536 7.46467C17.9095 7.83822 17.9096 8.44445 17.5357 8.81817C17.162 9.19202 16.556 9.1918 16.1826 8.81839C15.8086 8.44435 15.8091 7.83848 16.1831 7.46493Z" fill="black"/>
        <path d="M17.7091 12.4998C17.7091 11.9717 18.1375 11.5431 18.6661 11.543C19.1948 11.543 19.6231 11.9717 19.6231 12.4998C19.6231 13.0284 19.1949 13.4567 18.6661 13.4567C18.1375 13.4567 17.7091 13.0284 17.7091 12.4998Z" fill="black"/>
        <path d="M5.3767 12.4998C5.3767 11.9718 5.80519 11.5431 6.33381 11.543C6.86259 11.543 7.29092 11.9717 7.29092 12.4998C7.29092 13.0283 6.86264 13.4567 6.33381 13.4567C5.80516 13.4567 5.3767 13.0284 5.3767 12.4998Z" fill="black"/>
        <path d="M7.46333 7.46382C7.83697 7.09019 8.44294 7.09017 8.81667 7.46404C9.19041 7.83758 9.19041 8.44374 8.81703 8.81717C8.44297 9.19122 7.83718 9.19091 7.46353 8.81708C7.0897 8.44344 7.0897 7.83745 7.46333 7.46382Z" fill="black"/>
        <path d="M14.1413 22.8877L14.2071 23.3683C13.6508 23.455 13.0806 23.5 12.5 23.5C11.9192 23.5 11.3489 23.455 10.7925 23.3683L10.8585 22.8874C10.9695 22.0782 11.6623 21.4554 12.5003 21.4554C13.3373 21.4554 14.0304 22.0784 14.1413 22.8877Z" fill="black"/>
      </svg>`
    },
    {
      action: 'Bank Preferences',
      svg: `icn`
    },
    {
      action: 'Code Block',
      svg: `icn`
    }
  ];

  function findIcon(name){
    let icn = icons.find(i => i.action === name);
    if(icn) {return icn.svg} else { return ''}
  }

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

  // when the advanced options are open then show the actions with disabled user interactions
  let advancedView = false;
  $: ($actionPrefStore.advanced.index == index && $actionPrefStore.advanced.visible) ? advancedView = true : advancedView = false;

</script>


<wrapper id="act-{index}" movable={action.type == 'standard' || action.component == 'IF' ? true : false } action-component={action.component} action-id={action.id} class="block border-none outline-none transition-opacity duration-300">
  <div class="flex relative {drag_start ? 'pointer-events-none' : ''}">
    {#if action.type == 'standard'}
      <carousel on:click={()=>{toggle = ! toggle;}} style="" class="flex flex-grow relative text-white cursor-pointer ">
        <icon style="background-color: {color()}" class="flex  items-center p-2">
          <div class="w-6 h-6">
            {@html findIcon(action.desc)}         
          </div>              
        </icon>
        {#if !toggle && !advancedView}
          <name class="pl-4 flex items-center w-full bg-secondary hover:bg-select-saturate-10 py-2">
            <span class="block">{action.desc}</span> 
            <span style="overflow:hidden !important;" class="pl-2 font-mono text-gray-500 inline-block max-w-xs overflow-ellipsis whitespace-nowrap">{action.script}</span>
          </name>
        {/if}
       
      </carousel>
      {#if toggle || advancedView}
        <container in:heightChange class="{advancedView ? 'opacity-50 pointer-events-none' : ''} w-full flex bg-secondary bg-opacity-25 rounded-b-lg">
          <fader-transition class="w-full" in:fade={{delay: 200}} out:fade={{delay:0,duration:0}}>
            <slot name="action"></slot>
          </fader-transition>
        </container>
      {/if}
      
    {:else}
      <div class="flex w-full flex-col">
        <slot name="action"></slot>
      </div>
    {/if}

    <slot name="preferences" {toggle}>

    </slot>

  </div>
</wrapper>





<style global>

  carousel:last-child{
    margin-bottom: 0;
  }

</style>
