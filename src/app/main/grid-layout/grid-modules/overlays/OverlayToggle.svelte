<script>

  import { appSettings } from '../../../_stores/app-helper.store.js';

  export let type;

  let activated = false;

  function toggleOverlay(){

    activated = ! activated;

    appSettings.update((settings)=>{
      settings.overlays[type] = activated;
      console.log(settings)
      return settings;
    })
}

</script>

<div on:click={toggleOverlay} class:bg-highlight-400={activated} class="ml-2 rounded-full w-6 hover:bg-highlight cursor-pointer text-center">👁️</div>


