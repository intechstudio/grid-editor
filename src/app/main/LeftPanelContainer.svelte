<script>
  import Debug from "../debug/Debug.svelte";
  import { appSettings } from "./_stores/app-helper.store";

  export let classes;
</script>

{#if $appSettings.leftPanel}

  <panel-container class="{classes} h-full">

    
    {#if $appSettings.leftPanel == 'Debug'}

      <Debug/>

    {/if}

  </panel-container>

{/if}