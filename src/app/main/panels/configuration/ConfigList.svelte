<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

  import MultiSelect from './components/MultiSelect.svelte';
  import Bin from './components/Bin.svelte';
  import DropZone from './components/DropZone.svelte';
  import DynamicWrapper from './components/DynamicWrapper.svelte';
  import Options from './components/Options.svelte';

  import ConfigExtension from './ConfigExtension.svelte';
  import ConfigPicker from './config-picker/ConfigPicker.svelte';

  import { changeOrder } from '../../_actions/move.action.js';

  import { actionIsDragged, appSettings } from '../../_stores/app-helper.store.js';
  import { runtime, localDefinitions } from '../../../runtime/runtime.store.js';
  import { configManagement } from '../../../runtime/config-manager.store.js';
  import _utils from '../../../runtime/_utils';
  import { onMount } from 'svelte';
  import Debug from '../../../debug/Debug.svelte';

  export let configs = [];
  
  let animation = false;
  let drag_start = false;
  let drag_target = '';
  let drop_target = '';

  async function addConfigAtPosition(arg, index){

    const { config } = arg.detail;

    configs = await configManagement.add({configs: configs, index: index, newConfig: config});

    runtime.update.status('USER_EXECUTE').config({lua: _utils.configMerge({config: configs})}).sendToGrid();
  }

  function handleDrop(e){
    if(drop_target !== 'bin'){
      configs = configManagement.reorder({
        configs: configs, 
        drag_target: drag_target, 
        drop_target: drop_target, 
        isMultiDrag: e.detail.multi
      });
    } else {
      configs = configManagement.remove({
        configs: configs, 
        array: drag_target
      });
    }

    runtime.update.status('USER_EXECUTE').config({lua: _utils.configMerge({config: configs})}).sendToGrid();

  }

  function handleConfigChange({configName}){
    // when rendering the Else and End config-blocks, they automatically send out their respective values
    // this results in config change trigger, which should not be sent out to grid, consider it as AUTO change
    if(configName == 'End' || configName == 'Else'){
      runtime.update.status('BACKGROUND').config({lua: _utils.configMerge({config: configs})});
    } else {
      runtime.update.status('USER_EXECUTE').config({lua: _utils.configMerge({config: configs})}).sendToGrid();
    }

    localDefinitions.update(configs);

  }

</script>

<configs class="w-full block px-4 bg-primary py-2 mt-4">

  <div class="pt-1 flex items-center justify-between">
    <div class="text-gray-600 text-sm">Configurations</div>
    <MultiSelect/>
  </div>

    <div 
      use:changeOrder={{configs}} 
      on:drag-start={(e)=>{drag_start = true; actionIsDragged.set(true)}}  
      on:drag-target={(e)=>{drag_target = e.detail.id;}}
      on:drop-target={(e)=>{drop_target = e.detail.drop_target;}}
      on:drop={handleDrop}
      on:drag-end={(e)=>{ drag_start = false; actionIsDragged.set(false); drop_target = undefined; drag_target = [];}}
      on:anim-start={()=>{ animation= true;}}
      on:anim-end={()=>{ animation = false;}}  
      class="flex flex-col relative min-h-200 justify-between">

      <config-list class="flex flex-col w-full">
        {#if !drag_start}
          <ConfigPicker index={0} {configs} {animation} on:new-config={(e)=>{addConfigAtPosition(e, 0)}}/>
        {:else}
          <DropZone index={-1} {configs} {drop_target} {drag_target} {animation} {drag_start}/>
        {/if}

        {#each configs as config, index (config.id)}
          <anim-block animate:flip={{duration: 300}} in:fade={{delay: 0}} class="block select-none">
            <DynamicWrapper let:toggle {drag_start} {index} {config}>
                <svelte:component slot="config" this={config.component} {config} {index} on:output={(e)=>{config.script = e.detail.script; handleConfigChange({configName: config.information.desc}); configs = configs;}}/>  
                <Options slot="options" {toggle} {index} {configs} groupType={config.information.groupType} componentName={config.component.name} />
            </DynamicWrapper>

            <ConfigExtension {index} {config} on:output={(e)=>{config.script = e.detail.script; handleConfigChange(); configs = configs; }}/>
            
            {#if !drag_start}
              <ConfigPicker index={index + 1} {animation} {configs} on:new-config={(e)=>{addConfigAtPosition(e, index + 1)}}/>
            {:else}
              <DropZone {configs} {index} {drag_target} {drop_target} {animation} {drag_start}/>
            {/if}
                  
          </anim-block>
        {/each}
      </config-list>
      <container class="flex flex-col w-full">
        {#if !drag_start}
          <ConfigPicker  userHelper={true} index={configs.length + 1} {animation} {configs} on:new-config={(e)=>{addConfigAtPosition(e, configs.length + 1)}}/>
        {:else}
          <Bin/>
        {/if}
      </container>
    </div>

  </configs>

  <Debug {configs}/>

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

</style>