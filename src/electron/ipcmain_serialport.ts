const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async');

export const serial = {
  mainWindow: undefined
};

let port_disovery_interval;

/* const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    port_disovery_interval = setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};
 */



// Basic serial usage
async function listSerialPorts(){
  if (serial.mainWindow !== undefined){
    try{
      let foo = await serial.mainWindow.webContents.executeJavaScript(`if(navigator.intechConnect){navigator.intechConnect()}`, true)
      //console.log('serial conn',foo)
    }catch(e){
      console.log(e)
    }
  }
}



export function restartSerialCheckInterval(){


  if (typeof port_disovery_interval !== 'undefined'){

    clearIntervalAsync(port_disovery_interval)
  }

  port_disovery_interval = setIntervalAsync(listSerialPorts, 1000)


}

restartSerialCheckInterval();