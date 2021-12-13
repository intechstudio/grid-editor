<script>
  import grid from "../protocol/grid-protocol";
  import { runtime } from "../runtime/runtime.store";
  import instructions from "../serialport/instructions";
  import { serialComm } from "../serialport/serialport.store";

  import TooltipSetter from '../main/user-interface/tooltip/TooltipSetter.svelte';

  import { appSettings, analytics_track_string_event, analytics_track_number_event } from "../main/_stores/app-helper.store"


  export let classes;

  const { getGlobal } = require('electron').remote;
  const trackEvent = getGlobal('trackEvent');

  function discard() {

    instructions.sendPageDiscardToGrid();

    trackEvent('page-config', 'page-config: discard')
    analytics_track_string_event("pageconfig", "command", "discard")
    
  }

</script>

<button 
  on:click={()=>{discard()}} 
  class="relative flex items-center justify-center focus:outline-none rounded my-2 border-select bg-select border-2 hover:bg-yellow-600 hover:border-yellow-600 text-white px-2 py-0.5 {classes}">
  <div>Discard</div>
  <TooltipSetter mode={1} key={"configuration_header_clear"}/>
</button>
