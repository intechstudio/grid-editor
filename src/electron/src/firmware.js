const nodeDiskInfo = require('node-disk-info');
const log = require('electron-log');
const fs = require('fs-extra');

const { extractArchiveToTemp, downloadInMainProcess } = require('./library');

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
        
      //trackEvent('firmware-download', 'firmware-download: bootloader detected')
      //analytics.track_event("application", "firmwarecheck", "firmware update status", "bootloader detected")

      return bootloader_path;

    }
  }
  
  // reset path
  if (bootloader_path !== undefined){
    log.info('some reset stuff should happen here...')
    /**
    bootloader_path = undefined;
    setTimeout(() => {
      firmware.mainWindow.webContents.send('onFirmwareUpdate', {message: "", code: 0});

    }, 2000);
     */
  }

}

async function firmwareDownload(targetFolder){

  //appSettings.update(s => {s.firmwareNotificationState = 4; return s;})

  //trackEvent('firmware-download', 'firmware-download: update start')
  //analytics.track_event("application", "firmwarecheck", "firmware update status", "update started")

  const version = "v"+process.env.FIRMWARE_REQUIRED_MAJOR+"."+process.env.FIRMWARE_REQUIRED_MINOR+"."+process.env.FIRMWARE_REQUIRED_PATCH
  const link = process.env.FIRMWARE_URL_BEGINING + version + process.env.FIRMWARE_URL_END;

  firmware.mainWindow.webContents.send('onFirmwareUpdate', {message: "Downloading firmware image...", code: 4});

  const downloadResult = await downloadInMainProcess(link, "temp")

  const filePathArray = await extractArchiveToTemp(downloadResult, ".uf2", targetFolder)

  await delay(1000);

  console.log(downloadResult);

  const firmwareFileName = filePathArray[0];

  console.log(filePathArray);


  if (firmwareFileName === undefined){
    firmware.mainWindow.webContents.send('onFirmwareUpdate', {message: "Error: Download failed.", code: 3});

    //trackEvent('firmware-download', 'firmware-download: download fail')
    //analytics.track_event("application", "firmwarecheck", "firmware update status", "download fail")
    //await delay(2500);
    
    //appSettings.update(s => {s.firmwareNotificationState = 3; return s;})
    return;
  }


  firmware.mainWindow.webContents.send('onFirmwareUpdate',{message: "Decompressing image..."});

  await delay(1500);

  firmware.mainWindow.webContents.send('onFirmwareUpdate', {message: "Uploading firmware..."});

  await delay(1500);

  if (bootloader_path !== undefined){

    fs.copySync(targetFolder + "/temp/" + firmwareFileName, bootloader_path + "/" + firmwareFileName)

    firmware.mainWindow.webContents.send('onFirmwareUpdate', {message: "Update completed successfully!",code: 5});

    //trackEvent('firmware-download', 'firmware-download: update success')
    //analytics.track_event("application", "firmwarecheck", "firmware update status", "update success")
    
  }
  else{
    log.warn("GRID_NOT_FOUND")

    //trackEvent('firmware-download', 'firmware-download: update fail')
    //analytics.track_event("application", "firmwarecheck", "firmware update status", "update fail")
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