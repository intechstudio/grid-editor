<script>

  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  let formText = '';

  let result = null;

  async function handleSubmit(){

    const res = await fetch('http://localhost:3000/form-submission', {
			method: 'POST',
      body: JSON.stringify({msg: formText}),
      headers: { 'Content-Type': 'application/json' }
    })
    
    const json = await res.json()
    result = JSON.stringify(json)

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
{formText}
{result}
    <div class="m-2 py-2">
      <textarea class="text-black" bind:value={formText}></textarea>
    </div>

    <div class="m-2 flex justify-between py-2">
      <button on:click={handleSubmit} class="bg-highlight font-medium w-24 text-white py-1 px-2 border-none hover:bg-highlight-500 focus:outline-none rounded">Submit</button>
      <button on:click={handleClose} class="bg-gray-400 w-24 text-black py-1 px-2 border-none hover:bg-gray-500 focus:outline-none rounded">Close</button>
    </div>

    </div>
  </div>
</div>