<script>
  import { writable, get, derived } from 'svelte/store';
  
  import { fly } from 'svelte/transition';
  import { actionPrefStore, appSettings } from '../../_stores/app-helper.store.js';

  import ConfigParameters from './ConfigParameters.svelte';
  import ConfigList from './ConfigList.svelte';

  import Pages from './Pages.svelte';
  
  import TooltipSetter from '../../user-interface/tooltip/TooltipSetter.svelte';

  import { runtime, appMultiSelect, localDefinitions, conditionalConfigPlacement, user_input, engine } from '../../../runtime/runtime.store.js';

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



  const active_config = derived([user_input], ([ui]) => {


    // whenever the UI changes, reset multiselect
    appMultiSelect.reset();

    // close advanced views
    actionPrefStore.reset();

    const rt = get(runtime);


    // fetch or load config now inline

    let config = [];
    let selectedEvent = "";

    const device = rt.find(device => device.dx == ui.brc.dx && device.dy == ui.brc.dy)

    if (device === undefined){
      return;
    }

    const pageIndex = device.pages.findIndex(x => x.pageNumber == ui.event.pagenumber);
    const elementIndex = device.pages[pageIndex].control_elements.findIndex(x => x.controlElementNumber == ui.event.elementnumber);
    const eventIndex = device.pages[pageIndex].control_elements[elementIndex].events.findIndex(x => x.event.value == ui.event.eventtype);

    if (eventIndex === -1){
      selectedEvent = device.pages[pageIndex].control_elements[elementIndex].events[0];
      ui.event.eventtype = 0;
    }
    else{
      selectedEvent = device.pages[pageIndex].control_elements[elementIndex].events[eventIndex];
    }

    if (selectedEvent === undefined){
      console.log("SORRY", pageIndex, elementIndex, eventIndex);
      return;
    }

    if(selectedEvent.config.length){
      config = selectedEvent.config.trim();
    }

    const cfgstatus = selectedEvent.cfgStatus;

    if (cfgstatus == 'GRID_REPORT' || cfgstatus == 'EDITOR_EXECUTE' || cfgstatus == 'EDITOR_BACKGROUND' ){
      // its loaded
    }
    else{
      // fetch      
      const callback = function(){
        // trigger change detection
        user_input.update(n => n);
      }

      runtime.fetchOrLoadConfig(ui, callback);

    }

    console.log("ACTIVE_CONFIG change")

    return {
      config: config,
      stringname: "",
      events: {
        selected: selectedEvent.event,
        options: device.pages[pageIndex].control_elements[elementIndex].events.map(e => e.event)
      }, 
      elements: {
        selected: ui.event.elementnumber,
        options: device.pages[pageIndex].control_elements.map((n) => n.controlElementNumber)
      },
      pages: {
        selected: ui.event.pagenumber,
        options: device.pages.map((n) => n.pageNumber)
      }
    }
  });



  // if active_config changes then...
  active_config.subscribe(active => {

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


