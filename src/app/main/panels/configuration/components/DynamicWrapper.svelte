<script>
  import { sineOut } from 'svelte/easing';

  import { fade } from 'svelte/transition';

  import Options from './Options.svelte';

  import { actionPrefStore, configNodeBinding } from '../../../_stores/app-helper.store.js';

  export let config = '' //{desc: 'unnamed', rendering: 'standard', id: ''};
  export let configs
  export let index = undefined;
  export let disable_pointer_events = false;

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

  let advancedView = false;
  // default advanced view behaviour
  // when the advanced options are open then show the actions with disabled user interactions
  $: ($actionPrefStore.advanced.index == index && $actionPrefStore.advanced.visible) ? advancedView = true : advancedView = false;
  // CodeBlock different advanced view behaviour due to different update / render process
  $: ($actionPrefStore.advanced.index == index && $actionPrefStore.advanced.visible && config.information.name == 'CodeBlock') ? toggle = false : null;
  
</script>


<wrapper bind:this={$configNodeBinding[config.id]} class="flex border-none outline-none transition-opacity duration-300">

    {#if config.information.rendering == 'standard'}

      <carousel 
          class="flex flex-grow text-white cursor-pointer group"
          id="cfg-{index}" 
          movable={config.information.rendering == 'standard' || config.information.name == 'If' ? true : false } 
          config-component={config.information.name} 
          config-id={config.id}>

            <div 
              on:click={()=>{toggle = ! toggle;}}
              class="{disable_pointer_events ? 'pointer-events-none' : ''} flex relative ">
              <icon style="background-color:{config.information.color}" class="flex group-hover:bg-opacity-75 items-center p-2">
                <div class="w-6 h-6">
                  {@html config.information.icon ? config.information.icon : ' '}         
                </div>              
              </icon>
            </div>

            {#if !toggle && !advancedView}
              <name on:click={()=>{toggle = true;}}  class="pl-4 flex items-center w-full bg-secondary group-hover:bg-select-saturate-10 py-2">
                <span class="block">{config.information.desc}</span> 
                <!--<span style="overflow:hidden !important;" class="pl-2 font-mono text-gray-500 inline-block max-w-xs overflow-ellipsis whitespace-nowrap">{config.script}</span>-->
              </name>
            {/if}
      
      </carousel>
          
      {#if toggle || advancedView}

      <container in:heightChange class="{advancedView ? 'opacity-50 pointer-events-none' : ''} w-full flex bg-secondary bg-opacity-25 rounded-b-lg">
        <fader-transition class="w-full" in:fade={{delay: 200}} out:fade={{delay:0,duration:0}}>

          <svelte:component 
          this={config.component} 
          {index} 
          {config}
          slot="humanify"
          on:output={(e)=>{config.script = e.detail.script; handleConfigChange({configName: config.information.name}); configs = configs;}}/>

        </fader-transition>
      </container>
<!--
      {:else if advancedView}

      <name class="{advancedView ? 'opacity-50 pointer-events-none' : ''} pl-4 flex items-center w-full bg-secondary text-white group-hover:bg-select-saturate-10 py-2">
        <span class="block">{config.information.desc}</span> 
        <span style="overflow:hidden !important;" class="pl-2 font-mono text-gray-500 inline-block max-w-xs overflow-ellipsis whitespace-nowrap">{config.script}</span>
      </name>
-->
      {/if}
      
    {:else if config.information.rendering == 'modifier'}

      <div 
        id="cfg-{index}" 
        movable={config.information.rendering == 'standard' || config.information.name == 'If' ? true : false } 
        config-component={config.information.name} 
        config-id={config.id}
        class="flex w-full flex-col">

        <div class="{disable_pointer_events ? 'pointer-events-none' : ''} w-full flex relative">

          <svelte:component 
          this={config.component} 
          {index} 
          {config}
          slot="humanify"
          on:output={(e)=>{config.script = e.detail.script; handleConfigChange({configName: config.information.name}); configs = configs;}}/>

        </div>

      </div>

      {:else if config.information.rendering == 'fixed'}

      <div 
        id="cfg-{index}" 
        movable={true} 
        config-component={config.information.name} 
        config-id={config.id}
        class="flex w-full flex-grow">

        <div 
          class="{disable_pointer_events ? 'pointer-events-none' : ''} flex relative ">
          <icon style="background-color:{config.information.color}" class="flex group-hover:bg-opacity-75 items-center p-2">
            <div class="w-6 h-6">
              {@html config.information.icon ? config.information.icon : ' '}         
            </div>              
          </icon>
        </div>

        <div class="{disable_pointer_events ? 'pointer-events-none' : ''} w-full flex relative">

          <svelte:component 
          this={config.component} 
          {index} 
          {config}
          slot="humanify"
          on:output={(e)=>{config.script = e.detail.script; handleConfigChange({configName: config.information.name}); configs = configs;}}/>
       
        </div>

      </div>

    {/if}


    <Options {toggle} {index} {configs} rendering={config.information.rendering} componentName={config.information.name} />



</wrapper>





<style global>

  carousel:last-child{
    margin-bottom: 0;
  }

</style>
