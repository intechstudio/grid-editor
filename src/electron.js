const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
 
const Store = require('electron-store');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

const store = new Store({
    defaults: { 
        windowBounds: { 
            width: 800, 
            height: 600
        }
    }
});

const path = require('path');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// To avoid context aware flag.
app.allowRendererProcessReuse = false;

let watcher;
if (process.env.NODE_ENV === 'development') {
 watcher = require('chokidar').watch(path.join(__dirname, '../public/*'), { ignoreInitial: true });
 watcher.on('change', () => {
    mainWindow.reload();
 });
}

function createWindow() {
    const mode = process.env.NODE_ENV;

    // First we'll get our height and width. This will be the defaults if there wasn't anything saved
    let { width, height } = store.get('windowBounds');

    console.log('createwindow',width, height);

    mainWindow = new BrowserWindow({
        width,
        height,
        webPreferences: {
          nodeIntegration: true
        }
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

    mainWindow.webContents.openDevTools();
    
    
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

log.info('check fo update and notify...')
console.log('check for updates...')
autoUpdater.checkForUpdatesAndNotify();


ipcMain.on('setStoreValue-message', (event, arg) => {
  store.set({
    grid: arg
  })
  event.reply('setStoreValue-reply', 'saved');
})

ipcMain.handle('getStoreValue', (event, key) => {
  const result = store.get(key);
  return result
})


// Start the back-end micorservice on localport 3000.
const polka = require('./polka')

// auto-update features

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

autoUpdater.on('error', (event) => {
  log.info('Error..', event);
  console.log('updater error')
})

autoUpdater.on('update-available', () => {
  log.info('update-available... in main!')
  mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  log.info('update downloaded... in main!')
  mainWindow.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});


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