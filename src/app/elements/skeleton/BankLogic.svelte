<script>
  import BankView from "./BankView.svelte";

  import { globalConfigReportStore, bankActiveStore, numberOfModulesStore } from '../../stores/control-surface-input.store.js';
  
  import { runtime } from '../../stores/runtime.store.js';

  import { serialComm } from '../../core/serialport/serialport.store.js';

  import { GRID_PROTOCOL } from '../../core/classes/GridProtocol.js';

  import { commands } from '../../settings/shared/handshake.store';

  import { onMount } from 'svelte';

  import DynamicWrapper from "../view/DynamicWrapper.svelte";

  let banks = ['Bank 1', 'Bank 2', 'Bank 3', 'Bank 4'];

  let selected = 0;

  let globalData;

  function handleColorChange(e){
    const PARAMS = e.detail.parameters;

    runtime.update(runtime => {
      runtime.forEach(controller => {
        controller.global.bankColors[PARAMS[0].NUM] = [PARAMS[1].RED, PARAMS[2].GRE, PARAMS[3].BLU];
        console.log(controller, PARAMS);
      })
      return runtime;
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
      // here rework is needed. switching up from working with virtual modules to real modules may break the config fetch
      if(Object.keys($runtime[0].global).length !== 0 && (!globalData.isVirtual || $runtime[0].virtual)){
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

<banks class="w-full flex flex-col p-4 bg-primary mb-4">

  <div class="flex items-center secondary shadow ">
    {#each banks as bank, index}
      <button 
        on:click={()=>{changeSelected(index)}} 
        class="{selected === index ? 'shadow-md bg-pick text-white': 'hover:bg-pick-desaturate-10 text-gray-50'} m-2 p-1 flex-grow border-0 rounded focus:outline-none">
        {bank}
      </button>
    {/each}
  </div>

  <div class="pt-2">
    <DynamicWrapper action={{desc: 'Bank Preferences', type: 'standard', action_id: ''}}>
      <BankView
        slot="action"
        {selected}
        {globalData}
        on:BANKCOLOR={handleColorChange}
        on:BANKENABLED={handleBankEnabledChange}
      />  
    </DynamicWrapper>
  </div>

</banks>