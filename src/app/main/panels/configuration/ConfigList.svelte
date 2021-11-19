<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

  import { configListScrollSize } from '../../_actions/boundaries.action';

  import MultiSelect from './components/MultiSelect.svelte';
  import Bin from './components/Bin.svelte';
  import DropZone from './components/DropZone.svelte';
  import DynamicWrapper from './components/DynamicWrapper.svelte';
  import Options from './components/Options.svelte';

  import ConfigExtension from './ConfigExtension.svelte';
  import ConfigPicker from './config-picker/ConfigPicker.svelte';
  import ExportConfigs from './components/ExportConfigs.svelte';


  import { changeOrder } from '../../_actions/move.action.js';

  import { writable, get } from 'svelte/store';

  import { actionIsDragged, appSettings, configNodeBinding } from '../../_stores/app-helper.store.js';
  import { runtime, user_input, localDefinitions, luadebug_store, appMultiSelect } from '../../../runtime/runtime.store.js';
  import { configManagement } from '../../../runtime/config-manager.store.js';
  import _utils from '../../../runtime/_utils';
  import ConfigBlock from './components/ConfigBlock.svelte';
  import AddAction from './config-picker/AddAction.svelte';

  

  export let configs = [];

  export let events;
  export let pages;

  let disable_pointer_events = false;
  let animation = false;
  let drag_start = false;
  let drag_target = '';
  let drop_target = '';

  let scrollHeight = '100%';

  async function addConfigAtPosition(arg, index){

    const { config } = arg.detail;

    configs = await configManagement().drag_and_drop.add({configs: configs, index: index, newConfig: config});

    const li = get(user_input);

    const dx = li.brc.dx;
    const dy = li.brc.dy;
    const page =  li.event.pagenumber;
    const element = li.event.elementnumber;
    const event = li.event.eventtype;
    const actionstring = _utils.configMerge({config: configs});

    runtime.update_event_configuration(dx, dy, page, element, event, actionstring, 'EDITOR_EXECUTE');
    runtime.send_event_configuration_to_grid(dx, dy, page, element, event);
    
  }

  function handleDrop(e){

    if(drop_target !== 'bin'){
      
      // if only cfg-list is selected, don't let dnd happen nor delete.
      if(!Number.isNaN(drop_target)){
        configs = configManagement().drag_and_drop.reorder({
          configs: configs, 
          drag_target: drag_target, 
          drop_target: drop_target, 
          isMultiDrag: e.detail.multi
        });
      }

    } else { 

      configs = configManagement().drag_and_drop.remove({
        configs: configs, 
        array: drag_target
      });

    }

    const li = get(user_input);

    const dx = li.brc.dx;
    const dy = li.brc.dy;
    const page =  li.event.pagenumber;
    const element = li.event.elementnumber;
    const event = li.event.eventtype;
    const actionstring = _utils.configMerge({config: configs});

    runtime.update_event_configuration(dx, dy, page, element, event, actionstring, 'EDITOR_EXECUTE');
    runtime.send_event_configuration_to_grid(dx, dy, page, element, event);

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

  }

  $: luadebug_store.update_config(_utils.configMerge({config: configs}));

</script>

<configs class="w-full h-full flex flex-col px-4 bg-primary pb-2">

  <div class="pt-1 flex items-center  justify-between">
    <div class="text-gray-500 text-sm">Actions</div>
    <MultiSelect/>
  </div>

    <div 
      use:changeOrder={{configs}} 
      on:disable-pointer-events={(e)=>{disable_pointer_events = true;}}
      on:drag-start={(e)=>{drag_start = true; actionIsDragged.set(true); appMultiSelect.reset();}}  
      on:drag-target={(e)=>{drag_target = e.detail.id; }}
      on:drop-target={(e)=>{drop_target = e.detail.drop_target;}}
      on:drop={handleDrop}
      on:drag-end={(e)=>{ drag_start = false; actionIsDragged.set(false); drop_target = undefined; drag_target = [];}}
      on:enable-pointer-events={(e)=>{disable_pointer_events = false;}}
      on:anim-start={()=>{ animation= true;}}
      on:anim-end={()=>{ animation = false;}}  
      class="flex flex-col h-full relative justify-between">

      <config-list id="cfg-list" style="height:{scrollHeight}" use:configListScrollSize={configs} on:height={(e)=>{scrollHeight = e.detail}} class="flex flex-col w-full  h-auto overflow-y-auto">
        
        {#if !drag_start}
          <AddAction index={0} {configs} {animation} on:new-config={(e)=>{addConfigAtPosition(e, 0)}}/>
        {:else}
          <DropZone index={-1} {configs} {drop_target} {drag_target} {animation} {drag_start}/>
        {/if}

        {#if configs !== undefined}
          {#each configs as config, index (config.id)}
            <anim-block animate:flip={{duration: 300}} in:fade={{delay: 0}} class="select-none {config.information.rendering == 'hidden' ? 'hidden' : 'block'}">
              <DynamicWrapper let:toggle {disable_pointer_events} {index} {config}>
                  <ConfigBlock slot="humanify" {config} {index} on:output={(e)=>{config.script = e.detail.script; handleConfigChange({configName: config.information.name}); configs = configs;}}/>
                  <Options slot="options" {toggle} {index} {configs} rendering={config.information.rendering} componentName={config.information.name} />
              </DynamicWrapper>

              <ConfigExtension {index} {config} on:output={(e)=>{config.script = e.detail.script; handleConfigChange({configName: config.information.name}); configs = configs; }}/>
              
              {#if !drag_start}
                <AddAction index={index + 1} {animation} {configs} on:new-config={(e)=>{addConfigAtPosition(e, index + 1)}}/>
              {:else}
                <DropZone {configs} {index} {drag_target} {drop_target} {animation} {drag_start}/>
              {/if}
                    
            </anim-block>
          {/each}
        {/if}
      </config-list>

      <container class="flex flex-col w-full">
        {#if !drag_start}
          <div class="w-full flex justify-between mb-3">
            <AddAction userHelper={true} index={configs.length + 1} {animation} {configs} on:new-config={(e)=>{addConfigAtPosition(e, configs.length + 1)}}/>
            <ExportConfigs/>
          </div>
        {:else}
          <Bin/>
        {/if}
      </container>
    </div>

  </configs>

  <!--<Debug {configs}/>-->

 <style global>

  .grabbed{
    cursor: move !important;
  }

  .unselectable {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    cursor: default;
  }

  ::-webkit-scrollbar {
      height: 6px;
      width: 6px;
      background: #1e2628;
  }
  
  ::-webkit-scrollbar-thumb {
      background: #286787;
      box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
  }
  
  ::-webkit-scrollbar-corner {
      background: #1e2628
  }


</style>