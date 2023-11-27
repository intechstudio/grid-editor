import path from "path";
import fs from "fs";
import { MessagePortMain } from "electron/main";
import AdmZip from "adm-zip";
import os from "os";
import util from "util";
import fetch from "node-fetch";
import semver from "semver";
import chokidar from "chokidar";

enum PluginStatus {
  Uninstalled = "Uninstalled",
  Downloading = "Downloading",
  Downloaded = "Downloaded",
  Enabled = "Enabled",
  MarkedForDeletion = "MarkedForDeletion",
}

let pluginFolder: string = "";
let editorVersion: string = "";

process.parentPort.on("message", (e) => {
  switch (e.data.type) {
    case "init": {
      console.log(`Initialize Plugin Manager...`);
      editorVersion = e.data.version;

      pluginFolder = e.data.pluginFolder;
      if (!fs.existsSync(pluginFolder)) {
        fs.mkdirSync(pluginFolder, { recursive: true });
      }
      startPluginDirectoryWatcher(pluginFolder);

      const port = e.ports[0];
      setPluginManagerMessagePort(port);
      break;
    }
    case "set-new-message-port": {
      const port = e.ports[0];
      setPluginManagerMessagePort(port);
      break;
    }
    case "refresh-plugins": {
      notifyListener();
      break;
    }
    default: {
      console.log(`Plugin Manager: Unknown message tpye of ${e.data.type}`);
    }
  }
});

const availablePlugins = {
  "plugin-active-win": {
    name: "Active Window",
    description: "Short description of Active Window plugin",
    gitHubRepositoryOwner: "intechstudio",
    gitHubRepositoryName: "plugin-active-win",
  },
};

const currentlyLoadedPlugins = {};
const haveBeenLoadedPlugins = new Set<string>();
const markedForDeletionPlugins = new Set<string>();
const downloadingPlugins = new Set<string>();

let messagePort: MessagePortMain;

function setPluginManagerMessagePort(port: MessagePortMain) {
  messagePort = port;
  messagePort.on("message", async (event) => {
    try {
      const data = event.data;
      switch (data.type) {
        case "load-plugin":
          await loadPlugin(data.id, data.payload);
          break;
        case "unload-plugin":
          await unloadPlugin(data.id);
          break;
        case "download-plugin":
          await downloadPlugin(data.id);
          break;
        case "uninstall-plugin":
          await uninstallPlugin(data.id);
          break;
        case "refresh-plugin-list":
          await notifyListener();
          break;
        case "create-plugin-message-port":
          await currentlyLoadedPlugins[data.id].addMessagePort(
            event.ports?.[0]
          );
          break;
      }
    } catch (e) {
      messagePort.postMessage({ type: "debug-error", message: e.message });
    }
  });
  port.start();
  notifyListener();
}

async function loadPlugin(pluginName: string, persistedData: any) {
  try {
    if (currentlyLoadedPlugins[pluginName]) {
      return;
    }

    const pluginDirectory = path.join(pluginFolder, pluginName);
    const plugin = require(pluginDirectory);
    await plugin.loadPlugin(
      {
        sendMessageToRuntime: (payload) => {
          messagePort.postMessage({
            type: "plugin-action",
            pluginId: pluginName,
            ...payload,
          });
        },
      },
      persistedData
    );
    currentlyLoadedPlugins[pluginName] = plugin;
    haveBeenLoadedPlugins.add(pluginName);
    notifyListener();
  } catch (e) {
    messagePort.postMessage({
      type: "plugin-error",
      error: e.message,
    });
  }
}

async function unloadPlugin(pluginName: string) {
  if (currentlyLoadedPlugins[pluginName]) {
    await currentlyLoadedPlugins[pluginName].unloadPlugin();
    delete currentlyLoadedPlugins[pluginName];
    notifyListener();
  }
}

async function downloadPlugin(pluginName: string) {
  if (markedForDeletionPlugins.has(pluginName)) {
    markedForDeletionPlugins.delete(pluginName);
    notifyListener();
    return;
  }

  if (downloadingPlugins.has(pluginName)) return;
  downloadingPlugins.add(pluginName);
  notifyListener();

  const gitHubRepositoryName =
    availablePlugins[pluginName].gitHubRepositoryName;
  const gitHubRepositoryOwner =
    availablePlugins[pluginName].gitHubRepositoryOwner;

  try {
    const pluginReleasesResponse = await fetch(
      `https://api.github.com/repos/${gitHubRepositoryOwner}/${gitHubRepositoryName}/releases`,
      {
        method: "GET",
        headers: {
          "User-Agent": "Grid Editor",
        },
      }
    );
    const pluginReleases = await pluginReleasesResponse.json();
    const compatibleRelease = pluginReleases.find((e) => {
      const description = e.body;
      const lastLine = description.split("\n").pop() ?? "";
      if (semver.valid(lastLine)) {
        return !semver.gt(lastLine, editorVersion);
      } else {
        return true;
      }
    });
    if (!compatibleRelease) return;

    const assets = compatibleRelease.assets;

    let platform = "macos";
    switch (os.platform()) {
      case "win32":
        platform = "windows";
        break;
      case "darwin":
        platform = "macos";
        break;
      default:
        platform = "ubuntu";
        break;
    }

    const url = assets.find((e) =>
      e.name.includes(platform)
    ).browser_download_url;
    const response = await fetch(url);
    const filePath = path.join(pluginFolder, `${pluginName}.zip`);
    const fileStream = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on("error", (err) => {
        fileStream.close();
        reject(err);
      });
      fileStream.on("finish", () => {
        fileStream.close();
        resolve(null);
      });
    });

    const zip = new AdmZip(filePath);
    zip.extractAllTo(path.join(pluginFolder, pluginName), true, true);
    fs.unlinkSync(filePath);
  } catch (e) {
    messagePort.postMessage({ type: "debug-error", message: e.message });
  } finally {
    downloadingPlugins.delete(pluginName);
    notifyListener();
  }
}

async function uninstallPlugin(pluginName: string) {
  if (currentlyLoadedPlugins[pluginName]) {
    currentlyLoadedPlugins[pluginName].unloadPlugin();
    delete currentlyLoadedPlugins[pluginName];
  }
  if (haveBeenLoadedPlugins.has(pluginName)) {
    markedForDeletionPlugins.add(pluginName);
    notifyListener();
  } else {
    const pluginPath = path.join(pluginFolder, pluginName);
    fs.rm(pluginPath, { recursive: true }, notifyListener);
  }
}

async function notifyListener() {
  const plugins = await getAvailablePlugins();
  messagePort.postMessage({ type: "plugins", plugins });
}

async function getInstalledPlugins(): Promise<
  {
    pluginId: string;
    pluginName: string;
    pluginPreferenceHtml?: string;
  }[]
> {
  const readdir = util.promisify(fs.readdir);
  const folders = await readdir(pluginFolder);
  return Promise.all(
    folders
      .filter((folder) => !folder.toLowerCase().includes("ds_store"))
      .map(async (folder) => {
        const pluginId = folder;
        const pluginPath = path.join(pluginFolder, folder);

        let pluginName: string | undefined = undefined;
        let pluginPreferenceHtml: string | undefined = undefined;
        if (fs.statSync(pluginPath).isDirectory()) {
          const packageJsonPath = path.join(pluginPath, "package.json");
          if (fs.existsSync(packageJsonPath)) {
            const packageJson = require(packageJsonPath);
            pluginName = packageJson.description;
            const preferenceRelativePath = packageJson.grid_editor.preference;
            if (preferenceRelativePath) {
              const preferencePath = path.join(
                pluginPath,
                preferenceRelativePath
              );
              const readFile = util.promisify(fs.readFile);
              pluginPreferenceHtml = await readFile(preferencePath, "utf-8");
              //pluginPreferenceHtml = result.js.code;
            }
          }
        }
        pluginName = pluginName ?? pluginId;
        return {
          pluginId,
          pluginName,
          pluginPreferenceHtml,
        };
      })
  );
}

function getPluginStatus(
  pluginId: string,
  installedPlugins: { pluginId: string }[]
): PluginStatus {
  if (Object.keys(currentlyLoadedPlugins).includes(pluginId)) {
    return PluginStatus.Enabled;
  } else if (markedForDeletionPlugins.has(pluginId)) {
    return PluginStatus.MarkedForDeletion;
  } else if (
    installedPlugins.filter((e) => e.pluginId === pluginId).length > 0
  ) {
    return PluginStatus.Downloaded;
  } else if (downloadingPlugins.has(pluginId)) {
    return PluginStatus.Downloading;
  } else {
    return PluginStatus.Uninstalled;
  }
}

async function getAvailablePlugins() {
  let installedPlugins = await getInstalledPlugins();

  const pluginList: {
    id: string;
    name: string;
    status: PluginStatus;
    preferenceHtml?: string;
  }[] = [];
  for (const plugin of installedPlugins) {
    if (pluginList.filter((e) => e.id === plugin.pluginId).length > 0) continue;

    pluginList.push({
      id: plugin.pluginId,
      name: plugin.pluginName,
      status: getPluginStatus(plugin.pluginId, installedPlugins),
      preferenceHtml: plugin.pluginPreferenceHtml,
    });
  }
  Object.entries(availablePlugins).forEach(([key, entry]) => {
    if (pluginList.filter((e) => e.id === key).length > 0) return;

    pluginList.push({
      id: key,
      name: entry.name,
      status: getPluginStatus(key, installedPlugins),
    });
  });
  return pluginList;
}

let directoryWatcher: any = null;

function startPluginDirectoryWatcher(path: string): void {
  directoryWatcher = chokidar.watch(path, {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true, // Ignore initial events on startup
    depth: 0, // Only watch the top-level directory
  });

  directoryWatcher
    .on("add", function (path: string) {
      notifyListener();
    })
    .on("change", function (path: string) {
      notifyListener();
    })
    .on("unlink", function (path: string) {
      notifyListener();
    })
    .on("addDir", function (path: string) {
      notifyListener();
    })
    .on("unlinkDir", function (path: string) {
      notifyListener();
    })
    .on("ready", function (path: string) {
      notifyListener();
    });
}
