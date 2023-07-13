import path from "path"
import fs from "fs"
import { IPluginController } from "./gridController"
import { MessagePortMain } from "electron/main"
import axios from 'axios';
const AdmZip = require('adm-zip');

enum PluginStatus {
    Uninstalled,
    Downloading,
    Downloaded,
    Enabled
}

const pluginFolder = path.resolve('./plugins')

const availablePlugins = {
    'plugin-active-win': { name: 'Active Window', description: 'Short description of Active Window plugin', gitHubRepositoryName: 'plugin-active-win-wip'}
}

const loadedPlugins = {}
const downloadingPlugins : string[] = []

let messagePort: MessagePortMain

export function setPluginManagerMessagePort(port: MessagePortMain) {
    messagePort = port;
    messagePort.on('message', (event) => {
        const data = event.data
        switch (data.type){
            case 'load-plugin': loadPlugin(data.id, undefined); break;
            case 'unload-plugin': unloadPlugin(data.id); break;
            case 'download-plugin': downloadPlugin(data.id); break;
            case 'uninstall-plugin': uninstallPlugin(data.id); break;
            case 'plugin-action': executeAction(data.pluginId, data.actionId, data.payload); break;
        }
    })
    port.start()
    notifyListener()
}

async function loadPlugin(pluginName: string, persistedData: any) {
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

async function unloadPlugin(pluginName: string) {
    if (loadedPlugins[pluginName]) {
        loadedPlugins[pluginName].unloadPlugin()
        delete loadedPlugins[pluginName]
        notifyListener()
    }

    return true
}

async function downloadPlugin(pluginName: string) {
    const gitHubRepositoryName = availablePlugins[pluginName].gitHubRepositoryName
    try {
        messagePort.postMessage({type: 'debug-debug', message: 'Starting request'})
        var pluginReleases = await axios.get(`https://api.github.com/repos/intechstudio/${gitHubRepositoryName}/releases`, {
            headers: {
              'User-Agent': 'Grid Editor'
            }
          })
        messagePort.postMessage({type: 'debug-debug', pluginReleases})
        var url = pluginReleases[0].assets[2].browser_download_url
        messagePort.postMessage({type: 'debug-debug', url})
        const response = await axios({
          url: url,
          responseType: 'arraybuffer',
        });
    
        const zipPath = path.join(pluginFolder, `${pluginName}.zip`);
        fs.writeFileSync(zipPath, response.data);
    
        // Extract the contents to the destination folder
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(path.join(pluginFolder, pluginName), true);
    
        // Cleanup: Delete the temporary zip file
        fs.unlinkSync(zipPath);
    
        messagePort.postMessage({type: 'debug-result', message: `Extracted`})
      } catch (error) {
        messagePort.postMessage({type: 'debug-error', error})
      }
}

async function uninstallPlugin(pluginName: string) {

}

async function executeAction(pluginName: string, actionId: number, payload: any) {
    const plugin = loadedPlugins[pluginName]
    await plugin.executeAction(actionId, payload)
}

function notifyListener() {
    const plugins = getAvailablePlugins()
    messagePort.postMessage({type: 'plugins', plugins})
}

function getAvailablePlugins() {
    const folders = fs.readdirSync(pluginFolder);
  
    // Iterate over each subfolder
    let installedPlugins = folders.map((folder) => {
        const pluginId = folder
        const pluginPath = path.join(pluginFolder, folder);
  
        let pluginName : string | undefined = undefined 
        if (fs.statSync(pluginPath).isDirectory()) {
            const packageJsonPath = path.join(pluginPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = require(packageJsonPath);
                pluginName = packageJson.description;
            }
        } 
        pluginName = pluginName ?? pluginId
        return {
            pluginId,
            pluginName
        }
    });
  
    const pluginList = Object.entries(availablePlugins).map(([key, entry]) => {
        let status : PluginStatus
        if (Object.keys(loadedPlugins).includes(key)){
            status = PluginStatus.Enabled
        } else if (installedPlugins.filter((e) => e.pluginId == key).length > 0){
            status = PluginStatus.Downloaded
        } else if (downloadingPlugins.includes(key)){
            status = PluginStatus.Downloading
        } else {
            status = PluginStatus.Uninstalled
        }
        return {
            id: key,
            name: entry.name,           
            status
        }
    })
    for (const plugin of installedPlugins){
        if (pluginList.filter(e => e.id == plugin.pluginId).length > 0) continue
        let status: PluginStatus
        if (Object.keys(loadedPlugins).includes(plugin.pluginId)){
            status = PluginStatus.Enabled
        } else {
            status = PluginStatus.Downloaded
        }
        
        pluginList.push({
            id: plugin.pluginId,
            name: plugin.pluginName,
            status 
        })
    }
    return pluginList
}