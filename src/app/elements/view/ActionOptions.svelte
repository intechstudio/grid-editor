<script>
  import {fly} from 'svelte/transition';
  import { get } from 'svelte/store';
  import { actionPrefStore, appMultiSelect } from '../action-preferences.store';

  export let index;
  export let type;


</script>

{#if type == "standard" && !$appMultiSelect.enabled}
  <show-advanced id="show-advanced" on:click={()=>{  actionPrefStore.showAdvanced(index) }} class="flex pl-2 group justify-center  items-center bg-transparent">
    <svg style="padding:0.125rem" class="{$actionPrefStore.advanced.visible && $actionPrefStore.advanced.index == index ? 'bg-select-desaturate-10' : ''} h-6 w-6 pointer-events-none group-hover:bg-select-desaturate-10 group-hover:cursor-pointer rounded-full" viewBox="0 0 8 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4C8 6.20914 6.20914 8 4 8C1.79086 8 0 6.20914 0 4C0 1.79086 1.79086 0 4 0C6.20914 0 8 1.79086 8 4Z" fill="#ffffff"/>
      <path d="M8 16C8 18.2091 6.20914 20 4 20C1.79086 20 0 18.2091 0 16C0 13.7909 1.79086 12 4 12C6.20914 12 8 13.7909 8 16Z" fill="#ffffff"/>
      <path d="M8 28C8 30.2091 6.20914 32 4 32C1.79086 32 0 30.2091 0 28C0 25.7909 1.79086 24 4 24C6.20914 24 8 25.7909 8 28Z" fill="#ffffff"/>
    </svg>
  </show-advanced>
{:else}
<select-box class="flex pl-2 group justify-center items-center bg-transparent">
  <div 
    on:click={()=>{$appMultiSelect.selection[index] = !$appMultiSelect.selection[index]}} 
    class="{$appMultiSelect.selection[index] ? 'bg-pick' : ''} rounded-full flex items-center justify-center border-2 p-2 border-pick w-6 h-6 text-white text-xs">
      {$appMultiSelect.selection[index] ? '✔' : ''}
  </div>
</select-box>
{/if}