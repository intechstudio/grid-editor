<script>


  import Configuration from './panels/configuration/Configuration.svelte';
  import Preferences from './panels/preferences/Preferences.svelte';
  import MidiMonitor from './panels/MidiMonitor/MidiMonitor.svelte';

  import {appSettings} from '../runtime/app-helper.store';

  import { windowSize } from '../runtime/window-size';


  import { watchResize } from "svelte-watch-resize";
  import { onMount } from 'svelte';

  export let classes;


  function resize(){
    $windowSize.rightSidebarWidth = $windowSize.rightSidebarWidth+1;
  }

  onMount(()=> {
    console.log('rightpanel')
  })


</script>

<panel-container id="right-panel" class="{classes} h-full"  use:watchResize={resize} >

 
  {#if $appSettings.rightPanel == 'Configuration'}

  
    <Configuration/>

  {:else if $appSettings.rightPanel == 'Preferences'}

    <Preferences/>

  {:else if $appSettings.rightPanel == 'MIDI Monitor'}

    <MidiMonitor/>
  
  {/if}

</panel-container>