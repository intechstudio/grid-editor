<script>
  import { onMount } from 'svelte';
import { appSettings } from "../runtime/app-helper.store";


  const {BrowserWindow, getCurrentWindow} = require("@electron/remote");

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

    if(process.platform != 'darwin'){
      init();
    }

    let startingWindow = getCurrentWindow();
    startingWindow.isMaximized() ? isMaximized = true : false;

  });


</script>



<top-bar style="background-color:rgb(25, 26, 32)" class="text-white static top-0 w-full p-1">
   
  <!-- Editor logo text svg -->
  {#if process.platform != 'darwin'}
  <div class="draggable flex justify-between">
    <div class="flex items-center pl-2">
      <svg class="w-12 fill-current text-gray-500" viewBox="0 0 58 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.01576 13H7.22576C7.42376 13 7.58576 12.838 7.58576 12.64V11.65C7.58576 11.452 7.42376 11.29 7.22576 11.29H2.54576C2.43776 11.29 2.36576 11.218 2.36576 11.11V7.6C2.36576 7.492 2.43776 7.42 2.54576 7.42H6.99176C7.18976 7.42 7.35176 7.258 7.35176 7.06V6.07C7.35176 5.872 7.18976 5.71 6.99176 5.71H2.54576C2.43776 5.71 2.36576 5.638 2.36576 5.53V2.29C2.36576 2.182 2.43776 2.11 2.54576 2.11H7.18976C7.38776 2.11 7.54976 1.948 7.54976 1.75V0.760002C7.54976 0.562001 7.38776 0.400002 7.18976 0.400002H1.01576C0.817762 0.400002 0.655762 0.562001 0.655762 0.760002V12.64C0.655762 12.838 0.817762 13 1.01576 13Z"/>
        <path d="M10.5702 13H13.9002C15.5202 13 16.7802 12.19 17.3922 10.93C17.8602 9.958 17.8962 8.374 17.8962 6.7C17.8962 5.026 17.8602 3.442 17.3922 2.47C16.7802 1.21 15.5202 0.400002 13.9002 0.400002H10.5702C10.3722 0.400002 10.2102 0.562001 10.2102 0.760002V12.64C10.2102 12.838 10.3722 13 10.5702 13ZM13.9002 11.29H12.1002C11.9922 11.29 11.9202 11.218 11.9202 11.11V2.29C11.9202 2.182 11.9922 2.11 12.1002 2.11H13.9002C14.6022 2.11 15.3942 2.488 15.7722 3.208C16.1142 3.856 16.1322 5.368 16.1322 6.7C16.1322 8.032 16.1142 9.544 15.7722 10.192C15.3942 10.912 14.6022 11.29 13.9002 11.29Z" />
        <path d="M22.8787 2.146V11.236C22.8787 11.344 22.8067 11.416 22.6987 11.416H20.3587C20.1607 11.416 19.9987 11.578 19.9987 11.776V12.64C19.9987 12.838 20.1607 13 20.3587 13H27.1087C27.3067 13 27.4687 12.838 27.4687 12.64V11.776C27.4687 11.578 27.3067 11.416 27.1087 11.416H24.7687C24.6607 11.416 24.5887 11.344 24.5887 11.236V2.146C24.5887 2.038 24.6607 1.966 24.7687 1.966H26.9287C27.1267 1.966 27.2887 1.804 27.2887 1.606V0.760002C27.2887 0.562001 27.1267 0.400002 26.9287 0.400002H20.5387C20.3407 0.400002 20.1787 0.562001 20.1787 0.760002V1.606C20.1787 1.804 20.3407 1.966 20.5387 1.966H22.6987C22.8067 1.966 22.8787 2.038 22.8787 2.146Z" />
        <path d="M34.6832 2.11H37.7792C37.9772 2.11 38.1392 1.948 38.1392 1.75V0.760002C38.1392 0.562001 37.9772 0.400002 37.7792 0.400002H29.4992C29.3012 0.400002 29.1392 0.562001 29.1392 0.760002V1.75C29.1392 1.948 29.3012 2.11 29.4992 2.11H32.6132C32.7212 2.11 32.7932 2.182 32.7932 2.29V12.64C32.7932 12.838 32.9552 13 33.1532 13H34.1432C34.3412 13 34.5032 12.838 34.5032 12.64V2.29C34.5032 2.182 34.5752 2.11 34.6832 2.11Z" />
        <path d="M43.5357 13.18C45.3357 13.18 46.5597 12.244 47.1357 11.038C47.6757 9.922 47.7117 8.374 47.7117 6.7C47.7117 5.026 47.6757 3.478 47.1357 2.362C46.5597 1.156 45.3357 0.220001 43.5357 0.220001C41.7357 0.220001 40.5117 1.156 39.9357 2.362C39.3957 3.478 39.3597 5.026 39.3597 6.7C39.3597 8.374 39.3957 9.922 39.9357 11.038C40.5117 12.244 41.7357 13.18 43.5357 13.18ZM43.5357 11.47C42.5637 11.47 41.8977 10.984 41.5197 10.264C41.1417 9.544 41.1237 8.032 41.1237 6.7C41.1237 5.368 41.1417 3.856 41.5197 3.136C41.8977 2.416 42.5637 1.93 43.5357 1.93C44.5077 1.93 45.1737 2.416 45.5517 3.136C45.9297 3.856 45.9477 5.368 45.9477 6.7C45.9477 8.032 45.9297 9.544 45.5517 10.264C45.1737 10.984 44.5077 11.47 43.5357 11.47Z" />
        <path d="M50.4262 13H51.4162C51.6142 13 51.7762 12.838 51.7762 12.64V8.14C51.7762 8.032 51.8482 7.96 51.9562 7.96H53.0542C53.2522 7.96 53.3422 8.068 53.3962 8.176L55.5562 12.712C55.6282 12.856 55.7542 13 55.9882 13H57.0862C57.3382 13 57.4462 12.838 57.4462 12.676C57.4462 12.55 57.4102 12.46 57.3742 12.388L55.2862 8.14C55.2322 8.032 55.1962 7.942 55.1962 7.834C55.1962 7.672 55.3402 7.546 55.5742 7.402C56.6542 6.736 57.4462 5.728 57.4462 4.18C57.4462 1.912 55.7542 0.400002 53.6662 0.400002H50.4262C50.2282 0.400002 50.0662 0.562001 50.0662 0.760002V12.64C50.0662 12.838 50.2282 13 50.4262 13ZM53.6662 6.25H51.9562C51.8482 6.25 51.7762 6.178 51.7762 6.07V2.29C51.7762 2.182 51.8482 2.11 51.9562 2.11H53.6662C54.7642 2.11 55.6822 2.866 55.6822 4.18C55.6822 5.494 54.7642 6.25 53.6662 6.25Z" />
      </svg>
    </div>

    <!-- Title Text + version -->
    
    <div class="flex text-gray-500 text-sm pt-1">Grid Editor v{$appSettings.version.major}.{$appSettings.version.minor}.{$appSettings.version.patch}</div>

    <!-- Min Max Close -->

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
  </div>
  {:else}
  <div class="draggable flex items-center justify-center h-7">
    <div class="flex text-gray-500 text-sm pt-1">Grid Editor v{$appSettings.version.major}.{$appSettings.version.minor}.{$appSettings.version.patch}</div>
  </div>
  {/if}
</top-bar>

<style>
  :global(.draggable){
    -webkit-app-region:drag;
  }

  :global(.not-draggable){
    -webkit-app-region:no-drag;
  }

</style>