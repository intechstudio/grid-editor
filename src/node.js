// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.


const serialport = require('serialport')

serialport.list().then(ports => {
  console.log(ports);
})


console.log('heys')