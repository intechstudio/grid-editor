import nodeDiskInfo from 'node-disk-info';
import log from 'electron-log';
import fs from 'fs-extra';

import { extractArchiveToTemp, downloadInMainProcess } from './library';
import { googleAnalytics, influxAnalytics } from './analytics';

export const firmware = {
  mainWindow: undefined,
}

let bootloader_path = undefined;

function delay(time) {
  return new Promise((resolve) => {
      setTimeout(() => resolve(), time);
  });
}

export async function findBootloaderPath(){

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
    // old bootloader Linux Mac Win
    a.blocks === 3965 || a.blocks === 7929 || a.blocks === 4059648 || 
    // new bootloader Linux Mac Win
    a.blocks === 7934 || a.blocks === 15867 || a.blocks === 8123904 ||  
    // add esp32 bootloader block size here WINDOWS ONLY
    a.blocks === 33423360
  );

  console.log("DiskInfo", diskInfo)

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

      firmware.mainWindow.webContents.send('onFirmwareUpdate', {message: "Grid D51 bootloader is detected!", code: 3});
        
      googleAnalytics('firmware-download', {value: 'firmware-download: bootloader detected D51'})
      influxAnalytics("application", "firmwarecheck", "firmware update status", "bootloader detected D51")

      return {path: bootloader_path, architecture: "d51"};

    }
    else if (data.indexOf("ESP32S3") !== -1){

      bootloader_path = gridDrive.mounted;

      firmware.mainWindow.webContents.send('onFirmwareUpdate', {message: "Grid ESP32 bootloader is detected!", code: 3});
        
      googleAnalytics('firmware-download', {value: 'firmware-download: bootloader detected ESP32'})
      influxAnalytics("application", "firmwarecheck", "firmware update status", "bootloader detected ESP32")

      return {path: bootloader_path, architecture: "esp32"};
    }
  }
  
  // reset path
  if (bootloader_path != undefined){
    log.info('some reset stuff should happen here...')
  }

}

export async function firmwareDownload(targetFolder){


  const result = await findBootloaderPath();

  console.log("ARCHITECTURE = ", result.architecture);

  googleAnalytics('firmware-download', {value: 'update start'})
  influxAnalytics("application", "firmwarecheck", "firmware update status", "update started")

  const version = process.env.FIRMWARE_LATEST_DOWNLOAD_VERSION;
  const link = process.env.FIRMWARE_URL_BEGINING + version + process.env.FIRMWARE_URL_END;

  firmware.mainWindow.webContents.send('onFirmwareUpdate', {message: "Downloading firmware image...", code: 4});

  const downloadResult = await downloadInMainProcess(link, "temp")

  const filePathArray = await extractArchiveToTemp(downloadResult, ".uf2", targetFolder)

  await delay(1000);

  console.log("filePathArray", filePathArray);

  let firmwareFileName = undefined;

  filePathArray.forEach(element => {

    if (element.indexOf(result.architecture) !== -1){
      firmwareFileName = element;
      console.log("Correct firmware is: ", firmwareFileName);
    }
  })


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
