<script>

  import { createEventDispatcher, onMount } from 'svelte';

  import ColorPicker from '../ui/components/ColorPicker.svelte';
  
  const dispatch = createEventDispatcher();

  export let tab;
  //export let globalData;

  let rgb = [];

  let enabled = true;

  export let selected = 0;

  // Binding on parent for save & update.
  export let globalData = undefined;
  export let bankName = undefined;

  // Colorpicker variables.

  let startColor = "rgb('255,0,0')";
  let bankEnabled;

  $: if(globalData !== undefined){
    startColor = "rgb(" + globalData.bankColors[selected] + ")";
    bankEnabled = globalData.bankEnabled[selected];
    //console.log(bankEnabled);
  }

  let timer;
  const debounce = value => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        colorCallback(value);
      }, 25);
  }

  function colorCallback(rgba) {

    rgb[0] = Math.floor(rgba.detail.r * rgba.detail.a)
    rgb[1] = Math.floor(rgba.detail.g * rgba.detail.a)
    rgb[2] = Math.floor(rgba.detail.b * rgba.detail.a)

    dispatch('BANKCOLOR', {className: 'BANKCOLOR', parameters: [
      {'NUM': selected}, 
      {'RED': rgb[0]}, 
      {'GRE': rgb[1]}, 
      {'BLU': rgb[2]}
    ]})

  }

  function handleBankEnabled(){
    bankEnabled = ! bankEnabled
    let _state = bankEnabled;
    console.log(_state)
    _state ? _state = 1 : _state = 0;
    dispatch('BANKENABLED', {className: 'BANKENABLED', parameters: [
      {'BANKNUMBER': selected}, 
      {'ISENABLED': _state}
    ]})
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

    <div class="p-2 my-1">
      <div class="mb-1 text-gray-700">Name</div>
      <input 
        class="w-full secondary text-white p-1 pl-2 rounded-none focus:outline-none"
        bind:value={bankName}
        placeholder="Set bank name..."
        >
    </div>


    <div class="flex justify-between text-white p-2 my-1 items-center">
      <div class="text-gray-200 ">
        {#if bankEnabled}
          Bank is <span class="text-green-500">enabled!</span>
        {:else}
          Bank is <span class="text-red-500">disabled...</span>
        {/if}
      </div>
      <div class="relative flex items-center justify-center">
        <div on:click={()=>{handleBankEnabled()}} style="background: {bankEnabled ? 'rgb(45,220,0)' : 'rgb(220,45,0)'}" class="z-20 shadow-inner cursor-pointer transitions w-6 h-6 rounded-full"></div>
        <div class:circle={bankEnabled} class="w-12 h-12 rounded-full opacity-0 bg-red-400 absolute"></div>
      </div>
    </div>

    <div class="p-2 text-white">Bank Color</div>

    {#if startColor}
    <div class="flex px-2">
      <ColorPicker {startColor} showAlpha={false} on:colorChange={debounce}/>
    </div>
    {/if}
  </div>
{/if}