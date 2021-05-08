<script>
  import { sineOut } from 'svelte/easing';

  import { fade } from 'svelte/transition';

  import { actionPrefStore, configNodeBinding } from '../../../stores/app-helper.store.js';
  import { appMultiSelect } from '../../../../runtime/runtime.store.js';

  export let config = '' //{desc: 'unnamed', groupType: 'standard', id: ''};
  export let index = undefined;
  export let drag_start = false;

  export let toggle = false;
  const color = () => "rgb(" + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + ","+ Math.floor(Math.random() * 256) + ")";

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


<wrapper bind:this={$configNodeBinding[config.id]} id="cfg-{index}" movable={config.information.groupType == 'standard' || config.component.name == 'If' ? true : false } config-component={config.component.name} config-id={config.id} class="block border-none outline-none transition-opacity duration-300">
  <div class="flex relative {drag_start ? 'pointer-events-none' : ''}">

    {#if config.information.groupType == 'standard'}
      <carousel on:click={()=>{toggle = ! toggle;}} style="" class="flex flex-grow relative text-white cursor-pointer ">
        <icon style="background-color: {color()}" class="flex  items-center p-2">
          <div class="w-6 h-6">
            {@html config.information.icon ? config.information.icon : ' '}         
          </div>              
        </icon>
        {#if !toggle && !advancedView}
          <name class="pl-4 flex items-center w-full bg-secondary hover:bg-select-saturate-10 py-2">
            <span class="block">{config.information.desc}</span> 
            <span style="overflow:hidden !important;" class="pl-2 font-mono text-gray-500 inline-block max-w-xs overflow-ellipsis whitespace-nowrap">{config.script}</span>
          </name>
        {/if}
       
      </carousel>
      {#if toggle || advancedView}
        <container in:heightChange class="{advancedView ? 'opacity-50 pointer-events-none' : ''} w-full flex bg-secondary bg-opacity-25 rounded-b-lg">
          <fader-transition class="w-full" in:fade={{delay: 200}} out:fade={{delay:0,duration:0}}>
            <slot name="config"></slot>
          </fader-transition>
        </container>
      {/if}
      
    {:else}
      <div class="flex w-full flex-col">
        <slot name="config"></slot>
      </div>
    {/if}

    <slot name="options" {toggle}>

    </slot>

  </div>
</wrapper>





<style global>

  carousel:last-child{
    margin-bottom: 0;
  }

</style>
