<script>

  import { fade } from 'svelte/transition';

  import { onMount, onDestroy } from 'svelte';

  import { runtime } from '../../stores/runtime.store.js';

  import { tour } from '../../stores/tour.store';

  import { localInputStore, derivedInputStore, localConfigReportStore } from '../../stores/control-surface-input.store';

  import { profileStore } from '../../stores/profiles.store';

  import ActionList from './ActionList.svelte';
  import ActionWrapper from './ActionWrapper.svelte';
  import ActionCommands from './ActionCommands.svelte';

  import OverlayToggle from '../../core/grid-modules/overlays/OverlayToggle.svelte';

  import { GRID_PROTOCOL } from '../../core/classes/GridProtocol.js';

  import { serialComm } from '../../core/serialport/serialport.store.js';
  import { commands } from '../shared/handshake.store.js';
  import Commands from '../shared/Commands.svelte';
  import { appSettings } from '../../stores/app-settings.store.js';

  import { parameter_parser } from './actions/action-helper.js';

  let inputStore = {
    bankActive : -1,
    elementNumber : -1
  };

  let arrayOfSelectableActions = [
    { id: 0, name: 'MIDI Dynamic', value: 'MIDIRELATIVE' },
    { id: 1, name: 'MIDI Static', value: 'MIDIABSOLUTE'},
    { id: 2, name: 'LED Color', value: 'LEDCOLOR' },
    { id: 3, name: 'LED Phase', value: 'LEDPHASE' },
    //{ id: 4, name: 'Keyboard - Atomic', value: 'HIDKEYBOARD' },
    { id: 5, name: 'Keyboard - Macro', value: 'HIDKEYMACRO' },
    { id: 6, name: 'RAW', value: 'RAW' },
  ];

  let selectedAction = arrayOfSelectableActions[0];

  let actions = [];
  let temp_actions = [];
  
  let element_color;

  let moduleId = '';

  let moduleInfo;
  let eventInfo;
  let elementInfo;

  let events = [];

  let selectedEvent = '';

  let controlElementName = '';

  // copy-c and copy-v

  let copiedActions;

  // ElementSettings store subscription

  // main

  let RUNTIME;

  //runtime.subscribe(changes => {RUNTIME = changes; console.log(RUNTIME)})

  function renderLocalConfiguration(){
    $runtime.forEach(controller => {
      if(controller.dx == inputStore.dx && controller.dy == inputStore.dy && inputStore.elementNumber !== -1 && inputStore.bankActive !== -1){

        moduleInfo = controller;
        moduleId = controller.id;  
        events = controller.banks[inputStore.bankActive][inputStore.elementNumber].events.map((cntrl)=>{return cntrl.event});        
        selectedEvent = checkIfSelectedEventIsCorrect(inputStore, events);

        // currently selected control element on bank x, with activated event y
        let elementEvent = controller.banks[inputStore.bankActive][inputStore.elementNumber].events.find(cntrl => cntrl.event == selectedEvent);
        
        eventInfo = elementEvent.event;  
        elementInfo = controller.banks[inputStore.bankActive][inputStore.elementNumber].controlElementType;

 
        if(elementEvent.cfgStatus == "expected" || elementEvent.cfgStatus == "fetched"){
          const fetch = runtime.fetchLocalConfig(controller, inputStore);
          serialComm.write(fetch);
          elementEvent.cfgStatus = "fetched";
        }

        actions = runtime.configsToActions(elementEvent.config);

        controlElementName = controller.banks[inputStore.bankActive][inputStore.elementNumber].controlElementName || '';
      }
    });
  }

  function checkIfSelectedEventIsCorrect(settings, events){
    let event = events.find(e => e.value == settings.eventType);
    if(!event){
      event = events[1];
    }
    return event;
  }

  function manageActions(action){
    actions = [...actions, initActionParameters(action)];
    return action;
  }

  function initActionParameters(action){
    //let action = {name: actionValue}
    let parameters = []
    return {...action, parameters}
  }

  function handleRemoveAction(e){
    const action = e.detail.action;
    const index = e.detail.index;
    runtime.update((store)=>{
      store.map((controller)=>{
        if(controller.dx == inputStore.dx && controller.dy == inputStore.dy && inputStore.elementNumber !== -1){
          let elementEvent = controller.banks[inputStore.bankActive][inputStore.elementNumber].events.find(cntrl => cntrl.event == selectedEvent);   
          elementEvent.config.splice(index,1);
          actions = runtime.configsToActions(elementEvent.config); // update this list too. does kill smooth animations

          commands.validity("LOCALSTORE",true);
          
          elementEvent.cfgStatus = "changed";
          //sendChangesToGrid(elementEvent.config)
          
        }
        return controller;
      })
      return store;
    })
  }

  function handleSelectEvent(event){
    localInputStore.update((values)=>{
      values.eventType = event.value;
      return values;
    })
  }

  function handleOnActionChange(e){
    const action = e.detail.action;
    const index = e.detail.index;

    // update runtime based on editor from configuration
    runtime.update((store)=>{
      store.map((controller)=>{
        if(controller.dx == inputStore.dx && controller.dy == inputStore.dy && inputStore.elementNumber !== -1){
          
          let elementEvent = controller.banks[inputStore.bankActive][inputStore.elementNumber].events.find(cntrl => cntrl.event == selectedEvent);
                    
          temp_actions[index] = {name: action.value, parameters: action.parameters}; 
          
          elementEvent.config[index] = runtime.actionToConfig(temp_actions[index]);
          
          commands.validity("LOCALSTORE", true);

          elementEvent.cfgStatus = "changed";
          // comment this out to avoid reactive changes!
          //sendChangesToGrid(elementEvent.config);
        }
      
        return controller;

      });

      return store;   
    });

  }

  function handleControlElementNaming(name){
    // PROBABLY RUNS TOO MANY TIMES, TRY ONBLUR AND OTHER DEBOUNCING METHODS
    runtime.update((store)=>{
      store.map((controller)=>{
        if(controller.dx == inputStore.dx && controller.dy == inputStore.dy){
          controller.banks[inputStore.bankActive][inputStore.elementNumber].controlElementName = name;
        }
        return controller;
      })
      return store; 
    })
  }

  function copyActions(){
    $runtime.forEach(controller => {
      if(controller.dx == inputStore.dx && controller.dy == inputStore.dy){
        let elementEvent = controller.banks[inputStore.bankActive][inputStore.elementNumber].events.find(cntrl => cntrl.event == selectedEvent);
        copiedActions = elementEvent.config;
      }
    });
  }

  function pasteActions(){
    runtime.update((store)=>{
      store.map((controller)=>{
        if(controller.dx == inputStore.dx && controller.dy == inputStore.dy){
          let elementEvent = controller.banks[inputStore.bankActive][inputStore.elementNumber].events.find(cntrl => cntrl.event == selectedEvent);
          const newConfig = JSON.parse(JSON.stringify(copiedActions)); // deep copy of object.
          elementEvent.config = newConfig;
          elementEvent.cfgStatus = "changed";
          //sendChangesToGrid(elementEvent.config)
        }
        return controller;
      });   
      return store;
    });
    renderLocalConfiguration();
  }

  function recallActions(){

    const command = GRID_PROTOCOL.encode(
      moduleInfo,
      'CONFIGDEFAULT',
      'EXECUTE',
      [
        { BANKNUMBER: parameter_parser(inputStore.bankActive)}, 
        { ELEMENTNUMBER: parameter_parser(inputStore.elementNumber)}, 
        { EVENTTYPE: parameter_parser(inputStore.eventType)}, 
      ], 
      ''
    );
    serialComm.write(command);

    renderLocalConfiguration();
  }

  onMount(()=>{

    // Render local input settings if BANK or SELECTED CONTROL ELEMENT changes
    derivedInputStore.subscribe(store =>{
      inputStore = store;
      console.log('derivedInputStore', store);
      renderLocalConfiguration();
    });

    // Update runtime based on received config from Grid.
    // This is called, when config is fetched, interaction happened with a control element where no cfg found.
    localConfigReportStore.subscribe(store => {
      let cfgReport = false;
      runtime.update(runtime => {
        runtime.forEach(controller =>{
          if(controller.dx == store.brc.DX && controller.dy == store.brc.DY){
            let events = controller.banks[store.frame.BANKNUMBER][store.frame.ELEMENTNUMBER].events.find(cntrl => cntrl.event.value == store.frame.EVENTTYPE);
            // Upon connecting modules, messages on config are sent back to editor at instant.
            // To avoid unnecessary message flow, filter configs sent back with the cfgstatus flag.
            if(events){
            // here this should be figured out... what to do on profile load or other...
              if(events.cfgStatus == "fetched"){
                if(store.cfgs.length > 0){
                  events.config = store.cfgs;
                } else if(store.cfgs.length == 0){
                  events.config = [];
                }
                cfgReport = true;
                events.cfgStatus = "received"
              }
            }
          }
        })
        return runtime;
      });

      // Render only if config is successfully read back!
      cfgReport ? renderLocalConfiguration() : null;

    });

    profileStore.subscribe(store => {
      if(store !== undefined && store !== ''){
        // load only banks!
        runtime.update(runtime => {
          runtime.forEach((controller, i) => { 
            if(store[i].banks !== undefined){
              console.log(controller, i, store[i].banks)
              controller.banks = store[i].banks;
            }
          })
          return runtime;
        });

        store.forEach(controller => {
          controller.banks.forEach((bank) => {
            bank.forEach((controlElement) => {
              controlElement.events.forEach(event => {
                event.cfgStatus = "changed";                
              })
            })
          })
        });
        commands.validity("LOCALSTORE", true);
        renderLocalConfiguration();
      }
    });

});
    

</script>

<style>

  .disabled{
    background-color:#c1c1c1;
    cursor: not-allowed;
  }

  ::-webkit-scrollbar {
      height: 6px;
      width: 6px;
      @apply bg-secondary;
  }

  ::-webkit-scrollbar-thumb {
      background: #286787;
      box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
      -webkit-box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
  }

  ::-webkit-scrollbar-corner {
      background: #1e2628
  }

</style>



<div class:tour={$tour.selectedName == "LocalSettings"} class="inline-block primary rounded-lg p-4 z-30 w-full">
  <div class="flex flex-col relative justify-between font-bold text-white m-2">
    <div class="text-xl">Local Settings</div>
    {#if moduleId != '' && $localInputStore.elementNumber != undefined}
      <div class="text-orange-500 py-1">Module: {moduleId == '' ? '-' : moduleId.substr(0,4)}</div>
      <div class="text-orange-500 text-4xl absolute right-0">{$localInputStore.elementNumber == undefined ? '-' : $localInputStore.elementNumber}</div>
    {/if}
  </div>
  {#if inputStore.elementNumber !== -1 && inputStore.bankActive !== -1}
  
  <!--
  <div class="flex flex-col px-2 my-4 w-full">
    <div class="text-gray-700 flex py-1">
      <div>Name</div>
      <OverlayToggle type={'controlName'}/>
    </div>
    
    <input 
      bind:value={controlElementName}
      on:input={e => handleControlElementNaming(controlElementName)}
      type="text" 
      class="w-full secondary text-white p-1 pl-2 rounded-none focus:outline-none" 
      placeholder="Your name for this control element...">  
  </div>
  -->

  <div class="flex flex-col">
    <div class="text-gray-700 py-1 mx-2">
      Events
    </div>

    <div class:tour={$tour.selectedName == "Events"} class="flex mx-1 secondary  rounded-lg shadow overflow-x-auto">
      {#each events as event}
        <button 
          on:click={()=>{handleSelectEvent(event)}} 
          class:shadow-md={selectedEvent === event}
          class:bg-highlight={selectedEvent === event}
          class="m-2 p-1 text-white flex-grow outline-none border-0 rounded hover:bg-highlight-400  focus:outline-none">
          {event.desc}
        </button>
      {/each}
    </div>


  
    <div class="mx-2 my-4">

      <div class="text-gray-700 py-1">
        Actions
      </div>

      <div class="flex w-full">

          <div class="flex flex-col xl:flex-row w-full justify-between"> 

            <div class="flex w-full xl:w-2/3">         
              <select class:tour={$tour.selectedName == "Actions"} bind:value={selectedAction} class="secondary flex-grow text-white p-1 mr-2 rounded-none focus:outline-none">
                {#each arrayOfSelectableActions as action}
                  <option value={action} class="secondary  text-white">{action.name}</option>
                {/each}
              </select>
              <button 
                disabled={selectedAction === undefined} 
                class:disabled={selectedAction === undefined} 
                on:click={()=>{selectedAction = manageActions(selectedAction); }} 
                class="bg-highlight w-32 font-medium text-white py-1 px-2 rounded-none border border-highlight hover:bg-highlight-400 focus:outline-none"
                >
                Add Action
              </button>
            </div>
     
        

            <ActionCommands
              on:copy={copyActions}
              on:paste={pasteActions}
              on:recall={recallActions}
            />
        
          </div>  
      </div>

      

      <div style="max-height:400px" class="mt-4 pr-2 border-secondary overflow-y-scroll overflow-x-hidden">
        <ActionList
          {actions} 
          let:action 
          let:index
          >
            <ActionWrapper 
              on:remove={handleRemoveAction}
              on:change={handleOnActionChange}
              {action} 
              {index}
              {eventInfo}
              {elementInfo}
            />
        </ActionList>
      </div>

    </div>
  </div>

  <hr  class="text-secondary h-1 border-none rounded bg-secondary m-2">

  {:else}
  <div class="px-2 my-4 w-full text-white">
    <span class="px-1">
      {#if $appSettings.layoutMode}
        <p> 
          <span class="flicker">⚠️</span> 
          <span>Please close the <i class="pr-1">Virtual Modules</i> panel to select control elements.</span>
        </p>
      {/if}
      {#if $runtime.length == 0}
        <p> 
          <span class="flicker">⚠️</span>
          <span>Add a module to access <i class="pr-1">Local Settings</i>!</span>
        </p>  
      {/if}
      {#if $runtime.length > 0 && !$appSettings.layoutMode}
        <p>
          <span class="flicker">⚠️</span> 
          Select a 
          {#if inputStore.elementNumber == -1}control element{/if} 
          {#if inputStore.bankActive == -1 && inputStore.elementNumber == -1}and{/if}
          {#if inputStore.bankActive == -1}bank{/if} 
          to start configuration!
        </p>
      {/if}
    </span>
  </div>
  {/if}

  {#if inputStore.elementNumber !== -1}
    <Commands MODE={'LOCAL'}/>
  {/if}



</div>

