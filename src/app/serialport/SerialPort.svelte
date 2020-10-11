<script>

  import { onMount, onDestroy } from 'svelte';

  import { GRID_PROTOCOL } from './GridProtocol';

  import { elementSettings } from '../settings/elementSettings.store.js';
  import { globalSettings } from '../settings/globalSettings.store.js';

  import { debugStore } from '../stores/debug.store.js';

  import { serialComm } from './serialport.store.js';

  const SerialPort = require('serialport')
  const Readline = SerialPort.parsers.Readline;

	import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let GRID = GRID_PROTOCOL;
  GRID.initialize();
  console.log(GRID);

  let PORT = {path: 0};

  export let grid = [];

  let selectedPort = "";

 // $: serialpaths, closeSerialPort(), createSerialPort(), readSerialPort();

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
        store.list = [];
        return store
      });

      // reset UI
      grid.used = [];
      grid.layout = [];

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

  function runSerialParser(port){

    const parser = port.pipe(new Readline({ delimiter: "\n"}));

    parser.on('data', function(data) {

      let array = Array.from(data);

      let RESPONSE = {};

      // filter heartbeat messages
      if(!(array.join('').slice(30).startsWith('010') && array.length == 46) ){
        debugStore.store(array.join(''));    

        RESPONSE = GRID.decode_instr(array.slice(16,).join(''));      
        
      }

      let _array = [];

      array.forEach((element, i) => {
        _array[i] = element.charCodeAt(0);
      });
      
      let DATA = GRID.decode(_array);

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

      if(DATA.EVENT && DATA.EVENT.length > 0){
        if(DATA.EVENT[0].EVENTTYPE !== 1){
          elementSettings.update((setting)=>{
            setting.position = 'dx:'+DATA.BRC.DX+';dy:'+DATA.BRC.DY;
            setting.controlNumber = DATA.EVENT.map(event => {return event.ELEMENTNUMBER});   
            setting.eventparam = DATA.EVENT.map(event => {return event.EVENTPARAM});   
            return setting;
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
          globalSettings.update(settings => {
            settings.active = DATA.BANKACTIVE.BANKNUMBER;
            return settings
          });

          elementSettings.update(settings => {
            //console.log(DATA.BANKACTIVE);
            if(DATA.BANKACTIVE.BANKNUMBER !== 255){
              settings.bank = DATA.BANKACTIVE.BANKNUMBER;
            }
            return settings;
          })
        }
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

      if(!exists){
        globalSettings.update((setting)=>{
          setting.numberOfModules = grid.used.length;
          return setting;
        })
      }
      
      grid = grid;
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
