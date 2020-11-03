<script>
  import BankTab from './BankTab.svelte';  

  import { localInputStore, globalConfigReportStore, bankActiveStore, numberOfModulesStore } from '../../stores/control-surface-input.store.js';
  
  import { runtime } from '../../stores/runtime.store.js';

  import { serialComm } from '../../core/serialport/serialport.store.js';

  import Commands from '../shared/Commands.svelte';

  import { GRID_PROTOCOL } from '../../core/classes/GridProtocol.js';

  import { commands } from '../shared/handshake.store.js';

  import Tooltip from '../../shared/helpers/Tooltip.svelte';
  
  import { onMount } from 'svelte';

  let selected = 0;

  let globalData;

  let tabs = [0,1,2,3];

  function handleColorChange(e){
    const PARAMS = e.detail.parameters;

    $runtime.forEach((controller) => {
      controller.global.bankColors[PARAMS[0].NUM] = [PARAMS[1].RED, PARAMS[2].GRE, PARAMS[3].BLU];
    });

    console.log('$runtime (color) change', $runtime)

    const command = GRID_PROTOCOL.encode('', e.detail.className, 'EXECUTE', e.detail.parameters, '');
    commands.validity('GLOBALSTORE',true);
    serialComm.write(command);
  }

  function handleBankEnabledChange(e){
    const PARAMS = e.detail.parameters;
    
    $runtime.forEach((controller) => {
      controller.global.bankEnabled[PARAMS[0].BANKNUMBER] = PARAMS[1].ISENABLED
    });

    console.log('$runtime (bankenabled) change', $runtime)

    const command = GRID_PROTOCOL.encode('', e.detail.className,'EXECUTE', e.detail.parameters, '');
    commands.validity('GLOBALSTORE',true);
    serialComm.write(command);
  }


  function changeSelected(bank){
    bankActiveStore.update(store => {
      store.bankActive = bank;
      return store;
    })
    const command = GRID_PROTOCOL.encode('','BANKACTIVE','EXECUTE',[{'BANKNUMBER': bank}], '')
    serialComm.write(command);
  }

  function renderGlobalConfiguration(){
    if($runtime[0]){
      if(Object.keys($runtime[0].global).length !== 0){
        globalData = $runtime[0].global;
        updateRuntimeWithGlobalConfig(globalData);
      } else {
        // could be expanded the whole function to fetch global settings from all the modules
        const fetch = runtime.fetchGlobalConfig('7f7f', 'ff');
        serialComm.write(fetch);
      }
    }
  }

  function updateRuntimeWithGlobalConfig(globalData){
    runtime.update(runtime => {
      runtime.forEach(controller => {
        controller.global = globalData;
      })
      return runtime;
    });
  }

  onMount(()=>{

    // triggers on successful runtime.fetchGlobalConfig
    globalConfigReportStore.subscribe(store => {
      globalData = store; 
      // load to runtime all the controllers you see
      console.log('LOAD RUNTIME...', store, $runtime)
      updateRuntimeWithGlobalConfig(store);
      renderGlobalConfiguration();
    })

    // on init and on module change serial port connected module change run this!
    numberOfModulesStore.subscribe((number) => {
      renderGlobalConfiguration();
    })

    // this is very similiar to local input store, on trigger check runtime for config
    bankActiveStore.subscribe(store => {
      selected = store.bankActive;
      renderGlobalConfiguration();
    })

  })


</script>

<style>

  :global(.bg-highlight){
    background-color:#cc5b5b;
  }

</style>

<div class="flex">
<div class="inline-block flex-grow-0 primary rounded-lg p-4 m-4 z-50">

  <div class="text-xl font-bold text-white m-2 flex items-center justify-between">
    <div class="mr-2">Global Settings</div>
  </div>

  <div class="flex flex-col mt-4">
    <div class="text-gray-700 py-1 ml-2">
      Banks
    </div>   

    <div class="flex flex-col rounded-lg">
      <div class="flex mx-1 secondary rounded-lg shadow">
        {#each tabs as tab}
          <button 
            on:click={()=>{changeSelected(tab)}} 
            class:shadow-md={selected === tab}
            class:bg-highlight={selected === tab}
            class="m-2 p-1 text-white flex-grow outline-none border-0 rounded hover:bg-highlight-400 focus:outline-none">
            {tab+1}
          </button>
        {/each}
      </div>

      <div class="my-2 flex flex-col justify-between">
        {#each tabs as tab, index}     
          <BankTab 
            {tab} 
            {selected}
            {globalData}
            on:BANKCOLOR={handleColorChange}
            on:BANKENABLED={handleBankEnabledChange}
            />  
        {/each}
      </div>
    </div>

    

    <hr class="text-secondary border-none h-1 rounded bg-secondary m-2">

    
      
  </div>

  {#if selected == -1}

    <div class="text-important m-2 flex items-center">
      <span class="flicker pr-2">⚠️</span>
      <span>Please select a bank to start configuration!</span>
    </div>
  {/if}
  
  {#if selected !== -1}
  <Commands MODE={'GLOBAL'}/>
  {/if}
</div>
</div>