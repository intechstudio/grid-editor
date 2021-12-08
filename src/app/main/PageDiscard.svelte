<script>
  import grid from "../protocol/grid-protocol";
  import { runtime } from "../runtime/runtime.store";
  import instructions from "../serialport/instructions";
  import { serialComm } from "../serialport/serialport.store";

  import TooltipSetter from '../main/user-interface/tooltip/TooltipSetter.svelte';

  export let classes;

  const { getGlobal } = require('electron').remote;
  const trackEvent = getGlobal('trackEvent');

  function discard() {
    trackEvent('page-config', 'page-config: discard')
    instructions.sendPageDiscardToGrid();
  }

</script>

<button 
  on:click={()=>{discard()}} 
  class="relative flex items-center justify-center focus:outline-none rounded my-2 border-select bg-select border-2 hover:bg-yellow-600 hover:border-yellow-600 text-white px-2 py-0.5 {classes}">
  <div>Discard</div>
  <TooltipSetter mode={1} key={"configuration_header_clear"}/>
</button>
