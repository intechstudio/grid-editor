<script>
  import grid from "../protocol/grid-protocol";
  import { runtime } from "../runtime/runtime.store";
  import { serialComm } from "../serialport/serialport.store";

  export let classes;

  function discard() {
    const { serial, id } = grid.translate.encode('','GLOBAL','CONFIGDISCARD','EXECUTE','');
    console.log('editor discard: ', id)
    serialComm.write(serial);
    //runtime.set([]); // this causes blink, we could simply remove all config and reinit state
    //runtime.update.trigger();

    runtime.unsave.throw().setToZero().trigger();

  }

</script>

<button on:click={()=>{discard()}} class="flex items-center justify-center focus:outline-none rounded my-2 border-select bg-select border-2 hover:bg-yellow-600 hover:border-yellow-600 text-white px-2 py-0.5 {classes}">Discard</button>
