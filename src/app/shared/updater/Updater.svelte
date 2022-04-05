<script>
  const { ipcRenderer, app } = require('electron');

  import { openInBrowser } from '../../runtime/app-helper.store';

  // self update
  let updateNotification = false;
  let updateReady = false;
  let updateProgress = 0;
  let updateError = "";

  function restartApp(){
    ipcRenderer.send('restart_app');
  }  

  ipcRenderer.on('update_available', () => {
    ipcRenderer.removeAllListeners('update_available');
    console.log('update available')
    updateNotification = true;
  });
    
  ipcRenderer.on('update_downloaded', () => {
    ipcRenderer.removeAllListeners('update_downloaded');
    console.log('update downloaded')
    updateReady = true;
  });

  ipcRenderer.on('update_progress', (event,arg) => {
    updateProgress = Math.floor(arg.percent);
    console.log('update progress...', event, arg)
  });

  ipcRenderer.on('update_error', (event, arg) => {
    updateError = arg;  
    console.log('update error...', updateError)
  });



</script>

{#if updateNotification} <!--updateNotification-->
    <div style="z-index:9999;" class="bg-primary fixed text-white shadow rounded-lg left-1 bottom-1">
      <div id="notification" style="width:300px" class="p-4 rounded-lg">    


        {#if updateNotification && updateError == "" && !updateReady}
          <p class="text-xl pb-2">✨New version is available!</p> 
          <p class="py-2 loading">Downloading in the background {#if updateProgress !== 0 && updateProgress !== undefined}{updateProgress + '%'}{/if}</p>
          {#if updateProgress !== 0 && updateProgress !== undefined}<div style="width:{updateProgress + '%'};" class="rounded my-2 h-1 flex bg-highlight"></div>{/if}
        {/if}
        

        {#if updateReady}
          <p class="text-xl pb-2">🥂Update Downloaded!</p>
          <p class="py-2">It will be installed on restart.</p>
          <p class="py-2">Restart now?</p>
          <button class="cursor-pointer relative px-2 py-1 mt-2 mr-2 border-highlight bg-highlight rounded hover:bg-highlight-400 focus:outline-none" 
            id="restart-button" 
            on:click={restartApp}>
            Restart
          </button>
        {/if}

        {#if updateError !== ""}
        <p class="text-xl pb-2">💥Error during self-update!</p> 
        <p class="py-2">Please visit the website and pick the download for your operating system!</p>
        
        <button 
        class="cursor-pointer relative px-2 py-1 mt-2 mr-2 bg-commit rounded hover:bg-commit-saturate-20 focus:outline-none" 
        on:click={()=> {openInBrowser(process.env.EDITOR_DOWNLOAD_URL)}}>
          Download
        </button>

        {/if}

        <button id="close-button" class="cursor-pointer relative px-2 py-1 mt-2 border-highlight rounded hover:bg-highlight-400 focus:outline-none" on:click={() => {updateNotification = false}}>
          Close
        </button>

      </div>
    </div>
  {/if}


<style>

  #notification {
    background: -webkit-linear-gradient(45deg, #7D4645 0%, rgba(35, 104, 184, 0.29529) 44.71%, rgba(222, 118, 239, 0) 100%);
  }

  .hidden {
    display: none;
  }

  .loading:after {
  content: ' .';
  animation: dots 1s steps(5, end) infinite;}

  @keyframes dots {
    0%, 20% {
      color: rgba(0,0,0,0);
      text-shadow:
        .25em 0 0 rgba(0,0,0,0),
        .5em 0 0 rgba(0,0,0,0);}
    40% {
      color: white;
      text-shadow:
        .25em 0 0 rgba(0,0,0,0),
        .5em 0 0 rgba(0,0,0,0);}
    60% {
      text-shadow:
        .25em 0 0 white,
        .5em 0 0 rgba(0,0,0,0);}
    80%, 100% {
      text-shadow:
        .25em 0 0 white,
        .5em 0 0 white;}
      }

  </style>