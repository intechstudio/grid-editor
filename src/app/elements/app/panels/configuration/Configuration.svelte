<script>

  import { fly } from 'svelte/transition';
  import { appSettings } from '../../../../stores/app-settings.store.js';


  import Debug from '../../Debug.svelte';
  import ConfigParameters from './ConfigParameters.svelte';
  import ConfigList from './ConfigList.svelte';

  

  import { runtime } from '../../../runtime/runtime.store.js';
  import { rawLuaScriptToConfigList } from '../../../runtime/_utils.js';

  const grid_raw_actions = `
  --@locals
  local x = 1 local y = -12 + elem_num(1 + 2)
  --@glsp
  led_value(0,1,2)`
  ;

  let actions = rawLuaScriptToConfigList({script: grid_raw_actions});

  runtime.set(actions);

  let selectedConfig = 'uiEvents';

  function changeSelectedConfig(arg){
    selectedConfig = arg;
    $appSettings.configType = selectedConfig;
  }


</script>

<configuration class="w-full flex flex-col">

  <tabs class="flex flex-row items-start mt-8">
    <tab 
      on:click={()=>{changeSelectedConfig('uiEvents')}} 
      class="{selectedConfig == 'uiEvents' ? "bg-primary" : "bg-secondary"} px-4 py-2 cursor-pointer text-white rounded-t-md">
      <span>
        UI Events
      </span>
    </tab>
    <tab 
      on:click={()=>{changeSelectedConfig('systemEvents')}} 
      class="{selectedConfig == 'systemEvents' ? "bg-primary" : "bg-secondary"} px-4 py-2 cursor-pointer text-white rounded-t-md">
      <span>
        System Events
      </span>
    </tab>
  </tabs>

  {#key $appSettings.configType == 'uiEvents'}
    <container in:fly={{x: $appSettings.configType == 'uiEvents' ? -5 : 5, opacity: 0.5, duration: 200, delay: 0}} >

      <ConfigParameters/>

      <ConfigList/>

      <Debug {actions}/>

    </container>
  {/key}
</configuration>


