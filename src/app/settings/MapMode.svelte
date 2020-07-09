<script>

  import {elementSettings} from './elementSettings.store.js';
  import {globalSettings} from './globalSettings.store.js';

  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  import Tooltip from '../helpers/Tooltip.svelte';

  let selectedBank = 0;

  let banks = $globalSettings;

  function handleSwitch(){

    let switchableBanks = [];

    banks.forEach((enabled,i) => {
      if(enabled){
        switchableBanks.push(i)
      }
    });

    selectedBank += 1;

    selectedBank = selectedBank % switchableBanks.length;   

    elementSettings.update((setting)=>{
      setting.bank = switchableBanks[selectedBank];
      return setting;
    })

    dispatch('mapModeSwitch', {selectedBank})

  }


</script>

<style>


</style>

<div class="inline-block primary text-white rounded-lg p-4 mx-4 mt-4 z-20">
  <div class="text-xl font-bold flex justify-between items-center text-white m-2">
    <div> Utility Button</div> 
    <Tooltip text={
      'Utility button or as often referred the map mode button is a small button on the side of the modules. It changes the selected bank globally on Grid.'
    }/>
  </div>
  <div class="m-2">Configuration is saved for bank <span class="text-important">{$elementSettings.bank}</span>.</div>
  <div class="m-2">Currently enabled number of banks: <span class="text-important">2</span>.</div>
  <button on:click={handleSwitch} class="m-2 block bg-highlight w-32 font-medium text-white py-1 px-2 rounded-none border-none hover:bg-highlight-400 focus:outline-none">Switch Bank</button>
</div>