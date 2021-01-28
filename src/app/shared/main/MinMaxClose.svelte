<script>

  import { onMount } from 'svelte';

  const { remote } = require("electron");
  const BrowserWindow = remote.BrowserWindow;

  function init() { 
    document.getElementById("minimize-btn").addEventListener("click", function (e) {
          const window = BrowserWindow.getFocusedWindow();
          window.minimize(); 
    });

    document.getElementById("maximize-btn").addEventListener("click", function (e) {
          var window = BrowserWindow.getFocusedWindow(); 
          isMaximized = true;
          window.maximize(); 
    });

    document.getElementById("restore-down-btn").addEventListener("click", function (e) {
          const window = BrowserWindow.getFocusedWindow(); 
          isMaximized = false;
          window.restore()
    });

    document.getElementById("close-btn").addEventListener("click", function (e) {
          const window = BrowserWindow.getFocusedWindow();
          window.close();
    }); 
  }; 

  let isMaximized;

  onMount(()=> {

    init();

    let startingWindow = remote.getCurrentWindow();
    startingWindow.isMaximized() ? isMaximized = true : false;

  });


</script>

<div class="flex text-gray-300 not-draggable">

  <div id="minimize-btn" class="p-1 mx-1 cursor-pointer not-draggable hover:bg-secondary">
    <svg class="w-5 h-5 p-1 fill-current text-gray-500"  viewBox="0 0 20 3" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="3" />
    </svg>
  </div>

  <div id="maximize-btn" class:hidden={isMaximized} class="p-1 mx-1 cursor-pointer not-draggable hover:bg-secondary">
    <svg class="w-5 h-5 p-1 fill-current text-gray-500"  viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H26V26H0V0ZM3 3V23H23V3H3Z"/>
    </svg>  
  </div>

  <div id="restore-down-btn" class:hidden={!isMaximized} class="p-1 mx-1 cursor-pointer not-draggable hover:bg-secondary">
    <svg class="w-5 h-5 p-1 fill-current text-gray-500" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M20 5H0V25H20V5ZM2.30769 7.30769V22.6923H17.6923V7.30769H2.30769Z" />
      <path d="M5 5H7.30769V2.30769H22.6923V17.6923H20V20H25V0H5V5Z" />
    </svg>
  </div>
 

  <div id="close-btn" class="p-1 mx-1 cursor-pointer not-draggable hover:bg-secondary">
    <svg class="w-5 h-5 p-1 fill-current text-gray-500" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
      <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
    </svg>
  </div>

</div>