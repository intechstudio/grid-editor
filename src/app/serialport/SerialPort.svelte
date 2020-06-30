<script>

  import { onMount, onDestroy } from 'svelte';

  import { GRID } from './GridProtocol';

  const SerialPort = require('serialport')
  const Readline = SerialPort.parsers.Readline;
  
  let serialpaths = [];

  let serialports = [];

  let currentPorts = [];

  $: DATA = GRID.create();

  $: serialpaths, createSerialPort(), readSerialPort();

  function discoverPorts(){
    setInterval(() => {
      SerialPort.list()
        .then(ports => {
          let _serialpaths = [];
          ports.forEach((port, i) => {
            if(port.productId == 'ECAD' || port.productId == 'ECAC'){        
                serialpaths[i] = port.path;
            }                        
          });
        })
        .catch(err => {
          console.error(err)
        });
    }, 1000 )
  }
  
  function createSerialPort() {
    serialpaths.forEach((path, i) => {
      serialports[i] = new SerialPort(path, { autoOpen: false });
    });
  }

  function closeSerialPort() {
    serialports.forEach((port, i)=>{
      port.close(function(err){
        console.warn('port closed', i, err)
      })
    })
  }

  function readSerialPort() {

    serialports.forEach((port, i) => {

      if(currentPorts.indexOf(port.path) == -1){

        console.log('We are proceeding with reading the port.')

        port.open(function(err){
          if(err){
            console.error('Error opening port: ', err.message)
          }
          currentPorts[i] = port.path;
        })

        port.on('error', function(err) {
          console.log('Error',err);
        });

        port.on('open', function() {
          console.log('Port is open.', port.path); 
          
        }); 

        runSerialParser(port) 

      } else {
          console.log('Do nothing.')
      }

    }) 
   
  }

  function runSerialParser(port){

    const parser = port.pipe(new Readline({ delimiter: "\n"}))

    parser.on('data', function(data) {
      let array = Array.from(data);
      let _array = [];
      array.forEach((element, i) => {
        _array[i] = element.charCodeAt(0);
      });
      console.log(_array);
      DATA.heartbeat(_array);
    })

  }


  onDestroy(()=>{
    clearInterval(discoverPorts);
    closeSerialPort();
  })

  onMount(() => {
    discoverPorts();
  })

</script>

<div>

</div>

<!--
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
-->
