<script>
  const { ipcRenderer } = require('electron');
  const { getGlobal } = require('electron').remote;
  const trackEvent = getGlobal('trackEvent');

  import { onMount } from 'svelte';

  import { appSettings } from '../stores/app-settings.store';

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
      console.log(arg.version)
      appVersion = arg.version;
    });

    trackEvent('App', 'Report Version', 'Firmware', $appSettings.version);
  })

  
</script>

<style>

</style>

<div class="w-full flex justify-center text-xs text-white primary">
    
  <div class="w-1/4 flex justify-start">
    <div class="flex text-white items-center">
      <div class="p-4 pr-2 block">Size</div>
      <input 
        type="number" 
        class="secondary w-16 text-white p-1 pl-2 rounded-none focus:outline-none" 
        value={$appSettings.size}
        step=".1"
        on:input={(e)=>{appSettings.update(store => {store.size = e.target.value; return store;})}}/>
    </div>
  </div>

  <div class="w-1/2 h-12 flex justify-around items-center ">
    <div 
      on:click="{()=>{ changeSelectedDisplay('layout') }}" 
      class:bg-highlight={$appSettings.selectedDisplay === 'layout'}
      class="w-1/3 mx-2 flex items-center justify-center hover:bg-highlight-400 cursor-pointer rounded-lg"
      >
        <svg class="w-6 h-6 stroke-2" viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path stroke="gray" fill="gray" d="M91.5 30.5V30H91H62V1V0.5H61.5H60.5H60V1V30H32V1V0.5H31.5H30.5H30V1V30H1H0.5V30.5V31.5V32H1H30V60H1H0.5V60.5V61.5V62H1H30V91V91.5H30.5H31.5H32V91V62H60V91V91.5H60.5H61.5H62V91V62H91H91.5V61.5V60.5V60H91H62V32H91H91.5V31.5V30.5ZM32 32H60V60H32V32Z" />
        </svg>
        <div class="p-2">Layout</div>
    </div>
    <div 
      on:click="{()=>{changeSelectedDisplay('settings')}}" 
      class:bg-highlight={$appSettings.selectedDisplay === 'settings'}
      class="w-1/3 mx-2 flex items-center justify-center hover:bg-highlight-400 cursor-pointer rounded-lg"
      >
        <svg class="w-6 h-6"  viewBox="0 0 86 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0H47V15H0V0Z" fill="gray"/>
          <path d="M67 0H86V15H67V0Z" fill="gray"/>
          <path d="M0 37H21V52H0V37Z" fill="gray"/>
          <path d="M41 37H86V52H41V37Z" fill="gray"/>
          <path d="M0 75H52V90H0V75Z" fill="gray"/>
          <path d="M72 75H86V90H72V75Z" fill="gray"/>
          <path d="M51 0H63V15H51V0Z" fill="#C4C4C4"/>
          <path d="M25 37H37V52H25V37Z" fill="#C4C4C4"/>
          <path d="M56 75H68V90H56V75Z" fill="#C4C4C4"/>
          </svg>
        <div class="p-2">Settings</div>
    </div>
    <div 
      on:click="{()=>{ changeSelectedDisplay('profiles') }}" 
      class:bg-highlight={$appSettings.selectedDisplay === 'profiles'}
      class="w-1/3 mx-2 flex items-center justify-center hover:bg-highlight-400 cursor-pointer rounded-lg"
      >
      <svg class="w-6 h-6" viewBox="0 0 85 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0H20V90H0V0Z" fill="#C4C4C4"/>
        <path d="M23 0H49V90H23V0Z" fill="#969696"/>
        <path d="M52 0H85V90H52V0Z" fill="#5A5A5A"/>
      </svg>
      <div class="p-2">Profiles</div>
    </div>
  </div>
  
  <div class="w-1/4 flex justify-end">
    <div class="p-4 text-white">Version: {appVersion}</div>
    <div class="p-4 text-white">Protocol: {$appSettings.version.major + '.' + $appSettings.version.minor + '.' + $appSettings.version.patch }</div>
  </div>
</div>





