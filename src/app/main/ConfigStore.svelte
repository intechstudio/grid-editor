<script>

  import grid from "../protocol/grid-protocol";
  import { runtime } from "../runtime/runtime.store";
  import { serialComm } from "../serialport/serialport.store";

  export let classes;


  function store() {
    const command = grid.translate.encode('','GLOBAL',`CONFIGSTORE`,'EXECUTE','');
    serialComm.write(command);
    runtime.unsaved.set(0);
  }


</script>

<button 
  on:click={()=>{store()}} 
  class="flex items-center justify-center rounded my-2 focus:outline-none border-2 border-commit bg-commit hover:bg-commit-saturate-20 hover:border-commit-saturate-20 text-white px-2 py-0.5 {classes}">
      Store
</button>

<style>



</style>
