<script>

  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { appSettings } from '../main/_stores/app-helper.store.js';
  import { runtime, user_input, engine } from '../runtime/runtime.store.js';
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


  let port_disovery_interval;
  function discoverPorts(){
    port_disovery_interval = setInterval(() => {
      listSerialPorts();
    }, 300 ) // 300ms
  }

  // Basic serial usage

  function listSerialPorts(){

    SerialPort.list()
      .then(ports => {

        // collect serial ports with type grid

        serialComm.update((store) => { store.list = []; return store;});

        ports.forEach((port, i) => { 

          // check each port if it has productId with code ECAD or ecac...

          let isGrid = 0;
          
          if(port.productId){

            if(port.productId == 'ECAD' || port.productId == 'ecad' || port.productId == 'ECAC' || port.productId == 'ecac'){

              isGrid = 1;

              // add to serialComm store
              serialComm.update((store) => {   
                store.list = [...store.list, {isGrid: isGrid, port: port}]
                return store;
              });
            }
          }
 
        });

        // automatic open

        // pass the collection
        let gridSerialPorts = get(serialComm).list; // these are already filtered from other than grid ports
        // remove empty elements from array!
        gridSerialPorts = gridSerialPorts.filter(function (el) { return el != null; });

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
    const store = get(serialComm);
    // don't let reopen port if it's already opened and dont let port open if serial array is empty!
    if(!store.isEnabled && store.list.length > 0){
      try {      
        const serial = store.list.find(serial => serial.port.path === selectedPort);
        PORT = new SerialPort(serial.port.path, { autoOpen: false });
        serialComm.open(PORT);
        serialComm.selected(selectedPort);
        serialComm.enabled(true);
        readSerialPort();
      } catch (error) {
        console.error('readSerialPort() failed', error)
      }
      
    }
  }

  function closeSerialPort() {

    if(PORT.path !== 0){
      PORT.close(function(err){
        console.warn('Port closed', err)
      })

      // reset store
      serialComm.update((store)=>{
        store.open = undefined;
        store.isEnabled = false;
        store.list = [];
        return store
      });

      

      // reset runtime and user input on closing the port
      runtime.reset();

      
      appSettings.update(s => {s.overlays.controlElementName = false; return s})
      // clearup fifo writebuffer
      // reset engine to enabled
      engine.set('ENABLED');

      // reset port
      selectedPort = "";
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

      let class_array = grid.decode_packet_frame(data);
      grid.decode_packet_classes(class_array);

      if(class_array !== false){
        messageStream.deliver_inbound(class_array);   
      }
    })

  }


  onDestroy(()=>{
    clearInterval(port_disovery_interval);
    closeSerialPort();
  })

  onMount(() => {
    discoverPorts();
  })
    
</script>