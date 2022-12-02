import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

export const updater = {
  mainWindow: undefined
}

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

log.info('check for update and notify...')
autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('error', (error) => {
  log.info('Error..', error);
  updater.mainWindow.webContents.send('onAppUpdate', {code: 'update-error', error: error});
})

autoUpdater.on('update-available', () => {
  log.info('update-available...')
  updater.mainWindow.webContents.send('onAppUpdate', {code: 'update-available'});
});

autoUpdater.on('download-progress', (progressObj) => {
  log.info('update_progress', progressObj);
  updater.mainWindow.webContents.send('onAppUpdate', {code: 'update-progress', percent: progressObj.percent});
});

autoUpdater.on('update-downloaded', () => {
  log.info('update downloaded...!')
  updater.mainWindow.webContents.send('onAppUpdate', {code: 'update-downloaded'});
});

export function restartAfterUpdate(){
  updater.mainWindow.setClosable(true);
  autoUpdater.quitAndInstall();
}