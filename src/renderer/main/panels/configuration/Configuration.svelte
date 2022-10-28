<script>
  import { writable, get, derived } from 'svelte/store';
  
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  import ConfigParameters from './ConfigParameters.svelte';

  let actionIsDragged = false

  import Pages from './components/Pages.svelte';
  
  import TooltipSetter from '../../user-interface/tooltip/TooltipSetter.svelte';
  import TooltipQuestion from '../../user-interface/tooltip/TooltipQuestion.svelte';


  import { 
    runtime,
    elementNameStore, appMultiSelect, 
    luadebug_store, 
    localDefinitions, conditionalConfigPlacement, 
    user_input,
    engine 
  } from '../../../runtime/runtime.store.js';


  import { dropStore } from './Configuration.store.js';

  import _utils from '../../../runtime/_utils.js';

  import { onMount } from 'svelte';


  import { configListScrollSize } from '../../_actions/boundaries.action';

  import MultiSelect from './components/MultiSelect.svelte';
  import Bin from './components/Bin.svelte';
  import DropZone from './components/DropZone.svelte';
  import DynamicWrapper from './components/DynamicWrapper.svelte';

  import ExportConfigs from './components/ExportConfigs.svelte';


  import { changeOrder } from '../../_actions/move.action.js';

  import { configManagement} from './Configuration.store.js'
  import AddAction from './components/AddAction.svelte';

  import grid from "../../../protocol/grid-protocol"
    import { appSettings } from '../../../runtime/app-helper.store';


  let configs = [];
  let events = {options: ['', '', ''], selected: ""};
  let elements = {options: [], selected: ""};
  let pages =  {options: ['', '', '', ''], selected: ""};

  let access_tree = {};

  function configuration_panel_reset(){

    configs = [];
    events = {options: ['', '', ''], selected: ""};
    elements = {options: [], selected: ""};
    pages =  {options: ['', '', '', ''], selected: ""};

  }

  onMount(()=>{
    console.log("configuration mount.y")
  })


  function changeSelectedConfig(arg){ 
    $appSettings.configType = arg;

    if(arg == 'systemEvents'){ // maybe ui.event.elementnumber = 255 ?
      user_input.update((ui) => {
        ui.event.elementnumber = 255; 
        ui.event.eventtype = 4; 
        ui.event.elementtype = "system"; 
        return ui});
    }

    if(arg == 'uiEvents'){

      const rt = get(runtime);
      const ui = get(user_input);
      const device = rt.find(device => device.dx == ui.brc.dx && device.dy == ui.brc.dy)

      if (device === undefined){
        return;
      }

      user_input.update((ui) => {
        ui.event.elementnumber = 0; 
        ui.event.eventtype = 0; 
        ui.event.elementtype = device.pages[ui.event.pagenumber].control_elements[0].controlElementType; 
        return ui
      });
    }
  }
  user_input.subscribe(ui=>{


    appMultiSelect.reset();

    let config = [];
    let selectedEvent = "";

    const rt = get(runtime);
    const device = rt.find(device => device.dx == ui.brc.dx && device.dy == ui.brc.dy)

    if (device === undefined){

      if (rt.length === 0){
        console.log("ACTIVE_CONFIG: disconnect")
        configuration_panel_reset()
        return;
      }

      return;
    }


    let module_type = device.id.split("_")[0]

    let element_type = grid.moduleElements[module_type][ui.event.elementnumber]

    let pageIndex = device.pages.findIndex(x => x.pageNumber == ui.event.pagenumber);
    let elementIndex = device.pages[pageIndex].control_elements.findIndex(x => x.controlElementNumber == ui.event.elementnumber);

    if (elementIndex === -1){
      //console.log("MAXOS PARA")
      elementIndex = 0;
    }

    const eventIndex = device.pages[pageIndex].control_elements[elementIndex].events.findIndex(x => x.event.value == ui.event.eventtype);

    if (eventIndex === -1){
      selectedEvent = device.pages[pageIndex].control_elements[elementIndex].events[0];
      ui.event.eventtype = 0;
    }
    else{
      selectedEvent = device.pages[pageIndex].control_elements[elementIndex].events[eventIndex];
    }

    if (selectedEvent === undefined){
      //console.log("SORRY", pageIndex, elementIndex, eventIndex);
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


    let active = {
      elementtype: element_type,
      config: config,
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


    if (active === undefined){
      return;
    }
 
    let res = _utils.gridLuaToEditorLua(active.config)

    if (res === undefined){
      return;
    }

    let res_is_valid = true;

    res.forEach(element => {
      if (element.information === undefined){
        res_is_valid = false;
      }
    });


    if (res !== undefined && res_is_valid){ 
      configs = res;
      dropStore.update(res);
      conditionalConfigPlacement.set(configs);
      localDefinitions.update(configs);

      access_tree.elementtype = active.elementtype
    }

    
    // let use of default dummy parameters
    if(active.elements.selected !== ""){
      events = active.events;
      elements = active.elements;
      pages = active.pages;
      
    }

    // set UI to uiEvents, if its not system events
    if(elements.selected !== 255){
      $appSettings.configType = 'uiEvents';
    }
   

  });

  

  // ========================= FROM OLD CONFIGLIST IMPLEMENTATION ======================= //

  let disable_pointer_events = false;
  let animation = false;
  let drag_start = false;
  let drag_target = '';
  let drop_target = '';

  let scrollHeight = '100%';

  async function addConfigAtPosition(arg, index){

   // console.log("addConfigAtPosition")

    const { config } = arg.detail;

    if (config === undefined || config === ""){
      return;
    }

    configs = await configManagement().drag_and_drop.add({configs: configs, index: index, newConfig: config});

    send_to_grid()
  }

  function send_to_grid(){
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

    //console.log("handleDrop")

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
    
    send_to_grid()

  }

  $: luadebug_store.update_config(_utils.configMerge({config: configs}));




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
      <TooltipSetter key={"configuration_ui_events"}/>
    </tab>
    <tab 
      on:click={()=>{changeSelectedConfig('systemEvents')}} 
      class="{$appSettings.configType == 'systemEvents' ? "bg-primary" : "bg-secondary"} relative px-4 py-2 cursor-pointer text-white rounded-t-md">
      <span>
        System Events
      </span>
      <TooltipSetter key={"configuration_system_events"}/>
    </tab>
  </tabs>


    {#key $appSettings.configType == 'uiEvents'}


      <container class="flex flex-col h-full" in:fly={{x: $appSettings.configType == 'uiEvents' ? -5 : 5, opacity: 0.5, duration: 200, delay: 0}} >

        <ConfigParameters {configs} {events} {elements}/>

     

        <configs class="w-full h-full flex flex-col px-4 bg-primary pb-2">

          <div class="text-gray-500 text-sm">Actions</div>
          <div class="pt-1 flex items-center  justify-end">
            <MultiSelect/>
          </div>
        
          <div 
            use:changeOrder={{configs}} 
            on:disable-pointer-events={(e)=>{disable_pointer_events = true;}}
            on:drag-start={(e)=>{drag_start = true; actionIsDragged = true; appMultiSelect.reset();}}  
            on:drag-target={(e)=>{drag_target = e.detail.id; }}
            on:drop-target={(e)=>{drop_target = e.detail.drop_target;}}
            on:drop={handleDrop}
            on:drag-end={(e)=>{ drag_start = false; actionIsDragged = true; drop_target = undefined; drag_target = [];}}
            on:enable-pointer-events={(e)=>{disable_pointer_events = false;}}
            on:anim-start={()=>{ animation= true;}}
            on:anim-end={()=>{ animation = false;}}  
            class="flex flex-col h-full relative justify-between">
        
            <config-list id="cfg-list" style="height:{scrollHeight}" use:configListScrollSize={configs} on:height={(e)=>{scrollHeight = e.detail}} class="flex flex-col w-full  h-auto overflow-y-auto">
              
        
              {#if configs.length !==0}
        
                {#if !drag_start}
                  <AddAction {animation} on:new-config={(e)=>{addConfigAtPosition(e, 0)}}/>
                {:else}
                  <DropZone index={-1} {configs} {drop_target} {drag_target} {animation} {drag_start}/>
                {/if}
        
                {#if configs !== undefined}
                  {#each configs as config, index (config.id)}
                    <anim-block animate:flip={{duration: 300}} in:fade={{delay: 0}} class="select-none {config.information.rendering == 'hidden' ? 'hidden' : 'block'}">
                      <DynamicWrapper let:toggle {disable_pointer_events} {index} {config} {configs} {access_tree}> 
        
                      </DynamicWrapper>
        
                      {#if !drag_start}
                        <AddAction {animation} on:new-config={(e)=>{addConfigAtPosition(e, index + 1)}}/>
                      {:else}
                        <DropZone {configs} {index} {drag_target} {drop_target} {animation} {drag_start}/>
                      {/if}
                            
                    </anim-block>
                  {/each}
                {/if}
        
        
              {/if}
        
            </config-list>
        
            <container class="flex flex-col w-full">
              {#if !drag_start}
                <div class="w-full flex justify-between mb-3">
                  <AddAction userHelper={true} {animation} on:new-config={(e)=>{addConfigAtPosition(e, configs.length + 1)}}/>
                  <ExportConfigs/>
                </div>
              {:else}
                <Bin/>
              {/if}
            </container>
          </div>
        
        </configs>
        



      </container>
    {/key}


</configuration>





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