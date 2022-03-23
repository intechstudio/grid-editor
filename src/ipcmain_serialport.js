const {ipcMain} = require('electron');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

let serial = {

  mainWindow: undefined

};



let port_disovery_interval;

const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    port_disovery_interval = setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};





let serial_any_port_list = [];
let serial_grid_port_list = [];

let serialport_instance = undefined;



// Basic serial usage

async function listSerialPorts(){

    SerialPort.list().then(ports => {

    let serial_list = [];
    let grid_list = [];

    ports.forEach((port, i) => { 

        serial_list.push(port)

        // check each port if it has productId with code ECAD or ecac...
        if(port.productId == 'ECAD' || port.productId == 'ecad' || port.productId == 'ECAC' || port.productId == 'ecac'){

            grid_list.push(port)

        }
        
    });

    serial_any_port_list = [...serial_list]
    serial_grid_port_list = [...grid_list]
    

    }).catch(err => {console.error(err);});
}


async function openGridPort(){


    if (serial_grid_port_list.length>0 && serialport_instance === undefined){
  
  
      serialport_instance = new SerialPort({path: serial_grid_port_list[0].path, baudRate: 2000000, autoOpen: false})

        serialport_instance.open(function(err){
  
        if (err){
  
          console.log('Error opening port: ', err)
          serial_any_port_list = [];
          serial_grid_port_list = [];  
          serialport_instance = undefined;
        }
  
      });
  
      serialport_instance.on('open', function() {
        console.log('Port is open.', serialport_instance.path);  

        // setup serial parser:
        const parser = serialport_instance.pipe(new ReadlineParser({encoding: 'hex'}));
  
        parser.on('data', function(data){
          serial.mainWindow.webContents.send('serialport_rx', data);
        })
      }); 


  
      serialport_instance.on('close', function(err) {
        console.warn('Serialport closed unexpectedly: ',err);
  
        serial_any_port_list = [];
        serial_grid_port_list = [];
        serialport_instance = undefined;
        
      });
  
      serialport_instance.on('error', function(err) {
        console.warn('Error',err);
      });
  
    }
  
  }

ipcMain.on('serialport_tx', (event, arg) => {

  if (serialport_instance === undefined){
    return;
  } 

  // console.log("tx", arg)

  if (typeof arg == 'object'){

    serialport_instance.write([...arg, 10])
  }
  else{
    
    serialport_instance.write(arg+'\n')
  }

})

setIntervalAsync(listSerialPorts, 1000)
setIntervalAsync(openGridPort, 500)

  
module.exports = {serial};