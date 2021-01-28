<script>
  const { ipcRenderer } = require('electron');
  const { getGlobal } = require('electron').remote;
  const trackEvent = getGlobal('trackEvent');

  import { onMount } from 'svelte';

  import { appSettings } from '../stores/app-settings.store';

  let selectedDisplay = 'layout';

  let appVersion = '';

  onMount(()=>{

    ipcRenderer.send('app_version');
    ipcRenderer.on('app_version', (event, arg) => {
      ipcRenderer.removeAllListeners('app_version');
      appVersion = arg.version;
      trackEvent('Editor', `v${appVersion}`);
    });
    trackEvent('Firmware', `v${$appSettings.version.major}.${$appSettings.version.minor}.${$appSettings.version.patch}`);
    trackEvent('OS', process.platform)

  })

  
</script>

    
<div class="flex text-xs items-center">
  <div class="flex text-white items-center not-draggable">
    <div class="pr-2 block">Size</div>
    <input 
      type="number" 
      class="secondary w-12 text-white p-1 pl-2 rounded-none focus:outline-none" 
      value={$appSettings.size}
      step=".1"
      min="1" 
      max="4"
      on:input={(e)=>{appSettings.update(store => {store.size = e.target.value; return store;})}}/>
  </div>
  <div class="px-2 text-white">Ver: {appVersion}</div>
  <div class="px-2 text-white">Prtcl: {$appSettings.version.major + '.' + $appSettings.version.minor + '.' + $appSettings.version.patch }</div>
</div>