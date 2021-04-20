<script>

  import { appSettings } from '../../stores/app-settings.store.js';

  import PanelControl from './PanelControl.svelte';

  import Configuration from './panels/configuration/Configuration.svelte';
  import Preferences from './panels/Preferences.svelte';
  import MidiMonitor from './panels/MidiMonitor.svelte';

  /**
  appSettings.subscribe(s => {
    s.activePanel
  })

  */
</script>


<panel-container class="w-1/2">

  {#if $appSettings.activePanel == 'gridConfiguration'}

    <Configuration/>

  {:else if $appSettings.activePanel == 'preferences'}

    <Preferences/>

  {:else if $appSettings.activePanel == 'midiMonitor'}

    <MidiMonitor/>

  {/if}

</panel-container>