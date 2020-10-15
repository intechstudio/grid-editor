<script>

  import { onMount } from 'svelte';

  const { remote } = require("electron");
  const BrowserWindow = remote.BrowserWindow;

  function init() { 
    document.getElementById("min-btn").addEventListener("click", function (e) {
          var window = BrowserWindow.getFocusedWindow();
          window.minimize(); 
    });

    document.getElementById("max-btn").addEventListener("click", function (e) {
          var window = BrowserWindow.getFocusedWindow(); 
          window.maximize(); 
    });

    document.getElementById("close-btn").addEventListener("click", function (e) {
          var window = BrowserWindow.getFocusedWindow();
          window.close();
    }); 
  }; 

  onMount(()=> {
    init();
  });


</script>

<div class="flex text-gray-300 not-draggable">
  <div id="min-btn" class="p-1 mx-1 cursor-pointer not-draggable hover:bg-secondary">min</div>
  <div id="max-btn" class="p-1 mx-1 cursor-pointer not-draggable hover:bg-secondary">max</div>
  <div id="close-btn" class="p-1 mx-1 cursor-pointer not-draggable hover:bg-secondary">close</div>
</div>