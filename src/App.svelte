<script>

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
  import { engine } from './app/runtime/runtime.store';
import FirmwareCheck from './app/shared/firmware-check/FirmwareCheck.svelte';

  //let state = 'ENABLED';

  const engine_state = engine.state;

  //engine.state.subscribe(s => {state = s;})

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

    <div class="flex w-full h-full { $engine_state == 'ENABLED' ? '' : 'pointer-events-none'}">

      <LeftPanelContainer classes={"w-3/12"}/>
      
      <!-- This is the (mostly) Layout part of the code. -->
      <GridLayout classes={"w-7/12"}/>

      <!-- The right side panel container -->
      <RightPanelContainer classes={"w-5/12"}/>

    </div>
  </div>

</main>

