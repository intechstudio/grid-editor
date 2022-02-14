<script>


  /*
  *   tailwindcss
  */

  import Tailwindcss from './Tailwindcss.svelte';


  /**
   *  svelte UI parts and components
  */

  import { onMount } from 'svelte';

  import Titlebar from              './app/main/Titlebar.svelte';
  import NavTabs from               './app/main/NavTabs.svelte';

  import RightPanelContainer from   './app/main/RightPanelContainer.svelte';
  import LeftPanelContainer from    './app/main/LeftPanelContainer.svelte';
  import GridLayout from            './app/main/grid-layout/GridLayout.svelte';
  import TopSubMenu from            './app/main/TopSubMenu.svelte';

  import Export from                 './app/main/modals/Export.svelte';
  import Welcome from                 './app/main/modals/Welcome.svelte';
  import Monaco from                 './app/main/modals/Monaco.svelte';

  import CursorLog from             './app/main/user-interface/cursor-log/CursorLog.svelte';
  import FirmwareCheck from         './app/main/FirmwareCheck.svelte';
  import TooltipGetter from         './app/main/user-interface/tooltip/TooltipGetter.svelte';

  import Updater from               './app/shared/updater/Updater.svelte';
  import { appSettings } from       './app/runtime/app-helper.store'

  let modalComponents = {}
  modalComponents[""] = undefined;
  modalComponents["welcome"] = Welcome;
  modalComponents["export"] = Export;
  modalComponents["code"] = Monaco;

</script>

<Tailwindcss />

<Titlebar/>

<main id="app" spellcheck="false" class=" relative flex w-full h-full flex-row justify-between overflow-hidden">

  <!-- Switch between tabs for different application features. -->
  <NavTabs/> 

  <svelte:component 
    this={modalComponents[$appSettings.modal]}
  />

  <!-- Update notification -->
  <Updater/>

  <CursorLog/>

  <TooltipGetter/>

  <div class="flex flex-col w-full h-full">
  
    <TopSubMenu/>

    <FirmwareCheck/>

    <div class="flex w-full h-full overflow-hidden">

      <LeftPanelContainer classes={"w-4/12"}/>
      
      <!-- This is the (mostly) Layout part of the code. -->
      <GridLayout classes={"w-6/12"}/>

      <!-- The right side panel container -->
      <RightPanelContainer classes={"w-6/12"}/>

    </div>
  </div>


</main>

