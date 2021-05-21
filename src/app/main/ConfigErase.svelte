<script>
  import grid from "../protocol/grid-protocol";
  import { runtime } from "../runtime/runtime.store";
  import { serialComm } from "../serialport/serialport.store";

  export let classes;

  function clear() {
    const command = grid.translate.encode('',`CONFIGERASE`,'EXECUTE','');
    serialComm.write(command);
    runtime.unsaved.set(0);
  }

</script>

<button 
on:click={()=>{clear()}} 
  
class="flex items-center justify-center rounded my-2 border-select bg-select border-2 hover:bg-red-500 text-white px-2 py-0.5 {classes}">Clear</button>
