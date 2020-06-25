<script>

  import { onMount, onDestroy } from 'svelte';

  const serialport = require('serialport')

  $: serialports = [];

  $: selectedPort = '';

  const discoverPorts = setInterval(() => {

    serialport.list()
      .then(ports => {
        let _serialports = [];
        ports.forEach(port => {
          if(port.productId == 'ECAD' || port.productId == 'ECAC'){
            _serialports.push(port);
          }                        
        });
        serialports = _serialports
      })
      .catch(err => {
        console.error(err)
      });
    }, 1000 )
  

  onDestroy(()=>{
    clearInterval(discoverPorts);
  })

</script>

<div class="absolute bottom-0 mb-40 ml-40 z-50 text-white">
  Serialports
  <select bind:value={selectedPort} class="text-black">
    {#each serialports as port}
      <option value={port}>{port.path}</option>
    {/each}
  </select>
  <div class="block w-1/2 break-words">
    {JSON.stringify(selectedPort)}
  </div>
</div>

