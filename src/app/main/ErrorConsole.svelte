<script>
  import { onMount } from 'svelte';
  import { writable, get } from 'svelte/store';
  

  import { fade, blur, fly, slide, scale } from "svelte/transition";

  const { getGlobal } = require('@electron/remote');
  const trackEvent = getGlobal('trackEvent');

  let logelement;
  let text = '';

 

  onMount(()=>{

    window.onunhandledrejection = (e) => {
		  console.log('we got exception, but the app has crashed', e);
      logelement.innerHTML += "The Application Crashed: " + " ### " + e.reason + "<br>";
      logelement.innerHTML += "Reload the application using " + text;
    }

    if(process.platform == 'darwin'){
      text = 'Command + Shift + R';
    } else {
      text = 'Ctrl + Shift + R';
    }
  })



</script>

<style>


</style>

<div bind:this={logelement} class="w-full bg-red-600 text-white justify-center flex items-center">
</div>