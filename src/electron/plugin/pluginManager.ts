import path from "path"
import fs from "fs"
import { MessagePortMain } from "electron/main"
import axios from "axios"
import AdmZip from "adm-zip";
import os from "os"
import { app } from "electron"

enum PluginStatus {
    Uninstalled = "Uninstalled",
    Downloading = "Downloading",
    Downloaded = "Downloaded",
    Enabled = "Enabled",
    MarkedForDeletion = "MarkedForDeletion"
}

const pluginFolder = path.resolve(path.join(app.getPath("documents"), "grid-userdata", "plugins"))

if (!fs.existsSync(pluginFolder)){
    fs.mkdirSync(pluginFolder, {recursive: true})
}

const availablePlugins = {
    "plugin-active-win": { 
        name: "Active Window", 
        description: "Short description of Active Window plugin", 
        gitHubRepositoryOwner: "intechstudio",
        gitHubRepositoryName: "plugin-active-win-wip",
    }
}

const currentlyLoadedPlugins = {}
const haveBeenLoadedPlugins = new Set<string>()
const markedForDeletionPlugins = new Set<string>()
const downloadingPlugins = new Set<string>()

let messagePort: MessagePortMain

export function setPluginManagerMessagePort(port: MessagePortMain) {
    messagePort = port;
    messagePort.on("message", (event) => {
        const data = event.data
        switch (data.type){
            case "load-plugin": loadPlugin(data.id, undefined); break;
            case "unload-plugin": unloadPlugin(data.id); break;
            case "download-plugin": downloadPlugin(data.id); break;
            case "uninstall-plugin": uninstallPlugin(data.id); break;
            case "plugin-action": executeAction(data.pluginId, data.actionId, data.payload); break;
        }
    })
    port.start()
    notifyListener()
}

async function loadPlugin(pluginName: string, persistedData: any) {
    if (currentlyLoadedPlugins[pluginName]) {
        return true;
    }

    const pluginDirectory = path.join(pluginFolder, pluginName)
    const plugin = require(pluginDirectory)
    await plugin.loadPlugin({ sendMessageToRuntime: (payload) => { messagePort.postMessage({ type: "plugin-action", pluginId: pluginName, ...payload }) } }, persistedData)
    currentlyLoadedPlugins[pluginName] = plugin
    haveBeenLoadedPlugins.add(pluginName)
    notifyListener()
    return true;
}

async function unloadPlugin(pluginName: string) {
    if (currentlyLoadedPlugins[pluginName]) {
        currentlyLoadedPlugins[pluginName].unloadPlugin()
        delete currentlyLoadedPlugins[pluginName]
        notifyListener()
    }

    return true
}

async function downloadPlugin(pluginName: string) {
    if (markedForDeletionPlugins.has(pluginName)){
        markedForDeletionPlugins.delete(pluginName)
        notifyListener()
        return
    }

    if (downloadingPlugins.has(pluginName)) return
    downloadingPlugins.add(pluginName)
    notifyListener()
    
    const gitHubRepositoryName = availablePlugins[pluginName].gitHubRepositoryName
    const gitHubRepositoryOwner = availablePlugins[pluginName].gitHubRepositoryOwner
    
    try {
        const pluginReleasesResponse = await axios.get(`https://api.github.com/repos/${gitHubRepositoryOwner}/${gitHubRepositoryName}/releases`, {
            headers: {
              "User-Agent": "Grid Editor"
            }
          })
        const pluginReleases = pluginReleasesResponse.data
        const assets = pluginReleases[0].assets
        
        let platform = "macos"
        switch(os.platform()){
            case "win32": platform = "windows"; break;
            case "darwin": platform = "macos"; break;
            default: platform = "ubuntu"; break;
        }
        
        const url = assets.find((e) => e.name.includes(platform)).browser_download_url
        const response = await axios({
          url: url,
          responseType: "arraybuffer",
        });
    
        const zipPath = path.join(pluginFolder, `${pluginName}.zip`);
        fs.writeFileSync(zipPath, response.data);
    
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(path.join(pluginFolder, pluginName), true, true);
    
        fs.unlinkSync(zipPath);
      } finally {
        downloadingPlugins.delete(pluginName)
        notifyListener()
      }
}

async function uninstallPlugin(pluginName: string) {
    if (currentlyLoadedPlugins[pluginName]){
        currentlyLoadedPlugins[pluginName].unloadPlugin()
        delete currentlyLoadedPlugins[pluginName]
    }
    if (haveBeenLoadedPlugins.has(pluginName)){
        markedForDeletionPlugins.add(pluginName)
        notifyListener()
    } else {
        const pluginPath = path.join(pluginFolder, pluginName)
        fs.rm(pluginPath, { recursive: true }, notifyListener)
    }
}

async function executeAction(pluginName: string, actionId: number, payload: any) {
    const plugin = currentlyLoadedPlugins[pluginName]
    await plugin.executeAction(actionId, payload)
}

function notifyListener() {
    const plugins = getAvailablePlugins()
    messagePort.postMessage({type: "plugins", plugins})
}

function getAvailablePlugins() {
    const folders = fs.readdirSync(pluginFolder);
  
    // Iterate over each subfolder
    let installedPlugins = folders.map((folder) => {
        const pluginId = folder
        const pluginPath = path.join(pluginFolder, folder);
  
        let pluginName : string | undefined = undefined 
        if (fs.statSync(pluginPath).isDirectory()) {
            const packageJsonPath = path.join(pluginPath, "package.json");
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
        if (Object.keys(currentlyLoadedPlugins).includes(key)){
            status = PluginStatus.Enabled
        } else if (markedForDeletionPlugins.has(key)) {
            status = PluginStatus.MarkedForDeletion
        } else if (installedPlugins.filter((e) => e.pluginId === key).length > 0){
            status = PluginStatus.Downloaded
        } else if (downloadingPlugins.has(key)){
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
        if (pluginList.filter(e => e.id === plugin.pluginId).length > 0) continue
        let status: PluginStatus
        if (Object.keys(currentlyLoadedPlugins).includes(plugin.pluginId)){
            status = PluginStatus.Enabled
        } else if (markedForDeletionPlugins.has(plugin.pluginId)) {
            status = PluginStatus.MarkedForDeletion
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