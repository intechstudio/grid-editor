import { writable, get, readable } from "svelte/store";
import { getAllComponents } from "$lib/_configs";

const configuration = window.ctxProcess.configuration();

const persistentDefaultValues = {
  userId: "",
  size: 1.0,
  wssPort: 1337,
  moduleRotation: 0,
  welcomeOnStartup: true,
  lastVersion: "",
  profileFolder: "",
  presetFolder: "",
  pluginsDataStorage: {},
  enabledPlugins: [],
  markedForDeletionPlugins: [],
  keyboardLayout: "",
  websocketMonitorEnabled: false,
  portstateOverlayEnabled: false,
  profileCloudDevFeaturesEnabled: false,
  useProfileCloud: true,
  helperShape: 0,
  helperColor: 0,
  desktopAutomationPlugin: false,
  authUser: {},
  authIdToken: "",
  authRefreshToken: "",
  alwaysRunInTheBackground: true,
  analyticsEnabled: false,
  firstLaunch: true,
  fontSize: 12,
  profileCloudUrl: configuration.PROFILE_CLOUD_URL_PROD,
};

function checkOS() {
  if (typeof window.ctxProcess === "object") {
    return ctxProcess.platform;
  }
  return "browser";
}

export const statusReport = writable({
  serialport: {},
});

function createSplitPanes() {
  const obj = {
    left: { size: 25 },
    middle: { size: 50 },
    right: { size: 25 },
  };

  Object.defineProperty(obj.left, "default", {
    value: 25,
    writable: false,
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(obj.middle, "default", {
    value: 50,
    writable: false,
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(obj.right, "default", {
    value: 25,
    writable: false,
    enumerable: true,
    configurable: true,
  });

  return writable(obj);
}

export const splitpanes = createSplitPanes();

function createAppSettingsStore(persistent) {
  const store = writable({
    version: {
      major: configuration.EDITOR_VERSION.split(".")[0],
      minor: configuration.EDITOR_VERSION.split(".")[1],
      patch: configuration.EDITOR_VERSION.split(".")[2],
    },
    overlays: { controlElementName: false },
    debugMode: false,
    selectedDisplay: "",
    changeOnEvent: "event",
    layoutMode: false,
    stringNameOverlay: false,
    preferences: false,
    rightPanel: "Configuration",
    rightPanelVisible: true,
    leftPanel: "ProfileCloud",
    leftPanelVisible: true,
    modal: "",
    trayState: false,
    os: checkOS(),
    intervalPause: false,
    firmwareNotificationState: 0,
    firmware_d51_required: {
      major: parseInt(configuration.FIRMWARE_GRID_D51_REQUIRED_MAJOR),
      minor: parseInt(configuration.FIRMWARE_GRID_D51_REQUIRED_MINOR),
      patch: parseInt(configuration.FIRMWARE_GRID_D51_REQUIRED_PATCH),
    },
    firmware_esp32_required: {
      major: parseInt(configuration.FIRMWARE_GRID_ESP32_REQUIRED_MAJOR),
      minor: parseInt(configuration.FIRMWARE_GRID_ESP32_REQUIRED_MINOR),
      patch: parseInt(configuration.FIRMWARE_GRID_ESP32_REQUIRED_PATCH),
    },
    sizeChange: 0,
    activeWindowResult: {
      title: undefined,
      owner: { neme: undefined },
    },
    pluginList: [],
    persistent: structuredClone(persistent),
  });

  return {
    ...store,
  };
}

export const appSettings = createAppSettingsStore(persistentDefaultValues);

export const profileListRefresh = writable(0);
export const presetListRefresh = writable(0);

init_appsettings();

appSettings.subscribe((store) => {
  let instore = store.persistent;

  Object.entries(persistentDefaultValues).forEach((entry) => {
    const [key, value] = entry;

    if (persistentDefaultValues[key] !== instore[key]) {
      persistentDefaultValues[key] = instore[key];
      let settings = {};
      settings[key] = instore[key];
      window.electron.persistentStorage.set(settings);
    }
  });
});

/**
ipcRenderer.on('trayState', (event, args) => {

  if (get(appSettings).trayState === true && args === false){
    // restart session
    sessionid = Date.now();
  }

  console.log("traystate: ", args)
  appSettings.update(s => {s.trayState = args; return s;})  
})
 */

async function init_appsettings() {
  let request = [];
  Object.entries(persistentDefaultValues).forEach((entry) => {
    const [key, value] = entry;
    request.push(key);
  });

  await window.electron.persistentStorage
    .get(request)
    .then(async (response) => {
      appSettings.update((s) => {
        Object.entries(response).forEach(async (entry) => {
          let [key, value] = entry;

          // validate values, append default behavior

          if (key === "profileFolder" && value === undefined) {
            value = await window.electron.library.defaultDirectory();
          }

          if (key === "presetFolder" && value === undefined) {
            value = await window.electron.library.defaultDirectory();
          }

          if (key === "moduleRotation" && value === undefined) {
            value = persistentDefaultValues[key];
          }

          if (key === "pageActivatorInterval" && value === undefined) {
            value = 1000;
          }

          if (value !== undefined) {
            s.persistent[key] = value;
          }
        });

        return s;
      });

      // show welcome modal if it is not disabled, but always show after version update
      if (
        get(appSettings).persistent.welcomeOnStartup === undefined ||
        get(appSettings).persistent.welcomeOnStartup === true ||
        get(appSettings).persistent.lastVersion === undefined ||
        get(appSettings).persistent.lastVersion !=
          configuration["EDITOR_VERSION"]
      ) {
        appSettings.update((s) => {
          s.persistent.lastVersion = configuration["EDITOR_VERSION"];
          s.persistent.welcomeOnStartup = true;
          s.modal = "welcome";
          return s;
        });
      }

      //TODO
      /*if (get(appSettings).persistent.desktopAutomationPlugin === true) {
        console.log("start plugin");

        window.electron.plugin.start("desktopAutomation");
      } else {
        console.log("stop plugin");
        window.electron.plugin.stop("desktopAutomation");
      }*/
    });
}

export const preferenceStore = writable();

export const action_collection = readable(Promise.all([getAllComponents()]));

export const activeDropDown = writable({
  config_index: undefined,
  input_index: undefined,
});

export const layout = writable([]);

export const numberOfModulesStore = writable();

export const focusedCodeEditor = writable();
