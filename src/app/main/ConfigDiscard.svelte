<script>
  import grid from "../protocol/grid-protocol";
  import { runtime } from "../runtime/runtime.store";
  import instructions from "../serialport/instructions";
  import { serialComm } from "../serialport/serialport.store";

  export let classes;

  function discard() {
    instructions.sendDiscardToGrid();
  }

</script>

<button on:click={()=>{discard()}} class="flex items-center justify-center focus:outline-none rounded my-2 border-select bg-select border-2 hover:bg-yellow-600 hover:border-yellow-600 text-white px-2 py-0.5 {classes}">Discard</button>
