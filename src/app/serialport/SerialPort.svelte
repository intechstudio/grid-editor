<script>

  import { onMount, onDestroy } from 'svelte';

  import { get } from 'svelte/store';

  import { sendDataToClient } from '../debug/tower.js';

  import { appSettings, numberOfModulesStore } from '../main/_stores/app-helper.store.js';

  //import { runtime, rtUpdate, localInputStore } from '../runtime/runtime.store.js';
  import { debug, runtime, user_input, heartbeat } from '../runtime/runtime.store.js';

  import { layout } from '../main/_stores/app-helper.store.js';

  import { serialComm } from './serialport.store.js';

  import grid from '../protocol/grid-protocol.js';

  const SerialPort = require('serialport')
  const Readline = SerialPort.parsers.Readline;

	import { createEventDispatcher } from 'svelte';
import instructions from './instructions.js';
import { pParser } from '../protocol/_utils.js';

  const dispatch = createEventDispatcher();

  let PORT = {path: 0};

  let _layout = [];

  let selectedPort = "";

  let _runtime = []

  runtime.subscribe(rt => {_runtime = rt; return 1});
  layout.subscribe(l => {_layout = l; return 1});

  function coroner(){

    setInterval(()=>{

      // Don't interfere with virtual modules.
      let _removed = _runtime.find(g => (Date.now() - g.alive > ($heartbeat.grid * 2.5)) && !g.virtual);

      let _processgrid = _runtime.map(g => {
        if(Date.now() - g.alive > ($heartbeat.grid * 2.5) && !g.virtual){
          g.alive = 'dead';
        }
        return g;
      })
      
      let _usedgrid = _processgrid.filter(g => g.alive !== 'dead');
      //console.log('_usedgird length...', _usedgrid)

      if(_removed !== undefined && _usedgrid.length !== undefined){    

        // re-initialize Local Settings panel, if the module has been removed which had it's settings opened.
        user_input.reset(_removed);

        runtime.set(_usedgrid);
        
        dispatch('coroner', {
          usedgrid: _usedgrid, 
          removed: _removed
        })
        
      }
        
    }, $heartbeat.grid)

  }

  function editorHeartbeat(){

    setInterval(()=>{

      let type = 255

      if(get(runtime.unsaved) != 0){
        type = 254
      }
      
  
      const command = grid.translate.encode(
      {dx: 0, dy: 0, rot: -0},
      `HEARTBEAT`,
      'EXECUTE',
      [
        { TYPE: pParser(type)}, // if all good = 255, not guud = 254
        { HWCFG: pParser(255)}, 
        { VMAJOR: pParser($appSettings.version.major)}, 
        { VMINOR: pParser($appSettings.version.minor)}, 
        { VPATCH: pParser($appSettings.version.patch)}, 
      ], 
      ''
    );
    serialComm.write(command);

    }, $heartbeat.editor)

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
      //rtUpdate.reset();
      user_input.reset();

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

      if(DATA.PAGEACTIVE){
        console.log('pagenumber',DATA.PAGEACTIVE.PAGENUMBER )
        user_input.update_pagenumber(DATA.PAGEACTIVE.PAGENUMBER);
      }

      if(DATA.PAGECOUNT){
        runtime.device.update({brc:DATA.BRC, pagenumber: DATA.PAGECOUNT.PAGENUMBER})
      }

      if(DATA.DEBUGTEXT){
        debug.update((d) => {
          if(d.enabled){
            if(d.data.length >= 15){
              d.data.shift()
            }
            d.data = [...d.data, DATA.DEBUGTEXT];
          }
          return d;
        })
      }

      // local input update (user interaction)
      if(DATA.EVENT){
        if(DATA.EVENT.EVENTTYPE !== 12){
          // avoid validator retrigger on changing things on a the same parameter, as grid sends back the event with each config. 
          // console.log($user_input.eventParam, DATA.EVENT)
          if($user_input.event.elementnumber !== DATA.EVENT.ELEMENTNUMBER || $user_input.event.eventtype !== DATA.EVENT.EVENTTYPE ) {
          // now not using due to changed protocol

            user_input.update_all((store)=>{

              store.brc.dx = DATA.BRC.DX;
              store.brc.dy = DATA.BRC.DY;
              store.brc.rot = DATA.BRC.ROT

              if(DATA.EVENT.ELEMENTNUMBER !== 255){
                store.event.eventtype = DATA.EVENT.EVENTTYPE;
                store.event.elementnumber = DATA.EVENT.ELEMENTNUMBER;   
              }      

              return store;

            });

            
          }
        }
      }

      // lua config received, save to runtime
      if(DATA.CONFIG){
        runtime.update.status('GRID_REPORT').config({lua: DATA.CONFIG}).trigger(true)
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

        const cfg = grid.translate.encode(
          {dx: controller.dx, dy: controller.dy, rot: controller.rot},
          "PAGECOUNT",
          "FETCH",
          ""
        );
        
        serialComm.write(cfg);

      }

      runtime.set(_runtime);
    }
  }

  onDestroy(()=>{
    clearInterval(discoverPorts);
    clearInterval(coroner);
    clearInterval(editorHeartbeat);
    closeSerialPort();
  })

  onMount(() => {
    discoverPorts();
    editorHeartbeat();
    coroner();
  })
    
</script>
