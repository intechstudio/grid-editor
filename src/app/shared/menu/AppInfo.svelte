<script>
  const { ipcRenderer } = require('electron');
  const { getGlobal } = require('electron').remote;
  const trackEvent = getGlobal('trackEvent');

  import { onMount } from 'svelte';

  import { appSettings } from '../../stores/app-settings.store';

  let selectedDisplay = 'layout';

  let appVersion = '';

  function changeSelectedDisplay(display){
    selectedDisplay = display;
    $appSettings.selectedDisplay = selectedDisplay;
  }

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
  <div class="px-2 text-white">Version: {appVersion}</div>
  <div class="px-2 text-white">Protocol: {$appSettings.version.major + '.' + $appSettings.version.minor + '.' + $appSettings.version.patch }</div>
</div>






