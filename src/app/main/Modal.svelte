<script>
  import { onDestroy, onMount } from "svelte";
  import { runtime } from "../runtime/runtime.store";
  import BtnAndPopUp from "./user-interface/BtnAndPopUp.svelte";
  import { appSettings } from "./_stores/app-helper.store";

  import {clickOutside} from './_actions/click-outside.action'

  let config = '';

  function copyToClipboard(value){
    const _tempSpan = document.createElement('input');
    _tempSpan.value = `${value}`;
    _tempSpan.id = "temp-clip"
    document.getElementById('modal-copy-placeholder').append(_tempSpan);
    const _temp = document.querySelector("#temp-clip");
    _temp.select();
    document.execCommand("copy");
    document.getElementById("temp-clip").remove();
  }

  onMount(()=>{
    runtime.active_lua((lua) => {
      config = `<?lua ${lua} ?>`;
    });
  })


</script>

{#if $appSettings.modal == 'export'}

<div id="modal-copy-placeholder"></div>

<modal class="flex z-40 absolute items-center justify-center w-full h-screen bg-primary bg-opacity-50">

  <div use:clickOutside={{useCapture:true}} on:click-outside={()=>{$appSettings.modal = ''}}  id="clickbox" class="text-white relative z-50 flex flex-col shadow p-4 border border-black bg-primary bg-opacity-100 rounded items-start w-1/3 opacity-100">

      <div class="w-full flex justify-between items-center">
        <div class="text-gray-500 text-sm pb-1">Export Configurations</div>

        <div on:click={()=>{$appSettings.modal = ''}} id="close-btn" class="p-1 cursor-pointer rounded not-draggable hover:bg-secondary">
          <svg class="w-5 h-5 p-1 fill-current text-gray-300" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
            <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
          </svg>
        </div>
      </div>

      <textarea bind:value={config} class="bg-secondary min-h-200 font-mono w-full p-1 my-1 rounded"></textarea>

      <BtnAndPopUp on:clicked={()=>{copyToClipboard(config)}} btnStyle={"bg-commit mt-2 hover:bg-commit-saturate-10 rounded"} popStyle={'bg-commit-saturate-10'}>
        <span slot="popup">Copied to clipboard!</span>
        <span slot="button">Copy</span>
      </BtnAndPopUp>

    </div>



</modal>
{/if}