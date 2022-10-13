import { writable } from "svelte/store";

const ipcRenderer = window.sketchyAPI;

const variables = window.ctxProcess;

const versionstring = ipcRenderer.sendSync('app_version');



function checkOS() {

  if (typeof window.ctxProcess === 'object') {
    return variables.platform;
  }
 
  return 'browser';
}

export const app_settings = writable({
  size: 2.1,
  version: {
    major: versionstring.split('.')[0] || 0,
    minor: versionstring.split('.')[1] || 0,
    patch: versionstring.split('.')[2] || 0
  },
  overlays: {controlElementName: false},
  debugMode: false,
  selectedDisplay: '',
  changeOnContact: true,
  layoutMode: false,
  configType: 'uiEvents',
  stringNameOverlay: false,
  rightPanel: 'Configuration',
  preferences: false,
  modal: '',
  trayState: false,
  os: checkOS(),
  intervalPause: false,
  firmwareNotificationState: 0,
  sizeChange: 0,
  activeWindowResult: {
    title: undefined,
    owner: {neme: undefined}
  },
  persistant: {
    wssPort: 1337,
    moduleRotation: 0,
    welcomeOnStartup: true,
    lastVersion: '',
    profileFolder: '',
    pageActivatorEnabled: false,
    pageActivatorCriteria_0 : "",
    pageActivatorCriteria_1 : "",
    pageActivatorCriteria_2 : "",
    pageActivatorCriteria_3 : "",
    keyboardLayout : "",
    pageActivatorInterval: 1000,
    websocketMonitorEnabled: false,
    helperShape: 0,
    helperColor: 0,
    helperName: "Monster"
  }
})