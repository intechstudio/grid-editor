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

interface RecommendedGithubPackage {
  gitHubRepositoryOwner: string;
  gitHubRepositoryName: string;
}

interface GithubPackageDetails {
  gitHubRepositoryOwner: string;
  gitHubRepositoryName: string;
  version?: string;
  name: string;
  description?: string;
  mainIconPath?: string;
  menuIconPath?: string;
  preferenceComponent?: string;
}

interface EditorPackage {
  name: string;
  svgIcon?: string;
  description: string;
}

let packageFolder: string = "";
let editorVersion: string = "";
let shuttingDown: boolean = false;

const recommendedGithubPackageList: Map<string, RecommendedGithubPackage> =
  new Map(Object.entries(configuration.RECOMMENDED_PACKAGES));
let customGithubPackageList: Map<string, RecommendedGithubPackage> = new Map();
let githubPackageDetails: Map<string, GithubPackageDetails> = new Map();
let localPackages: Map<string, string> = new Map();

let installedPackagesChecked = false;
let githubPackagesChecked = false;

let packageInstallProgress: Map<string, number> = new Map();
let updatingPackages: Set<string> = new Set();

const editorPackages: Map<string, EditorPackage> = new Map(
  Object.entries(configuration.EDITOR_PACKAGES),
);

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

        if (e.data.cachedData) {
          githubPackageDetails = e.data.cachedData.githubPackageDetails;
        }

        startPackageDirectoryWatcher(packageFolder);
        updateGithubPackages();
        if (e.data.updatePackageOnStartName) {
          updatingPackages.add(e.data.updatePackageOnStartName);
          await downloadPackage(e.data.updatePackageOnStartName);
        }
        break;
      }
      case "refresh-packages": {
        updateGithubPackages();
        break;
      }
      case "stop-package-manager": {
        shuttingDown = true;
        await stopPackageManager();
        process.parentPort.postMessage({ type: "shutdown-complete" });
        break;
      }
      case "query-running-packages": {
        let onlyBuiltInPackages = [...currentlyLoadedPackages.keys()].every(
          (e) => editorPackages.has(e),
        );
        process.parentPort.postMessage({
          type: "running-packages-result",
          hasRunningPackage: !onlyBuiltInPackages,
        });
        break;
      }
      case "create-package-message-port": {
        if (!currentlyLoadedPackages.has(e.data.id)) {
          process.parentPort?.postMessage({
            type: "debug-error",
            packageId: e.data.id,
            message:
              "Package not loaded " +
              e.data.id +
              ` ${currentlyLoadedPackages.keys()}`,
          });
          break;
        }
        await currentlyLoadedPackages
          .get(e.data.id)
          .addMessagePort(e.ports?.[0], e.data.senderId);
        break;
      }
      case "load-package":
        await loadPackage(data.id, data.payload);
        break;
      case "restart-package":
        if (currentlyLoadedPackages.get(data.id)) {
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
        await scheduleRefreshInstalledPackages();
        break;
      case "add-local-package":
        await addLocalPackage(data.rootPath);
        break;
      case "add-github-repository":
        customGithubPackageList.set(data.id, {
          gitHubRepositoryOwner: data.gitHubRepositoryOwner,
          gitHubRepositoryName: data.gitHubRepositoryName,
        });
        await updateGithubPackages();
        if (customGithubPackageList.has(data.id)) {
          process.parentPort?.postMessage({
            type: "persist-github-package",
            packageId: data.id,
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
        if (!currentlyLoadedPackages.get(packageId)) {
          process.parentPort?.postMessage({
            type: "debug-error",
            packageId: packageId,
            message:
              "Package not loaded " +
              packageId +
              `${currentlyLoadedPackages.keys()}`,
          });
          break;
        }
        await currentlyLoadedPackages.get(packageId).sendMessage(args);
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
  for (let packageName of currentlyLoadedPackages.keys()) {
    if (err.stack.includes(packageName)) {
      let packageIndex = currentPackageList.findIndex(
        (value) => value.id == packageName,
      );
      if (packageIndex != -1) {
        unloadPackage(currentPackageList[packageIndex].id);
        process.parentPort?.postMessage({
          type: "debug-error",
          packageId: packageName,
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

const currentlyLoadedPackages = new Map<string, any>();
const haveBeenLoadedPackages = new Set<string>();
const downloadingPackages = new Set<string>();
let currentPackageList = [];

async function stopPackageManager() {
  for (let packageName of currentlyLoadedPackages.keys()) {
    await currentlyLoadedPackages.get(packageName).unloadPackage();
    currentlyLoadedPackages.delete(packageName);
  }
  process.parentPort.postMessage({
    type: "cache-temp-data",
    data: {
      githubPackageDetails,
    },
  });
}

async function loadPackage(packageName: string, persistedData: any) {
  try {
    if (currentlyLoadedPackages.has(packageName)) {
      return;
    }

    if (editorPackages.has(packageName)) {
      currentlyLoadedPackages.set(packageName, {
        unloadPackage: async function () {},
      });
    } else {
      const packageDirectory: string =
        localPackages.get(packageName) ?? path.join(packageFolder, packageName);

      let name = require.resolve(packageDirectory);
      delete require.cache[name];

      const _package = require(packageDirectory);
      await _package.loadPackage(
        {
          sendMessageToEditor: (payload) => {
            if (payload.type === "send-package-message") {
              let requestedId = payload.targetPackageId;
              if (!currentlyLoadedPackages.has(requestedId)) {
                return;
              }

              currentlyLoadedPackages.get(requestedId).sendMessage({
                ...payload.message,
                senderPackageId: packageName,
              });
              return;
            } else {
              process.parentPort?.postMessage({
                ...payload,
                packageId: packageName,
              });
            }
          },
        },
        persistedData,
      );
      currentlyLoadedPackages.set(packageName, _package);
      haveBeenLoadedPackages.add(packageName);
    }
    notifyListener();
  } catch (e) {
    process.parentPort?.postMessage({
      packageId: packageName,
      type: "debug-error",
      error: e.message,
    });
  }
}

async function unloadPackage(packageName: string) {
  if (currentlyLoadedPackages.has(packageName)) {
    await currentlyLoadedPackages.get(packageName).unloadPackage();
    currentlyLoadedPackages.delete(packageName);
    notifyListener();
  }
}

async function downloadPackage(packageName: string) {
  if (downloadingPackages.has(packageName)) return;

  // The package:// protocol is registered as a "standard" scheme, so browsers
  // parse the id as a URL host and ASCII-lowercase it before every request.
  // packageName also becomes the extracted folder name on disk (case-sensitive
  // on Linux/macOS), so any uppercase letters in the id make its own
  // components unreachable after install. Reject those ids up front rather
  // than downloading a package that can never load.
  if (packageName !== packageName.toLowerCase()) {
    process.parentPort?.postMessage({
      type: "show-message",
      message: `Can't install "${packageName}": package ids must be lowercase (browsers normalize package:// URLs to lowercase, so an uppercase id can never load its components). Fix the id in its catalog entry.`,
      messageType: "fail",
    });
    return;
  }

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

    try {
      const progress = new Progress(response, { throttle: 200 });
      progress.on("progress", (p) => {
        packageInstallProgress.set(packageName, p.progress / 5); //Goes to 0.2 for downloading
        notifyListener();
      });
    } catch (e) {
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
    });
    yauzl.open(filePath, { lazyEntries: true }, function (err, zipfile) {
      if (err) unzipReject(err);

      let rootFolder = path.join(packageFolder, packageName);
      let currentEntryCount = 0;
      let totalEntryCount = zipfile.entryCount;

      function incrementEntryCount() {
        currentEntryCount++;
        let newValue =
          0.2 + 0.8 * Math.min(currentEntryCount / totalEntryCount, 1);
        let oldValue = packageInstallProgress.get(packageName);

        if (oldValue && newValue !== 1 && newValue - oldValue < 0.01) {
          return;
        }

        packageInstallProgress.set(packageName, newValue);
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
      zipfile.on("close", function () {
        console.log("closed input file");
        decrementHandleCount();
      });

      function mkdirp(dir, cb) {
        if (dir === ".") return cb();
        fs.stat(dir, function (err) {
          if (err == null) return cb(); // already exists

          var parent = path.dirname(dir);
          mkdirp(parent, function () {
            //console.log(dir.replace(/\/$/, "") + "/\n");
            fs.mkdir(dir, cb);
          });
        });
      }

      zipfile.readEntry();
      zipfile.on("entry", function (entry) {
        if (/\/$/.test(entry.fileName)) {
          // directory file names end with '/'
          mkdirp(path.join(rootFolder, entry.fileName), function () {
            if (err) unzipReject(err);
            zipfile.readEntry();
            incrementEntryCount();
          });
        } else {
          // ensure parent directory exists
          mkdirp(
            path.join(rootFolder, path.dirname(entry.fileName)),
            function () {
              zipfile.openReadStream(entry, function (err, readStream) {
                if (err) unzipReject(err);

                var writeStream = fs.createWriteStream(
                  path.join(rootFolder, entry.fileName),
                );
                incrementHandleCount();
                writeStream.on("close", decrementHandleCount);
                readStream.pipe(writeStream).on("finish", () => {
                  zipfile.readEntry();
                });
                incrementEntryCount();
              });
            },
          );
        }
      });
    });
    await unzipPromise;
    fs.unlinkSync(filePath);
    await loadPackage(packageName, undefined);
  } catch (e) {
    if (customGithubPackageList.has(packageName)) {
      customGithubPackageList.delete(packageName);
      process.parentPort?.postMessage({
        packageId: packageName,
        type: "show-message",
        message: "Couldn't find package archive, removed from list!",
        messageType: "fail",
      });
    }
    process.parentPort?.postMessage({
      packageId: packageName,
      type: "remove-github-package",
    });
    process.parentPort?.postMessage({
      packageId: packageName,
      type: "debug-error",
      message: e.message,
    });
  } finally {
    downloadingPackages.delete(packageName);
    packageInstallProgress.delete(packageName);
    updatingPackages.delete(packageName);
    notifyListener();
  }
}

async function updatePackage(packageName: string) {
  if (currentlyLoadedPackages.has(packageName)) {
    currentlyLoadedPackages.get(packageName).unloadPackage();
    currentlyLoadedPackages.delete(packageName);
  }
  const packagePath = path.join(packageFolder, packageName);
  if (haveBeenLoadedPackages.has(packageName)) {
    if (downloadingPackages.size > 0) {
      process.parentPort?.postMessage({
        packageId: packageName,
        type: "show-message",
        message:
          "Please wait for all downloads to complete before updating package!",
        messageType: "fail",
      });
      return;
    }
    await stopPackageManager();
    process.parentPort.postMessage({
      type: "update-package-folder",
      path: packagePath,
      packageName: packageName,
    });
  } else {
    updatingPackages.add(packageName);
    fs.rm(packagePath, { recursive: true }, () => {
      refreshInstalledPackagesCache();
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
    if (downloadingPackages.size > 0) {
      process.parentPort?.postMessage({
        packageId: packageName,
        type: "show-message",
        message:
          "Please wait for all downloads to complete before deleting package!",
        messageType: "fail",
      });
      return;
    }
    await stopPackageManager();
    process.parentPort.postMessage({
      type: "delete-package-folder",
      path: packagePath,
    });
  } else {
    fs.rm(packagePath, { recursive: true }, refreshInstalledPackagesCache);
  }
}

async function removePackage(packageName: string) {
  unloadPackage(packageName);
  if (localPackages.has(packageName)) {
    localPackages.delete(packageName);
    process.parentPort?.postMessage({
      type: "remove-local-package",
      packageId: packageName,
    });
    refreshInstalledPackagesCache();
  }
  if (customGithubPackageList.has(packageName)) {
    customGithubPackageList.delete(packageName);
    process.parentPort?.postMessage({
      type: "remove-github-package",
      packageId: packageName,
    });
    refreshInstalledPackagesCache();
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
      packageId: packageId,
      rootPath: rootPath,
    });
    refreshInstalledPackagesCache();
  } else {
    process.parentPort?.postMessage({
      type: "show-message",
      message: `Couldn't find package.json file in ${rootPath}!`,
      messageType: "fail",
    });
  }
}

function notifyListener() {
  if (shuttingDown || !installedPackagesChecked || !githubPackagesChecked)
    return;

  const packages = getAvailablePackages();
  process.parentPort?.postMessage({ type: "packages", packages: packages });
}

let cachedInstalledPackages: {
  packageId: string;
  packageName: string;
  componentsPath?: string;
  preferenceComponent?: string;
  packageVersion?: string;
  loadable: boolean;
  author?: string;
  description?: string;
  mainIconPath?: string;
  menuIconPath?: string;
}[] = [];

let scheduleRefreshInstalledPackagesTimeout: NodeJS.Timeout | undefined =
  undefined;
function scheduleRefreshInstalledPackages() {
  clearTimeout(scheduleRefreshInstalledPackagesTimeout);
  scheduleRefreshInstalledPackagesTimeout = setTimeout(
    refreshInstalledPackagesCache,
    50,
  );
}

async function refreshInstalledPackagesCache() {
  cachedInstalledPackages = await getInstalledPackages();
  installedPackagesChecked = true;
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
    author?: string;
    description?: string;
    mainIconPath?: string;
    menuIconPath?: string;
  }[]
> {
  if (!fs.existsSync(packageFolder)) {
    return [];
  }
  const readdir = util.promisify(fs.readdir);
  const readfile = util.promisify(fs.readFile);
  const opendir = util.promisify(fs.opendir);
  const folders = await readdir(packageFolder, { encoding: "utf-8" });
  const packages = await Promise.all(
    [...folders, ...localPackages.values()]
      .filter(
        (folder) =>
          path.extname(folder) === "" &&
          !downloadingPackages.has(path.basename(folder)) &&
          !folder.toLowerCase().includes("ds_store"),
      )
      .map(async (folder) => {
        let packageId: string | undefined = undefined;
        let packagePath = folder;
        if (!path.isAbsolute(folder)) {
          packageId = folder;
          packagePath = path.join(packageFolder, folder);
        }
        const packageJsonPath = path.join(packagePath, "package.json");
        if (!fs.existsSync(packageJsonPath)) {
          return undefined;
        }

        const packageFile = await readfile(packageJsonPath);
        const packageJson = JSON.parse(packageFile.toString());
        if (packageId === undefined) {
          packageId = packageJson.name;
        }
        const packageName = packageJson.description;
        const packageVersion = packageJson.version;

        let componentsPath: string | undefined = undefined;
        if (packageJson.grid_editor?.componentsPath) {
          componentsPath = path.join(
            packageId,
            packageJson.grid_editor?.componentsPath,
          );
        }
        const preferenceComponent =
          packageJson.grid_editor?.preferenceComponent;
        const loadable = packageJson.main !== undefined;
        const author = packageJson.author;
        const mainIconPath = packageJson.grid_editor?.mainIcon
          ? `package://${packageId}/${packageJson.grid_editor?.mainIcon}`
          : undefined;
        const menuIconPath = packageJson.grid_editor?.menuIcon
          ? `package://${packageId}/${packageJson.grid_editor?.menuIcon}`
          : undefined;
        const description = packageJson.grid_editor?.shortDescription;
        return {
          packageId,
          packageName,
          componentsPath,
          preferenceComponent,
          packageVersion,
          loadable,
          author,
          mainIconPath,
          menuIconPath,
          description,
        };
      }),
  );
  let validPackages = packages.filter((e) => e !== undefined);
  let seenPackageIds = new Set<String>();
  let finalPackageList = [];
  validPackages.reverse().forEach((p) => {
    if (!seenPackageIds.has(p.packageId)) {
      seenPackageIds.add(p.packageId);
      finalPackageList.push(p);
    }
  });
  return finalPackageList.reverse();
}

function getAvailablePackages() {
  let installedPackages = cachedInstalledPackages;

  const packageList: {
    id: string;
    name: string;
    componentsPath?: string;
    preferenceComponent?: string;
    packageVersion?: string;
    removable: boolean;
    uninstallable: boolean;
    loadable: boolean;
    canUpdate: boolean;
    svgIcon?: string;
    installProgress?: number;
    author?: string;
    description?: string;
    mainIconPath?: string;
    menuIconPath?: string;
    isOfficial: boolean;
    isEnabled: boolean;
    isDownloaded: boolean;
  }[] = [];

  editorPackages.forEach((entry, key) => {
    packageList.push({
      id: key,
      name: entry.name,
      isEnabled: currentlyLoadedPackages.has(key),
      removable: false,
      loadable: true,
      uninstallable: false,
      canUpdate: false,
      svgIcon: entry.svgIcon,
      description: entry.description,
      author: "Built-in",
      isOfficial: true,
      isDownloaded: true,
    });
  });

  let githubPackageList = new Map([
    ...recommendedGithubPackageList.entries(),
    ...customGithubPackageList.entries(),
  ]);
  for (const _package of installedPackages) {
    if (packageList.filter((e) => e.id === _package.packageId).length > 0)
      continue;

    //TODO: Temporarly allow new version of packages to overwrite package data. Can be removed in the future.
    let canUpdate =
      _package.packageVersion != undefined &&
      githubPackageDetails.get(_package.packageId)?.version != undefined &&
      semver.gt(
        githubPackageDetails.get(_package.packageId)!.version!,
        _package.packageVersion,
      );

    let author = _package.author
      ? _package.author
      : (githubPackageList.get(_package.packageId)?.gitHubRepositoryOwner ??
        _package.author);

    packageList.push({
      id: _package.packageId,
      name: _package.packageName,
      isEnabled: currentlyLoadedPackages.has(_package.packageId),
      componentsPath: _package.componentsPath,
      preferenceComponent: _package.preferenceComponent,
      packageVersion: _package.packageVersion,
      removable:
        !recommendedGithubPackageList.has(_package.packageId) ||
        localPackages.has(_package.packageId),
      loadable: _package.loadable,
      uninstallable: !localPackages.has(_package.packageId),
      canUpdate,
      installProgress: packageInstallProgress.get(_package.packageId),
      author: author,
      description: canUpdate
        ? githubPackageDetails.get(_package.packageId).description
        : _package.description,
      mainIconPath: canUpdate
        ? githubPackageDetails.get(_package.packageId).mainIconPath
        : _package.mainIconPath,
      menuIconPath: canUpdate
        ? githubPackageDetails.get(_package.packageId).menuIconPath
        : _package.menuIconPath,
      isOfficial:
        recommendedGithubPackageList.has(_package.packageId) &&
        author == "intechstudio",
      isDownloaded: true,
    });
  }
  githubPackageDetails.forEach((entry, key) => {
    if (packageList.filter((e) => e.id === key).length > 0) return;

    packageList.push({
      id: key,
      name: entry.name,
      isEnabled: false,
      canUpdate: false,
      uninstallable: true,
      removable: !recommendedGithubPackageList.has(key),
      loadable: false,
      installProgress: packageInstallProgress.get(key),
      author: entry.gitHubRepositoryOwner,
      mainIconPath: entry.mainIconPath,
      description: entry.description,
      packageVersion: entry.version,
      menuIconPath: entry.menuIconPath,
      isOfficial:
        recommendedGithubPackageList.has(key) &&
        entry.gitHubRepositoryOwner == "intechstudio",
      isDownloaded: updatingPackages.has(key),
      preferenceComponent: entry.preferenceComponent,
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
  for (const [packageId, githubPackage] of githubPackageList) {
    try {
      if (!forceRefreshVersion && githubPackageDetails.has(packageId)) {
        continue;
      }
      let githubRawUrl = `https://raw.githubusercontent.com/${githubPackage.gitHubRepositoryOwner}/${githubPackage.gitHubRepositoryName}/refs/heads/main`;
      let packageJsonResponse = await fetch(`${githubRawUrl}/package.json`);
      let packageJson = await packageJsonResponse.json();

      githubPackageDetails.set(packageId, {
        ...githubPackage,
        name: packageJson.description,
        description: packageJson.grid_editor?.shortDescription,
        mainIconPath: packageJson.grid_editor?.mainIcon
          ? `${githubRawUrl}/${packageJson.grid_editor?.mainIcon}`
          : undefined,
        menuIconPath: packageJson.grid_editor?.menuIcon
          ? `${githubRawUrl}/${packageJson.grid_editor?.menuIcon}`
          : undefined,
        preferenceComponent: packageJson.grid_editor?.preferenceComponent,
      });

      const compatiblePackage = await getCompatibleGithubRelease(packageId);
      if (!compatiblePackage) {
        customGithubPackageList.delete(packageId);
        continue;
      }

      let version =
        semver.coerce(compatiblePackage.tag_name) ??
        semver.coerce(compatiblePackage.name);
      githubPackageDetails.get(packageId).version = version.toString();
    } catch (e) {
      console.log(e);
    }
  }
  githubPackagesChecked = true;
  notifyListener();
}

async function getCompatibleGithubRelease(githubPackageName: string) {
  let githubPackageList = new Map([
    ...recommendedGithubPackageList.entries(),
    ...customGithubPackageList.entries(),
  ]);
  let githubPackage = githubPackageList.get(githubPackageName);
  if (!githubPackage) return;
  const packageReleasesResponse = await fetch(
    `https://hq2.intech.studio/v1/github/package-releases?repositoryOwner=${encodeURIComponent(githubPackage.gitHubRepositoryOwner)}&repositoryName=${encodeURIComponent(githubPackage.gitHubRepositoryName)}`,
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
    .on("add", scheduleRefreshInstalledPackages)
    .on("change", scheduleRefreshInstalledPackages)
    .on("unlink", scheduleRefreshInstalledPackages)
    .on("addDir", scheduleRefreshInstalledPackages)
    .on("unlinkDir", scheduleRefreshInstalledPackages)
    .on("ready", scheduleRefreshInstalledPackages);
}
