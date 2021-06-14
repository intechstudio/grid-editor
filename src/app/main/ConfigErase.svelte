<script>
  import grid from "../protocol/grid-protocol";
  import { engine, logger, runtime } from "../runtime/runtime.store";
  import { serialComm } from "../serialport/serialport.store";

  const engine_state = engine.state;

  export let classes;

  function erase() {
    const {serial, id} = grid.translate.encode('','GLOBAL','CONFIGERASE','EXECUTE','');
    engine.strict.store('erase', serial, id);
    serialComm.write(serial);
    runtime.unsaved.set(0);
    runtime.set([]); // this causes blink, we could simply remove all config and reinit state
    runtime.update.trigger();
  }

</script>

<button on:click={()=>{erase()}} disabled={$engine_state !== 'ENABLED'} class="{$engine_state == 'ENABLED' ? 'hover:bg-red-500 hover:border-red-500' : 'opacity-75'} flex items-center focus:outline-none justify-center rounded my-2 border-select bg-select border-2  text-white px-2 py-0.5 {classes}">Erase</button>
