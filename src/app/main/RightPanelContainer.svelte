<script>

  import { appSettings } from '../runtime/app-helper.store.js';

  import Configuration from './panels/configuration/Configuration.svelte';
  import Preferences from './panels/preferences/Preferences.svelte';
  import MidiMonitor from './panels/MidiMonitor/MidiMonitor.svelte';

  export let classes;

</script>


<panel-container id="right-panel" class="{classes} h-full relative overflow-hidden">
 
  {#if $appSettings.rightPanel == 'Configuration'}

    <Configuration/>

  {:else if $appSettings.rightPanel == 'Preferences'}

    <Preferences/>

  {:else if $appSettings.rightPanel == 'MIDI Monitor'}

    <MidiMonitor/>

  {/if}

</panel-container>