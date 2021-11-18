<script>

  import { appSettings } from './_stores/app-helper.store.js';

  import Configuration from './panels/configuration/Configuration.svelte';
  import Preferences from './panels/preferences/Preferences.svelte';
  import MidiMonitor from './panels/MidiMonitor/MidiMonitor.svelte';

  export let classes;

</script>


<panel-container class="{classes} h-full">

  {#if $appSettings.rightPanel == 'Configuration'}

    <Configuration/>

  {:else if $appSettings.rightPanel == 'Preferences'}

    <Preferences/>

  {:else if $appSettings.rightPanel == 'MIDI Monitor'}

    <MidiMonitor/>

  {/if}

</panel-container>