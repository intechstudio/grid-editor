<script>
  import { configManagement } from '../../../../runtime/config-manager.store.js';

  import { appMultiSelect } from '../../../../runtime/runtime.store.js';
  import BtnAndPopUp from '../../../user-interface/BtnAndPopUp.svelte';

  function multiSelectToggle(){
    $appMultiSelect.enabled = !$appMultiSelect.enabled;
    if(!$appMultiSelect.enabled){
      appMultiSelect.reset();
    }
  }

</script>


<app-action-multi-select class="flex items-end justify-end  flex-wrap">
  <!-- When any of the array elements is true -->  

  {#if $appMultiSelect.enabled}
  <BtnAndPopUp on:clicked={()=>{configManagement().on_click.remove(); appMultiSelect.reset();}} btnStyle={"bg-red-500 hover:bg-red-600 mr-2 rounded-full"} popStyle={'bg-red-500 '}> 
    <span slot="popup">Removed!</span>
    <span slot="button">Remove</span>
  </BtnAndPopUp>

  <BtnAndPopUp on:clicked={()=>{configManagement().on_click.cut(); appMultiSelect.reset();}} btnStyle={"bg-yellow-500 hover:bg-yellow-600 mr-2 rounded-full"} popStyle={'bg-yellow-500 '}> 
    <span slot="popup">Cutted!</span>
    <span slot="button">Cut</span>
  </BtnAndPopUp>

  <BtnAndPopUp on:clicked={()=>{configManagement().on_click.copy(); appMultiSelect.reset();}} btnStyle={"bg-pick hover:bg-pick-saturate-10 mr-2 rounded-full"} popStyle={'bg-pick '}> 
    <span slot="popup">Copied!</span>
    <span slot="button">Copy</span>
  </BtnAndPopUp>
  {/if}

  <button 
    on:click={()=>{multiSelectToggle()}} 
    class="text-sm py-0.5 px-4 mr-2 text-white rounded-full hover:bg-select focus:ring-0 focus:outline-none border border-select-saturate-10 shadow hover:border-purple-500">
     {@html $appMultiSelect.enabled ? `
        <svg class="w-5 h-5 p-1 fill-current text-white" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
          <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
        </svg>
    ` : `
    <svg style="padding:0.125rem" class="rotate-90 transform h-5 w-5 pointer-events-none group-hover:bg-select-desaturate-10 group-hover:cursor-pointer rounded-full" viewBox="0 0 8 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4C8 6.20914 6.20914 8 4 8C1.79086 8 0 6.20914 0 4C0 1.79086 1.79086 0 4 0C6.20914 0 8 1.79086 8 4Z" fill="#ffffff"/>
      <path d="M8 16C8 18.2091 6.20914 20 4 20C1.79086 20 0 18.2091 0 16C0 13.7909 1.79086 12 4 12C6.20914 12 8 13.7909 8 16Z" fill="#ffffff"/>
      <path d="M8 28C8 30.2091 6.20914 32 4 32C1.79086 32 0 30.2091 0 28C0 25.7909 1.79086 24 4 24C6.20914 24 8 25.7909 8 28Z" fill="#ffffff"/>
    </svg>
    `}
  </button>

  {#if $appMultiSelect.enabled}
    <div 
      on:click={()=>{configManagement().on_click.select_all();  /* appMultiSelect.select({config: configs[index], selected: selected})*/}}
      class="{$appMultiSelect.all_selected  ? 'bg-pick' : ''}  flex items-center justify-center p-2 w-6 h-6 border-2  border-pick rounded-full text-white text-xs">
        {$appMultiSelect.all_selected ? '✔' : ''}
    </div>

  {/if}

</app-action-multi-select>

<style>



</style>