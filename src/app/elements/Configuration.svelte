<script>

  import { appSettings } from '../stores/app-settings.store';
  import BankLogic from './configuration/ui-events/BankLogic.svelte';
  import ConfigActions from './configuration/ConfigActions.svelte';
  import ConfigOptions from './configuration/ConfigOptions.svelte';
  import ConfigType from './configuration/ConfigType.svelte';

</script>

<configuration class="w-full flex flex-col">

  <ConfigType/>

  <container>

    {#if $appSettings.configType == 'uiEvents'}
    
    <BankLogic/>

    {/if}

    <ConfigOptions/>

    <ConfigActions/>

  </container>

</configuration>


