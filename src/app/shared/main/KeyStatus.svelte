<script>

  import {onMount} from 'svelte'

  import { serialComm } from '../../core/serialport/serialport.store.js';
  import { GRID_PROTOCOL } from '../../core/classes/GridProtocol.js';
  import { hidKeyStatusStore } from '../../stores/control-surface-input.store';
  
  let hidKeyStatus = 0;

  function enableMacro(){
    const command = GRID_PROTOCOL.encode('','HIDKEYSTATUS','EXECUTE',[{'ISENABLED': 1}], '')
    serialComm.write(command);
  }

  onMount(()=>{
    hidKeyStatusStore.subscribe(values => {
      hidKeyStatus = values.isEnabled;
    })
  })

</script>

<div class="flex flex-col text-white ">
  <button
    class:bg-secondary={hidKeyStatus == 1}
    class:bg-highlight={hidKeyStatus == 0}
    class="ml-8 text-white px-2 py-1 text-xs border-none rounded focus:outline-none" 
    on:click={enableMacro}
    >
    Re-Enable Macro
  </button>   
</div>
