<script>
  import { onMount } from 'svelte';
  import MinMaxClose from './MinMaxClose.svelte';
  import AppInfo from './AppInfo.svelte'
  import {appSettings} from '../../stores/app-settings.store';


  export let debugMode;

  onMount(()=>{
  })

  $: {
    appSettings.update((store)=>{
      store.debugMode = debugMode;
      return store;
    })
  }

</script>

<header id="top-bar" class="text-white static top-0 w-full bg-primary p-1">
  <div class="draggable flex justify-between">
    <div class="flex">
      <div class="p-1 text-gray-700 font-gt-pressura tracking-wider">EDITOR</div>
    </div>

    <AppInfo></AppInfo>

    <div class="flex items-center not-draggable text-sm">
      <button 
        on:click={()=> {debugMode = !debugMode}} 
        class:bg-highlight={debugMode} 
        class="text-white px-2 py-1 mx-2 rounded border-highlight hover:bg-highlight-400 focus:outline-none ">
        debug
      </button>

      <slot></slot>

    </div>

    <MinMaxClose/>
        
  </div>
</header>

<style>
  :global(.draggable){
    -webkit-app-region:drag;
  }

  :global(.not-draggable){
    -webkit-app-region:no-drag;
  }

</style>