<script>
  import {fly} from 'svelte/transition';
  import { get } from 'svelte/store';
  import { actionPrefStore } from '../action-preferences.store';

  export let toggle;
  export let index;
  export let advanced = false;
  export let type;
  let preferencesMenu = false;

</script>

{#if type == "standard"}
  {#if preferencesMenu}
    <preferences-menu class="flex {toggle ? 'flex-col items-end bg-opacity-25' : 'flex-row items-center bg-secondary'}">
      {#if advanced}
        <div in:fly={{x:5}} class="table {toggle ? 'my-1 mx-2' : 'mr-2'}">
          <span on:click={()=>{actionPrefStore.showAdvanced(index, true); preferencesMenu = false;}} class="flex text-sm text-white  bg-green-600 hover:bg-green-700 cursor-pointer items-center rounded-md justify-center px-2 py-1">Advanced</span>
        </div>
      {/if}
      <div in:fly={{x:5}} class="table {toggle ? 'my-1 mx-2' : 'mr-2'}">
        <span class="flex text-sm text-white  bg-red-500 hover:bg-red-700 cursor-pointer items-center rounded-md justify-center px-2 py-1">Remove</span>
      </div>
      <div in:fly={{x:5}} class="table relative {toggle ? 'my-1 mx-2' : 'mr-2'}">
        <!--<div class="absolute block text-white text-xs bg-commit-saturate-20 tracking-wide px-2 py-2 rounded-lg top-0 -mt-10 z-50">Copied!</div>--> 
        <span on:click={()=>{}} class="flex text-sm text-white  bg-purple-500 hover:bg-purple-700 cursor-pointer items-center rounded-md justify-center px-2 py-1">Copy</span>
      </div>
    </preferences-menu>
  {/if}

  <preferences on:click={()=>{ preferencesMenu = ! preferencesMenu}} class=" flex pl-2 group justify-center items-center bg-transparent">
    <svg style="padding:0.125rem" class="{preferencesMenu ? 'bg-select-desaturate-10' : ''} h-6 w-6 group-hover:bg-select-desaturate-10 group-hover:cursor-pointer rounded-full" viewBox="0 0 8 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4C8 6.20914 6.20914 8 4 8C1.79086 8 0 6.20914 0 4C0 1.79086 1.79086 0 4 0C6.20914 0 8 1.79086 8 4Z" fill="#ffffff"/>
      <path d="M8 16C8 18.2091 6.20914 20 4 20C1.79086 20 0 18.2091 0 16C0 13.7909 1.79086 12 4 12C6.20914 12 8 13.7909 8 16Z" fill="#ffffff"/>
      <path d="M8 28C8 30.2091 6.20914 32 4 32C1.79086 32 0 30.2091 0 28C0 25.7909 1.79086 24 4 24C6.20914 24 8 25.7909 8 28Z" fill="#ffffff"/>
    </svg>
  </preferences>
{/if}