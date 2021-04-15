<script>
  import { onMount } from 'svelte';
  import Configuration from '../../elements/skeleton/Configuration.svelte';
  import DragModule from '../../layout/components/DragModule.svelte';
  import Preferences from '../../preferences/Preferences.svelte';
  import Profiles from '../../profiles/Profiles.svelte';
  import GlobalSettings from '../../settings/global/GlobalSettings.svelte';
  import LocalSettings from '../../settings/local/LocalSettings.svelte';
  

  import {appSettings} from '../../stores/app-settings.store';

  onMount(()=>{
    
  })

</script>

<tab-container class="w-1/2">

  <Configuration/>

  {#if $appSettings.tab == 'virtual-modules'}
    <DragModule/>
  {:else if $appSettings.tab == 'global-settings'}
    <GlobalSettings/>
  {:else if $appSettings.tab == 'local-settings'}
    <LocalSettings/>
  {:else if $appSettings.tab == 'profiles'}
    <Profiles/>
  {/if}

</tab-container>





