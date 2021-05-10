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
  import PanelContainer from './app/main/PanelContainer.svelte';
  import GridLayout from './app/main/grid-layout/GridLayout.svelte';


</script>

<Tailwindcss />

<Titlebar/>

<SerialPort/>


<main id="app" class="relative flex w-full h-full flex-row justify-between overflow-hidden">

  <!-- Switch between tabs for different application features. -->
  <NavTabs/> 
  
  <!-- This is the (mostly) Layout part of the code. -->
  <GridLayout/>

  <!-- The right side panel container -->
  <PanelContainer/>

</main>

