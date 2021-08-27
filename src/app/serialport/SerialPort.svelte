<script>

  import { onMount, onDestroy } from 'svelte';

  import { get } from 'svelte/store';

  import { appSettings } from '../main/_stores/app-helper.store.js';

  import { runtime, user_input, heartbeat, engine } from '../runtime/runtime.store.js';

  import { serialComm } from './serialport.store.js';

  import grid from '../protocol/grid-protocol.js';

  const SerialPort = require('serialport')
  const Readline = SerialPort.parsers.Readline;

  import { pParser } from '../protocol/_utils.js';
  import { messageStream } from './message-stream.store.js';  
  import { writeBuffer } from '../runtime/engine.store.js';

  let PORT = {path: 0};

  let selectedPort = "";

  let _runtime = []

  runtime.subscribe(rt => {_runtime = rt; return 1});

  $: if($heartbeat.editor){ clearInterval(editor_heartbeat_interval); editorHeartbeat()}

  $: if($heartbeat.grid){ clearInterval(grid_heartbeat_interval); gridHeartbeat()}

  // Main serial intervals

  let grid_heartbeat_interval;
  function gridHeartbeat(){ 
    const interval = get(heartbeat).grid;
    grid_heartbeat_interval = setInterval(()=>{
      let _removed = _runtime.find(g => (Date.now() - g.alive > ($heartbeat.grid * 2)) && !g.virtual);
      let _processgrid = _runtime.map(g => {
        if(Date.now() - g.alive > ($heartbeat.grid *2) && !g.virtual){
          g.alive = 'dead';
        }
        return g;
      })
      let _usedgrid = _processgrid.filter(g => g.alive !== 'dead');

      if(_removed !== undefined && _usedgrid.length !== undefined){    
        // re-initialize configuration panel, if the module has been removed which had it's settings opened.
        user_input.reset(_removed);
        runtime.set(_usedgrid); 
        writeBuffer.clean_up.one(_removed);
     
      }

    }, interval)
  }

  let editor_heartbeat_interval;
  function editorHeartbeat(){ 

    const interval = get(heartbeat).editor;
    
    editor_heartbeat_interval = setInterval(()=>{
        let type = 255
        if(get(runtime.unsaved) != 0){
          type = 254
        }

        const {serial, id} = grid.translate.encode(
          {dx: 0, dy: 0, rot: 0},
          'GLOBAL',
          'HEARTBEAT',
          'EXECUTE',
          [
            { TYPE: pParser(type)}, // if all good = 255, not guud = 254
            { HWCFG: pParser(255)}, 
            { VMAJOR: pParser($appSettings.version.major)}, 
            { VMINOR: pParser($appSettings.version.minor)}, 
            { VPATCH: pParser($appSettings.version.patch)}, 
          ]
        );

        serialComm.write(serial);
        
    }, interval);

  }

  let port_disovery_interval;
  function discoverPorts(){
    port_disovery_interval = setInterval(() => {
      listSerialPorts();
    }, grid.properties.HEARTBEAT_INTERVAL )
  }

  // Basic serial usage

  function listSerialPorts(){

    SerialPort.list()
      .then(ports => {

        // collect serial ports with type grid

        serialComm.update((store) => { store.list = []; return store;});

        ports.forEach((port, i) => {  
          let isGrid = 0;
          if(port.productId){
            if(port.productId == 'ECAD' || port.productId == 'ecad' || port.productId == 'ECAC' || port.productId == 'ecac'){
              isGrid = 1 
            }
          }

          // collect all ports in an array
          serialComm.update((store) => {   
            if(isGrid){
              store.list[i] = {isGrid: isGrid, port: port};
            }
            return store;
          });       
        });

        // automatic open

        console.log('gridserialports', get(serialComm).list);

        const gridSerialPorts = get(serialComm).list; // these are already filtered from other than grid ports

        const preferredPort = gridSerialPorts.find(p => p.port.path == $serialComm.preferredPort);

        if($serialComm.open == undefined){
          if(preferredPort !== undefined){
            // open the preferred port
            closeSerialPort();
            selectedPort = preferredPort.port.path;
            openSerialPort();
          } else if(gridSerialPorts.length) {
            //open the first grid port found if preferred is not available but there are grid ports
            selectedPort = gridSerialPorts[0].port.path;
            openSerialPort(); 
          } else {
            // there is no grid serial port
            closeSerialPort();
          }     
        }

        // when changing cables on the fly
        const isStillAvailable = gridSerialPorts.find(p => p.port.path == selectedPort);
        if(!isStillAvailable){
          closeSerialPort();
        }

        // if no grid found ,kill
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
    // don't let reopen port if it's already opened and dont let port open if serial array is empty!
    if(!store.isEnabled && store.list.length > 0){
      const serial = store.list.find(serial => serial.port.path == selectedPort);
      PORT = new SerialPort(serial.port.path, { autoOpen: false });
      serialComm.open(PORT);
      serialComm.selected(selectedPort);
      serialComm.enabled(true);
      readSerialPort();
    }
  }

  function closeSerialPort() {

    if(PORT.path !== 0){
      PORT.close(function(err){
        console.warn('Port closed', err)
      })

      serialComm.update((store)=>{
        store.open = undefined;
        store.isEnabled = false;
        store.list = [];
        return store
      });

      // reset runtime and user input on closing the port
      runtime.set([]);
      user_input.reset();
      runtime.unsaved.set(0);
      runtime.update.one().trigger();
      // clearup fifo writebuffer
      writeBuffer.clean_up.all();
      // reset engine to enabled
      engine.set('ENABLED');

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
      runSerialParser(PORT);
    }); 
  }

  
  function runSerialParser(port){

    const parser = port.pipe(new Readline({ encoding: 'hex' }));

    parser.on('data', function(data) {
      const decoded = grid.translate.decode(data);
      if(decoded !== false){
        messageStream.set(decoded);   
      }
    })

  }


  onDestroy(()=>{
    clearInterval(port_disovery_interval);
    clearInterval(grid_heartbeat_interval);
    clearInterval(editor_heartbeat_interval);
    closeSerialPort();
  })

  onMount(() => {
    discoverPorts();
    editorHeartbeat();
    gridHeartbeat();
  })
    
</script>