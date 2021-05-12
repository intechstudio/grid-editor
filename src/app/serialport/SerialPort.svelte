<script>

  import { onMount, onDestroy } from 'svelte';

  import { sendDataToClient } from '../debug/tower.js';

  import { numberOfModulesStore } from '../main/_stores/app-helper.store.js';

  import { runtime, rtUpdate, localInputStore } from '../runtime/runtime.store.js';

  import { layout } from '../main/_stores/app-helper.store.js';

  import { serialComm } from './serialport.store.js';

  import grid from '../protocol/grid-protocol.js';

  const SerialPort = require('serialport')
  const Readline = SerialPort.parsers.Readline;

	import { createEventDispatcher } from 'svelte';
  import rt from '../runtime/_rt.js';

  const dispatch = createEventDispatcher();

  let PORT = {path: 0};

  let _runtime = [];
  let _layout = [];

  let selectedPort = "";

  runtime.subscribe(rt => {_runtime = rt; return 1});
  layout.subscribe(l => {_layout = l; return 1});

  function coroner(){

    setInterval(()=>{

      // Don't interfere with virtual modules.
      let _removed = _runtime.find(g => (Date.now() - g.alive > (grid.properties.HEARTBEAT_INTERVAL*2)) && !g.virtual);

      let _processgrid = _runtime.map(g => {
        if(Date.now() - g.alive > (grid.properties.HEARTBEAT_INTERVAL*2) && !g.virtual){
          g.alive = 'dead';
        }
        return g;
      })
      
      let _usedgrid = _processgrid.filter(g => g.alive !== 'dead');
      //console.log('_usedgird length...', _usedgrid)

      if(_removed !== undefined && _usedgrid.length !== undefined){    

        // re-initialize Local Settings panel, if the module has been removed which had it's settings opened.
        localInputStore.setToDefault(_removed);

        runtime.set(_usedgrid);
        
        dispatch('coroner', {
          usedgrid: _usedgrid, 
          removed: _removed
        })
        
      }
        
    }, grid.properties.HEARTBEAT_INTERVAL)

  }

  function discoverPorts(){
    setInterval(() => {
      listSerialPorts();
    }, grid.properties.HEARTBEAT_INTERVAL )
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
      console.error(err);
    });
  }
  
  function openSerialPort() {
    const store = $serialComm;
    // don't let reopen port if it's already opened!
    if(!store.isEnabled){
      const serial = store.list.find(serial => serial.port.path === selectedPort);
      PORT = new SerialPort(serial.port.path, { autoOpen: false });
      serialComm.open(PORT);
      serialComm.enabled(true);
      readSerialPort();
    }
  }

  function closeSerialPort() {

    if(PORT.path !== 0){
      PORT.close(function(err){
        console.warn('port closed', err)
      })

      serialComm.update((store)=>{
        store.open = undefined;
        store.isEnabled = false;
        store.list = [];
        return store
      });

      // reset UI
      runtime.set([]);
      rtUpdate.reset();
      localInputStore.setToDefault();

      PORT = {path: 0};
    }
  }

  function readSerialPort() {
        
    console.log('We are proceeding with reading the port.')

    PORT.open(function(err){
      if(err){
        console.error('Error opening port: ', err.message)
        closeSerialPort();
      }
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

    const parser = port.pipe(new Readline({ encoding: 'hex' }));

    parser.on('data', function(data) {

      let temp_array = Array.from(data);
      let array = [];

      for (let index = 0; index < temp_array.length; index+=2) {
        array.push((temp_array[index] + '' + temp_array[index+1])) 
      }

      let RESPONSE = {};

      let _array = [];

      array.forEach((element, i) => {
        _array[i] = parseInt('0x'+element);
      });   
            
      let DATA = grid.translate.decode(_array);

      let d_array = ''

      _array.forEach((element, i) => {
        d_array += String.fromCharCode(element);
      })

      // websocket debug info to client
      sendDataToClient('input', d_array);

      // filter heartbeat messages
      if(!(d_array.slice(30).startsWith('010') && d_array.length == 48) ){
        RESPONSE = grid.translate.decode(_array);
      }

      updateGridUsedAndAlive(DATA.CONTROLLER);

      // local input update (user interaction)
      if(DATA.EVENT){
        if(DATA.EVENT.EVENTTYPE !== 12){
          // avoid validator retrigger on changing things on a the same parameter, as grid sends back the event with each config. 
          //console.log($localInputStore.eventParam, DATA.EVENT)
          if($localInputStore.event.elementnumber !== DATA.EVENT.ELEMENTNUMBER || $localInputStore.event.eventtype !== DATA.EVENT.EVENTTYPE ) {
          // now not using due to changed protocol
            localInputStore.update((store)=>{
              store.brc.dx = DATA.BRC.DX;
              store.brc.dy = DATA.BRC.DY;
              store.brc.rot = DATA.BRC.ROT
              store.event.elementnumber = DATA.EVENT.ELEMENTNUMBER;   
              store.event.eventtype = DATA.EVENT.EVENTTYPE;
              store.event.pagenumber = DATA.EVENT.PAGENUMBER || 0;
              return store;
            });
          }
        }
      }

      // lua config received, save to runtime
      if(DATA.CONFIG){
        rt.update({lua: DATA.CONFIG});
        rtUpdate.count();
      }

      if(DATA.HIDKEYSTATUS){
        hidKeyStatusStore.update((store) => {
          store.isEnabled = DATA.HIDKEYSTATUS.ISENABLED;
          return store;
        });
      }

    })
  }

  function updateGridUsedAndAlive(controller){
    if(controller !== undefined){
      let exists = false;
      _runtime.forEach(g => {
        if(g.id == controller.id && g.virtual == false){
          exists = true;
        }
      });   
      if(!exists){
        _runtime.push(controller);
        dispatch('change', {
          data: {
            moduleId: controller.id,
            cellId: 'dx:'+controller.dx + ';' + 'dy:'+controller.dy,
            isVirtual: false
          }
        });
      }
      if(exists){
        _runtime.map(c => {
          if(c.id === controller.id && c.virtual == false){
            c.alive = Date.now();
          }
          return c;
        });
      }

      if(!exists){
        numberOfModulesStore.set(_runtime.length);
      }

      runtime.set(_runtime);

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
