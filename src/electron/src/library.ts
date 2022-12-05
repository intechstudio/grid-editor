import { BrowserWindow, ipcMain, webContents, dialog } from 'electron';
import AdmZip from 'adm-zip';
import { download } from 'electron-dl';
import log from 'electron-log'
import fs from 'fs-extra';

import { store } from '../main-store';
import { googleAnalytics, influxAnalytics } from './analytics';

/**
 * 
 * @param {string} url Download link url 
 * @param {string} directory Destination directory
 * @returns
 */
export async function downloadInMainProcess(url, directory){
  const win = BrowserWindow.getFocusedWindow();
  let folder = store.get("profileFolder") + "/" + directory;
  let result = await download(win, url, {
      directory: folder
  });
  const savePath = result.getSavePath();
  return savePath;
}

export async function extractArchiveToTemp(data, endOfEntryName, folder){
  let zip = new AdmZip(data);

  let zipEntries = zip.getEntries(); // an array of ZipEntry records

  let libraryFilePaths = [];

  zipEntries.forEach(function (zipEntry) {

    if (zipEntry.entryName.endsWith(endOfEntryName)) {

      libraryFilePaths.push(zipEntry.entryName);
    }
  });

  zip.extractAllTo(folder + "/temp", true);

  return libraryFilePaths;
}
  

export async function libraryDownload(targetFolder){

  googleAnalytics('library-download', {value: 'download start'})
  influxAnalytics("application", "preferences", "profile downloader status", "download started")

  log.info("Starting the download...")
  
  let downloadResult = await downloadInMainProcess(process.env.LIBRARY_GITHUB_URL, "temp");

  log.info("Download completed!")

  let libraryFilePaths = await extractArchiveToTemp(downloadResult, ".json", targetFolder);

  log.info("Archive extracted!")

  if (libraryFilePaths.length !== 0){

    console.log(libraryFilePaths)

    libraryFilePaths.forEach(path => {

      let parts = path.split("/")
      let filename = parts[parts.length-1]
      let profilename = parts[parts.length-2]
      let author = parts[parts.length-3]
      let type = parts[parts.length-4]




      const from = targetFolder + "/temp/" + path
      const to = targetFolder+"/"+type+"/"+author+"/"+profilename +"/"+  filename


      fs.copySync(from, to)

    })

    log.info("Profiles copied!")

    googleAnalytics('library-download', {value: 'download success'})
    influxAnalytics("application", "preferences", "profile downloader status", "download success")

    return 'success';

  }
  else{
    log.error("Fail after archive extraction!")

    googleAnalytics('library-download', {value: 'download failed'})   
    influxAnalytics("application", "preferences", "profile downloader status", "download fail")
    
    return 'failed';

  }

}


export async function uxpPhotoshopDownload(targetFolder){


  const version = "v"+process.env.UXP_PHOTOSHOP_REQUIRED_MAJOR+"."+process.env.UXP_PHOTOSHOP_REQUIRED_MINOR+"."+process.env.UXP_PHOTOSHOP_REQUIRED_PATCH
  
  let link = process.env.UXP_PHOTOSHOP_URL_BEGINING + version + process.env.UXP_PHOTOSHOP_URL_END

  log.info("Starting the download...")
  
  let downloadResult = await downloadInMainProcess(process.env.LIBRARY_GITHUB_URL, "temp");

  log.info("Download completed!")

  extractArchiveToTemp(downloadResult, ".ccx", targetFolder);

  log.info("Archive extracted!")
  

 //shell.showItemInFolder(targetFolder + "/temp/" +pluginFilePaths[0]) 

} 

export function selectDirectory(){

  const selectedDirectoryPath = dialog.showOpenDialog({
      properties: ['openDirectory']
  }).then(dir => {

    if(!dir.canceled){

      const persistantProfileFolder = dir.filePaths.toString();
      
      // Create the folder if it does not exist
      if(!fs.existsSync(persistantProfileFolder)) {
        fs.mkdirSync(persistantProfileFolder)
      };

      return persistantProfileFolder;

    }

    // just return empty folder path;
    return '';

  }).catch(err => {
      // we should handle errors better in general
      log.error('Failed to select directory', err);
      return '';
  });

  return selectedDirectoryPath;
}