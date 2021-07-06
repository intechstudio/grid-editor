<script>
  import grid from "../protocol/grid-protocol";
  import { engine, logger, runtime } from "../runtime/runtime.store";
  import instructions from "../serialport/instructions";
  import { serialComm } from "../serialport/serialport.store";

  const engine_state = engine.state;

  export let classes;

  function erase() {
    instructions.sendEraseToGrid();
  }

</script>

<button on:click={()=>{erase()}} disabled={$engine_state !== 'ENABLED'} class="{$engine_state == 'ENABLED' ? 'hover:bg-red-500 hover:border-red-500' : 'opacity-75'} flex items-center focus:outline-none justify-center rounded my-2 border-select bg-select border-2  text-white px-2 py-0.5 {classes}">Erase</button>
