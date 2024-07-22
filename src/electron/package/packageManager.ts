import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import os from "os";
import util from "util";
import fetch from "node-fetch";
import semver from "semver";
import chokidar from "chokidar";
import configuration from "../../../configuration.json";

interface GithubPackage {
  name: string;
  gitHubRepositoryOwner: string;
  gitHubRepositoryName: string;
  version?: string;
}

enum PackageStatus {
  Uninstalled = "Uninstalled",
  Downloading = "Downloading",
  Downloaded = "Downloaded",
  Enabled = "Enabled",
}

let developerModeEnabled = false;
let packageFolder: string = "";
let editorVersion: string = "";

const recommendedGithubPackageList: Map<string, GithubPackage> = new Map(
  Object.entries(configuration.RECOMMENDED_PACKAGES)
);
let customGithubPackageList: Map<string, GithubPackage> = new Map();

process.parentPort.on("message", async (e) => {
  try {
    const data = e.data;
    switch (e.data.type) {
      case "init": {
        editorVersion = e.data.version;
        developerModeEnabled = e.data.packageDeveloper ?? false;
        packageFolder = e.data.packageFolder;
        if (!fs.existsSync(packageFolder)) {
          fs.mkdirSync(packageFolder, { recursive: true });
        }

        customGithubPackageList = new Map(
          Object.entries(e.data.githubPackages)
        );

        startPackageDirectoryWatcher(packageFolder);
        updateGithubPackages();
        if (e.data.updatePackageOnStartName) {
          await downloadPackage(e.data.updatePackageOnStartName);
        }
        break;
      }
      case "refresh-packages": {
        updateGithubPackages();
        break;
      }
      case "stop-package-manager": {
        await stopPackageManager();
        process.parentPort.postMessage({ type: "shutdown-complete" });
        break;
      }
      case "set-package-developer": {
        developerModeEnabled = e.data.value ?? false;
        break;
      }
      case "create-package-message-port": {
        if (!currentlyLoadedPackages[e.data.id]) {
          process.parentPort?.postMessage({
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
          e.data.senderId
        );
        break;
      }
      case "load-package":
        await loadPackage(data.id, data.payload);
        break;
      case "unload-package":
        await unloadPackage(data.id);
        break;
      case "download-package":
        await downloadPackage(data.id);
        break;
      case "update-package":
        await updatePackage(data.id);
        break;
      case "uninstall-package":
        await uninstallPackage(data.id);
        break;
      case "refresh-package-list":
        await notifyListener();
        break;
      case "add-github-repository":
        customGithubPackageList.set(data.id, {
          name: data.packageName,
          gitHubRepositoryOwner: data.gitHubRepositoryOwner,
          gitHubRepositoryName: data.gitHubRepositoryName,
        });
        await updateGithubPackages();
        if (customGithubPackageList.has(data.id)) {
          process.parentPort?.postMessage({
            type: "persist-github-package",
            id: data.id,
            packageName: data.packageName,
            gitHubRepositoryOwner: data.gitHubRepositoryOwner,
            gitHubRepositoryName: data.gitHubRepositoryName,
          });
        }
        break;
      case "send-to-package":
        //... send data.message through to each plugin for dedicated processing
        // add the following to a codeblock: package_send("package_name", 123.3, 22, "hello")
        let args = JSON.parse(`[${data.message}]`);
        let packageId = args.shift();
        if (!currentlyLoadedPackages[packageId]) {
          process.parentPort?.postMessage({
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
      default: {
        console.log(`Package Manager: Unknown message type of ${e.data.type}`);
      }
    }
  } catch (e) {
    console.log(e);
  }
});

process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.log(
    "UNCAUGHT PACKAGE MANAGER EXCEPTION, TRYING TO DISABLE PACKAGE AND RESTART"
  );
  console.log({ err, origin });
  process.parentPort.postMessage({ type: "shutdown-complete" });
  for (let packageName of Object.keys(currentlyLoadedPackages)) {
    if (err.stack.includes(packageName)) {
      let packageIndex = currentPackageList.findIndex(
        (value) => value.id == packageName
      );
      console.log({ packageIndex });
      if (packageIndex != -1) {
        currentPackageList[packageIndex].status = PackageStatus.Downloaded;
        process.parentPort?.postMessage({
          type: "debug-error",
          error: `Received uncaught exception from package: ${packageName}, error: ${err}`,
        });
      }
    }
  }
  process.parentPort?.postMessage({ type: "packages", packages: currentPackageList });
});

const currentlyLoadedPackages = {};
const haveBeenLoadedPackages = new Set<string>();
const downloadingPackages = new Set<string>();
let currentPackageList = [];

async function stopPackageManager() {
  for (let packageName of Object.keys(currentlyLoadedPackages)) {
    await currentlyLoadedPackages[packageName].unloadPackage();
    delete currentlyLoadedPackages[packageName];
  }
}

async function loadPackage(packageName: string, persistedData: any) {
  console.log(`ENABLING PACKAGE: ${packageName}`);
  try {
    if (currentlyLoadedPackages[packageName]) {
      return;
    }

    const packageDirectory = path.join(packageFolder, packageName);
    const _package = require(packageDirectory);
    await _package.loadPackage(
      {
        sendMessageToEditor: (payload) => {
          process.parentPort?.postMessage({
            packageId: packageName,
            ...payload,
          });
        },
      },
      persistedData
    );
    currentlyLoadedPackages[packageName] = _package;
    haveBeenLoadedPackages.add(packageName);
    notifyListener();
  } catch (e) {
    process.parentPort?.postMessage({
      type: "debug-error",
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
  if (downloadingPackages.has(packageName)) return;
  downloadingPackages.add(packageName);
  notifyListener();

  try {
    const compatibleRelease = await getCompatibleGithubRelease(packageName);
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
    if (customGithubPackageList.has(packageName)) {
      customGithubPackageList.delete(packageName);
      process.parentPort?.postMessage({
        type: "show-message",
        message: "Couldn't find package archive, removed from list!",
        messageType: "fail",
      });
    }
    process.parentPort?.postMessage({
      type: "remove-github-package",
      id: packageName,
    });
    process.parentPort?.postMessage({ type: "debug-error", message: e.message });
  } finally {
    downloadingPackages.delete(packageName);
    notifyListener();
  }
}

async function updatePackage(packageName: string) {
  if (currentlyLoadedPackages[packageName]) {
    currentlyLoadedPackages[packageName].unloadPackage();
    delete currentlyLoadedPackages[packageName];
  }
  const packagePath = path.join(packageFolder, packageName);
  if (haveBeenLoadedPackages.has(packageName)) {
    await stopPackageManager();
    process.parentPort.postMessage({
      type: "update-package-folder",
      path: packagePath,
      packageName: packageName,
    });
  } else {
    fs.rm(packagePath, { recursive: true }, () => {
      downloadPackage(packageName);
    });
  }
}

async function uninstallPackage(packageName: string) {
  if (currentlyLoadedPackages[packageName]) {
    currentlyLoadedPackages[packageName].unloadPackage();
    delete currentlyLoadedPackages[packageName];
  }
  if (customGithubPackageList.has(packageName)) {
    customGithubPackageList.delete(packageName);
    process.parentPort?.postMessage({
      type: "remove-github-package",
      id: packageName,
    });
  }
  const packagePath = path.join(packageFolder, packageName);
  if (haveBeenLoadedPackages.has(packageName)) {
    await stopPackageManager();
    process.parentPort.postMessage({
      type: "delete-package-folder",
      path: packagePath,
    });
  } else {
    fs.rm(packagePath, { recursive: true }, notifyListener);
  }
}

async function notifyListener() {
  const packages = await getAvailablePackages();
  console.log("SENDING PACKAGES");
  process.parentPort?.postMessage({ type: "packages", packages: packages });
}

async function getInstalledPackages(): Promise<
  {
    packageId: string;
    packageName: string;
    componentsPath?: string;
    preferenceComponent?: string;
    packageVersion?: string;
  }[]
> {
  if (!fs.existsSync(packageFolder)) {
    return [];
  }
  const readdir = util.promisify(fs.readdir);
  const readfile = util.promisify(fs.readFile);
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
        let componentsPath: string | undefined = undefined;
        let preferenceComponent: string | undefined = undefined;
        let packageVersion: string | undefined = undefined;
        if (fs.statSync(packagePath).isDirectory()) {
          const packageJsonPath = path.join(packagePath, "package.json");
          if (fs.existsSync(packageJsonPath)) {
            const packageFile = await readfile(packageJsonPath);
            const packageJson = JSON.parse(packageFile.toString());
            packageName = packageJson.description;
            packageVersion = packageJson.version;
            if (packageJson.grid_editor?.componentsPath){
              componentsPath = path.join(folder.name, packageJson.grid_editor?.componentsPath);
            }
            preferenceComponent = packageJson.grid_editor?.preferenceComponent;
          }
        }
        packageName = packageName ?? packageId;
        return {
          packageId: packageId,
          packageName: packageName,
          componentsPath: componentsPath,
          preferenceComponent: preferenceComponent,
          packageVersion: packageVersion,
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
    componentsPath?: string;
    preferenceComponent?: string;
    packageVersion?: string;
    canUpdate: boolean;
  }[] = [];
  let githubPackageList = new Map([
    ...recommendedGithubPackageList.entries(),
    ...customGithubPackageList.entries(),
  ]);
  for (const _package of installedPackages) {
    if (packageList.filter((e) => e.id === _package.packageId).length > 0)
      continue;

    packageList.push({
      id: _package.packageId,
      name: _package.packageName,
      status: getPackageStatus(_package.packageId, installedPackages),
      componentsPath: _package.componentsPath,
      preferenceComponent: _package.preferenceComponent,
      packageVersion: _package.packageVersion,
      canUpdate:
        _package.packageVersion != undefined &&
        githubPackageList.get(_package.packageId)?.version != undefined &&
        semver.gt(
          githubPackageList.get(_package.packageId)!.version!,
          _package.packageVersion
        ),
    });
  }
  githubPackageList.forEach((entry, key) => {
    if (packageList.filter((e) => e.id === key).length > 0) return;

    packageList.push({
      id: key,
      name: entry.name,
      status: getPackageStatus(key, installedPackages),
      canUpdate: false,
    });
  });
  currentPackageList = packageList;
  return packageList;
}

async function updateGithubPackages(forceRefreshVersion: boolean = false) {
  let githubPackageList = new Map([
    ...recommendedGithubPackageList.entries(),
    ...customGithubPackageList.entries(),
  ]);
  try {
    for (const [packageId, githubPackage] of githubPackageList) {
      if (!forceRefreshVersion && githubPackage.version != undefined) continue;

      const compatiblePackage = await getCompatibleGithubRelease(packageId);
      if (!compatiblePackage) {
        customGithubPackageList.delete(packageId);
        continue;
      }

      let version =
        semver.coerce(compatiblePackage.tag_name) ??
        semver.coerce(compatiblePackage.name);
      githubPackage.version = version?.version;
    }
    notifyListener();
  } catch (e) {
    console.log(e);
  }
}

async function getCompatibleGithubRelease(githubPackageName: string) {
  let githubPackageList = new Map([
    ...recommendedGithubPackageList.entries(),
    ...customGithubPackageList.entries(),
  ]);
  let githubPackage = githubPackageList.get(githubPackageName);
  if (!githubPackage) return;
  const packageReleasesResponse = await fetch(
    `https://api.github.com/repos/${githubPackage.gitHubRepositoryOwner}/${githubPackage.gitHubRepositoryName}/releases`,
    {
      method: "GET",
      headers: {
        "User-Agent": "Grid Editor",
      },
    }
  );
  const packageReleases = await packageReleasesResponse.json();
  return (
    packageReleases?.find((e) => {
      const description = e.body;
      const lastLine = description.split("\n").pop() ?? "";
      if (semver.coerce(lastLine)) {
        return !semver.gt(semver.coerce(lastLine)!, editorVersion);
      } else {
        return true;
      }
    }) ?? false
  );
}

let directoryWatcher: any = null;

function restartIfDeveloperMode() {
  if (developerModeEnabled) {
    stopPackageManager();
    process.parentPort.postMessage({ type: "shutdown-complete" });
  }
}

function startPackageDirectoryWatcher(path: string): void {
  directoryWatcher = chokidar.watch(path, {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true, // Ignore initial events on startup
    depth: 1, // Levels of subdirectories to watch //TODO: Increasing adds significant delay in message processing
  });

  directoryWatcher
    .on("add", function (path: string) {
      notifyListener();
      restartIfDeveloperMode();
    })
    .on("change", function (path: string) {
      notifyListener();
      restartIfDeveloperMode();
    })
    .on("unlink", function (path: string) {
      notifyListener();
      restartIfDeveloperMode();
    })
    .on("addDir", function (path: string) {
      notifyListener();
      restartIfDeveloperMode();
    })
    .on("unlinkDir", function (path: string) {
      notifyListener();
      restartIfDeveloperMode();
    })
    .on("ready", function (path: string) {
      notifyListener();
    });
}
