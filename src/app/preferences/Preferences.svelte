
<script>

  import {appSettings } from '../stores/app-settings.store';

  function close(){
    appSettings.update( store => {
      store.preferences = false;
      return store;
    })
  }

</script>

{#if $appSettings.preferences}
  <preferences class="w-full h-full absolute flex items-center justify-center ">
    <container class="w-1/2 bg-primary  m-2 shadow-lg text-white">

      <top style="background-color:rgb(25, 26, 32)" class="flex justify-between ">
        <div class="p-2">Preferences</div>
        <button class="border-none outline-none p-2" on:click={()=> {close()}}>
          <svg class="w-5 h-5 p-1 fill-current text-gray-500" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
            <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
          </svg>
        </button>
      </top>

      <main class="flex flex-row">
        <aside class="flex flex-col ml-2">
          <tab class="p-2 rounded-l-lg ">Events</tab>
          <tab class="p-2 rounded-l-lg ">Grid Connection</tab>
          <tab class="p-2 rounded-l-lg ">Actions</tab>
          <tab class="p-2 rounded-l-lg  bg-secondary">Debug</tab>
          <tab class="p-2 rounded-l-lg ">Advanced</tab>
        </aside>
        <tab-container class="flex bg-secondary w-full p-2 my-2 mr-2 rounded-lg">
          Hi
        </tab-container>
      </main>

    </container>
 
  </preferences>
{/if}