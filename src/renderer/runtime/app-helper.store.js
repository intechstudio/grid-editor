import { writable, get, readable } from "svelte/store";
import { getAllComponents } from "$lib/_configs";

const configuration = window.ctxProcess.configuration();

function checkOS() {
  if (typeof window.ctxProcess === "object") {
    return ctxProcess.platform;
  }
  return "browser";
}

export const current_tooltip_store = writable({ key: "", bool: false });

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

function createAppSettingsStore() {
  const store = writable({
    size: 2.1,
    version: {
      major: configuration.EDITOR_VERSION.split(".")[0],
      minor: configuration.EDITOR_VERSION.split(".")[1],
      patch: configuration.EDITOR_VERSION.split(".")[2],
    },
    overlays: { controlElementName: false },
    debugMode: false,
    selectedDisplay: "",
    changeOnContact: true,
    layoutMode: false,
    configType: "uiEvents",
    stringNameOverlay: false,
    preferences: false,
    rightPanel: "Configuration",
    rightPanelVisible: true,
    leftPanel: "ProfileCloud",
    profileBrowserMode: "profileCloud",
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
    persistant: {
      userId: "",
      wssPort: 1337,
      moduleRotation: 0,
      welcomeOnStartup: true,
      lastVersion: "",
      profileFolder: "",
      presetFolder: "",
      pageActivatorEnabled: false,
      pageActivatorCriteria_0: "",
      pageActivatorCriteria_1: "",
      pageActivatorCriteria_2: "",
      pageActivatorCriteria_3: "",
      keyboardLayout: "",
      pageActivatorInterval: 1000,
      websocketMonitorEnabled: false,
      newProfileBrowserEnabled: true,
      legacyProfileBrowserEnabled: false,
      profileCloudDevFeaturesEnabled: false,
      useProfileCloud: true,
      helperShape: 0,
      helperColor: 0,
      helperName: "Monster",
      desktopAutomationPlugin: false,
      authUser: {},
      authIdToken: "",
      authRefreshToken: "",
    },
  });

  return {
    ...store,
  };
}

export const appSettings = createAppSettingsStore();

export const profileListRefresh = writable(0);
export const presetListRefresh = writable(0);

let persistant = {
  userId: "",
  wssPort: 1337,
  moduleRotation: 0,
  welcomeOnStartup: true,
  lastVersion: "",
  profileFolder: "",
  presetFolder: "",
  pageActivatorEnabled: false,
  pageActivatorCriteria_0: "",
  pageActivatorCriteria_1: "",
  pageActivatorCriteria_2: "",
  pageActivatorCriteria_3: "",
  keyboardLayout: "",
  pageActivatorInterval: 1000,
  websocketMonitorEnabled: false,
  newProfileBrowserEnabled: true,
  legacyProfileBrowserEnabled: false,
  profileCloudDevFeaturesEnabled: false,
  useProfileCloud: true,
  helperShape: 0,
  helperColor: 0,
  helperName: "Monster",
  desktopAutomationPlugin: false,
  authUser: {},
  authIdToken: "",
  authRefreshToken: "",
};

init_appsettings();

appSettings.subscribe((store) => {
  let instore = store.persistant;

  Object.entries(persistant).forEach((entry) => {
    const [key, value] = entry;

    if (persistant[key] !== instore[key]) {
      persistant[key] = instore[key];

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
  Object.entries(persistant).forEach((entry) => {
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
            value = persistant[key];
          }

          if (key === "pageActivatorInterval" && value === undefined) {
            value = 1000;
          }

          if (value !== undefined) {
            s.persistant[key] = value;
          }
        });

        return s;
      });

      // show welcome modal if it is not disabled, but always show after version update
      if (
        get(appSettings).persistant.welcomeOnStartup === undefined ||
        get(appSettings).persistant.welcomeOnStartup === true ||
        get(appSettings).persistant.lastVersion === undefined ||
        get(appSettings).persistant.lastVersion !=
          configuration["EDITOR_VERSION"]
      ) {
        appSettings.update((s) => {
          s.persistant.lastVersion = configuration["EDITOR_VERSION"];
          s.persistant.welcomeOnStartup = true;
          s.modal = "welcome";
          return s;
        });
      }

      if (get(appSettings).persistant.desktopAutomationPlugin === true) {
        console.log("start plugin");

        window.electron.plugin.start("desktopAutomation");
      } else {
        console.log("stop plugin");
        window.electron.plugin.stop("desktopAutomation");
      }
    });
}

export const preferenceStore = writable();

export const action_collection = readable(Promise.all([getAllComponents()]));

function createPresetManagement() {
  const _selected_preset = writable({ sub: "", name: "", configs: "" });

  const _selected_action = writable({ name: "", configs: "" });

  const _quick_access = writable([]);

  return {
    subscribe: _selected_preset.subscribe,
    selected_preset: {
      subscribe: _selected_preset.subscribe,
      update: ({ sub, name, configs }) => {
        _selected_preset.set({ sub: sub, name: name, configs: configs });
      },
    },
    selected_action: {
      subscribe: _selected_action.subscribe,
      update: ({ name, configs }) => {
        _selected_action.set({ name: name, configs: configs });
      },
    },
    quick_access: {
      subscribe: _quick_access.subscribe,
      update: () => {
        _quick_access.update((s) => {
          if (s.length >= 4) {
            s.shift();
          }
          s = [...s, get(_selected_preset)];
          return s;
        });
      },
    },
  };
}

export const activeDropDown = writable({
  config_index: undefined,
  input_index: undefined,
});

export const presetManagement = createPresetManagement();

export const layout = writable([]);

export const numberOfModulesStore = writable();

export const focusedCodeEditor = writable();
