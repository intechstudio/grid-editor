<script>

  import { globalSettings } from './globalSettings.store.js';
  import { elementSettings } from './elementSettings.store.js';

  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();

  let colors = {
    red: [245, 0, 0],
    green: [0, 250, 0],
    blue: [0, 0, 250],
    pink: [200, 50, 70],
    indigo: [30, 75, 200],
    yellow: [160, 160, 20],
    orange: [200, 100, 20]
  }

  export let tab;

  export let selected;

  let bank_color;

  let rgb = [];

  let enabled = true;

  let numberOfModules;

  function bankSettings(state){
    globalSettings.update((array)=>{
      array[selected] = state;
      return array;
    })
  }

  function selectColor(color){
    bank_color = color;
    rgb = colors[color];
    dispatch('BANKCOLOR', {className: 'BANKCOLOR', parameters: [
      {'BANKNUMBER': selected, 'RED': rgb[0], 'GREEN': rgb[1], 'BLUE': rgb[2]}
    ]})
    console.log('selectColor')
  }

  globalSettings.subscribe((setting)=>{
    if(rgb.length > 0){
      dispatch('BANKCOLOR', {className: 'BANKCOLOR', parameters: [
        {'BANKNUMBER': selected, 'RED': rgb[0], 'GREEN': rgb[1], 'BLUE': rgb[2]}
      ]})
    }
  })

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

    <div class="flex justify-between text-white p-2 m-1 items-center">
      <div>Name: </div>
      <input type="text" class="secondary text-white p-1 rounded-none focus:outline-none">
    </div>

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
        on:click="{() => selectColor('red')}"
        class="shadow bg-red-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{bank_color === 'green'}" 
        on:click="{() => selectColor('green')}"
        class="shadow bg-green-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{bank_color === 'blue'}" 
        on:click="{() => selectColor('blue')}"
        class="shadow bg-blue-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{bank_color === 'pink'}" 
        on:click="{() => selectColor('pink')}"
        class="shadow bg-pink-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{bank_color === 'indigo'}" 
        on:click="{() => selectColor('indigo')}"
        class="shadow bg-indigo-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{bank_color === 'yellow'}" 
        on:click="{() => selectColor('yellow')}"
        class="shadow bg-yellow-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
      <div 
        class:border-2="{bank_color === 'orange'}" 
        on:click="{() => selectColor('orange')}"
        class="shadow bg-orange-500 p-2 rounded-full border-white w-8 h-8 font-medium mx-2" 
      ></div>
    </div>
  </div>
{/if}