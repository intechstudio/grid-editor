<script>

  import MidiMonitor from "./panels/MidiMonitor/MidiMonitor.svelte";
  import DebugMonitor from "./panels/DebugMonitor/DebugMonitor.svelte";
  import Profiles from "./panels/profiles/Profiles.svelte";
  import Presets from "./panels/presets/Presets.svelte";
  import { appSettings, windowSize } from "../runtime/app-helper.store";


  import { watchResize } from "svelte-watch-resize";

  export let classes;

  function resize(){

    $windowSize.leftSidebarWidth = $windowSize.leftSidebarWidth+1;
  }


</script>

{#if $appSettings.leftPanel}

  <panel-container class="{classes} h-full"  use:watchResize={resize} >

    
    {#if $appSettings.leftPanel == 'Debug'}

      <DebugMonitor/>

    {/if}

    {#if $appSettings.leftPanel == 'MIDI Monitor'}

      <MidiMonitor/>

    {/if}

    {#if $appSettings.leftPanel == 'Profiles'}

      <Profiles/>

    {/if}

    {#if $appSettings.leftPanel == 'Presets'}

      <Presets/>

    {/if}

  </panel-container>

{/if}