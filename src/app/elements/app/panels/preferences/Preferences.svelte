
<script>

  import { appSettings, preferenceStore } from '../../../../stores/app-settings.store';

  let preferences = ['MIDI Monitor', 'Debug', 'Advanced'];

  let selectedTab = preferences[0];

  function handleInputChange(e){
    
    console.log($preferenceStore);
  }

  function close(){
    appSettings.update( store => {
      store.preferences = false;
      return store;
    })
  }

</script>

  <preferences  class="w-full h-full absolute flex items-center justify-center z-10">
    <container class="bg-primary w-96 m-2 shadow-lg text-white">
      <top  style="background-color:rgb(25, 26, 32)" class="flex justify-between ">
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
          {#each preferences as preference, index}
            <tab on:click={()=>{selectedTab = preference; preferenceStore.update(s => {s.showTab = preference; return s})}} class="{selectedTab == preference ? 'bg-secondary text-white' : 'text-gray-100 hover:bg-secondary'} p-2 rounded-l-lg cursor-pointer">{preference}</tab>
          {/each}
        </aside>
        <tab-container class="{'rounded-r-lg'} flex bg-secondary items-start justify-start flex-wrap w-full p-2 my-2 mr-2">
          {#if selectedTab == 'MIDI Monitor'}

            <div class="flex items-center p-1">
              <input checked={$preferenceStore.midiMonitor.show} on:input={(e)=>{preferenceStore.update(s => { s.midiMonitor.show = e.target.checked; return s; })}} type="checkbox">
              <label class="ml-1">Show MIDI Monitor</label>
            </div>

            <div class="flex items-center p-1">
              <input checked={$preferenceStore.midiMonitor.option} on:input={(e)=>{preferenceStore.update(s => { s.midiMonitor.option = e.target.checked; return s; })}} type="checkbox">
              <label class="ml-1">Hex output</label>
            </div>
          {/if}
        </tab-container>
      </main>

    </container>
 
  </preferences>


<style>

  tab:first-child{
    @apply mt-2;
  }

  tab:last-child{
    @apply mb-2
  }

  </style>