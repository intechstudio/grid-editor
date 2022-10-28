const nodeDiskInfo = require('node-disk-info');
const log = require('electron-log');
const fs = require('fs-extra');

const { extractArchiveToTemp, downloadInMainProcess } = require('./library');
const { googleAnalytics, influxAnalytics } = require('./analytics');

let bootloader_path = undefined;

function delay(time) {
  return new Promise((resolve) => {
      setTimeout(() => resolve(), time);
  });
}

async function findBootloaderPath(){

  let diskInfo = undefined;

  try {
    diskInfo = nodeDiskInfo.getDiskInfoSync()
  } catch (error) {
    log.warn(error)
  }

  if (diskInfo === undefined){
    return;
  }

  // log.info(diskInfo)
  // 7929 MAC ||  15867 new
  // 3965 for Linux and 4059648 for Windows (old bootloader)
  // 7934 for Linux and 8123904 for Windows (new bootloader)

  let gridDrive = diskInfo.find(a => 
    // old Linux Mac Win
    a.blocks === 3965 || a.blocks === 7929 || a.blocks === 4059648 || 
    // new Linux Mac Win
    a.blocks === 7934 || a.blocks === 15867 || a.blocks === 8123904     
  );

  let data;

  if (gridDrive !== undefined ){
    try {
      data = fs.readFileSync(gridDrive.mounted + "/INFO_UF2.TXT", {encoding:'utf8', flag:'r'})
    } catch (error) {
      console.warn(error)
    }
  }

  if (data !== undefined){
    // is it grid
    if (data.indexOf("SAMD51N20A-GRID") !== -1){

      bootloader_path = gridDrive.mounted;

      firmware.mainWindow.webContents.send('onFirmwareUpdate', {message: "Grid bootloader is detected!", code: 3});
        
      window.electron.analytics.google('firmware-download', {value: 'firmware-download: bootloader detected'})
      window.electron.analytics.influx("application", "firmwarecheck", "firmware update status", "bootloader detected")

      return bootloader_path;

    }
  }
  
  // reset path
  if (bootloader_path !== undefined){
    log.info('some reset stuff should happen here...')
  }

}

async function firmwareDownload(targetFolder){

  googleAnalytics('firmware-download', {value: 'update start'})
  influxAnalytics("application", "firmwarecheck", "firmware update status", "update started")

  const version = "v"+process.env.FIRMWARE_REQUIRED_MAJOR+"."+process.env.FIRMWARE_REQUIRED_MINOR+"."+process.env.FIRMWARE_REQUIRED_PATCH
  const link = process.env.FIRMWARE_URL_BEGINING + version + process.env.FIRMWARE_URL_END;

  firmware.mainWindow.webContents.send('onFirmwareUpdate', {message: "Downloading firmware image...", code: 4});

  const downloadResult = await downloadInMainProcess(link, "temp")

  const filePathArray = await extractArchiveToTemp(downloadResult, ".uf2", targetFolder)

  await delay(1000);

  const firmwareFileName = filePathArray[0];


  if (firmwareFileName === undefined){
    firmware.mainWindow.webContents.send('onFirmwareUpdate', {message: "Error: Download failed.", code: 3});

    googleAnalytics('firmware-download', {value: 'download fail'})
    influxAnalytics("application", "firmwarecheck", "firmware update status", "download fail")    

    return;
  }


  firmware.mainWindow.webContents.send('onFirmwareUpdate',{message: "Decompressing image..."});

  await delay(1500);

  firmware.mainWindow.webContents.send('onFirmwareUpdate', {message: "Uploading firmware..."});

  await delay(1500);

  if (bootloader_path !== undefined){

    fs.copySync(targetFolder + "/temp/" + firmwareFileName, bootloader_path + "/" + firmwareFileName)

    firmware.mainWindow.webContents.send('onFirmwareUpdate', {message: "Update completed successfully!",code: 5});

    googleAnalytics('firmware-download', {value: 'update success'})
    influxAnalytics("application", "firmwarecheck", "firmware update status", "update success")
    
  }
  else{
    
    log.warn("GRID_NOT_FOUND")

    googleAnalytics('firmware-download', {value: 'update fail'})
    influxAnalytics("application", "firmwarecheck", "firmware update status", "update fail")
  }



}

let firmware = {
  mainWindow: undefined,
}

module.exports = {
  firmware,
  findBootloaderPath,
  firmwareDownload,
}