<script>
  import grid from "../protocol/grid-protocol";
  import { engine, logger, runtime } from "../runtime/runtime.store";
  import instructions from "../serialport/instructions";
  import { serialComm } from "../serialport/serialport.store";
import TooltipSetter from "./user-interface/tooltip/TooltipSetter.svelte";

  export let classes;

  function erase() {
    instructions.sendPageClearToGrid();
  }

</script>

<button 
  on:click={()=>{erase()}} 
  disabled={$engine != 'ENABLED'} 
  class="{$engine == 'ENABLED' ? 'hover:bg-red-500 hover:border-red-500' : 'opacity-75'} relative flex items-center focus:outline-none justify-center rounded my-2 border-select bg-select border-2  text-white px-2 py-0.5 {classes}">
  <div>Clear</div>
  <TooltipSetter mode={1} key={"configuration_header_clear"}/>
</button>
