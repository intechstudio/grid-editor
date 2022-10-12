<script>


  import Configuration from './panels/configuration/Configuration.svelte';
  //import Preferences from './panels/preferences/Preferences.svelte';
  import MidiMonitor from './panels/MidiMonitor/MidiMonitor.svelte';

  import {app_settings} from '../runtime/settings.store';

  import { windowSize } from '../runtime/window-size';


  import { watchResize } from "svelte-watch-resize";

  export let classes;


  function resize(){
    $windowSize.rightSidebarWidth = $windowSize.rightSidebarWidth+1;
  }


</script>

<panel-container id="right-panel" class="{classes} h-full"  use:watchResize={resize} >
 
  {#if $app_settings.rightPanel == 'Configuration'}

  
    <Configuration/>

  {:else if $app_settings.rightPanel == 'Preferences'}

    <!--<Preferences/>-->

  {:else if $app_settings.rightPanel == 'MIDI Monitor'}

    <MidiMonitor/>
  
  {/if}

</panel-container>