<script>

  import { onMount, onDestroy } from 'svelte';

  import { runtime } from '../../stores/runtime.store.js';

  import { localInputStore, globalInputStore, derivedInputStore } from '../../stores/control-surface-input.store';

  import ActionList from './ActionList.svelte';
  import ActionWrapper from './ActionWrapper.svelte';

  import OverlayToggle from '../../core/grid-modules/overlays/OverlayToggle.svelte';

  import { GRID_PROTOCOL } from '../../core/classes/GridProtocol.js';

  import { serialComm } from '../../core/serialport/serialport.store.js';

  let inputStore;

  let arrayOfSelectableActions = [
    { id: 0, name: 'MIDI Dynamic', value: 'MIDIRELATIVE' },
    { id: 1, name: 'MIDI Static', value: 'MIDIABSOLUTE'},
    { id: 2, name: 'LED Color', value: 'LEDCOLOR' },
    { id: 3, name: 'LED Phase', value: 'LEDPHASE' },
    { id: 4, name: 'RAW', value: 'RAW' }
  ];

  let selectedAction = arrayOfSelectableActions[0];

  let actions = [];
  let temp_actions = [];
  
  let element_color;

  let moduleId = '';

  let moduleInfo;
  let eventInfo;

  let events = [];

  let selectedEvent = '';

  let controlElementName = '';

  // copy-c and copy-v

  let copiedActions;

  // ElementSettings store subscription

  // main

  function loadSelectedModuleSettings(){
    $runtime.forEach(controller => {
      if(controller.dx == inputStore.dx && controller.dy == inputStore.dy && inputStore.elementNumber[0] !== -1){

        moduleInfo = controller;
        moduleId = controller.id;  
        events = controller.banks[inputStore.bankActive][inputStore.elementNumber[0]].events.map((cntrl)=>{return cntrl.event.desc});        
        selectedEvent = checkIfSelectedEventIsCorrect(inputStore, events)

        // currently selected control element on bank x, with activated event y
        let elementEvent = controller.banks[inputStore.bankActive][inputStore.elementNumber[0]].events.find(cntrl => cntrl.event.desc == selectedEvent);
        
        eventInfo = elementEvent.event;  

        // no config detected
        /**
         * better handling of no config state! draw in drawio too!
        */
        if(elementEvent.config == "" && !controller.virtual){
          let cfg = runtime.fetchConfig(controller, inputStore)
          serialComm.write(cfg);
          /**
           * 
           * Here the fetched config should be loaded in somehow.
           * Implement helper store maybe?
           * 
          */
        } 
        else if(elementEvent.config !== "" && controller.virtual){
          actions = runtime.configToActions(elementEvent.config)
        } 
        else {
          actions = []
        }

        console.log(elementEvent);

        controlElementName = controller.banks[inputStore.bankActive][inputStore.elementNumber[0]].controlElementName || '';
      }
    });
  }


  function checkIfSelectedEventIsCorrect(settings, events){
    let event = events.find(e => e == settings.eventType);
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
        if(controller.dx == inputStore.dx && controller.dy == inputStore.dy && inputStore.elementNumber[0] !== -1){
          let elementEvent = controller.banks[inputStore.bankActive][inputStore.elementNumber[0]].events.find(cntrl => cntrl.event.desc == selectedEvent);   
          elementEvent.actions.splice(index,1);
          actions = elementEvent.actions; // update this list too. does kill smooth animations
          configStore.remove(index, moduleInfo, eventInfo, inputStore);
        }
        return controller;
      })
      return store;
    })
  }

  function handleFocus(e){
    focus = true;
  }

  function handleSelectEvent(event){
    console.log(event);
    localInputStore.update((values)=>{
      values.eventType = event;
      return values;
    })
  }

  function handleOnActionChange(e){
    const action = e.detail.action;
    const index = e.detail.index;

    runtime.update((store)=>{
      store.map((controller)=>{
        if(controller.dx == inputStore.dx && controller.dy == inputStore.dy && inputStore.elementNumber[0] !== -1){
          
          let elementEvent = controller.banks[inputStore.bankActive][inputStore.elementNumber[0]].events.find(cntrl => cntrl.event.desc == selectedEvent);
                    
          temp_actions[index] = {name: action.value, parameters: action.parameters}; 

          const cfgs = runtime.actionsToConfig(temp_actions);

          const params = [
            { BANKNUMBER: inputStore.bankActive },
            { ELEMENTNUMBER: inputStore.elementNumber[0] },
            { EVENTTYPE: eventInfo.value }
          ]

          const serialized = GRID_PROTOCOL.serialize_cfgs(params, cfgs);

          elementEvent.config = serialized;
          
        }
        return controller;
      })
      return store;   
    });

  }

  function handleControlElementNaming(name){
    // PROBABLY RUNS TOO MANY TIMES, TRY ONBLUR AND OTHER DEBOUNCING METHODS
    runtime.update((store)=>{
      store.map((controller)=>{
        if(('dx:'+controller.dx+';dy:'+controller.dy) == inputStore.position){
          controller.banks[inputStore.bank][inputStore.elementNumber[0]].controlElementName = name;
        }
        return controller;
      })
      return store; 
    })
  }

  function copyActions(){
    $runtime.forEach(controller => {
      if(('dx:'+controller.dx+';dy:'+controller.dy) == inputStore.position){
        let elementEvent = controller.banks[inputStore.bankActive][inputStore.elementNumber[0]].events.find(cntrl => cntrl.event.desc == selectedEvent);
        copiedActions = elementEvent.actions;
      }
    });
  }

  function pasteActions(){
    runtime.update((store)=>{
      store.map((controller)=>{
        if(('dx:'+controller.dx+';dy:'+controller.dy) == inputStore.position){
          let elementEvent = controller.banks[inputStore.bankActive][inputStore.elementNumber[0]].events.find(cntrl => cntrl.event.desc == selectedEvent);
          const newActions = JSON.parse(JSON.stringify(copiedActions)); // deep copy of object.
          elementEvent.actions = newActions;
        }
        return controller;
      });   
      return store;
    });
    loadSelectedModuleSettings();
  }

  onMount(()=>{
    derivedInputStore.subscribe((values)=>{
      inputStore = values;
      console.log('loading values...' , inputStore)
      loadSelectedModuleSettings();
    });


    /*
    configStore.subscribe((store)=>{
      if(store[moduleId] !== undefined){
        let actions;
        if(eventInfo){
          actions = store[moduleId][inputStore.bankActive][eventInfo.value];
        }
        if(actions){   
          const config = [
            { BANKNUMBER: inputStore.bankActive },
            { ELEMENTNUMBER: inputStore.elementNumber[0] },
            { EVENTTYPE: eventInfo.value }
          ]
          let array = [];
          actions.forEach(a => {
            array.push(...a);
          });
          const serialized = GRID_PROTOCOL.serialize_actions(config, array);
          serialComm.write(GRID_PROTOCOL.encode(moduleInfo,'','',serialized));
        }
      }   
    })
*/
  })

  


</script>

<style>

  .disabled{
    background-color:#c1c1c1;
    cursor: not-allowed;
  }

</style>




<div class="inline-block primary rounded-lg p-4 z-30 w-full">
  <div class="flex flex-col relative justify-between font-bold text-white m-2">
    <div class="text-xl">Element Settings</div>
    <div class="text-orange-500 py-1">Module: {moduleId == '' ? '-' : moduleId.substr(0,4)}</div>
    <div class="text-orange-500 text-4xl absolute right-0">{$localInputStore.elementNumber[0] == undefined ? '-' : $localInputStore.elementNumber[0]}</div>
  </div>

  {#if $localInputStore.elementNumber[0] !== undefined}
  

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

  <div class="flex flex-col">
    <div class="text-gray-700 py-1 mx-2">
      Events
    </div>

    <div class="flex mx-1 secondary rounded-lg shadow overflow-x-auto">
      {#each events as event}
        <button 
          on:click={()=>{handleSelectEvent(event)}} 
          class:shadow-md={selectedEvent === event}
          class:bg-highlight={selectedEvent === event}
          class="m-2 p-1 text-white flex-grow outline-none border-0 rounded hover:bg-highlight-300  focus:outline-none">
          {event}
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
              <select bind:value={selectedAction} class="secondary flex-grow text-white p-1 mr-2 rounded-none focus:outline-none">
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
     
            <!--
            <div class="flex mt-2 xl:mt-0">
              <button on:click={(e)=>{copyActions()}} class="mr-2 text-gray-200 w-16 text-center p-1 border rounded-none border-highlight hover:bg-highlight-400 focus:outline-none">Copy</button>
              <button on:click={(e)=>{pasteActions()}} class="text-gray-200 w-16 text-center p-1 border rounded-none border-highlight hover:bg-highlight-400 focus:outline-none">Paste</button>
            </div>
            -->
          </div>  
      </div>

      

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
          />
      </ActionList>

    </div>
  </div>
  {:else}
  <div class="px-2 my-4 w-full text-gray-700">Select a control element to start configuration!</div>
  {/if}
</div>



