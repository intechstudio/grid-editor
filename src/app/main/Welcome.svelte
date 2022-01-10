<script>
  import { onDestroy, onMount } from "svelte";
  import { luadebug_store } from "../runtime/runtime.store";
  import BtnAndPopUp from "./user-interface/BtnAndPopUp.svelte";
  import { appSettings } from "../runtime/app-helper.store";

  import {clickOutside} from './_actions/click-outside.action'

  import { writable, get, readable } from 'svelte/store';

  onMount(()=>{


  })

  $appSettings.modal = 'welcome'

  let version = `v${get(appSettings).version.major}.${get(appSettings).version.minor}.${get(appSettings).version.patch}`

</script>

{#if $appSettings.modal == 'welcome'}

<div id="modal-copy-placeholder"></div>

<modal class="flex z-40 absolute items-center justify-center w-full h-screen bg-primary bg-opacity-50">

  <div use:clickOutside={{useCapture:true}} on:click-outside={()=>{$appSettings.modal = ''}}  id="clickbox" class="text-white relative z-50 flex flex-col shadow p-4 border border-black bg-primary bg-opacity-100 rounded items-start w-1/3 opacity-100">

      <div class="w-full flex justify-between items-center">
        <div class="text-gray-500 text-sm pb-1">Welcome</div>

        {version}

        <div on:click={()=>{$appSettings.modal = ''}} id="close-btn" class="p-1 cursor-pointer rounded not-draggable hover:bg-secondary">
          <svg class="w-5 h-5 p-1 fill-current text-gray-300" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
            <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
          </svg>
        </div>
      </div>

    </div>



</modal>
{/if}