<script>
  import BankTab from './BankTab.svelte';  
  import { globalSettings } from './globalSettings.store.js';
  import { elementSettings } from './elementSettings.store.js';
  import { serialComm } from '../serialport/serialport.store.js';

  import { GRID_PROTOCOL } from '../serialport/GridProtocol.js';

  import Tooltip from '../helpers/Tooltip.svelte';

  import { onMount } from 'svelte';

  let selected = 0;

  let globalData;

  let tabs = [0,1,2,3];

  globalSettings.subscribe(banks => {
    console.log(banks);
      globalData = banks;
      selected =  banks.active;      
    })

  function handleColorChange(e){
    const PARAMS = e.detail.parameters[0];
    globalData.colors[PARAMS.BANKNUMBER] = [PARAMS.RED, PARAMS.GREEN, PARAMS.BLUE];
    const command = GRID_PROTOCOL.encode('', e.detail.className, e.detail.parameters);
    serialComm.write(command);
  }

  function handleBankEnabledChange(e){
    const PARAMS = e.detail.parameters[0];
    console.log(e.detail);
    globalData.bankEnabled[PARAMS.BANKNUMBER] = PARAMS.ISENABLED;
    const command = GRID_PROTOCOL.encode('', e.detail.className, e.detail.parameters);
    serialComm.write(command);
  }


  function changeSelected(bank){
    globalData.active = bank;
    elementSettings.update(settings => {
      settings.bank = bank;
      return settings;
    })
    selected = bank;
    const command = GRID_PROTOCOL.encode('','BANKACTIVE',[{'BANKNUMBER': bank}])
    serialComm.write(command);
  }

  function handleStoreGlobal(){
    const command = GRID_PROTOCOL.encode('','GLOBALSTORE','');
    serialComm.write(command);
    console.log('Store global settings to Grid!')
  }

  function handleRecallGlobal(){
    const command = GRID_PROTOCOL.encode('','GLOBALRECALL','');
    serialComm.write(command);
    console.log('Recall global settings on Grid!')
  }

  function handleClearGlobal(){
    const command = GRID_PROTOCOL.encode('','GLOBALCLEAR','');
    serialComm.write(command);
    console.log('Clear global settings on Grid!')
  }

</script>

<style>

  :global(.bg-highlight){
    background-color:#cc5b5b;
  }

</style>

<div class="inline-block primary rounded-lg p-4 m-4 z-20">

  <div class="text-xl font-bold text-white m-2 flex items-center justify-between">
    <div class="mr-2">Global Settings</div>
    <Tooltip text={'Global settings refer to Grid\'s bank system activated by the small side button.'}></Tooltip>
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
            class="m-2 p-1 text-white flex-grow outline-none border-0 rounded hover:bg-highlight-300 focus:outline-none">
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

    <div class="flex justify-between m-2">
      <div class="flex">
        <button on:click={handleStoreGlobal} class="focus:outline-none mr-1 text-white border-none border-primary bg-highlight hover:bg-highlight-400 px-2 py-1">Store</button>
        <button on:click={handleRecallGlobal} class="focus:outline-none ml-1 text-white border-highlight hover:bg-highlight-400 px-2 py-1">Recall</button>
      </div>
      <button on:click={handleClearGlobal} class="focus:outline-none text-white border-none bg-secondary border-primary hover:bg-highlight-400 px-2 py-1">Clear</button>
    </div>
      
  </div>
</div>
