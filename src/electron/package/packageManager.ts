import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import os from "os";
import util from "util";
import fetch from "node-fetch";
import semver from "semver";
import chokidar from "chokidar";
import configuration from "../../../configuration.json";
import Progress from "node-fetch-progress";
import yauzl from "yauzl";
import { Transform } from "stream";

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

let packageFolder: string = "";
let editorVersion: string = "";

const recommendedGithubPackageList: Map<string, GithubPackage> = new Map(
  Object.entries(configuration.RECOMMENDED_PACKAGES),
);
let customGithubPackageList: Map<string, GithubPackage> = new Map();
let localPackages: Map<string, string> = new Map();

let packageInstallProgress: Map<string, number> = new Map();

process.parentPort.on("message", async (e) => {
  try {
    const data = e.data;
    switch (e.data.type) {
      case "init": {
        editorVersion = e.data.version;
        packageFolder = e.data.packageFolder;
        if (!fs.existsSync(packageFolder)) {
          fs.mkdirSync(packageFolder, { recursive: true });
        }

        customGithubPackageList = new Map(
          Object.entries(e.data.githubPackages),
        );
        localPackages = new Map(Object.entries(e.data.localPackages));

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
          e.data.senderId,
        );
        break;
      }
      case "load-package":
        await loadPackage(data.id, data.payload);
        break;
      case "restart-package":
        if (currentlyLoadedPackages[data.id]) {
          await unloadPackage(data.id);
          await loadPackage(data.id, data.payload);
        }
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
      case "remove-package":
        await removePackage(data.id);
        break;
      case "refresh-package-list":
        await refreshInstalledPackagesCache();
        break;
      case "add-local-package":
        await addLocalPackage(data.rootPath);
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
    "UNCAUGHT PACKAGE MANAGER EXCEPTION, TRYING TO DISABLE PACKAGE AND RESTART",
  );
  console.log({ err, origin });
  process.parentPort.postMessage({ type: "shutdown-complete" });
  for (let packageName of Object.keys(currentlyLoadedPackages)) {
    if (err.stack.includes(packageName)) {
      let packageIndex = currentPackageList.findIndex(
        (value) => value.id == packageName,
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
  process.parentPort?.postMessage({
    type: "packages",
    packages: currentPackageList,
  });
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
  try {
    if (currentlyLoadedPackages[packageName]) {
      return;
    }

    const packageDirectory: string =
      localPackages.get(packageName) ?? path.join(packageFolder, packageName);

    let name = require.resolve(packageDirectory);
    delete require.cache[name];

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
      persistedData,
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
      e.name.includes(platform),
    ).browser_download_url;
    const response = await fetch(url);
    
    try{
      const progress = new Progress(response, {throttle: 200});
      progress.on('progress', (p) => {
        packageInstallProgress.set(packageName, p.progress / 2); //Goes to 0.5 for downloading
        notifyListener();
      })
    } catch(e) {
      console.error(e);
      packageInstallProgress.delete(packageName);
      throw e;
    }

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

    let unzipResolve: (value: unknown) => void;
    let unzipReject: (reason: any) => void; 
    let unzipPromise = new Promise((res, rej) => {
      unzipResolve = res;
      unzipReject = rej;
    })
    yauzl.open(filePath, {lazyEntries: true}, function(err, zipfile) {
      if (err) unzipReject(err);

      let rootFolder = path.join(packageFolder, packageName);
      let currentEntryCount = 0;
      let totalEntryCount = zipfile.entryCount;

      function incrementEntryCount(){
        currentEntryCount++;
        let newValue = 0.5 + 0.5 * Math.min(currentEntryCount / totalEntryCount, 1);
        let oldValue = packageInstallProgress.get(packageName);

        if (oldValue && newValue !== 1 && newValue - oldValue < 0.01){
          return;
        }

        packageInstallProgress.set(packageName, 0.5 + 0.5 * Math.min(currentEntryCount / totalEntryCount, 1));
        notifyListener();
      }

      // track when we've closed all our file handles
      var handleCount = 0;
      function incrementHandleCount() {
        handleCount++;
      }
      function decrementHandleCount() {
        handleCount--;
        if (handleCount === 0) {
          console.log("all input and output handles closed");
          unzipResolve(null);
        }
      }

      incrementHandleCount();
      zipfile.on("close", function() {
        console.log("closed input file");
        decrementHandleCount();
      });

      function mkdirp(dir, cb) {
        if (dir === ".") return cb();
        fs.stat(dir, function(err) {
          if (err == null) return cb(); // already exists

          var parent = path.dirname(dir);
          mkdirp(parent, function() {
            //console.log(dir.replace(/\/$/, "") + "/\n");
            fs.mkdir(dir, cb);
          });
        });
      }

      zipfile.readEntry();
      zipfile.on("entry", function(entry) {
        if (/\/$/.test(entry.fileName)) {
          // directory file names end with '/'
          mkdirp(path.join(rootFolder, entry.fileName), function() {
            if (err) unzipReject(err);
            zipfile.readEntry();
            incrementEntryCount();
          });
        } else {
          // ensure parent directory exists
          mkdirp(path.join(rootFolder, path.dirname(entry.fileName)), function() {
            zipfile.openReadStream(entry, function(err, readStream) {
              if (err) unzipReject(err);

              var writeStream = fs.createWriteStream(path.join(rootFolder, entry.fileName));
              incrementHandleCount();
              writeStream.on("close", decrementHandleCount);
              readStream.pipe(writeStream).on("finish", () => { zipfile.readEntry() });
              incrementEntryCount();
            });
          });
        }
      });
    });
    await unzipPromise;
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
    process.parentPort?.postMessage({
      type: "debug-error",
      message: e.message,
    });
  } finally {
    downloadingPackages.delete(packageName);
    packageInstallProgress.delete(packageName);
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

async function removePackage(packageName: string) {
  unloadPackage(packageName);
  if (localPackages.has(packageName)) {
    localPackages.delete(packageName);
    process.parentPort?.postMessage({
      type: "remove-local-package",
      id: packageName,
    });
    notifyListener();
  }
  if (customGithubPackageList.has(packageName)) {
    customGithubPackageList.delete(packageName);
    process.parentPort?.postMessage({
      type: "remove-github-package",
      id: packageName,
    });
    notifyListener();
  }
}

async function addLocalPackage(rootPath: string) {
  const packageJsonPath = path.join(rootPath, "package.json");
  const readfile = util.promisify(fs.readFile);
  if (fs.existsSync(packageJsonPath)) {
    const packageFile = await readfile(packageJsonPath);
    const packageJson = JSON.parse(packageFile.toString());
    const packageId = packageJson.name;
    localPackages.set(packageId, rootPath);
    process.parentPort?.postMessage({
      type: "persist-local-package",
      id: packageId,
      rootPath: rootPath,
    });
    notifyListener();
  } else {
    process.parentPort?.postMessage({
      type: "show-message",
      message: `Couldn't find package.json file in ${rootPath}!`,
      messageType: "fail",
    });
  }
}

function notifyListener() {
  const packages = getAvailablePackages();
  process.parentPort?.postMessage({ type: "packages", packages: packages });
}

let cachedInstalledPackages : {
    packageId: string;
    packageName: string;
    componentsPath?: string;
    preferenceComponent?: string;
    packageVersion?: string;
    loadable: boolean;
  }[] = [];

async function refreshInstalledPackagesCache() {
  cachedInstalledPackages = await getInstalledPackages();
  notifyListener();
}

async function getInstalledPackages(): Promise<
  {
    packageId: string;
    packageName: string;
    componentsPath?: string;
    preferenceComponent?: string;
    packageVersion?: string;
    loadable: boolean;
  }[]
> {
  if (!fs.existsSync(packageFolder)) {
    return [];
  }
  const readdir = util.promisify(fs.readdir);
  const readfile = util.promisify(fs.readFile);
  const opendir = util.promisify(fs.opendir);
  const folders = await readdir(packageFolder, { encoding: "utf-8" });
  return Promise.all(
    [...folders, ...localPackages.values()]
      .filter(
        (folder) =>
          path.extname(folder) === "" &&
          !folder.toLowerCase().includes("ds_store"),
      )
      .map(async (folder) => {
        let packageId: string | undefined = undefined;
        let packagePath = folder;
        if (!path.isAbsolute(folder)) {
          packageId = folder;
          packagePath = path.join(packageFolder, folder);
        }
        let packageName: string | undefined = undefined;
        let componentsPath: string | undefined = undefined;
        let preferenceComponent: string | undefined = undefined;
        let packageVersion: string | undefined = undefined;
        let loadable: boolean = false;
        const packageJsonPath = path.join(packagePath, "package.json");
        if (fs.existsSync(packageJsonPath)) {
          const packageFile = await readfile(packageJsonPath);
          const packageJson = JSON.parse(packageFile.toString());
          if (packageId === undefined) {
            packageId = packageJson.name;
          }
          packageName = packageJson.description;
          packageVersion = packageJson.version;
          if (packageJson.grid_editor?.componentsPath) {
            componentsPath = path.join(
              packageId,
              packageJson.grid_editor?.componentsPath,
            );
          }
          preferenceComponent = packageJson.grid_editor?.preferenceComponent;
          loadable = packageJson.main !== undefined;
        }

        packageName = packageName ?? packageId;
        return {
          packageId,
          packageName,
          componentsPath,
          preferenceComponent,
          packageVersion,
          loadable,
        };
      }),
  );
}

function getPackageStatus(
  packageId: string,
  installedPackages: { packageId: string }[],
): PackageStatus {
  if (Object.keys(currentlyLoadedPackages).includes(packageId)) {
    return PackageStatus.Enabled;
  } else if (downloadingPackages.has(packageId)) {
    return PackageStatus.Downloading;
  } else if (
    installedPackages.filter((e) => e.packageId === packageId).length > 0
  ) {
    return PackageStatus.Downloaded;
  } else {
    return PackageStatus.Uninstalled;
  }
}

function getAvailablePackages() {
  let installedPackages = cachedInstalledPackages;

  const packageList: {
    id: string;
    name: string;
    status: PackageStatus;
    componentsPath?: string;
    preferenceComponent?: string;
    packageVersion?: string;
    removable: boolean;
    uninstallable: boolean;
    loadable: boolean;
    canUpdate: boolean;
    installProgress?: number;
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
      removable:
        !recommendedGithubPackageList.has(_package.packageId) ||
        localPackages.has(_package.packageId),
      loadable: _package.loadable,
      uninstallable: !localPackages.has(_package.packageId),
      canUpdate:
        _package.packageVersion != undefined &&
        githubPackageList.get(_package.packageId)?.version != undefined &&
        semver.gt(
          githubPackageList.get(_package.packageId)!.version!,
          _package.packageVersion,
        ),
      installProgress: packageInstallProgress.get(_package.packageId),
    });
  }
  githubPackageList.forEach((entry, key) => {
    if (packageList.filter((e) => e.id === key).length > 0) return;

    packageList.push({
      id: key,
      name: entry.name,
      status: getPackageStatus(key, installedPackages),
      canUpdate: false,
      uninstallable: true,
      removable: !recommendedGithubPackageList.has(key),
      loadable: false,
      installProgress: packageInstallProgress.get(key),
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
    },
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

function startPackageDirectoryWatcher(path: string): void {
  directoryWatcher = chokidar.watch(path, {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true, // Ignore initial events on startup
    depth: 1, // Levels of subdirectories to watch //TODO: Increasing adds significant delay in message processing
  });

  directoryWatcher
    .on("add", refreshInstalledPackagesCache)
    .on("change", refreshInstalledPackagesCache)
    .on("unlink", refreshInstalledPackagesCache)
    .on("addDir", refreshInstalledPackagesCache)
    .on("unlinkDir", refreshInstalledPackagesCache)
    .on("ready", refreshInstalledPackagesCache);
}
