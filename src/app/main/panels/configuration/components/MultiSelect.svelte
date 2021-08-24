<script>
  import { configManagement } from '../../../../runtime/config-manager.store.js';

  import { appActionClipboard, appMultiSelect } from '../../../../runtime/runtime.store.js';
  import BtnAndPopUp from '../../../user-interface/BtnAndPopUp.svelte';

  function multiSelectToggle(){

  }

</script>


<app-action-multi-select class=" flex items-center justify-end flex-wrap">
  <!-- When any of the array elements is true -->  
  <BtnAndPopUp on:clicked={()=>{configManagement().on_click.cut(); appMultiSelect.reset();}} btnStyle={`bg-yellow-500 hover:bg-yellow-600 mr-2 rounded-full ${$appMultiSelect.selection.includes(true) ? '' : 'opacity-50 pointer-events-none'}`} popStyle={'bg-yellow-500 '}> 
    <span slot="popup">Cutted!</span>
    <span slot="button">Cut</span>
  </BtnAndPopUp>

  <BtnAndPopUp on:clicked={()=>{configManagement().on_click.copy(); appMultiSelect.reset();}} btnStyle={`bg-pick hover:bg-pick-saturate-10 mr-2 rounded-full ${$appMultiSelect.selection.includes(true) ? '' : 'opacity-50 pointer-events-none'}`} popStyle={'bg-pick '}> 
    <span slot="popup">Copied!</span>
    <span slot="button">Copy</span>
  </BtnAndPopUp>

  <BtnAndPopUp on:clicked={()=>{configManagement().on_click.paste(); appMultiSelect.reset();}} btnStyle={`bg-purple-500 hover:bg-purple-600 mr-2 rounded-full ${$appActionClipboard.length > 0 ? '' : 'opacity-50 pointer-events-none'}`} popStyle={'bg-purple-500 '}> 
    <span slot="popup">Pasted!</span>
    <span slot="button">Paste</span>
  </BtnAndPopUp>


  <BtnAndPopUp on:clicked={()=>{configManagement().on_click.remove(); appMultiSelect.reset();}} btnStyle={`bg-red-500 hover:bg-red-600 mr-2 rounded-full ${$appMultiSelect.selection.includes(true) ? '' : 'opacity-50 pointer-events-none'}`} popStyle={'bg-red-500 '}> 
    <span slot="popup">Removed!</span>
    <span slot="button">Remove</span>
  </BtnAndPopUp> 

  <div 
    on:click={()=>{configManagement().on_click.select_all();  /* appMultiSelect.select({config: configs[index], selected: selected})*/}}
    class="{$appMultiSelect.all_selected  ? 'bg-pick' : ''}  flex items-center justify-center p-2 w-6 h-6 border-2 border-pick rounded-full text-white cursor-pointer text-xs">
      {$appMultiSelect.all_selected ? '✔' : ''}
  </div>


</app-action-multi-select>

<style>



</style>