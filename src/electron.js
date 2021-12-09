const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const { trackEvent } = require('./analytics');
const { store } = require('./main-store');

const { iconBuffer, iconSize } = require('./icon')

global.trackEvent = trackEvent;

const path = require('path');
const log = require('electron-log');

const {download} = require('electron-dl');
const fs = require('fs-extra');  
var AdmZip = require("adm-zip");
const drivelist = require('drivelist');


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
        trackEvent('tray', 'tray: show window')
      }
    },    
    {
      label: 'Hide', click: function () {
        mainWindow.hide(); 
        mainWindow.setSkipTaskbar(true);
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

app.whenReady().then(() => {

  if (process.platform !== 'darwin') {
    create_tray();
  }
  

})


let watcher;
if (process.env.NODE_ENV === 'development') {
 watcher = require('chokidar').watch(path.join(__dirname, '../public/build/*'), { ignoreInitial: true });
 watcher.on('change', () => {
    mainWindow.reload();
 });
}

function createWindow() {

    const mode = process.env.NODE_ENV;

    // First we'll get our height and width. This will be the defaults if there wasn't anything saved
    let { width, height } = store.get('windowBounds');

    mainWindow = new BrowserWindow({
        width,
        height,
        'minHeight': 500,
        'minWidth': 800,
        backgroundColor: '#1e2628',
        frame: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true,
          backgroundThrottling: false
        },
        icon:'./icon.png'
    });

    mainWindow.loadURL(`file://${path.join(__dirname, '../public/index.html')}`);

    mainWindow.on('closed', () => {
      mainWindow = null;
      if (watcher) {
        watcher.close();
      }         
    });



    mainWindow.on('resize', () => {
      let { width, height } = mainWindow.getBounds();

      store.set('windowBounds', { width, height });
    })

    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }


    
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);



log.info('check fo update and notify...')
console.log('check for updates...')
autoUpdater.checkForUpdatesAndNotify();


ipcMain.on('setStoreValue-message', (event, arg) => {
  console.log('attempt to store..',arg);
  store.set(arg)
  event.reply('setStoreValue-reply', 'saved');
})


ipcMain.on('download', async (event, arg) => {
  


  console.log('attempt to download..', arg.url);
  const win = BrowserWindow.getFocusedWindow();

  let folder = store.get("profileFolder") + "/" + arg.folder;

  let result = await download(win, arg.url, {
                                  directory: folder
                              });

  event.returnValue = result.getSavePath();

})

ipcMain.handle('getStoreValue', (event, key) => {
  const result = store.get(key);
  return result;
})

// uuid for google analytics

ipcMain.on('set_uuid', (event,arg) => {
  console.log('Storing UUID!');
  store.set(arg);
});

ipcMain.handle('get_uuid', (event,arg) => {
  return store.get('uuid');
})

// auto-update features

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
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
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});





