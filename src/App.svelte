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
  import Feedback from                 './app/main/modals/Feedback.svelte';

  import CursorLog from             './app/main/user-interface/cursor-log/CursorLog.svelte';
  import FirmwareCheck from         './app/main/FirmwareCheck.svelte';
  import ErrorConsole from          './app/main/ErrorConsole.svelte';
  import TooltipGetter from         './app/main/user-interface/tooltip/TooltipGetter.svelte';

  import Updater from               './app/shared/updater/Updater.svelte';
  import { appSettings } from       './app/runtime/app-helper.store'

  let modalComponents = {}
  modalComponents[""] = undefined;
  modalComponents["welcome"] = Welcome;
  modalComponents["export"] = Export;
  modalComponents["code"] = Monaco;
  modalComponents["feedback"] = Feedback;
  
  let startX, startY, startWidth, startHeight, stopWidth, stopX;


  //resize the element
  function Resize(e) {
    element.style.width = (startWidth - e.clientX + startX) + 'px';
  }
  //on mouseup remove windows functions mousemove & mouseup
  function stopResize(e) {
    startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
    startX = e.clientX; // lehetne getboundingclientrect is
    document.removeEventListener('mousemove', Resize, false);
    document.removeEventListener('mouseup', stopResize, false);
  }


  //Window funtion mousemove & mouseup
  function startDrag(e) {
    startX = element.getBoundingClientRect().x; // horixontal cordinate
    startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
    document.addEventListener('mousemove', Resize, false);
    document.addEventListener('mouseup', stopResize, false);
 }

  let element;
  let originalLeftPos;
  onMount(()=>{

    /*

    element = document.getElementById('right-panel');
    //create box in bottom-left
    var resizer = document.createElement('div');
    resizer.style.width = '10px';
    resizer.style.height = '10px';
    resizer.style.background = 'red';
    resizer.style.position = 'absolute';
    resizer.style.left = 0;
    resizer.style.top = 0;
    resizer.style.cursor = 'se-resize';
    //Append Child to Element
    element.appendChild(resizer);
    
    //box function onmousemove
    resizer.addEventListener('mousedown', startDrag, false);

    */
   
  })


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

    <ErrorConsole/>

    <div class="flex w-full h-full overflow-hidden ">

      <LeftPanelContainer classes={"w-3/12 "}/>
      
      <!-- This is the (mostly) Layout part of the code. -->
      <GridLayout classes={"flex-1"}/>

      <!-- The right side panel container -->
      <RightPanelContainer classes={"w-4/12"}/>

    </div>
  </div>


</main>

