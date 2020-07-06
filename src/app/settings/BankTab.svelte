<script>

  export let tab;

  export let selected;

  let bank_color;

  let enabled = 'off';

</script>

{#if tab === selected}

  <div class="flex flex-col">

    <div class="flex secondary justify-between text-white p-2 m-1 items-center">
      <div>Enabled</div>
      <div>
        <button class:primary={enabled === 'off'} on:click={()=>{enabled = 'off'}} class="px-1 rounded outline-none border-0 focus:outline-none" >OFF</button>
        <button class:bg-highlight={enabled === 'on'} on:click={()=>{enabled = 'on'}} class="px-1 rounded outline-none border-0 focus:outline-none">ON</button>
      </div>
    </div>

    <div class="p-2 m-1 text-white">Bank Color</div>

    <div class="flex p-2">
      <div 
        class:border-2="{bank_color === 'red'}" 
        on:click="{() => bank_color = 'red'}"
        class="shadow bg-red-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{bank_color === 'green'}" 
        on:click="{() => bank_color = 'green'}"
        class="shadow bg-green-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{bank_color === 'blue'}" 
        on:click="{() => bank_color = 'blue'}"
        class="shadow bg-blue-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{bank_color === 'pink'}" 
        on:click="{() => bank_color = 'pink'}"
        class="shadow bg-pink-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{bank_color === 'indigo'}" 
        on:click="{() => bank_color = 'indigo'}"
        class="shadow bg-indigo-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{bank_color === 'yellow'}" 
        on:click="{() => bank_color = 'yellow'}"
        class="shadow bg-yellow-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{bank_color === 'orange'}" 
        on:click="{() => bank_color = 'orange'}"
        class="shadow bg-orange-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
    </div>
  </div>
{/if}