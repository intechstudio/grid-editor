<script>
  import { onMount } from 'svelte';
  import { writable, get } from 'svelte/store';
  

  import { fade, blur, fly, slide, scale } from "svelte/transition";

  const { getGlobal } = require('@electron/remote');
  const trackEvent = getGlobal('trackEvent');
  import {analytics} from "../runtime/analytics_influx"

  const { ipcRenderer } = require('electron');

  const {Webhook} = require('simple-discord-webhooks');


  let logelement;
  let text = '';

  let logtext = [];

  onMount(()=>{

    window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {

      console.log('we got exception, but the app has crashed', errorMsg);
      logtext = [...logtext, (errorMsg)];

      analytics.track_event("application", "error console", "error notification", "error event")

      const webhook = new Webhook(process.env.DISCORD_FEEDBACK_WEBHOOK);
      webhook.send(`######\nError Notification\n######\n${errorMsg} `)

      return false;
    }


    window.onunhandledrejection = (e) => {
		  console.log('we got exception, but the app has crashed', e);
      logtext = [...logtext, (e.reason)];

      analytics.track_event("application", "error console", "error notification", "error event")

      const webhook = new Webhook(process.env.DISCORD_FEEDBACK_WEBHOOK);
      webhook.send(`######\nError Notification\n######\n${e.reason} `)
    }

    if(process.platform == 'darwin'){
      text = 'Command + Shift + R';
    } else {
      text = 'Ctrl + Shift + R';
    }


  })




  function refresh(){

    analytics.track_event("application", "error console", "error notification", "app restart")

    setTimeout(() => {
      ipcRenderer.sendSync('restart', "foo");
    }, 500);


  }



</script>

<style>


</style>

{#if logtext.length != 0}

  <div bind:this={logelement} class="w-full bg-red-600 text-white justify-center flex flex-col items-center">

    {#each logtext as log}
      
      <div>{log}</div>

    {/each}

    <div class="flex flex-row items-center">
      Reload the application using {text} or click 

      <button 
        on:click={refresh} 
        class="relative bg-gray-500 mr-3 block hover:bg-gray-300 text-white ml-3 my-2 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none">
        Restart
      </button>

    </div>
  </div>
  
{/if}

