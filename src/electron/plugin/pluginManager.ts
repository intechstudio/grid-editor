import path from "path"
import { IPluginController } from "./gridController"
import { MessagePortMain } from "electron/main"

const availablePlugins = {
    'plugin-active-win': { name: 'Active Window', description: 'Short description of Active Window plugin', path: './plugins/plugin-active-win-wip', preference: 'ActiveWinPreferences.svelte' }
}

const loadedPlugins = {}

//let pluginController: IPluginController
let messagePort: MessagePortMain

/*export function setPluginController(controller: IPluginController) {
    pluginController = controller;
    notifyListener()
}*/
export function setPluginManagerMessagePort(port: MessagePortMain) {
    messagePort = port;
    messagePort.on('message', (event) => {
        const data = event.data
        if (data.type == 'load-plugin'){
            loadPlugin(data.id, undefined)
        } else if (data.type == 'unload-plugin'){
            unloadPlugin(data.id)
        } else if (data.type == 'plugin-action'){
            executeAction(data.pluginId, data.actionId, data.payload)
        }
    })
    port.start()
    notifyListener()
}

export async function loadPlugin(pluginName: string, persistedData: any) {
    if (loadedPlugins[pluginName]) {
        return true;
    }

    const pluginDirectory = path.resolve(availablePlugins[pluginName].path)
    const plugin = require(pluginDirectory)
    await plugin.loadPlugin({ sendMessageToRuntime: (payload) => { messagePort.postMessage({ type: 'plugin-action', pluginId: pluginName, ...payload }) } }, persistedData)
    loadedPlugins[pluginName] = plugin
    notifyListener()
    return true;
}

export async function unloadPlugin(pluginName: string) {
    if (loadedPlugins[pluginName]) {
        loadedPlugins[pluginName].unloadPlugin()
        delete loadedPlugins[pluginName]
        notifyListener()
    }
    return true
}

export async function executeAction(pluginName: string, actionId: number, payload: any) {
    const plugin = loadedPlugins[pluginName]
    await plugin.executeAction(actionId, payload)
}

function notifyListener() {
    const plugins = getAvailablePlugins()
    messagePort.postMessage({type: 'plugins', plugins})
}

function getAvailablePlugins() {
    const pluginList = Object.entries(availablePlugins).map(([key, entry]) => {
        return {
            id: key,
            name: entry.name,
            isLoaded: Object.keys(loadedPlugins).includes(key),
            preference: path.resolve(path.join(entry.path, entry.preference))
        }
    })
    return pluginList
}