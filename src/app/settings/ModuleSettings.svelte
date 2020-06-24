<script>

  let mappingMode = 'relative';
  let midiMessageFormat = 'standard';
  let nrpnResolution = '12-bit';

</script>

<div class="inline-block primary rounded-lg p-4 m-4 z-20">

  <div class="text-xl font-bold text-white mx-2">
    Module Settings
  </div>

  <div class="flex flex-col my-4">
    <div class="text-gray-700 py-1 ml-2">
      Mapping Mode
    </div>
    <div class="flex">
      <input type="button" 
        class:btn-active="{mappingMode === 'absolute'}" 
        on:click="{() => mappingMode = 'absolute'}"
        class="btn shadow flex-grow p-2 rounded font-medium mx-2" 
        value="Absolute"
      >
      <input type="button" 
        class:btn-active="{mappingMode === 'relative'}" 
        on:click="{() => mappingMode = 'relative'}"
        class="btn shadow flex-grow p-2 rounded font-medium mx-2" 
        value="Relative"
      >
    </div>
  </div>

  <div class="flex flex-col my-4">
    <div class="text-gray-700 py-1 ml-2">
      MIDI Message Format
    </div>
    <div class="flex">
      <input type="button" 
        class:btn-active="{midiMessageFormat === 'standard'}" 
        on:click="{() => midiMessageFormat = 'standard'}"
        class="btn shadow p-2 flex-grow rounded font-medium mx-2" 
        value="Standard"
      >
      <input type="button" 
        class:btn-active="{midiMessageFormat === 'high'}" 
        on:click="{() => midiMessageFormat = 'high'}"
        class="btn shadow p-2 flex-grow rounded font-medium mx-2" 
        value="High"
      >
    </div>
  </div>

  <div class="flex flex-col my-4">
    <div class="text-gray-700 py-1 ml-2">
      <div class="text-white">Resolution</div>
      <div class="text-gray-700">14-bit MIDI format NRPN messages.</div>
    </div>
    <div class="flex flex-row text-white shadow mx-2">
      <div class="px-3 p-2 w-1/2 rounded-l secondary">Bit Depth</div>
      <select bind:value={nrpnResolution} class="bg-red-500 p-1 w-1/2 rounded-l-none rounded-r">
        {#each ['10-bit', '11-bit', '12-bit'] as resolution}
          <option class="font-medium text-black bg-white" >{resolution}</option>
        {/each}
      </select>
    </div>
  </div>

</div>
