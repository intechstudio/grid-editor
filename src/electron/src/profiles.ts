import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import util from "util";
import log from "electron-log";

async function checkIfWritableDirectory(path) {
  const stats = fs.promises.stat(path).then((res) => ({
    isFile: res.isFile(),
    isDirectory: res.isDirectory(),
  }));

  return await Promise.all([stats]);
}

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const readdir = util.promisify(fs.readdir);

async function migrateProfileFileToCloud(
  filePath: string,
  configType: string,
  configPath: string,
  configDirectory: string,
) {
  const id = uuidv4();
  const oldProfileBuffer = await readFile(filePath);
  const oldProfile = JSON.parse(oldProfileBuffer.toString());
  delete oldProfile.id;

  const newConfig = {
    ...oldProfile,
    localId: id,
    configType: configType,
    version: {
      major: oldProfile.version.major.toString(),
      minor: oldProfile.version.minor.toString(),
      patch: oldProfile.version.patch.toString(),
    },
  };
  await saveConfig(configPath, configDirectory, newConfig);
}

export async function migrateToProfileCloud(
  oldRootPath: string,
  newRootPath: string,
  configDirectory: string,
): Promise<void> {
  const oldConfigTypes = ['profile', 'preset'];
  for (const configType of oldConfigTypes){
    const relativeFolder = `${oldConfigTypes}s`;
    const fullOldPath = path.join(oldRootPath, relativeFolder);
    const entries = await readdir(oldRootPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name == "intech" || entry.name == "intechstudio") {
          // do nothing
        } else {
          // If the entry is a directory, go into it
          const subentries = await readdir(oldRootPath, { withFileTypes: true });
          for (const fileEntry of subentries.filter((entry) => entry.isFile)){
            await migrateProfileFileToCloud(path.join(fullOldPath, entry.name, fileEntry.name), configType, newRootPath, configDirectory);
          }
        }
      } else if (entry.isFile() && path.extname(entry.name) === ".json") {
        await migrateProfileFileToCloud(path.join(fullOldPath, entry.name), configType, newRootPath, configDirectory);
      }
    }
  }
}

export async function loadConfigsFromDirectory(configPath, rootDirectory) {
  if (typeof configPath === "undefined" || configPath === "") {
    return [];
  }

  let path = configPath;
  // Create the folder if it does not exist
  if (!fs.existsSync(path)) fs.mkdirSync(path);
  if (!fs.existsSync(`${path}/${rootDirectory}`))
    fs.mkdirSync(`${path}/${rootDirectory}`);

  let configs : any[] = [];

  const [stats] = await checkIfWritableDirectory(`${path}/${rootDirectory}`);

  if (stats.isDirectory) {
    const files = await fs.promises.readdir(
      `${path}/${rootDirectory}`,
    );

    for (const file of files) {
      let filepath =
        path +
        "/" +
        rootDirectory +
        "/" +
        file;

      await fs.promises.readFile(filepath, "utf-8").then(async (data) => {
        if (isJson(data)) {
          let obj = JSON.parse(data);
          if (obj.configType) {
            const dateObject = await getDateOfModify(filepath);
            obj.fileName = file;
            obj.fsModifiedAt = dateObject?.modifiedAt;
            configs.push(obj);
          } else {
            log.info("JSON is not a grid config!");
          }
        } else {
          log.info("Not a file!");
        }
      });
    }
  } else {
    log.info("Not a directory!");
  }

  return configs;
}

export async function saveConfig(
  configPath,
  rootDirectory,
  config,
) {
  const path = configPath;

  log.info("SaveConfig", config);

  if (!fs.existsSync(`${path}/${rootDirectory}`))
    await fs.promises.mkdir(`${path}/${rootDirectory}`, {recursive: true});

  const fileNameBase = `${config.name ?? "config"}_${config.localId ?? ''}`;
  let fileName = fileNameBase;
  let fileNameCounter = 0;
  while (fs.existsSync(`${path}/${rootDirectory}/${fileName}.json`)){
    fileName = `${fileNameBase}_${fileNameCounter}`;
  }
  
  await fs.promises
    .writeFile(
      `${path}/${rootDirectory}/${fileName}.json`,
      JSON.stringify(config, null, 4),
    )
    .then((data) => {
      console.log("Saved!");
      if (config.fileName){
        deleteConfig(configPath, rootDirectory, config);
      }
    })
    .catch((err) => {
      console.log("Error:", err);
      throw err;
    });
}

export async function deleteConfig(
  configPath,
  configFolder,
  config,
) {

  const path = configPath;
  log.info("deleteConfig");

  await fs.promises
    .rm(`${path}/${configFolder}/${config.fileName}`)
    .catch((err) => {
      throw err;
    });
}

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

async function getDateOfModify(filepath) {
  // Get the modif date of selected file
  const dateObject = await fs.promises
    .stat(filepath)
    .then((stats) => {
      // print file last modified date
      return { modifiedAt: stats.mtime, createdAt: stats.ctime };
    })
    .catch((err) => console.error("get date modify", err));

  return dateObject;
}