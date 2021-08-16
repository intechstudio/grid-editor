<script>
  import grid from "../protocol/grid-protocol";
  import { engine, logger, runtime } from "../runtime/runtime.store";
  import instructions from "../serialport/instructions";
  import { serialComm } from "../serialport/serialport.store";

  export let classes;

  function defrag() {
    instructions.sendNVMDefragToGrid();
  }

</script>

<button 
  on:click={()=>{defrag()}} 
  disabled={$engine != 'ENABLED'} 
  class="{$engine == 'ENABLED' ? 'hover:bg-red-500 hover:border-red-500' : 'opacity-75'} flex items-center focus:outline-none justify-center rounded my-2 border-select border-2  text-white px-2 py-0.5 {classes}">
  NVM Defrag
</button>
