const { BrowserWindow, ipcMain, webContents, dialog } = require('electron');
const AdmZip = require('adm-zip');
const { download } = require('electron-dl');
const log = require('electron-log');
const fs = require('fs-extra');

const { store } = require('../main-store');

/**
 * 
 * @param {string} url Download link url 
 * @param {string} directory Destination directory
 * @returns
 */
async function downloadInMainProcess(url, directory){
  const win = BrowserWindow.getFocusedWindow();
  let folder = store.get("profileFolder") + "/" + directory;
  let result = await download(win, url, {
      directory: folder
  });
  const savePath = result.getSavePath();
  return savePath;
}

async function extractArchiveToTemp(data, endOfEntryName, folder){
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
  

async function libraryDownload(targetFolder){

  //trackEvent('library-download', 'library-download: download start')
  //analytics.track_event("application", "preferences", "profile downloader status", "download started")

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
      let author = parts[parts.length-2]
      let type = parts[parts.length-3]

      fs.copySync(targetFolder + "/temp/" + path, targetFolder+"/"+type+"/"+author+"/" + filename)

    })

    log.info("Profiles copied!")

    return 'success';
    //trackEvent('library-download', 'library-download: download success')
    //analytics.track_event("application", "preferences", "profile downloader status", "download success")
  }
  else{
    log.error("Fail after archive extraction!")

    return 'failed';
      //trackEvent('library-download', 'library-download: download failed')   
      //analytics.track_event("application", "preferences", "profile downloader status", "download fail")
  }

}


async function uxpPhotoshopDownload(targetFolder){


  const version = "v"+process.env.UXP_PHOTOSHOP_REQUIRED_MAJOR+"."+process.env.UXP_PHOTOSHOP_REQUIRED_MINOR+"."+process.env.UXP_PHOTOSHOP_REQUIRED_PATCH
  
  let link = process.env.UXP_PHOTOSHOP_URL_BEGINING + version + process.env.UXP_PHOTOSHOP_URL_END

  log.info("Starting the download...")
  
  let downloadResult = await downloadInMainProcess(process.env.LIBRARY_GITHUB_URL, "temp");

  log.info("Download completed!")

  extractArchiveToTemp(downloadResult, ".ccx", targetFolder);

  log.info("Archive extracted!")
  

 //shell.showItemInFolder(targetFolder + "/temp/" +pluginFilePaths[0]) 

} 

function selectDirectory(){

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

module.exports = {
  libraryDownload, 
  uxpPhotoshopDownload,
  selectDirectory,
  downloadInMainProcess,
  extractArchiveToTemp
}