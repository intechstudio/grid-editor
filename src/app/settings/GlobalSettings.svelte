<script>

  import BankTab from './BankTab.svelte';  
  import {globalSettings} from './globalSettings.store.js';
  import {elementSettings} from './elementSettings.store.js';

  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  let bank_color = 'relative';
  let bank_number = 'standard';

  let selected = 0;

  let tabs = [0,1,2,3];

  $: selected = $elementSettings.bank;

  globalSettings.subscribe(banks => {
    let parameters = banks.map((b,i)=>{
      b ? b = 1 : b = 0; 
      return {'BANKNUMBER': i,'ISENABLED': b}
    });
    console.log('bank change', banks)
    dispatch('BANKENABLED', {className: 'BANKENABLED', parameters: parameters})
  })

  function changeSelected(bank){
    selected = bank;
    dispatch('BANKACTIVE', {className: 'BANKACTIVE', parameters: [{'BANKNUMBER': selected}]})
  }

</script>

<style>

  :global(.bg-highlight){
    background-color:#cc5b5b;
  }

</style>

<div class="inline-block primary rounded-lg p-4 m-4 z-20">

  <div class="text-xl font-bold text-white m-2">
    Global Settings
  </div>

  <div class="flex flex-col my-4">
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
        {#each tabs as tab}     
          <BankTab on:BANKCOLOR {tab} {selected}/>  
        {/each}
      </div>
    </div>
      
  </div>


      <!--
      <select bind:value={nrpnResolution} class="bg-red-500 p-1 w-1/2 rounded-l-none rounded-r">
        {#each ['10-bit', '11-bit', '12-bit'] as resolution}
          <option class="font-medium text-black bg-white" >{resolution}</option>
        {/each}
      </select>
      -->


</div>
