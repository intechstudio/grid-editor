<script>
  import { onMount } from "svelte";
	import { fly, fade, slide } from 'svelte/transition';

  import configuration from "../../../configuration.json";



  const ctxProcess = window.ctxProcess;

  let logelement;
  let text = "";

  let logtext = [];

  let solutions = [];
  let notifications = [];

  let bgHelper = 0;

  function displayError(errorMessage, url, line){

    if (logtext.length>4){
      //logtext.shift();
    }

    if (bgHelper === 0){
      bgHelper = 1;
    }
    else{
      bgHelper = 0;
    }

    console.log("we got exception, but the app has crashed 1", url, line, errorMessage);

    let solution = undefined;

    console.log("solutions:", solutions)

    if (typeof solutions !== "undefined"){
      solutions.forEach(s =>{
        if (errorMessage.toString().indexOf(s.match) !== -1){
          console.log("match")
          solution = s;
        }
      })
    }


    let displaytext = "";

    if (url !== undefined && line !== undefined){
      displaytext = errorMessage+" at line "+line+" in "+url.split("/")[url.split("/").length-1]+" "
    }
    else{
      displaytext = errorMessage +" "
    }

    logtext = [...logtext, {reason: displaytext, solution: solution}];


    window.electron.analytics.influx(
      "application",
      "error console",
      "error notification",
      "error event"
    );

    try {
       window.electron.discord.sendMessage({ title: "Error", text: displaytext });
    } catch (error) {}


  }

  onMount(async () => {
    // check for errors

    window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
      displayError(errorMsg, url, lineNumber)
      return false;

    };

    window.onunhandledrejection = (e) => {
      console.log("we got exception, but the app has crashed 2", e);
      displayError(e.reason)

    };

    if (ctxProcess.platform() == "darwin") {
      text = "Command + Shift + R";
    } else {
      text = "Ctrl + Shift + R";
    }

    const response = await window.electron.fetchUrlJSON(configuration.NOTIFICATION_JSON_URL)

    response.forEach(element => {
      if (element.type === "error"){
        solutions.push(element)

      }
      else if (element.type === "notification"){

        if (typeof element.delay !== 'undefined'){
          let delay = parseInt(element.delay)
          setTimeout(() => {
            notifications = [...notifications, element]
          }, delay);
        } 
        else{
          notifications = [...notifications, element]

        }

      }
    });


  });

  function refresh() {
    window.electron.analytics.influx(
      "application",
      "error console",
      "error notification",
      "app restart"
    );
    window.electron.restartApp();
  }

  function solution(link) {

    window.electron.openInBrowser(link)

    window.electron.analytics.influx(
      "application",
      "error console",
      "error notification",
      "app restart"
    );
  }


  function dismiss() {
    logtext = [];
    window.electron.analytics.influx(
      "application",
      "error console",
      "error notification",
      "dismiss"
    );
  }

  function close_notification(index){

    let new_not_array = [];

    
    notifications.forEach((element, i) => {

      if (i!==index){
        new_not_array.push(element)
      }
    });

    
    notifications = [...new_not_array]

  }

</script>

{#if logtext.length != 0}
  <div
    bind:this={logelement}
    class="w-full bg-gray-900 text-white justify-center flex flex-col items-center"
    transition:fade
  >
    {#each logtext as log, index}

      {#if index>logtext.length-5}
        {#key index === logtext.length}
        <div in:fly="{{ x: -50, delay: 0, duration: 500 }}"  class="w-full {(logtext.length-index+bgHelper)%2?"bg-gray-800":"bg-gray-900"} justify-center flex flex-row items-center h-16">
          <div>{log.reason} </div>
          {#if log.solution !== undefined}
            <div class="ml-4 font-bold"> {log.solution.message} </div>
           

            {#if log.solution.link !== undefined && log.solution.link !==""}
            <button
              on:click={solution(log.solution.link)}
              class="relative bg-gray-600 mr-3 block hover:bg-gray-300 text-white ml-3 my-2 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
            >
              Find solution
            </button>
        
            {/if}

          {/if}


        </div>       
      {/key}  
    {/if}   



    {/each}

    <div class="w-full flex flex-row bg-red-500 justify-center items-center">
      Reload the application using {text} or click

      <button
        on:click={refresh}
        class="relative bg-gray-500 mr-3 block hover:bg-gray-300 text-white ml-3 my-2 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
      >
        Restart
      </button>
      <button
        on:click={dismiss}
        class="relative bg-gray-500 mr-3 block hover:bg-gray-300 text-white ml-1 my-2 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
      >
        Dismiss
      </button>
    </div>
  </div>
{/if}

{#each notifications as notification, index}


  {#key index === notifications.length}
    <div in:fly="{{ x: -50, delay: 0, duration: 500 }}"  class="w-full {notification.class?notification.class:"bg-green-500"} justify-center flex flex-row items-center h-16">
      <div>{notification.message} </div>

      {#if notification.link !== undefined && notification.link !==""}
      <button
        on:click={solution(notification.link)}
        class="relative bg-gray-600 mr-3 block hover:bg-gray-300 text-white ml-3 my-2 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
      >
        Open Link
      </button>
  
      {#if notification.dismissable === true}
        <button
          on:click={()=>{close_notification(index)}}
          class="relative bg-gray-600 mr-3 block hover:bg-gray-300 text-white ml-3 my-2 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
        >
          Close
        </button>
  
      {/if}


      {/if}



    </div>       
  {/key}  


{/each}

<style>
</style>
