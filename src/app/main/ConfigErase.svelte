<script>
  import grid from "../protocol/grid-protocol";
  import { runtime } from "../runtime/runtime.store";
  import { serialComm } from "../serialport/serialport.store";

  export let classes;

  function clear() {
    const command = grid.translate.encode('','GLOBAL','CONFIGERASE','EXECUTE','');
    serialComm.write(command);
    runtime.unsaved.set(0);
    runtime.set([]); // this causes blink, we could simply remove all config and reinit state
    runtime.update.trigger();
  }

</script>

<button on:click={()=>{clear()}} class="flex items-center focus:outline-none justify-center rounded my-2 border-select bg-select border-2 hover:bg-red-500 hover:border-red-500 text-white px-2 py-0.5 {classes}">Clear</button>
