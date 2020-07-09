<script>

  import { onMount, onDestroy } from 'svelte';

  import { GRID_PROTOCOL } from './GridProtocol';

  import { elementSettings } from '../settings/elementSettings.store.js';

  const SerialPort = require('serialport')
  const Readline = SerialPort.parsers.Readline;

	import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  
  let serialpaths = [];

  let serialports = [];

  let currentPorts = [];

  let message = '';

  let GRID = GRID_PROTOCOL;
  GRID.initialize();
  console.log(GRID);

  export let grid = [];

  $: serialpaths, closeSerialPort(), createSerialPort(), readSerialPort();

  function coroner(){

    setInterval(()=>{

      // Don't interfere with virtual modules.
      let _removed = grid.used.find(g => (Date.now() - g.alive > 1000) && !g.virtual);

      let _processgrid = grid.used.map(g => {
        if(Date.now() - g.alive > 1000 && !g.virtual){
          g.alive = 'dead';
        }
        return g;
      })
      
      let _usedgrid = _processgrid.filter(g => g.alive !== 'dead');

      if(_removed !== undefined && _usedgrid.length !== 0){

        dispatch('coroner', {
          usedgrid: _usedgrid, 
          removed: _removed
        })
        
      }
        
    }, 500)

  }

  function discoverPorts(){

    /**
     * Need to implement multiple port watch, if modules are connected on different usb ports.
    */

    setInterval(() => {
      SerialPort.list()
        .then(ports => {
          let _serialpaths = [];
          ports.length == 0 ? serialpaths = [] : null;
          ports.forEach((port, i) => {
            if(port.productId == 'ECAD' || port.productId == 'ECAC'){        
              if(serialports.find(p => p.path == port.path)){
                // Already initialized.
              }else {
                serialpaths[i] = port.path;
              }
            }                        
          });
        })
        .catch(err => {
          console.error(err)
        });
    }, 500 )
  }
  
  function createSerialPort() {
    serialpaths.forEach((path, i) => {
      serialports[i] = new SerialPort(path, { autoOpen: false });
    });
  }

  function closeSerialPort() {
    if(serialpaths.length == 0){
      serialports = [];
      currentPorts = [];
      serialports.forEach((port, i)=>{
        port.close(function(err){
          console.warn('port closed', i, err)
        })
      })
    }
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

        runSerialParser(port, i) 

      } else {
        console.log('Do nothing.')
      }

    }) 

  }

  function runSerialParser(port, i){

    const parser = port.pipe(new Readline({ delimiter: "\n"}))

    parser.on('data', function(data) {

      let array = Array.from(data);

      let _array = [];

      array.forEach((element, i) => {
        _array[i] = element.charCodeAt(0);
      });

      let DATA = GRID.decode(_array)

      updateGridUsedAndAlive(DATA.CONTROLLER)

      //console.log(DATA);

      if(DATA.MIDIRELATIVE){      
        elementSettings.update((setting)=>{
          setting.position = 'dx:'+DATA.BRC.DX+';dy:'+DATA.BRC.DY;
          setting.controlNumber = DATA.MIDIRELATIVE.PARAM1;
          return setting;
        });
      }

      if(DATA.BANKACTIVE){
        elementSettings.update((setting)=>{
          setting.bank = DATA.BANKACTIVE.BANKNUMBER;
          return setting;
        })
      }

    })

  }

  function updateGridUsedAndAlive(controller){
    if(controller !== undefined){
      let exists = false;
      grid.used.forEach(g => {
        if(g.id == controller.id && g.virtual == false){
          exists = true;
        }
      });   
      if(!exists){
        grid.used.push(controller);
        dispatch('change');
      }
      if(exists){
        grid.used.map(c => {
          if(c.id === controller.id && c.virtual == false){
            c.alive = Date.now();
          }
          return c;
        });
      }
      grid = grid;
    }
  }

  export function writeSerialPort(message){
    console.log('attempt writing serialport' ,message);
    const port = serialports[0];
    const MSG = GRID.encode(message);
    port.write(`${MSG}\n`, function(err, result){
      if(err){
        console.log('Error while sending message : ' + err)
      }
      if (result) {
        console.log('Response received after sending message : ' + result); 
      }  
    });
  }


  onDestroy(()=>{
    clearInterval(discoverPorts);
    clearInterval(coroner)
    closeSerialPort();
  })

  onMount(() => {
    discoverPorts();
    coroner();
  })
    

</script>

<div style="left:40%;z-index:9999;" class="absolute p-2 flex bg-primary bottom-0 mb-20">
  <input type="text" class="secondary  text-xs text-white p-1 w-64 rounded-none focus:outline-none mr-2" bind:value={message}>
  <button on:click={()=>writeSerialPort(message)} class="bg-highlight ml-1 w-32 font-medium text-white py-1 px-2 rounded-none border-none hover:bg-highlight-400 focus:outline-none cursor-pointer">Serial Write</button>
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
