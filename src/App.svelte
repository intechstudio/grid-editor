<script>

  /**
  *   Analytics 
  */

  const { getGlobal } = require('electron').remote;
  const trackEvent = getGlobal('trackEvent');
  require('dotenv').config();

  /*
  *   tailwindcss
  */

  import Tailwindcss from './Tailwindcss.svelte';


  /*
  *   serialport and nodejs
  */

  import SerialPort from './app/serialport/SerialPort.svelte';


  /**
   *  svelte UI parts and components
  */

  import { onMount } from 'svelte';

  import Titlebar from './app/shared/main/Titlebar.svelte';
  import NavTabs from './app/shared/main/NavTabs.svelte';
  import RightPanelContainer from './app/main/RightPanelContainer.svelte';
  import LeftPanelContainer from './app/main/LeftPanelContainer.svelte';
  import GridLayout from './app/main/grid-layout/GridLayout.svelte';
  import ConfigLibrary from './app/main/panels/config-library/ConfigLibrary.svelte';
  import TopSubMenu from './app/main/TopSubMenu.svelte';
  import Modal from './app/main/Modal.svelte';
  import Updater from './app/shared/updater/Updater.svelte';
  import CursorLog from './app/main/user-interface/cursor-log/CursorLog.svelte';
  import FirmwareCheck from './app/shared/firmware-check/FirmwareCheck.svelte';
  import { appSettings } from './app/main/_stores/app-helper.store';
  import NotificationBar from './app/shared/notifications/NotificationBar.svelte';

  onMount(()=>{

    trackEvent('fw-editor-version', `v${$appSettings.version.major}.${$appSettings.version.minor}.${$appSettings.version.patch}`);
    trackEvent('operating-system', process.platform)
    
  });

</script>

<Tailwindcss />

<Titlebar/>

<SerialPort/>


<main id="app" spellcheck="false" class=" relative flex w-full h-full flex-row justify-between overflow-hidden">

  <!-- Switch between tabs for different application features. -->
  <NavTabs/> 

  <!-- The modal pages views -->
  <Modal/>

  <!-- Update notification -->
  <Updater/>

  <CursorLog/>

  <div class="flex flex-col w-full h-full">
  
    <TopSubMenu/>

    <FirmwareCheck/>

    <div class="flex w-full h-full">

      <LeftPanelContainer classes={"w-2/12"}/>
      
      <!-- This is the (mostly) Layout part of the code. -->
      <GridLayout classes={"w-7/12"}/>

      <!-- The right side panel container -->
      <RightPanelContainer classes={"w-6/12"}/>

    </div>
  </div>

</main>

