<script>

  import { fly } from 'svelte/transition';
  import { appSettings } from '../../_stores/app-helper.store.js';


  import Debug from '../../../debug/Debug.svelte';
  import ConfigParameters from './ConfigParameters.svelte';
  import ConfigList from './ConfigList.svelte';

  import Pages from './Pages.svelte';


  import { runtime, localDefinitions, conditionalConfigPlacement, user_input } from '../../../runtime/runtime.store.js';

  import { dropStore } from '../../../runtime/config-manager.store.js';

  import _utils from '../../../runtime/_utils.js';
  import { onMount } from 'svelte';

  const grid_raw_actions = `
  --[[@l]]
  local x = 1 local y = -12 + elem_num(1 + 2)
  --[[@glp]]
  glp(0,1,2)
  --[[@cb]]
  if x == 1 then gms(1,176,7,this.element[0]) end`
  ;

  //_utils.gridLuaToEditorLua(grid_raw_actions).then(config =>{ console.log(config); runtime.set(config)})

  let selectedConfig = 'uiEvents';

  let configs = [];
  let events = {options: ['', '', ''], selected: ""};
  let elements = {options: [], selected: ""};
  let pages =  {options: ['', '', '', ''], selected: ""};

  function changeSelectedConfig(arg){
    selectedConfig = arg;
    $appSettings.configType = selectedConfig;
  }

  runtime.active_config(active => {
    _utils.gridLuaToEditorLua(active.config).then(res => { 
      configs = res;
      dropStore.update(res);
      conditionalConfigPlacement.set(configs);
      localDefinitions.update(configs);
    }).catch(err => {console.error(err); configs = [];})

    // let use of default dummy parameters
    if(active.elements.selected !== ""){
      events = active.events;
      elements = active.elements;
      pages = active.pages;
    }

  });




</script>

<configuration class="w-full h-full flex flex-col">

  <Pages {pages}/>

  <tabs class="flex flex-row items-start mt-4">
    <tab 
      on:click={()=>{changeSelectedConfig('uiEvents')}} 
      class="{selectedConfig == 'uiEvents' ? "bg-primary" : "bg-secondary"} px-4 py-2 cursor-pointer text-white rounded-t-md">
      <span>
        UI Events
      </span>
    </tab>
    <tab 
      on:click={()=>{changeSelectedConfig('systemEvents')}} 
      class="{selectedConfig == 'systemEvents' ? "bg-primary" : "bg-secondary"} px-4 py-2 cursor-pointer text-white rounded-t-md">
      <span>
        System Events
      </span>
    </tab>
  </tabs>

  {#key $appSettings.configType == 'uiEvents'}
    <container class="flex flex-col h-full" in:fly={{x: $appSettings.configType == 'uiEvents' ? -5 : 5, opacity: 0.5, duration: 200, delay: 0}} >

      <ConfigParameters {events} {elements}/>

      <ConfigList {configs}/>

    </container>
  {/key}
</configuration>


