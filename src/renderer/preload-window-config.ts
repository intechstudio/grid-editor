/**
 * While web browser mode is active, the electron preload script functions are replaced with mock functions found here.
 * VITE_WEB_MODE=true indicates, that the project is running in web browser mode.
 *
 * I added vite to package.json and put a separate vite.config.mjs file in the root directory for web dev and build.
 * The vite config is the same in electron.vite.config.mjs and vite.config.mjs, the shared part is in renderer.vite.config.mjs
 * The mode is also passed to the CLI while starting the dev server or building the project.
 *
 * To run this app in browser dev mode, run: npm install && npm run web-dev
 */

import configuration from "../../configuration.json";
import buildVariables from "../../buildVariables.json";
import { version } from "../../package.json";

configuration.EDITOR_VERSION = version;

declare global {
  interface Window {
    electron: any;
    ctxProcess: any;
    chrome: any;
  }
  interface Navigator {
    serial: any;
    debugSerial: boolean;
    tryConnectGrid: () => any;
  }
}

if (import.meta.env.VITE_WEB_MODE == "true") {
  // handle non-chromium based browsers
  if (window.chrome == null) {
    navigator.serial = {
      addEventListener: () => {},
    };
  }
  window.ctxProcess = {
    configuration: () => {
      return configuration;
    },
    buildVariables: () => {
      // overwrite build target to web, used for mixpanel analytics primarily
      // when deploying to web, consider overwriting the build target in buildVariables.json during a build step
      const buildVars = buildVariables;
      buildVars.BUILD_TARGET = "web";
      return buildVars;
    },
    platform: () => {
      return "web";
    },
  };
  window.electron = {
    window: {
      close: () => {},
      maximize: () => {},
      minimize: () => {},
      restore: () => {},
      isMaximized: () => {},
    },
    clipboard: {
      writeText: () => {
        return new Promise((resolve, reject) => {
          reject("This feature is not yet supported in web mode.");
        });
      },
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
      restartSerialCheckInterval: async () => {},
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
      saveConfig: () => {
        return new Promise((resolve, reject) => {
          reject("This feature is not yet supported in web mode.");
        });
      },
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

    listSerialPorts: () => {
      return [];
    },
    restartPackageManager: () => {},
    resetAppSettings: () => {},
    openInBrowser: () => {},
    overlay: () => {},
  };
}

export {};
