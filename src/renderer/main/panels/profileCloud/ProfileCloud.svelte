<script>
  import { onDestroy, onMount } from "svelte";
  import { appSettings } from "../../../runtime/app-helper.store";

  import { get } from "svelte/store";
  const { env } = window.ctxProcess;

  import configuration from "../../../../../configuration.json";


let iframe_element;  
let iframe_response_element;


function iframe_receive(event){

  console.log("Parent received:  ", event.origin, window.location.origin, event.data)

  if (iframe_response_element){

    iframe_response_element.innerHTML = event.data

  }




}
  


onMount(() => {

  console.log("Initialize Profile Cloud")

  window.addEventListener(
      "message",
      iframe_receive,
      false
    );

    

});  

onDestroy(() => {

  console.log("De-initialize Profile Cloud")
    window.removeEventListener("message", iframe_receive)

});

let srcdoc_content = `


<${"script"} script-src="unsafe-inline">    
  window.addEventListener(
    "message",
    function (event) {
      console.log("Child received:  ", event.origin, window.location.origin, event.data)

      document.getElementById("my-message").innerHTML = event.data;
      
    },
    false
  );

  function buttonClick(){
    parent.postMessage("HELLO FROM CHILD "+ Math.random(), "*");
    
  }

</${"script"}>  

<p>
  <strong>Message:</strong>
  <span id="my-message">Test Data 12</span>
</p>

<button onclick="buttonClick()">OK</button>


`

</script>


<div
class="flex flex-row bg-primary w-full"
style=""
>


    <iframe style="background-color: white;" bind:this={iframe_element} class="w-full h-[500px]" title="Test" src="https://example.com" srcdoc="{srcdoc_content}"></iframe>

</div>
<div class="px-2 flex flex-row w-full bg-black bg-opacity-20">
  
  <button
    on:click={() => {


      if (iframe_element && iframe_element.contentWindow) {
        iframe_element.contentWindow.postMessage("HELLO FROM PARENT " + Math.random(), "*");
      }

    }}
    id="close-btn"
    class="px-3 py-1 cursor-pointer rounded not-draggable
    hover:bg-blue-700 bg-blue-500"
  >
    Send
  </button>
  <div class="text-white" bind:this={iframe_response_element}>Response text</div>
</div>