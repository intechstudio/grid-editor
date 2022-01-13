<script>

  import MidiMonitor from "./panels/MidiMonitor/MidiMonitor.svelte";
  import DebugMonitor from "./panels/DebugMonitor/DebugMonitor.svelte";
  import Profiles from "./panels/profiles/Profiles.svelte";
  import { appSettings } from "../runtime/app-helper.store";

  export let classes;
</script>

{#if $appSettings.leftPanel}

  <panel-container class="{classes} h-full">

    
    {#if $appSettings.leftPanel == 'Debug'}

      <DebugMonitor/>

    {/if}

    {#if $appSettings.leftPanel == 'MIDI Monitor'}

      <MidiMonitor/>

    {/if}

    {#if $appSettings.leftPanel == 'Profiles'}

      <Profiles/>

    {/if}

  </panel-container>

{/if}