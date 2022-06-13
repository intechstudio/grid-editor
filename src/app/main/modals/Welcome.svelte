<script>
  import { onDestroy, onMount } from "svelte";
  import { luadebug_store } from "../../runtime/runtime.store";
  import BtnAndPopUp from "../user-interface/BtnAndPopUp.svelte";
  import { appSettings, openInBrowser} from "../../runtime/app-helper.store";

  import {clickOutside} from '../_actions/click-outside.action'

  import { writable, get, readable } from 'svelte/store';

  const {google} = require('googleapis');
  const youtube = google.youtube('v3');

  let video_link= process.env["YOUTUBE_RELEASENOTES_FALLBACK_URL"]


  let helperX
  let helperY
  let mouseX
  let mouseY
  let eyesX1 = 0
  let eyesY1 = 0
  let eyesX2 = 0
  let eyesY2 = 0

  let helperElement;

  onMount(()=>{

    console.log("YOUTUBE", youtube)

    const result = youtube.playlistItems.list({
      key: process.env["YOUTUBE_API_KEY"],
      part: 'snippet',
      playlistId: process.env["YOUTUBE_RELEASENOTES_PLAYLIST_ID"],
      maxResult: 100,
    }, (err, results) => {
      //console.log("YOUTUBE", err ? err.message : results);
      if (err){

      }
      else{
        const snippet = results.data.items[results.data.items.length-1].snippet
        video_link = "https://www.youtube.com/watch?v="+snippet.resourceId.videoId
        console.log(video_link)
      }
      
    });


    const bounding = helperElement.getBoundingClientRect()

    console.log(bounding);

    helperX = bounding.x + bounding.width/2
    helperY = bounding.y + bounding.height/2


    document.addEventListener("mouseleave", e=>{

      eyesX1 = 0;
      eyesY1 = 0;
      eyesX2 = 0;
      eyesY2 = 0;

    });


    document.addEventListener("mousemove", e=>{

      let eX1 = e.clientX - helperX + 10
      let eY1 = e.clientY - helperY    

      let dist1 = Math.sqrt(eX1*eX1 + eY1*eY1)
   


      let eX2 = e.clientX - helperX - 10
      let eY2 = e.clientY - helperY

      let dist2 = Math.sqrt(eX2*eX2 + eY2*eY2)

      let agvDist = (dist1 + dist2)/2

      if (agvDist > 150){
        eyesX1 = eX1*(150/agvDist)
        eyesY1 = eY1*(150/agvDist)
      }
      else{
        eyesX1 = eX1
        eyesY1 = eY1
      }   

      if (agvDist > 150){

        eyesX2 = eX2*(150/agvDist)
        eyesY2 = eY2*(150/agvDist)
      
      }
      else{
        eyesX2 = eX2
        eyesY2 = eY2
      }

      let rate = Math.sqrt(agvDist*0.1)*20

      eyesX1 = eX1/Math.sqrt(eX1*eX1+eY1*eY1)*rate
      eyesY1 = eY1/Math.sqrt(eX1*eX1+eY1*eY1)*rate

      eyesX2 = eX2/Math.sqrt(eX2*eX2+eY2*eY2)*rate
      eyesY2 = eY2/Math.sqrt(eX2*eX2+eY2*eY2)*rate

    })


  })


  let version = `${get(appSettings).version.major}.${get(appSettings).version.minor}.${get(appSettings).version.patch}`

  

</script>


<div id="modal-copy-placeholder"></div>

<modal class=" z-40 flex absolute items-center justify-center w-full h-screen bg-secondary bg-opacity-50">

  <div use:clickOutside={{useCapture:true}} on:click-outside={()=>{$appSettings.modal = ''}}  id="clickbox" 
    class=" z-50 w-1/2 h-1/2 text-white relative flex flex-col shadow bg-primary bg-opacity-100 items-start opacity-100">

      <div class="p-8 flex-col w-full flex justify-between items-center">

        <div class="flex w-full text-4xl opacity-90">Grid Editor {version}</div>
        <div class="flex w-full text-2xl opacity-70 ">Intech Studio</div>        

        <div on:click={()=>{$appSettings.modal = ''}} id="close-btn" 
          class="p-1  absolute top-6 right-6 cursor-pointer rounded not-draggable hover:bg-secondary">
          <svg class="w-5 h-5 p-1 fill-current text-gray-300" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
            <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
          </svg>
        </div>

      </div>

      <div class="flex flex-row w-full">
        <div class="p-8 flex-col w-7/12 flex justify-between mt-8">


          <div style="width:100px; height: 100px;" class="bg-red-500 relative">

            <svg bind:this={helperElement} width="100" height="100">
              <circle cx="30" cy="50" r="15" fill="white" />   
              <circle cx="70" cy="50" r="15" fill="white" />
              <circle cx="{30 + eyesX1/15}" cy="{50 + eyesY1/15}" r="5" fill="black" />   
              <circle cx="{70 + eyesX2/15}" cy="{50 + eyesY2/15}" r="5" fill="black" />
              Sorry, your browser does not support inline SVG.
           </svg> 
            
          </div>



        </div>

        <div class="p-8 flex-col w-5/12 min-w-max flex justify-between mt-8">

          <div class="flex w-full text-xl opacity-70 ">Getting started</div>
          <div 
          on:click={e => openInBrowser(video_link)} 
          class="flex w-full text-blue-500 cursor-pointer">
          Release notes video...
        </div>
          <div 
            on:click={e => openInBrowser(process.env.DOCUMENTATION_REFERENCEMANUAL_URL)} 
            class="flex w-full text-blue-500 cursor-pointer">
            Editor reference manual...
          </div>
          <div 
            on:click={e => openInBrowser(process.env.DOCUMENTATION_DISCORDSERVER_URL)} 
            class="flex w-full text-blue-500 cursor-pointer">
            Join the Discord community...
          </div>

          <br>

          <div class="flex w-full text-xl opacity-70 ">Troubleshooting</div>
          <div 
            on:click={e => openInBrowser(process.env.DOCUMENTATION_TROUBLESHOOTING_URL)} 
            class="flex w-full text-blue-500 cursor-pointer">
            Grid does not connect...
          </div>
          <div 
            on:click={e => openInBrowser(process.env.DOCUMENTATION_FIRMWAREUPDATE_URL)} 
            class="flex w-full text-blue-500 cursor-pointer">
            Updating the firmware...
          </div>
          <div 
            on:click={e => openInBrowser(process.env.DOCUMENTATION_MAINTENANCE_URL)} 
            class="flex w-full text-blue-500 cursor-pointer">
            Taking care of grid modules...
          </div>

        </div>
      </div>


      <div class="flex flex-row w-full absolute h-content bottom-0 bg-black bg-opacity-10 flex justify-between items-center"> 
       
        <div class="flex flex-col h-full p-6">
            <div class="flex w-full opacity-70 ">Grid Editor is Open-Source Software</div>
            <div class="flex w-full opacity-40 ">Developed by Intech Studio</div>
        </div>

        <div class="flex flex-row items-center h-full p-6">
          <input class="mr-1 mr-1 opacity-70 " type="checkbox" bind:checked={$appSettings.persistant.welcomeOnStartup}>
          <div class="mx-1 mr-4 opacity-70 ">Always show on startup</div>

          <button on:click={()=>{$appSettings.modal = ''}} id="close-btn" 
            class="p-1  cursor-pointer rounded not-draggable hover:bg-secondary bg-primary">
            Close
          </button>
        </div>

        

      </div>

    </div>



</modal>
