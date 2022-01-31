<script>
  import { sineOut } from 'svelte/easing';

  import { fade } from 'svelte/transition';
  import { get } from 'svelte/store';

  import Options from './Options.svelte';

  import { runtime, user_input, localDefinitions, luadebug_store, appMultiSelect } from '../../../../runtime/runtime.store.js';

  import _utils from '../../../../runtime/_utils';

  import { configNodeBinding } from '../../../../runtime/app-helper.store.js';


  import { getAllComponents } from '../../../../config-blocks/_configs';


  export let config = '' //{desc: 'unnamed', rendering: 'standard', id: ''};
  export let configs
  export let index = undefined;
  export let disable_pointer_events = false;

  export let toggle = false;


  function replace_me(e) {

    appMultiSelect.reset()

    let components = getAllComponents();

    let new_config = components.find(c=>c.information.name == e.detail)

    config.script = new_config.information.defaultLua
    config.short = new_config.information.short

    config.component = new_config.component
    config.information = new_config.information

    handleConfigChange({configName: config.information.name});
  }

  function handleConfigChange({configName}){

    // when rendering the Else and End config-blocks, they automatically send out their respective values
    // this results in config change trigger, which should not be sent out to grid, consider it as AUTO change

    const li = get(user_input);

    const dx = li.brc.dx;
    const dy = li.brc.dy;
    const page =  li.event.pagenumber;
    const element = li.event.elementnumber;
    const event = li.event.eventtype;
    const actionstring = _utils.configMerge({config: configs});

    if(configName == 'End' || configName == 'Else'){
      runtime.update_event_configuration(dx, dy, page, element, event, actionstring, 'EDITOR_EXECUTE');

    } else {
      runtime.update_event_configuration(dx, dy, page, element, event, actionstring, 'EDITOR_EXECUTE');
      runtime.send_event_configuration_to_grid(dx, dy, page, element, event);
    }

    localDefinitions.update(configs);
    luadebug_store.update_config(_utils.configMerge({config: configs}));

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

          {#if !toggle}
            <name on:click={()=>{toggle = true;}}  class="pl-4 flex items-center w-full bg-secondary group-hover:bg-select-saturate-10 py-2">
              <span class="block">{config.information.desc}</span>
            </name>
          {/if}
      
      </carousel>
          
      {#if toggle}
      
        <container in:heightChange class=" w-full flex bg-secondary bg-opacity-25 rounded-b-lg">
          <fader-transition class="w-full" in:fade={{delay: 200}} out:fade={{delay:0,duration:0}}>

            <svelte:component 
              this={config.component} 
              {index} {config}
              on:replace={(e)=>{replace_me(e)}}
              on:output={(e)=>{config.script = e.detail.script; handleConfigChange({configName: config.information.name}); configs = configs;}}
            />

          </fader-transition>
        </container>

      {/if}
      
    {:else if config.information.rendering == 'modifier'}

      <div 
        id="cfg-{index}" 
        movable={config.information.name == 'If'} 
        config-component={config.information.name} 
        config-id={config.id}
        class="flex w-full flex-col">

        <div class="{disable_pointer_events ? 'pointer-events-none' : ''} w-full flex relative">

          <svelte:component 
            this={config.component} 
            {index} {config}
            on:output={(e)=>{config.script = e.detail.script; handleConfigChange({configName: config.information.name}); configs = configs;}}
          />

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
