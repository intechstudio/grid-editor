import path from "path";
import fs from "fs";
import { MessagePortMain } from "electron/main";
import AdmZip from "adm-zip";
import os from "os";
import util from "util";
import fetch from "node-fetch";
import semver from "semver";
import chokidar from "chokidar";

enum PackageStatus {
  Uninstalled = "Uninstalled",
  Downloading = "Downloading",
  Downloaded = "Downloaded",
  Enabled = "Enabled",
  MarkedForDeletion = "MarkedForDeletion",
}

let packageFolder: string = "";
let editorVersion: string = "";

process.parentPort.on("message", async (e) => {
  switch (e.data.type) {
    case "init": {
      console.log(`Initialize Package Manager...`);
      editorVersion = e.data.version;

      packageFolder = e.data.packageFolder;
      if (!fs.existsSync(packageFolder)) {
        fs.mkdirSync(packageFolder, { recursive: true });
      }
      startPackageDirectoryWatcher(packageFolder);

      const port = e.ports[0];
      setPackageManagerMessagePort(port);
      break;
    }
    case "set-new-message-port": {
      const port = e.ports[0];
      setPackageManagerMessagePort(port);
      break;
    }
    case "refresh-packages": {
      notifyListener();
      break;
    }
    case "stop-package-manager": {
      stopPackageManager();
      break;
    }
    case "create-package-message-port": {
      if (!currentlyLoadedPackages[e.data.id]) {
        messagePort.postMessage({
          type: "debug-error",
          message:
            "Package not loaded " +
            e.data.id +
            ` ${Object.keys(currentlyLoadedPackages)}`,
        });
        break;
      }
      await currentlyLoadedPackages[e.data.id].addMessagePort(
        e.ports?.[0],
        e.data.senderId,
      );
      break;
    }
    default: {
      console.log(`Package Manager: Unknown message type of ${e.data.type}`);
    }
  }
});

const availablePackages = {
  "package-active-win": {
    name: "Active Window",
    description: "Short description of Active Window package",
    gitHubRepositoryOwner: "intechstudio",
    gitHubRepositoryName: "package-active-win",
  },
};

const currentlyLoadedPackages = {};
const haveBeenLoadedPackages = new Set<string>();
const markedForDeletionPackages = new Set<string>();
const downloadingPackages = new Set<string>();

let messagePort: MessagePortMain;

function setPackageManagerMessagePort(port: MessagePortMain) {
  messagePort = port;
  messagePort.on("message", async (event) => {
    try {
      const data = event.data;
      switch (data.type) {
        case "load-package":
          await loadPackage(data.id, data.payload);
          break;
        case "unload-package":
          await unloadPackage(data.id);
          break;
        case "download-package":
          await downloadPackage(data.id);
          break;
        case "uninstall-package":
          await uninstallPackage(data.id);
          break;
        case "refresh-package-list":
          await notifyListener();
          break;
        case "send-to-package":
          //... send data.message through to each plugin for dedicated processing
          // add teh following to a codeblock: package_send("package_name", 123.3, 22, "hello")
          let args = JSON.parse(`[${data.message}]`);
          let packageId = args.shift();
          if (!currentlyLoadedPackages[packageId]) {
            messagePort.postMessage({
              type: "debug-error",
              message:
                "Package not loaded " +
                packageId +
                ` ${Object.keys(currentlyLoadedPackages)}`,
            });
            break;
          }
          await currentlyLoadedPackages[packageId].sendMessage(args);
          break;
        case "create-package-message-port":
          if (!currentlyLoadedPackages[data.id]) {
            messagePort.postMessage({
              type: "debug-error",
              message:
                "Package not loaded " +
                data.id +
                ` ${Object.keys(currentlyLoadedPackages)}`,
            });
            break;
          }
          await currentlyLoadedPackages[data.id].addMessagePort(
            event.ports?.[0],
            data.senderId,
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

async function stopPackageManager() {
  for (let packageName of Object.keys(currentlyLoadedPackages)) {
    await currentlyLoadedPackages[packageName].unloadPackage();
    delete currentlyLoadedPackages[packageName];
  }
  if (messagePort) {
    messagePort.close();
  }
  process.parentPort.postMessage({ type: "shutdown-complete" });
}

async function loadPackage(packageName: string, persistedData: any) {
  try {
    if (currentlyLoadedPackages[packageName]) {
      return;
    }

    const packageDirectory = path.join(packageFolder, packageName);
    const _package = require(packageDirectory);
    await _package.loadPackage(
      {
        sendMessageToRuntime: (payload) => {
          messagePort.postMessage(
            {
              type: "package-action",
              packageId: packageName,
              ...payload,
            },
          );
        },
        sendMessageToProcess: (payload) => {
          process.parentPort.postMessage(
            {
              packageId: packageName,
              ...payload,
            }
          )
        }
      },
      persistedData
    );
    currentlyLoadedPackages[packageName] = _package;
    haveBeenLoadedPackages.add(packageName);
    notifyListener();
  } catch (e) {
    messagePort.postMessage({
      type: "package-error",
      error: e.message,
    });
  }
}

async function unloadPackage(packageName: string) {
  if (currentlyLoadedPackages[packageName]) {
    await currentlyLoadedPackages[packageName].unloadPackage();
    delete currentlyLoadedPackages[packageName];
    notifyListener();
  }
}

async function downloadPackage(packageName: string) {
  if (markedForDeletionPackages.has(packageName)) {
    markedForDeletionPackages.delete(packageName);
    notifyListener();
    return;
  }

  if (downloadingPackages.has(packageName)) return;
  downloadingPackages.add(packageName);
  notifyListener();

  const gitHubRepositoryName =
    availablePackages[packageName].gitHubRepositoryName;
  const gitHubRepositoryOwner =
    availablePackages[packageName].gitHubRepositoryOwner;

  try {
    const packageReleasesResponse = await fetch(
      `https://api.github.com/repos/${gitHubRepositoryOwner}/${gitHubRepositoryName}/releases`,
      {
        method: "GET",
        headers: {
          "User-Agent": "Grid Editor",
        },
      }
    );
    const packageReleases = await packageReleasesResponse.json();
    const compatibleRelease = packageReleases.find((e) => {
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
    const filePath = path.join(packageFolder, `${packageName}.zip`);
    const fileStream = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      try {
        fileStream.on("error", (err) => {
          reject(err);
        });
        fileStream.on("finish", () => {
          fileStream.close();
          resolve(null);
        });
        response.body.on("error", (err) => {
          fileStream.close();
          reject(err);
        });
        response.body.pipe(fileStream);
      } catch (e) {
        reject(e);
      }
    });

    const zip = new AdmZip(filePath);
    zip.extractAllTo(path.join(packageFolder, packageName), true, true);
    fs.unlinkSync(filePath);
  } catch (e) {
    messagePort.postMessage({ type: "debug-error", message: e.message });
  } finally {
    downloadingPackages.delete(packageName);
    notifyListener();
  }
}

async function uninstallPackage(packageName: string) {
  if (currentlyLoadedPackages[packageName]) {
    currentlyLoadedPackages[packageName].unloadPackage();
    delete currentlyLoadedPackages[packageName];
  }
  if (haveBeenLoadedPackages.has(packageName)) {
    markedForDeletionPackages.add(packageName);
    notifyListener();
  } else {
    const packagePath = path.join(packageFolder, packageName);
    fs.rm(packagePath, { recursive: true }, notifyListener);
  }
}

async function notifyListener() {
  const packages = await getAvailablePackages();
  messagePort.postMessage({ type: "packages", packages: packages });
}

async function getInstalledPackages(): Promise<
  {
    packageId: string;
    packageName: string;
    packagePreferenceHtml?: string;
  }[]
> {
  if (!fs.existsSync(packageFolder)) {
    return [];
  }
  const readdir = util.promisify(fs.readdir);
  const folders = await readdir(packageFolder, { withFileTypes: true });
  return Promise.all(
    folders
      .filter(
        (folder) =>
          folder.isDirectory() &&
          !folder.name.toLowerCase().includes("ds_store")
      )
      .map(async (folder) => {
        const packageId = folder.name;
        const packagePath = path.join(packageFolder, folder.name);

        let packageName: string | undefined = undefined;
        let packagePreferenceHtml: string | undefined = undefined;
        if (fs.statSync(packagePath).isDirectory()) {
          const packageJsonPath = path.join(packagePath, "package.json");
          if (fs.existsSync(packageJsonPath)) {
            const packageJson = require(packageJsonPath);
            packageName = packageJson.description;
            const preferenceRelativePath = packageJson.grid_editor?.preference;
            if (preferenceRelativePath) {
              const preferencePath = path.join(
                packagePath,
                preferenceRelativePath
              );
              const readFile = util.promisify(fs.readFile);
              packagePreferenceHtml = await readFile(preferencePath, "utf-8");
              //packagePreferenceHtml = result.js.code;
            }
          }
        }
        packageName = packageName ?? packageId;
        return {
          packageId: packageId,
          packageName: packageName,
          packagePreferenceHtml: packagePreferenceHtml,
        };
      })
  );
}

function getPackageStatus(
  packageId: string,
  installedPackages: { packageId: string }[]
): PackageStatus {
  if (Object.keys(currentlyLoadedPackages).includes(packageId)) {
    return PackageStatus.Enabled;
  } else if (markedForDeletionPackages.has(packageId)) {
    return PackageStatus.MarkedForDeletion;
  } else if (
    installedPackages.filter((e) => e.packageId === packageId).length > 0
  ) {
    return PackageStatus.Downloaded;
  } else if (downloadingPackages.has(packageId)) {
    return PackageStatus.Downloading;
  } else {
    return PackageStatus.Uninstalled;
  }
}

async function getAvailablePackages() {
  let installedPackages = await getInstalledPackages();

  const packageList: {
    id: string;
    name: string;
    status: PackageStatus;
    preferenceHtml?: string;
  }[] = [];
  for (const _package of installedPackages) {
    if (packageList.filter((e) => e.id === _package.packageId).length > 0)
      continue;

    packageList.push({
      id: _package.packageId,
      name: _package.packageName,
      status: getPackageStatus(_package.packageId, installedPackages),
      preferenceHtml: _package.packagePreferenceHtml,
    });
  }
  Object.entries(availablePackages).forEach(([key, entry]) => {
    if (packageList.filter((e) => e.id === key).length > 0) return;

    packageList.push({
      id: key,
      name: entry.name,
      status: getPackageStatus(key, installedPackages),
    });
  });
  return packageList;
}

let directoryWatcher: any = null;

function startPackageDirectoryWatcher(path: string): void {
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
