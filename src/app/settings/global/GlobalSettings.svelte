<script>
  import BankTab from './BankTab.svelte';  
  import { localInputStore, globalInputStore } from '../../stores/control-surface-input.store.js';
  import { serialComm } from '../../core/serialport/serialport.store.js';

  import Commands from '../shared/Commands.svelte';

  import { GRID_PROTOCOL } from '../../core/classes/GridProtocol.js';

  import { commands } from '../shared/handshake.store.js';

  import Tooltip from '../../shared/helpers/Tooltip.svelte';

  let selected = 0;

  let globalData;

  let tabs = [0,1,2,3];

  globalInputStore.subscribe(banks => {
      globalData = banks;
      selected =  banks.active;      
  })

  function handleColorChange(e){
    const PARAMS = e.detail.parameters[0];
    globalData.colors[PARAMS.BANKNUMBER] = [PARAMS.RED, PARAMS.GREEN, PARAMS.BLUE];
    const command = GRID_PROTOCOL.encode('', e.detail.className, e.detail.parameters, '');
    commands.validity('GLOBALSTORE',true);
    serialComm.write(command);
  }

  function handleBankEnabledChange(e){
    const PARAMS = e.detail.parameters[0];
    globalData.bankEnabled[PARAMS.BANKNUMBER] = PARAMS.ISENABLED;
    const command = GRID_PROTOCOL.encode('', e.detail.className, e.detail.parameters, '');
    commands.validity('GLOBALSTORE',true);
    serialComm.write(command);
  }


  function changeSelected(bank){
    globalData.active = bank;
    localInputStore.update(settings => {
      settings.bank = bank;
      return settings;
    })
    selected = bank;
    const command = GRID_PROTOCOL.encode('','BANKACTIVE',[{'BANKNUMBER': bank}], '')
    serialComm.write(command);
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
    <Tooltip text={"A 'Bank' refers to an independently customisable mode of a given Grid module. <br><br> At default you have four Banks available to you on each Grid module. <br><br> Banks store their settings independently from each other, so you can configure multiple different setups and switch between them on the fly. <br><br> You can switch between Banks quickly by pressing the Bank button located on the side opposite from the USB port."}></Tooltip>
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

    
      
  </div>

  <Commands MODE={'GLOBAL'}/>
</div>
