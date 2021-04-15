<script>

  import { createEventDispatcher, onMount } from 'svelte';
  import ColorPicker from '../user-interface/ColorPicker.svelte';
  import Toggle from '../user-interface/Toggle.svelte';

  const dispatch = createEventDispatcher();

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
    bankEnabled = ! bankEnabled;
    let _state = bankEnabled;
    _state ? _state = 1 : _state = 0;
    dispatch('BANKENABLED', {className: 'BANKENABLED', parameters: [
      {'BANKNUMBER': selected}, 
      {'ISENABLED': _state}
    ]})
  }


</script>


  <div class="w-full flex flex-col p-2">

    <div class="flex flex-row">

      <div class="p-2">
        <div class="mb-1 text-gray-700 text-sm">Bank Name</div>
        <input 
          class="w-full secondary text-white p-1 pl-2 rounded-none focus:outline-none bg-secondary"
          bind:value={bankName}
          placeholder="Set bank name..."
        >
      </div>

      <div class="p-2">
        <div class="mb-1 text-gray-700 text-sm">Change Bank State</div>
        <div class="relative flex items-center ">
          <Toggle on:change={handleBankEnabled} toggleValue={bankEnabled} />
          <div class="{bankEnabled ? 'text-green-500' : 'text-gray-500'} pl-4 text-sm">{bankEnabled ? 'Active' : 'Disabled'}</div>
        </div>
      </div>

    </div>

    <div class="p-2">
      <div class="mb-1 text-gray-700 text-sm">Bank Color</div>
      {#if startColor}
        <div class="flex w-full">
          <ColorPicker {startColor} showAlpha={false} on:colorChange={debounce}/>
        </div>
      {/if}
    </div>
  </div>

