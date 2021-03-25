<script>

  import { appSettings } from '../stores/app-settings.store';

  import BankLogic from './configuration/ui-events/BankLogic.svelte';
  import ConfigActions from './configuration/ConfigActions.svelte';
  import ConfigOptions from './configuration/ConfigOptions.svelte';
  import ConfigType from './configuration/ConfigType.svelte';

  import { fly, fade } from 'svelte/transition';

//$appSettings.configType == 'uiEvents' ? -10 : 10
</script>

<configuration class="w-full flex flex-col">

  <ConfigType/>

  
  {#key $appSettings.configType == 'uiEvents'}
    <container in:fly={{x: $appSettings.configType == 'uiEvents' ? -5 : 5, opacity: 0.5, duration: 200, delay: 0}} >
      {#if $appSettings.configType == 'uiEvents'}
        <BankLogic/>
      {/if}
      <ConfigOptions/>
      <ConfigActions/>
    </container>
  {/key}
</configuration>


