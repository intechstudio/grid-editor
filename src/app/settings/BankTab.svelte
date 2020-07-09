<script>

  import { globalSettings } from './globalSettings.store.js';

  export let tab;

  export let selected;

  let bank_color;

  let enabled = true;

  function bankSettings(state){
    globalSettings.update((array)=>{
      array[selected-1] = state;
      return array;
    })
  }

</script>

<style>


  .transitions{
    -moz-transition: all .2s ease-in;
    -o-transition: all .2s ease-in;
    -webkit-transition: all .2s ease-in;
    transition: all .2s ease-in;
    background: #f5f5f5;  
  }
 
  .circle{
    animation: scaleIn .75s cubic-bezier(.36, .11, .89, .32);
  }

  @keyframes scaleIn {
  from {
    transform: scale(.5, .5);
    opacity: .5;
  }
  to {
    transform: scale(1, 1);
    opacity: 0;
  }
}


</style>

{#if tab === selected}

  <div class="flex flex-col">

    <div class="flex secondary justify-between text-white p-2 m-1 items-center">
      <div>Enabled: <span class="text-blue-500">{enabled}</span></div>
      <div class="relative flex items-center justify-center">
        <div on:click={()=>{bankSettings(enabled =! enabled)}} style="background: {enabled ? 'rgb(45,220,0)' : 'rgb(220,45,0)'}" class="z-20 shadow-inner transitions w-6 h-6 rounded-full"></div>
        <div class:circle={enabled} class="w-12 h-12 rounded-full opacity-0 bg-red-400 absolute"></div>
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