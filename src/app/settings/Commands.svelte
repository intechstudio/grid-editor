<script>
    
  import { GRID_PROTOCOL } from '../serialport/GridProtocol.js';

  import { serialComm } from '../serialport/serialport.store.js';

  export let MODE = '';

  function handleStore(){
    const command = GRID_PROTOCOL.encode('',`${MODE}STORE`,'','');
    serialComm.write(command);
    console.log('Store LOCAL settings on Grid!')
  }

  function handleRecall(){
    const command = GRID_PROTOCOL.encode('',`${MODE}RECALL`,'','');
    serialComm.write(command);
    console.log('Recall LOCAL settings on Grid!')
  }

  function handleClear(){
    const command = GRID_PROTOCOL.encode('',`${MODE}CLEAR`,'','');
    serialComm.write(command);
    console.log('Clear LOCAL settings on Grid!')
  }

</script>

<div class="bg-primary flex rounded-lg z-20">
  <div class="flex flex-grow justify-between m-2 rounded-lg">
    <div class="flex">
      <button on:click={handleStore} class="focus:outline-none cursor-pointer mr-1 text-white border-none border-primary bg-highlight hover:bg-highlight-400 px-2 py-1">Store</button>
      <button on:click={handleRecall} class="focus:outline-none ml-1 cursor-pointer text-white border-highlight hover:bg-highlight-400 px-2 py-1">Recall</button>
    </div>
    <button on:click={handleClear} class="focus:outline-none text-white border-none bg-secondary border-primary hover:bg-highlight-400 px-2 py-1">Clear</button>
  </div>
</div>