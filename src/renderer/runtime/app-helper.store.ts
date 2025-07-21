import { writable, get, readable } from "svelte/store";
import { Modal } from "../main/modals/modal.store";
import Welcome from "../main/modals/Welcome.svelte";
import { Grid } from "../lib/_utils";

const configuration = window.ctxProcess.configuration();

export enum ColorPickerModel {
  Square,
  Slider,
  Circle,
}

const persistentDefaultValues = {
  userId: "",
  size: 1.0,
  wssPort: 1337,
  moduleRotation: Grid.Rotation.R0,
  welcomeOnStartup: true,
  lastVersion: "",
  profileFolder: "",
  presetFolder: "",
  packagesDataStorage: {},
  enabledPackages: [],
  githubPackages: {},
  localPackages: {},
  keyboardLayout: "",
  portstateOverlayEnabled: false,
  writeBufferDebugEnabled: false,
  heartbeatDebugEnabled: false,
  messageIdDebugEnabled: false,
  profileCloudDevFeaturesEnabled: false,
  useProfileCloud: true,
  helperShape: 0,
  helperColor: 0,
  desktopAutomationPackage: false,
  authUser: {},
  authIdToken: "",
  authRefreshToken: "",
  alwaysRunInTheBackground: true,
  analyticsEnabled: false,
  firstLaunch: true,
  fontSize: 12,
  profileCloudUrl: configuration.PROFILE_CLOUD_URL_PROD,
  showPCB: false,
  nightlyFirmware: false,
  nightlyEditor: false,
  changeOnEvent: "event",
  sendHeartbeatImmediate: false,
  disableAnimations: false,
  colorfulToolbar: false,
  packageDeveloper: false,
  actionHelperText: true,
  editableBlockNames: false,
  unreleasedVirtualModules: false,
  multiViewEnabled: false,
  colorPicker: ColorPickerModel.Circle,
  allowDevBlocks: false,
  lastActiveVersion: undefined,
  lightMode: false,
  userLevelMinimalist: true,
};

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
    maxSize: 2.6,
    minSize: 0.6,
    stepSize: 0.1,
    defaultSize: 1.0,
    debugMode: false,
    selectedDisplay: "",
    layoutMode: false,
    preferences: false,
    rightPanelVisible: true,
    leftPanel: undefined,
    leftPanelVisible: true,
    isMultiView: false,
    trayState: false,
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
    packageList: [],
    packageManagerRunning: false,
    developerPackagesRequested: [],
    packageComponentKeys: {},
    packageDebugLogs: [],
    gridLayoutShift: { x: 0, y: 0 },
    persistent: structuredClone(persistent),
  });

  return {
    ...store,
  };
}

export const appSettings = createAppSettingsStore(persistentDefaultValues);

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
          if (import.meta.env.VITE_BUILD_TARGET !== "web") {
            new Modal.Window(Welcome).show();
          }
          return s;
        });
      }

      //TODO
      /*if (get(appSettings).persistent.desktopAutomationPackage === true) {
        console.log("start package");

        window.electron.package.start("desktopAutomation");
      } else {
        console.log("stop package");
        window.electron.package.stop("desktopAutomation");
      }*/
    });

  await window.electron
    .fetchUrlJSON(configuration.FIRMWARE_JSON_URL)
    .then((res) => {
      for (const obj of res) {
        const as = get(appSettings);
        const editorVersion = {
          major: Number(as.version.major),
          minor: Number(as.version.minor),
          patch: Number(as.version.patch),
        };

        const targetVersion = {
          major: obj.EDITOR_VERSION.MAJOR,
          minor: obj.EDITOR_VERSION.MINOR,
          patch: obj.EDITOR_VERSION.PATCH,
        };

        if (
          editorVersion.major == targetVersion.major &&
          editorVersion.minor == targetVersion.minor &&
          editorVersion.patch == targetVersion.patch
        ) {
          const reqired = obj.REQUIRED_FIRMWARES;
          for (const firmware of reqired) {
            const { ARCHITECTURE, MAJOR, MINOR, PATCH } = firmware;
            switch (ARCHITECTURE) {
              case "esp32":
                appSettings.update((store) => {
                  store.firmware_esp32_required = {
                    major: MAJOR,
                    minor: MINOR,
                    patch: PATCH,
                  };
                  return store;
                });
                break;
              case "d51":
                appSettings.update((store) => {
                  store.firmware_d51_required = {
                    major: MAJOR,
                    minor: MINOR,
                    patch: PATCH,
                  };
                  return store;
                });
                break;
              default:
                console.warn(
                  `Unknown required firmware: ${ARCHITECTURE} ${MAJOR}.${MINOR}.${PATCH}`,
                );
            }
          }
        }
      }
    })
    .catch((e) => {
      console.error(e);
    });
}
