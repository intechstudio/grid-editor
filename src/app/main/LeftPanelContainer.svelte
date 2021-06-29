<script>
  import Debug from "../debug/Debug.svelte";
  import Profiles from "./panels/profiles/Profiles.svelte";
  import { appSettings } from "./_stores/app-helper.store";

  export let classes;
</script>

{#if $appSettings.leftPanel}

  <panel-container class="{classes} h-full">

    
    {#if $appSettings.leftPanel == 'Debug'}

      <Debug/>

    {/if}

    {#if $appSettings.leftPanel == 'Profiles'}

      <Profiles/>

    {/if}

  </panel-container>

{/if}