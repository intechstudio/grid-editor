<script>

  import { fly } from 'svelte/transition';
  import { appSettings } from '../../_stores/app-helper.store.js';


  import Debug from '../../../debug/Debug.svelte';
  import ConfigParameters from './ConfigParameters.svelte';
  import ConfigList from './ConfigList.svelte';

  import Pages from './Pages.svelte';
  
  import TooltipSetter from '../../user-interface/tooltip/TooltipSetter.svelte';

  import { runtime, localDefinitions, conditionalConfigPlacement, user_input, engine } from '../../../runtime/runtime.store.js';

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

  
  let configs = [];
  let stringname = "";
  let events = {options: ['', '', ''], selected: ""};
  let elements = {options: [], selected: ""};
  let pages =  {options: ['', '', '', ''], selected: ""};

  function changeSelectedConfig(arg){
    $appSettings.configType = arg;

    if(arg == 'systemEvents'){ // maybe ui.event.elementnumber = 255 ?
      user_input.update((ui) => {ui.event.elementnumber = 255; ui.event.eventtype = 4; return ui});
    }

    if(arg == 'uiEvents'){
      user_input.update((ui) => {ui.event.elementnumber = 0; ui.event.eventtype = 0; return ui});
    }
  }

  // if runtime.active_config changes then...
  runtime.active_config(active => {

    try{
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
        stringname = active.stringname;
      }

      // set UI to uiEvents, if its not system events
      if(elements.selected !== 255){
        $appSettings.configType = 'uiEvents';
      }
    }catch(e){
      //SORRY
    }

  });

  

  onMount(()=>{

    const cfg = '--[[@l]]local x,y,z=this.ind(),this.val(0,1,"h"), 2'
  
  })



</script>

<configuration class="w-full h-full flex flex-col { $engine == 'ENABLED' ? '' : 'pointer-events-none'}">

  <Pages {pages}/>

  <tabs class="flex flex-row items-start mt-4">
    <tab 
      on:click={()=>{changeSelectedConfig('uiEvents')}} 
      class="{$appSettings.configType == 'uiEvents' ? "bg-primary" : "bg-secondary"} relative px-4 py-2 cursor-pointer text-white rounded-t-md">
      <span>
        UI Events
      </span>
      <TooltipSetter mode={1} key={"configuration_ui_events"}/>
    </tab>
    <tab 
      on:click={()=>{changeSelectedConfig('systemEvents')}} 
      class="{$appSettings.configType == 'systemEvents' ? "bg-primary" : "bg-secondary"} relative px-4 py-2 cursor-pointer text-white rounded-t-md">
      <span>
        System Events
      </span>
      <TooltipSetter mode={1} key={"configuration_system_events"}/>
    </tab>
  </tabs>

  {#key $appSettings.configType == 'uiEvents'}
    <container class="flex flex-col h-full" in:fly={{x: $appSettings.configType == 'uiEvents' ? -5 : 5, opacity: 0.5, duration: 200, delay: 0}} >

      <ConfigParameters {stringname} {configs} {events} {elements}/>

      <ConfigList {pages} {events} {configs}/>

    </container>
  {/key}
</configuration>


