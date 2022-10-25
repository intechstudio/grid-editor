<script>
  import { onDestroy, onMount } from "svelte";
  import { luadebug_store } from "../../runtime/runtime.store";
  import BtnAndPopUp from "../user-interface/BtnAndPopUp.svelte";
  import { appSettings } from "../../runtime/app-helper.store";

  import {clickOutside} from '../_actions/click-outside.action'

  import { writable, get, readable } from 'svelte/store';

  import {Webhook} from 'simple-discord-webhooks';

  //const webhook = new Webhook(process.env.DISCORD_FEEDBACK_WEBHOOK);


  let feedback_title;
  let feedback_text; 
  let submit_button;

  let thank_you = ""; 

  onMount(()=>{

  })





  function sendFeedback(){

    //webhook.send(`######\n${feedback_title.value}\n######\n${feedback_text.value} `)

    thank_you = 'Thank you for your feedback!'
    //$appSettings.modal = ''
    submit_button.disabled = true
  }


</script>


<div id="modal-copy-placeholder"></div>

<modal class=" z-40 flex absolute items-center justify-center w-full h-screen bg-primary bg-opacity-50">

  <div use:clickOutside={{useCapture:true}} on:click-outside={()=>{$appSettings.modal = ''}}  id="clickbox" 
    class=" z-50 w-1/2 h-1/2 text-white relative flex flex-col shadow bg-primary bg-opacity-100 items-start opacity-100">

      <div class="p-8 flex-col w-full flex justify-between items-center">

        <div class="flex w-full text-4xl opacity-90">Send Feedback</div>
        <div class="flex w-full text-2xl opacity-70 ">Intech Studio</div>        

        <div on:click={()=>{$appSettings.modal = ''}} id="close-btn" 
          class="p-1  absolute top-6 right-6 cursor-pointer rounded not-draggable hover:bg-secondary">
          <svg class="w-5 h-5 p-1 fill-current text-gray-300" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
            <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
          </svg>
        </div>

      </div>

      <div class="p-8 flex-col w-full flex justify-between ml-auto">

        
        <div class="mt-4 mb-1 text-gray-500 ">Feedback Context:</div>
        <input bind:this={feedback_title} class="bg-secondary p-2" type="text" value="{$appSettings.feedback_context}"/>
        <div class="mt-4 mb-1 text-gray-500 ">Text:</div>
        <textarea bind:this={feedback_text} class="bg-secondary p-2 h-36"></textarea>
        <button bind:this={submit_button}  on:click={sendFeedback} id="close-btn" 
          class="p-1 mt-4 mb-4 w-48 rounded not-draggable hover:bg-green-500 bg-secondary disabled:bg-secondary">
          Submit Feedback!
        </button>{thank_you}
      </div>

      <div class="flex flex-row w-full absolute h-content bottom-0 bg-black bg-opacity-10 flex justify-between items-center"> 
       
        <div class="flex flex-col h-full p-6">
            <div class="flex w-full opacity-70 ">Grid Editor is Open-Source Software</div>
            <div class="flex w-full opacity-40 ">Developed by Intech Studio</div>
        </div>

      </div>

    </div>



</modal>
