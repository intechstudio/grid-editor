<script>

  import { appSettings } from '../../stores/app-settings.store.js';

  import Configuration from './panels/configuration/Configuration.svelte';
  import Preferences from './panels/preferences/Preferences.svelte';
  import MidiMonitor from './panels/midi-monitor/MidiMonitor.svelte';

</script>


<panel-container class="w-2/5">

  {#if $appSettings.activePanel == 'gridConfiguration'}

    <Configuration/>

  {:else if $appSettings.activePanel == 'preferences'}

    <Preferences/>

  {:else if $appSettings.activePanel == 'midiMonitor'}

    <MidiMonitor/>

  {/if}

</panel-container>