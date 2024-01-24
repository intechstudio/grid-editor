/**
 * While web browser mode is active, the electron preload script functions are replaced with mock functions found here.
 * VITE_WEB_MODE=true indicates, that the project is running in web browser mode.
 *
 * I added vite to package.json and put a separate vite.config.mjs file in the root directory for web dev and build.
 * The vite config is the same in electron.vite.config.mjs and vite.config.mjs, the shared part is in renderer.vite.config.mjs
 * The mode is also passed to the CLI while starting the dev server or building the project.
 *
 * To run this app in browser dev mode, run: npm install && npm run web:dev
 */

declare global {
  interface Window {
    electron: any;
    ctxProcess: any;
  }
}

if (import.meta.env.VITE_WEB_MODE == "true") {
  window.ctxProcess = {
    configuration: () => {
      return {
        PROFILE_CLOUD_URL_PROD: "https://profiles.intech.studio",
        EDITOR_VERSION: "1.2.48",
        FIRMWARE_GRID_D51_REQUIRED_MAJOR: 0,
        FIRMWARE_GRID_D51_REQUIRED_MINOR: 0,
        FIRMWARE_GRID_D51_REQUIRED_PATCH: 0,
        FIRMWARE_GRID_ESP32_REQUIRED_MAJOR: 0,
        FIRMWARE_GRID_ESP32_REQUIRED_MINOR: 0,
        FIRMWARE_GRID_ESP32_REQUIRED_PATH: 0,
        MIXPANEL_TOKEN: "d5072f1b11e0a753c9f655dc3ddf7b8d", // mixpanel should be refactored, so it can be disabled without errors.
      };
    },
    buildVariables: () => {
      return {
        BUILD_ENV: "development",
      };
    },
    platform: () => {
      return "darwin";
    },
  };
  window.electron = {
    window: {
      isMaximized: () => {},
    },
    persistentStorage: {
      set: () => {},
      get: async () => {
        return {
          key: "value",
        };
      },
    },
    serial: {
      restartSerialCheckInterval: async () => {
        return {};
      },
    },
    websocket: {
      onReceive: async () => {},
      onTransmit: async () => {},
    },
    auth: {
      onExternalResponse: async () => {},
    },
    configs: {
      onExternalResponse: async () => {},
      startConfigsWatch: async () => {},
      stopConfigsWatch: async () => {},
      onSendConfigsToRenderer: async () => {},
    },
    updater: {
      onAppUpdate: async () => {},
    },
    firmware: {
      onFirmwareUpdate: async () => {},
      findBootloaderPath: async () => {},
    },
    stopOfflineProfileCloud: async () => {},
    fetchUrlJSON: async () => {},
    getLatestVideo: async () => {
      return {
        videLink: "",
        videoId: "",
      };
    },
  };
}

export {};
