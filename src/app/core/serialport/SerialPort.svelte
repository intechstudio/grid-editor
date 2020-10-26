<script>

  import { onMount, onDestroy } from 'svelte';

  import { GRID_PROTOCOL } from '../classes/GridProtocol';

  import { localInputStore, globalInputStore } from '../../stores/control-surface-input.store';

  import { serialComm, serialCommDebug } from './serialport.store.js';

  const SerialPort = require('serialport')
  const Readline = SerialPort.parsers.Readline;

	import { createEventDispatcher } from 'svelte';
  import { commands } from '../../settings/shared/handshake.store';

  const dispatch = createEventDispatcher();

  let GRID = GRID_PROTOCOL;
  GRID.initialize();

  let PORT = {path: 0};

  export let runtime = [];

  let selectedPort = "";

  function coroner(){

    setInterval(()=>{

      // Don't interfere with virtual modules.
      let _removed = runtime.find(g => (Date.now() - g.alive > 1000) && !g.virtual);

      let _processgrid = runtime.map(g => {
        if(Date.now() - g.alive > 1000 && !g.virtual){
          g.alive = 'dead';
        }
        return g;
      })
      
      let _usedgrid = _processgrid.filter(g => g.alive !== 'dead');
      //console.log('_usedgird length...', _usedgrid)

      if(_removed !== undefined && _usedgrid.length !== undefined){    

        dispatch('coroner', {
          usedgrid: _usedgrid, 
          removed: _removed
        })
        
      }
        
    }, GRID.PROTOCOL.HEARTBEAT_INTERVAL)

  }

  function discoverPorts(){
    setInterval(() => {
      listSerialPorts();
    }, GRID.PROTOCOL.HEARTBEAT_INTERVAL )
  }

  function listSerialPorts(){
    SerialPort.list()
      .then(ports => {
        //ports.length == 0 ? serialpaths = [] : null;
        serialComm.update((store) => { store.list = []; return store;})
        ports.forEach((port, i) => {  
          let isGrid = 0;
          if(port.productId){
            if(port.productId == 'ECAD' || port.productId == 'ecad' || port.productId == 'ECAC' || port.productId == 'ecac'){
              isGrid = 1 
            }
          }
          // collect all ports in an array
          serialComm.update((store) => { 
            store.selected = port.path;     
            store.list[i] = {isGrid: isGrid, port: port};
            return store;
          });       

          if(isGrid && $serialComm.open == undefined){
            selectedPort = port.path;
            openSerialPort();
          }
        });

        const thereIsGrid = ports.find(p => p.productId == 'ECAD' || p.productId == 'ecad' || p.productId == 'ECAC' || p.productId == 'ecac');
        if(!thereIsGrid){
          closeSerialPort();
        }

      })
    .catch(err => {   
      console.error(err)
    });
  }


  
  function openSerialPort() {
    const store = $serialComm;
    const serial = store.list.find(serial => serial.port.path === selectedPort);
    PORT = new SerialPort(serial.port.path, { autoOpen: false });
    serialComm.open(PORT);
    serialComm.enabled(true);
    readSerialPort();
  }

  function updateSelectedPort(port){
    selectedPort = port;
  }

  function closeSerialPort() {

    if(PORT.path !== 0){
      PORT.close(function(err){
        console.warn('port closed', err)
      })

      serialComm.update((store)=>{
        store.open = 'none';
        store.isEnabled = false;
        store.list = [];
        return store
      });

      // reset UI
      runtime = [];
      //layout = [];

      PORT = {path: 0};
    }
  }

  function readSerialPort() {
        
    console.log('We are proceeding with reading the port.')

    PORT.open(function(err){
      if(err){
        console.error('Error opening port: ', err.message)
      }
      //currentPorts[i] = port.path;
    })

    PORT.on('error', function(err) {
      console.log('Error',err);
    });

    PORT.on('open', function() {
      console.log('Port is open.', PORT.path); 
      
    }); 

    runSerialParser(PORT) 
  }

  function makeThisUsable(RESPONSE){ 
    let controller = runtime.find(g => g.dx == RESPONSE.BRC.DX && g.dy == RESPONSE.BRC.DY);
    controller.instr = RESPONSE.COMMAND;
  }

  function runSerialParser(port){

    const parser = port.pipe(new Readline({ delimiter: "\n"}));

    parser.on('data', function(data) {

      let array = Array.from(data);

      let RESPONSE = {};

      let _array = [];

      array.forEach((element, i) => {
        _array[i] = element.charCodeAt(0);
      });
      
      let DATA = GRID.decode_serial(_array);

      // filter heartbeat messages
      if(!(array.join('').slice(30).startsWith('010') && array.length == 46) ){

        serialCommDebug.store(array.join(''));    

        RESPONSE = GRID.decode_serial(_array);

        RESPONSE.COMMAND ? makeThisUsable(RESPONSE) : null;

        RESPONSE.COMMAND ? commands.response(RESPONSE) : null;
      }

      updateGridUsedAndAlive(DATA.CONTROLLER);

      if(DATA.HEARTBEAT){
        //console.log(DATA.HEARTBEAT);
      }

      if(DATA.BRC){
        //console.log(DATA.BRC);
      }

      if(DATA.LEDPHASE){
        //console.log(DATA.LEDPHASE);
      }

      if(DATA.CONFIGURATION){
        console.log('received cfg',DATA.CONFIGURATION);
      }

      if(DATA.EVENT && DATA.EVENT.length > 0){
        if(DATA.EVENT[0].EVENTTYPE !== 1){
          console.log(DATA.EVENT,DATA.BRC);
          localInputStore.update((store)=>{
            store.dx = DATA.BRC.DX;
            store.dy = DATA.BRC.DY;
            store.elementNumber = DATA.EVENT.map(event => event.ELEMENTNUMBER);   
            store.eventParam = DATA.EVENT.map(event => event.EVENTPARAM);   
            store.eventType = DATA.EVENT.map(event => event.EVENTTYPE);
            return store;
          })
        }
      }

      // rep req not implemented as needed
      if(DATA.BANKCOLOR){
       
      }

      if(DATA.MIDIRELATIVE){ 
        
      }

      if(DATA.BANKACTIVE){
        if(DATA.BANKACTIVE.BANKNUMBER !== 255){
          bankActiveStore.update(store => {
            store.bankActive = DATA.BANKACTIVE.BANKNUMBER;
            return store
          });
        }
      }
      
      
    })
  }

  function updateGridUsedAndAlive(controller){
    if(controller !== undefined){
      let exists = false;
      runtime.forEach(g => {
        if(g.id == controller.id && g.virtual == false){
          exists = true;
        }
      });   
      if(!exists){
        runtime.push(controller);
        dispatch('change', {
          data: {
            moduleId: controller.id,
            cellId: 'dx:'+controller.dx + ';' + 'dy:'+controller.dy,
            isVirtual: false
          }
        });
      }
      if(exists){
        runtime.map(c => {
          if(c.id === controller.id && c.virtual == false){
            c.alive = Date.now();
          }
          return c;
        });
      }

      if(!exists){
        globalInputStore.update((store)=>{
          store.numberOfModules = runtime.length;
          return store;
        })
      }
      runtime = runtime;
    }
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

<div class="flex items-center not-draggable text-sm">

  <select bind:value={selectedPort} on:change={()=>updateSelectedPort(selectedPort)} class="bg-secondary flex-grow text-white p-1 mx-2 rounded-none focus:outline-none">
    {#each $serialComm.list as serial,index}
      {#if serial.isGrid}
        <option value={serial.port.path}>{'Grid'}</option> 
      {/if}
    {/each}
  </select>
 
  <div class="flex items-center">
    
      <button 
        on:click={openSerialPort} 
        class="text-white px-2 py-1 mx-2 rounded border-highlight bg-highlight hover:bg-highlight-400 focus:outline-none ">
        open
      </button>
      <button 
        on:click={closeSerialPort} 
        class="text-white px-2 py-1 mx-2 rounded border-highlight hover:bg-highlight-400 focus:outline-none ">
        close
      </button>
      {#if PORT.path}
        <div class="flex mx-2 items-center">
          <div class="mr-2 rounded-full p-2 w-4 h-4 bg-green-500"></div>
          <div>Connected: {PORT.path}</div>
        </div>
      {:else}
        <div class="flex mx-2 items-center">
          <div class="mr-2 rounded-full p-2 w-4 h-4 bg-red-500"></div>
          <div class="text-red-500">Reconnect Grid!</div>
        </div>
      {/if}

    
  </div>
  <!--
  <div class="flex mx-2 items-center">
    <div>TX</div>
    <div class="mx-2 rounded-full p-2 w-4 h-4 bg-black"></div>
  </div>
  <div class="flex mx-2 items-center">
    <div>RX</div>
    <div class="mx-2 rounded-full p-2 w-4 h-4 bg-black"></div>
  </div>
  -->
</div>
