<script>

  import { appMultiSelect, appActionManagement } from '../../../../runtime/runtime.store.js';
  import BtnAndPopUp from '../../../user-interface/BtnAndPopUp.svelte';

  let multiSelectToggle = false;

  appMultiSelect.subscribe(chg => console.log('appMultiSelect', chg));

  let removeClick;
  let copyClick;

  function handleClick(e){
    if(e == 'copy'){
      appActionManagement.copy(); 
    } else {
      appActionManagement.remove();
    }
  }

  function clearUpSelection(){
    $appMultiSelect.selection = [];
    $appMultiSelect.enabled = false;
  }


</script>


<app-action-multi-select class="flex">
  <!-- When any of the array elements is true -->
  {#if $appMultiSelect.selection.includes(true) && $appMultiSelect.enabled}
    <BtnAndPopUp btnStyle={"bg-red-500 hover:bg-red-600 mr-2"} popStyle={'bg-red-500 '}> 
      <span slot="popup">Removed!</span>
      <span slot="button">Remove</span>
    </BtnAndPopUp>
  
    <BtnAndPopUp on:clicked={()=>{handleClick('copy'); clearUpSelection()}} btnStyle={"bg-pick hover:bg-pick-saturate-10 mr-2"} popStyle={'bg-pick '}> 
      <span slot="popup">Copied!</span>
      <span slot="button">Copy</span>
    </BtnAndPopUp>
  {/if}
  <button 
    on:click={()=>{$appMultiSelect.enabled = !$appMultiSelect.enabled }} 
    class="text-sm py-0.5 px-4 text-white rounded-full hover:bg-select focus:ring-0 focus:outline-none border border-select-saturate-10 shadow hover:border-purple-500">
     {@html $appMultiSelect.enabled ? `
        <svg class="w-5 h-5 p-1 fill-current text-white" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
          <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
        </svg>
    `  : 'Select'}
  </button>
</app-action-multi-select>

<style>



</style>