<script>

  import BankTab from './BankTab.svelte';  
  import {globalSettings} from './globalSettings.store.js';
  import {elementSettings} from './elementSettings.store.js';

  import Tooltip from '../helpers/Tooltip.svelte';

  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  let bank_color = 'relative';
  let bank_number = 'standard';

  let selected = 0;

  let globalData;

  let tabs = [0,1,2,3];

  $: if(globalData){
    globalSettings.update((banks)=>{
      banks.names = globalData.names;
      banks.colors = globalData.colors;
      banks.bankEnabled = globalData.bankEnabled;
      return banks;
    })
  }

  globalSettings.subscribe(banks => {
    let parameters = banks.bankEnabled.map((b,i)=>{
      b ? b = 1 : b = 0; 
      return {'BANKNUMBER': i,'ISENABLED': b}
    });
    
    globalData = banks;
    selected =  banks.active;
    dispatch('BANKENABLED', {className: 'BANKENABLED', parameters: parameters})
  })

  function changeSelected(bank){
    globalData.active = bank;
    elementSettings.update(settings => {
      settings.bank = bank;
      return settings;
    })
    dispatch('BANKACTIVE', {className: 'BANKACTIVE', parameters: [{'BANKNUMBER': selected}]})
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
            on:BANKCOLOR 
            {tab} 
            {globalData} 
            {selected}
            bind:bankName={globalData.names[index]}
            bind:bankState={globalData.bankEnabled[index]}
            bind:bankColor={globalData.colors[index]} />  
        {/each}
      </div>
    </div>
      
  </div>

</div>
