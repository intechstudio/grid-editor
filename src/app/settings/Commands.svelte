<script>
    
  import { GRID_PROTOCOL } from '../serialport/GridProtocol.js';

  import { serialComm } from '../serialport/serialport.store.js';

  import Tooltip from '../helpers/Tooltip.svelte';
  import { onMount } from 'svelte';

  export let MODE = '';

  let tooltip;

  function handleStore(){
    const command = GRID_PROTOCOL.encode('',`${MODE}STORE`,'','');
    serialComm.write(command);
    console.log(`Store ${MODE} settings on Grid!`)
  }

  function handleRecall(){
    const command = GRID_PROTOCOL.encode('',`${MODE}LOAD`,'','');
    serialComm.write(command);
    console.log(`Recall ${MODE} settings on Grid!`)
  }

  function handleClear(){
    const command = GRID_PROTOCOL.encode('',`${MODE}CLEAR`,'','');
    serialComm.write(command);
    console.log(`Clear ${MODE} settings on Grid!`)
  }

  onMount(()=>{
    if(MODE == 'GLOBAL'){
      tooltip = "Store will save your global configuration in your Grid modules memory and Clear will clear it from there."
    } else {
      tooltip = "Store will save your local configuration in your Grid modules memory and Clear will clear it from there."
    }
  })

</script>

<div class="bg-primary flex rounded-lg z-20">
  <div class="flex flex-grow justify-between m-2 rounded-lg">
    
    <div class="flex">
      <button on:click={handleStore} class="focus:outline-none cursor-pointer mr-1 text-white border-none border-primary bg-highlight hover:bg-highlight-400 px-2 py-1">Store</button>
      <button on:click={handleRecall} class="focus:outline-none ml-1 cursor-pointer text-white border-highlight hover:bg-highlight-400 px-2 py-1">Recall</button>
    </div>
    <div class="flex items-center">
      <button on:click={handleClear} class="focus:outline-none text-white border-none bg-secondary border-primary hover:bg-highlight-400 px-2 py-1">Clear</button>
      <!--<Tooltip text={tooltip}/>-->
    </div>
    
  </div>
</div>