<script>
  
  import { appSettings } from "../../stores/app-settings.store";

  let selectedPanel = 'uiEvents';

  function changeSelectedPanel(arg){
    selectedPanel = arg;
    $appSettings.activePanel = selectedPanel;
  }


</script>

<tabs class="flex flex-row items-start justify-between mt-8">
  <left-menu>
    <tab 
      on:click={()=>{changeSelectedPanel('uiEvents')}} 
      class="{selectedPanel == 'uiEvents' ? "bg-primary" : " hover:bg-select"} px-4 py-2 cursor-pointer text-white rounded-t-md">
      <span>
        UI Events
      </span>
    </tab>
    <tab 
      on:click={()=>{changeSelectedPanel('systemEvents')}} 
      class="{selectedPanel == 'systemEvents' ? "bg-primary" : " hover:bg-select"} px-4 py-2 cursor-pointer text-white rounded-t-md">
      <span>
        System Events
      </span>
    </tab>
  </left-menu>
  <right-menu>
    <tab 
      on:click={()=>{changeSelectedPanel('preferences')}} 
      class="{selectedPanel == 'preferences' ? "bg-primary" : " hover:bg-select"} px-4 py-2 cursor-pointer text-white rounded-t-md">
      <span>
        Preferences
      </span>
    </tab>
    <tab 
      on:click={()=>{changeSelectedPanel('midiMonitor')}} 
      class="{selectedPanel == 'midiMonitor' ? "bg-primary" : " hover:bg-select"} px-4 py-2 cursor-pointer text-white rounded-t-md">
      <span>
        MIDI Monitor
      </span>
    </tab>
  </right-menu>
</tabs>