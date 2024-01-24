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
            }
        },
        buildVariables: () => {
            return {
                BUILD_ENV: "development",
            }
        },
        platform: () => {
            return "darwin"
        },
    }
    window.electron = {
        window: {
            isMaximized: () => { }
        },
        persistentStorage: {
            set: () => { },
            get: async () => {
                return {
                    key: "value",
                }
            }
        },
        serial: {
            restartSerialCheckInterval: async () => {
                return {}
            },
        },
        websocket: {
            onReceive: async () => { },
            onTransmit: async () => { },
        },
        auth: {
            onExternalResponse: async () => { },
        },
        configs: {
            onExternalResponse: async () => { },
            startConfigsWatch: async () => { },
            stopConfigsWatch: async () => { },
            onSendConfigsToRenderer: async () => { },
        },
        updater: {
            onAppUpdate: async () => { },
        },
        firmware: {
            onFirmwareUpdate: async () => { },
            findBootloaderPath: async () => { }
        },
        stopOfflineProfileCloud: async () => { },
        fetchUrlJSON: async () => { },
        getLatestVideo: async () => {
            return {
                videLink: "",
                videoId: ""
            }
        },
    }
}

export { }
