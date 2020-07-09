<script>

  import BankTab from './BankTab.svelte';  

  let bank_color = 'relative';
  let bank_number = 'standard';

  let selected = 1;

  let tabs = [1,2,3,4];

</script>

<style>

  :global(.bg-highlight){
    background-color:#cc5b5b;
  }

</style>

<div class="inline-block primary rounded-lg p-4 m-4 z-20">

  <div class="text-xl font-bold text-white m-2">
    Global Settings
  </div>

  <div class="flex flex-col my-4">
    <div class="text-gray-700 py-1 ml-2">
      Banks
    </div>   

    <div class="flex flex-col rounded-lg">
      <div class="flex mx-1 secondary rounded-lg shadow">
        {#each tabs as tab}
          <button 
            on:click={()=>{selected = tab}} 
            class:shadow-md={selected === tab}
            class:bg-highlight={selected === tab}
            class="m-2 p-1 text-white flex-grow outline-none border-0 rounded hover:bg-highlight-300 focus:outline-none">
            {tab}
          </button>
        {/each}
      </div>

      <div class="my-2 flex flex-col justify-between">
        {#each tabs as tab}     
          <BankTab {tab} {selected}/>  
        {/each}
      </div>
    </div>
      
  </div>


      <!--
      <select bind:value={nrpnResolution} class="bg-red-500 p-1 w-1/2 rounded-l-none rounded-r">
        {#each ['10-bit', '11-bit', '12-bit'] as resolution}
          <option class="font-medium text-black bg-white" >{resolution}</option>
        {/each}
      </select>
      -->


</div>
