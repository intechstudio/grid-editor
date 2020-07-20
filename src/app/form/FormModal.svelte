<script>

  import { createEventDispatcher } from 'svelte';0
  
  const dispatch = createEventDispatcher();


  function handleSubmit(){
    dispatch('submit', {

    })
  }

  function handleClose(){
    dispatch('close', {
      
    })
  }

</script>

<div style="backdrop-filter: blur(10px); z-index:9999" class="text-white absolute h-screen w-full">
  <div class="flex justify-center items-center h-full ">
    <div class="p-4 m-4 w-1/3 bg-primary rounded border border-gray-700 shadow">
    
    <div class="m-2 text-xl font-bold py-2">Feedback form</div>

    <div class="m-2 py-2">
      {#each [0,1,2,3,4] as question}
      <div class="py-2">
        <div>Question {question}</div>
        <input type="text" class="secondary w-full text-white p-1 rounded-none focus:outline-none">
      </div>
      {/each}
    </div>

    <div class="m-2 flex justify-between py-2">
      <button on:click={handleSubmit} class="bg-highlight font-medium w-24 text-white py-1 px-2 border-none hover:bg-highlight-500 focus:outline-none rounded">Submit</button>
      <button on:click={handleClose} class="bg-gray-400 w-24 text-black py-1 px-2 border-none hover:bg-gray-500 focus:outline-none rounded">Close</button>
    </div>

    </div>
  </div>
</div>