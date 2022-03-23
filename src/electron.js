const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const { trackEvent } = require('./analytics');
require('@electron/remote/main').initialize();

const { serial } = require('./ipcmain_serialport');
const { websocket } = require('./ipcmain_websocket');


const { store } = require('./main-store');

const { iconBuffer, iconSize } = require('./icon')

const grid_env = require('../configuration.json')

for (const key in grid_env) {

  //console.log(key, grid_env[key])
  process.env[key] = grid_env[key]

}

global.trackEvent = trackEvent;

const path = require('path');
const log = require('electron-log');

const {download} = require('electron-dl');
const fs = require('fs-extra');  
var AdmZip = require("adm-zip");


autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// To avoid context aware flag.
app.allowRendererProcessReuse = false;

let tray = null
  
function create_tray(){

/* ===============================================================================
// Conde snippet to generate JSON file from PNG. Use this when creating a new icon
// ./icon.js holds de raw data in PNG encoding

  let iconLoad = fs.readFileSync(path.join(__dirname, './icon.png'),null)
  const iconLoadJson = JSON.stringify(iconLoad);
  fs.writeFileSync(path.join(__dirname, './iconpng.txt'), iconLoadJson)  
*/ 

  const icon = nativeImage.createFromBuffer(Buffer.from( iconBuffer.data ), {width: iconSize, height: iconSize})

  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show', click: function () {
        mainWindow.setSkipTaskbar(false);
        mainWindow.show();

        mainWindow.webContents.send('trayState', false)

        trackEvent('tray', 'tray: show window')
      }
    },    
    {
      label: 'Hide', click: function () {
        mainWindow.hide(); 
        mainWindow.setSkipTaskbar(true);

        mainWindow.webContents.send('trayState', true)

        trackEvent('tray', 'tray: hide window')
      }
    },
    {
        label: 'Exit', click: function () {
            app.isQuiting = true;
            app.quit();
        }
    }
    ])

  tray.setToolTip('Grid Editor')
  tray.setContextMenu(contextMenu)
  tray.setTitle("Grid Editor")
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {

  app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
    // Print out data received from the second instance.
    console.log(additionalData)

    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {

    if (process.platform !== 'darwin') {
      create_tray();
    }
    
    createWindow()

  })
}

let watcher;
if (process.env.NODE_ENV === 'development') {
 watcher = require('chokidar').watch(path.join(__dirname, '../public/build/*'), { ignoreInitial: true });
 watcher.on('change', () => {
    mainWindow.reload();
 });
}


function createWindow() {

    const windowTitle = 'Grid Editor - ' + process.env.npm_package_version;

    // First we'll get our height and width. This will be the defaults if there wasn't anything saved
    let { width, height } = store.get('windowBounds');

    mainWindow = new BrowserWindow({
        width,
        height,
        'minHeight': 500,
        'minWidth': 800,
        backgroundColor: '#1e2628',
        frame: false,
        titleBarStyle: 'hidden',
        trafficLightPosition: {
          x: 6,
          y: 6
        },
        title: windowTitle,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true,
          backgroundThrottling: false
        },
        icon:'./icon.png'
    });

    serial.mainWindow = mainWindow;
    websocket.mainWindow = mainWindow;

    require("@electron/remote/main").enable(mainWindow.webContents);

    mainWindow.loadURL(`file://${path.join(__dirname, '../public/index.html')}`);

    mainWindow.on('close', (evt)=> {
      // when quit is terminal under darwin
      if(app.quitting){
        mainWindow = null
      } else { // only hide, keep in the background
        evt.preventDefault();
        mainWindow.hide()
      }

      // stop debug functions
      if (watcher) {
        watcher.close();
      } 
    })

    mainWindow.on('resize', () => {
      let { width, height } = mainWindow.getBounds();

      store.set('windowBounds', { width, height });
      mainWindow.webContents.send('window_size', { width, height });
    })

    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }

    
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

// moved this to app.whenReady!
// app.on('ready', createWindow);

log.info('check fo update and notify...')
console.log('check for updates...')
autoUpdater.checkForUpdatesAndNotify();


ipcMain.on('setStoreValue-message', (event, arg) => {
  
  Object.entries(arg).forEach(entry => {

    let [key, value] = entry;
    if (value !== undefined){
      store.set(arg)
      console.log('attempt to store..',arg);
    }
    else{
      store.delete(key)
      console.log('delete from store..',arg);
    }

  });

  event.reply('setStoreValue-reply', 'saved');
})




ipcMain.on('download', async (event, arg) => {


  try{

    console.log('attempt to download..', arg.url);
    const win = BrowserWindow.getFocusedWindow();
  
    let folder = store.get("profileFolder") + "/" + arg.folder;
  
    let result = await download(win, arg.url, {
                                    directory: folder
                                });

    event.returnValue = result.getSavePath();

  }catch(e){

    event.returnValue = undefined;
  }


})

ipcMain.handle('getStoreValue', (event, key) => {
  const result = store.get(key);
  return result;
})

ipcMain.handle('getStoreValues', (event, keys) => {
  
  let result = {}
  keys.forEach(key => {

    let value = store.get(key);
    result[key] = value;
    
  });

  return result;
})



ipcMain.on('analytics_uuid', (event) => {
  console.log("UUID", store.get('userId'))

  event.returnValue = store.get('userId');
});



ipcMain.on('app_version', (event) => {
  event.returnValue = app.getVersion();
});



autoUpdater.on('error', (error) => {
  log.info('Error..', error);
  mainWindow.webContents.send('update_error', error);
})

autoUpdater.on('update-available', () => {
  log.info('update-available... in main!')
  mainWindow.webContents.send('update_available');
});

autoUpdater.on('download-progress', (progressObj) => {
  log.info('update_progress', progressObj);
  mainWindow.webContents.send('update_progress', progressObj);
});

autoUpdater.on('update-downloaded', () => {
  log.info('update downloaded... in main!')
  mainWindow.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});


// profile save and user config saves
ipcMain.on('getProfileDefaultDirectory', (event, arg) => {

  event.returnValue = app.getPath('documents') + '/grid-userdata'
})

ipcMain.on('resetAppSettings', (event, arg) => {

  event.returnValue = store.clear();
  app.relaunch()
  app.exit()
})

ipcMain.on('restart', (event, arg) => {

  app.relaunch()
  app.exit()
})


// Quit when all windows are closed.
app.on('window-all-closed', (evt) => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    mainWindow.show();

});

// termination of application, closing the windows, used for macOS hide flag
app.on('before-quit', () => app.quitting = true)


