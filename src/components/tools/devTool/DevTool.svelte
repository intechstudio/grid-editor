<script>

  import { palette } from './palette.store.js';

  let type = 'PO16';
  let x = 0;
  let y = 0;
  let rotation = 0;

  function addToPalette(){
    $palette = [...$palette, {type: type, x: x, y: y, rotation: rotation}]
  }

  function removeFromPalette(obj){
    $palette = $palette.filter(m => m !== obj);
  }

</script>

<style>


</style>

<div style="width:600px;" class="primary flex flex-col rounded m-4 p-4">
  <div class="text-white font-bold">Dev Tools</div>
  <div class="flex flex-row text-xs justify-between items-end m-2 p-2 rounded-lg">
    <div class="flex flex-row text-white">
      <div class="px-3 p-2 rounded-l secondary">Module</div>
      <select bind:value={type} class="bg-red-500 p-1 w-20 rounded-l-none rounded-r">
        {#each ['PO16', 'PBF4'] as type}
          <option class="font-medium" >{type}</option>
        {/each}
      </select>
    </div>

    <div class="flex flex-col text-white">
      <div class="secondary p-2 rounded-t">X Pos.</div>
      <input class="bg-red-500 p-2 w-20 rounded-t-none rounded-b font-medium" bind:value={x} type="number">
    </div>

    <div class="flex flex-col text-white">
      <div class="secondary p-2 rounded-t">Y Pos.</div>
      <input class="bg-red-500 p-2 w-20 rounded-t-none rounded-b font-medium" bind:value={y} type="number">
    </div>


    <div class="flex flex-col text-white">
      <div class="secondary p-2 rounded-t">Rotation</div>
      <input class="bg-red-500 p-2 w-20 rounded-t-none rounded-b font-medium" bind:value={rotation} type="number">
    </div>

    <input on:click={addToPalette} class="text-white shadow bg-red-500 p-2 w-20 rounded rounded-b font-medium" value="Add" type="button">

  </div>

  {#each $palette as config}
   <div class="flex flex-row text-white justify-between items-end m-2 p-2">
      <div class="flex flex-row items-center text-white">
        <div class="invisible px-3 p-2 rounded-l secondary">Module</div>
        <div class="p-1 w-20 rounded-l-none rounded-r">{config.type}</div>
      </div>
      <div class="p-2 w-20 font-medium" >{config.x}</div>
      <div class="p-2 w-20 font-medium" >{config.y}</div>
      <div class="p-2 w-20 font-medium" >{config.rotation}</div>
      <input on:click={removeFromPalette(config)} class="text-white shadow bg-red-500 p-2 w-20 rounded rounded-b font-medium" value="Remove" type="button">
    </div>
  {/each}

</div>