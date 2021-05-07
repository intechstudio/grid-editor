<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

  import MultiSelect from './components/MultiSelect.svelte';
  import Bin from './components/Bin.svelte';
  import DropZone from './components/DropZone.svelte';
  import DynamicWrapper from './components/DynamicWrapper.svelte';
  import Options from './components/Options.svelte';

  import ConfigExtension from './ConfigExtension.svelte';
  import ConfigPicker from './ConfigPicker.svelte';

  import { changeOrder } from '../../actions/move.action.js';

  import { dropStore, actionIsDragged } from '../../stores/app-helper.store.js';
  import { runtime } from '../../../runtime/runtime.store.js';
  import _utils from '../../../runtime/_utils';

  let configs = [];
  
  let animation = false;
  let drag_start = false;
  let drag_target = '';
  let drop_target = '';

  runtime.subscribe(store => {configs = store})

  async function addConfigAtPosition(arg, index){
    const { config } = arg.detail;
    
    initConfigs(config).then(res => {
      console.log(res);
      configs = [...configs.slice(0, index), ...res, ...configs.slice(index , configs.length)];
      configsChanged(configs);
    });
  }

  async function initConfigs(config){
    let configs = _utils.rawLuaToConfigList(config);
    configs = _utils.configBreakDown(configs);
    return await _utils.extendProperties(configs)
  }


  function calcMultiChangeConfigs(drag_target, drop_target){
    if(isDropZoneAvailable(drop_target)){
      let grabbed = [];
      drag_target.forEach(id => {
        grabbed.push(configs.find((act) => Number(id) === act.id));
      });
      const firstElem = configs.indexOf(grabbed[0]);
      const lastElem = configs.indexOf(grabbed[grabbed.length-1]);
      let to = Number(drop_target) + 1;
      // correction for multidrag
      if(to > firstElem){
        to = to - drag_target.length;
      }
      configs = [...configs.slice(0, firstElem), ...configs.slice(lastElem + 1)];
      configs = [...configs.slice(0, to), ...grabbed, ...configs.slice(to)];
      configsChanged(configs);
    };
  }

  function calcSingleChangeConfigs(drag_target, drop_target){
    const grabbed = configs.find((act) => Number(...drag_target) === act.id);
    const from  = configs.indexOf(grabbed);
    let   to    = Number(drop_target);
    if(to < from){ to = to + 1 };
    configs = [...configs.slice(0, from), ...configs.slice(from + 1 )];
    configs = [...configs.slice(0, to), grabbed, ...configs.slice(to)];
    configsChanged(configs);
  }

  function isDropZoneAvailable(drop_target){
    if(drop_target < 0) drop_target += 1; // dont let negative drop target come into play
    const target_index = configs.indexOf(drop_target);
    const found = $dropStore.disabledDropZones.find(index => index == target_index);
    if(found){
      return 0;
    }
    return 1
  }

  function handleDrop(e){
 
    if(drop_target !== 'bin'){
      if(e.detail.multi){
        calcMultiChangeConfigs(drag_target, drop_target)
      } else {
        calcSingleChangeConfigs(drag_target, drop_target)
      }
    } else {
      appActionManagement.remove(drag_target);
    }

  }
 
  // actions changed
  function configsChanged(configs){
    console.log('config changed...', configs)
    runtime.set(configs);
    dropStore.disabledDropZones();
  }


</script>


<actions class="w-full block px-4 bg-primary py-2 mt-4">

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
      class="relative">

      {#if !drag_start}
        <ConfigPicker index={0} {configs} {animation} on:new-config={(e)=>{addConfigAtPosition(e, 0)}}/>
      {:else}
        <DropZone index={-1} {drop_target} {drag_target} {animation} {drag_start}/>
      {/if}

      {#each configs as config, index (config.id)}
        <anim-block animate:flip={{duration: 300}} in:fade={{delay: 300}} class="block select-none">
          <DynamicWrapper let:toggle {drag_start} {index} {config}>
              <svelte:component slot="config"  this={config.component} {config} {index} on:output={(e)=>{config.script = e.detail; config = config; runtime.set(configs)}}/>  
              <Options slot="options" {toggle} {index} groupType={config.groupType} componentName={config.component.name} />
          </DynamicWrapper>

          <ConfigExtension {index} {config} on:output={(e)=>{config.script = e.detail; config = config; }}/>
          
          {#if !drag_start}
            <ConfigPicker index={index + 1} {animation} {configs} on:new-config={(e)=>{addConfigAtPosition(e, index)}}/>
          {:else}
            <DropZone {index} {drag_target} {drop_target} {animation} {drag_start}/>
          {/if}
                
        </anim-block>
      {/each}

      {#if !drag_start}
        <ConfigPicker userHelper={true} index={configs.length + 1} {animation} {configs} on:new-config={(e)=>{addConfigAtPosition(e, configs.length + 1)}}/>
      {:else}
        <Bin/>
      {/if}
      
    </div>

</actions>

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