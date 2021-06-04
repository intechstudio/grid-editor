<script>

  import { appSettings } from './_stores/app-helper.store.js';

  import Configuration from './panels/configuration/Configuration.svelte';
  import Preferences from './panels/preferences/Preferences.svelte';
  import MidiMonitor from './panels/midi-monitor/MidiMonitor.svelte';

  export let classes;

</script>


<panel-container class="{classes} h-full">

  {#if $appSettings.activePanel == 'Configuration'}

    <Configuration/>

  {:else if $appSettings.activePanel == 'Preferences'}

    <Preferences/>

  {:else if $appSettings.activePanel == 'MIDI Monitor'}

    <MidiMonitor/>

  {/if}

</panel-container>