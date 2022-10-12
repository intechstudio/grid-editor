let serial = {

  mainWindow: undefined

};


let port_disovery_interval;

const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    port_disovery_interval = setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};



// Basic serial usage

async function listSerialPorts(){

  if (serial.mainWindow !== undefined){
    
    try{
      let foo = await serial.mainWindow.webContents.executeJavaScript(`if(navigator.intechConnect){navigator.intechConnect()}`, true)
      //console.log(foo)
    }catch(e){
      console.log(e)
    }

    

  }


}

setIntervalAsync(listSerialPorts, 1000)

  
module.exports = {serial};