<script>

  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  let formText = '';
  let name = '';
  let email = '';
  let optIn = false;

  let result = null;

  async function handleSubmit(){

    const res = await fetch('http://localhost:3000/form-submission', {
			method: 'POST',
      body: JSON.stringify({msg: formText, name: name, email: email, optIn: optIn}),
      headers: { 'Content-Type': 'application/json' }
    })
    
    const message = await res.json()

    console.log(message);
    
    console.log(message);
    if(message.sent){
      result = true;
    } else {
      result = false;
    }

    dispatch('success', {
      
    })
  }

  function handleClose(){
    dispatch('close', {
      
    })
  }

</script>

<div style="backdrop-filter: blur(10px); z-index:9999" class="text-white absolute w-full h-full">
  <div class="flex justify-center items-center h-full ">

    <div class="p-4 m-4 w-1/3 bg-primary rounded border border-gray-700 shadow">
    
      <div class="m-2 text-xl font-bold py-2">Feedback Form</div>

      {#if result}
        <div class="m-2">
          <p class="text-green-500 py-2">Thank you for the feedback!</p>
          <button on:click={handleClose} class="bg-gray-400 w-24 text-black py-1 px-2 my-2 border-none hover:bg-gray-500 focus:outline-none rounded">Close</button>
        </div>
      {:else if (result == false)}
      <div class="m-2">
        <p class="text-red-500">Sorry, feedback is lost in the ether.</p>
        <button on:click={handleClose} class="bg-gray-400 w-24 text-black py-1 px-2 my-2 border-none hover:bg-gray-500 focus:outline-none rounded">Close</button>
      </div>
        
      {:else}
        <p class="m-2 pb-2">
          Let us know what feature you would see, report any bugs or issues.
        </p>

        <div class="m-2 pb-2">
          <div class="py-2">
            <div class="pb-1">Name:</div>
            <input bind:value={name} class="text-black w-64 p-2 outline-none border-none" placeholder="John">
          </div>
          <div class="py-2">
            <div class="pb-1">Email:</div>
            <input bind:value={email} class="text-black w-64 p-2 outline-none border-none" placeholder="johnwick@action.com">
          </div>
        </div>

        <div class="m-2 py-2">
          <textarea class="text-black w-full p-2 min-h-200 outline-none border-none" bind:value={formText} placeholder="Write your message here..."></textarea>
        </div>

        <!--
        <div class="flex m-2 items-center">
          <input bind:checked={optIn} type="checkbox" class="w-5 h-5">
          <p class="p-2">Save my email address and name for @intechstudio newsletter.</p>
        </div>
-->
        <div class="m-2 flex justify-between py-2">
          <button on:click={handleSubmit} class="bg-highlight font-medium w-24 text-white py-1 px-2 border-none hover:bg-highlight-500 focus:outline-none rounded">Submit</button>
          <button on:click={handleClose} class="bg-gray-400 w-24 text-black py-1 px-2 border-none hover:bg-gray-500 focus:outline-none rounded">Close</button>
        </div>
      {/if}

    </div>    

  </div>
</div>