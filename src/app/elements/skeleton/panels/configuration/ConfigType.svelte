<script>
  
  import { appSettings } from "../../../../stores/app-settings.store";

  let selectedConfig = 'uiEvents';

  function changeSelectedConfig(arg){
    selectedConfig = arg;
    $appSettings.configType = selectedConfig;
  }


</script>

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