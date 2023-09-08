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

interface OldProfile {
  version: {
    major: number;
    minor: number;
    patch: number;
  };
}

interface NewProfile {
  id: string;
  version: {
    major: string;
    minor: string;
    patch: string;
  };
}

export async function migrateToProfileCloud(
  oldPath: string,
  newPath: string,
): Promise<void> {
  const entries = await readdir(oldPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullOldPath = path.join(oldPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name == "intech" || entry.name == "intechstudio") {
        // do nothing
      } else {
        // If the entry is a directory, recurse into it
        await migrateToProfileCloud(fullOldPath, newPath);
      }
    } else if (entry.isFile() && path.extname(entry.name) === ".json") {
      const id = uuidv4();
      const fullNewPath = path.join(newPath, id);
      // If the entry is a file and ends in '.json', process it
      const oldProfileBuffer = await readFile(fullOldPath);
      const oldProfile: OldProfile = JSON.parse(oldProfileBuffer.toString());

      const newProfile: NewProfile = {
        ...oldProfile,
        id: id,
        version: {
          major: oldProfile.version.major.toString(),
          minor: oldProfile.version.minor.toString(),
          patch: oldProfile.version.patch.toString(),
        },
      };
      fs.mkdirSync(fullNewPath, { recursive: true });
      await writeFile(
        path.join(fullNewPath, `${newProfile.id}.json`),
        JSON.stringify(newProfile, null, 2),
      );
    }
  }
}

export async function moveOldConfigs(configPath, rootDirectory) {
  if (configPath === undefined) return;
  if (configPath === "") return;

  let path = configPath;

  if (!fs.existsSync(path)) fs.mkdirSync(path);
  if (!fs.existsSync(`${path}/${rootDirectory}`))
    fs.mkdirSync(`${path}/${rootDirectory}`);

  log.info(rootDirectory + " move start...");
  await fs.promises
    .readdir(`${path}/${rootDirectory}`)
    .then((authors) => {
      authors.forEach(async (author) => {
        await fs.promises
          .readdir(`${path}/${rootDirectory}/${author}`)
          .then((files) => {
            files.forEach(async (file) => {
              let filepath = `${path}/${rootDirectory}/${author}/${file}`;

              const [stats] = await checkIfWritableDirectory(filepath);

              if (stats.isFile) {
                let filenameparts = file.split(".");
                let extension = filenameparts[filenameparts.length - 1];
                if (extension === "json") {
                  if (file.lastIndexOf(".") != -1) {
                    let basename = file.substring(0, file.lastIndexOf("."));

                    if (
                      !fs.existsSync(
                        `${path}/${rootDirectory}/${author}/${basename}`,
                      )
                    ) {
                      fs.mkdirSync(
                        `${path}/${rootDirectory}/${author}/${basename}`,
                      );
                    }

                    const from = `${path}/${rootDirectory}/${author}/${file}`;
                    const to = `${path}/${rootDirectory}/${author}/${basename}/${file}`;
                    fs.renameSync(from, to);
                    log.info("moving: ", file);
                  }
                }
              } else {
                log.info("Not a file!");
              }
            });
          });
      });
    })
    .catch((err) => {
      log.error(err);
    });

  log.info(rootDirectory + " move end.");
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

  let configs = [];

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
            obj.fsModifiedAt = dateObject.modifiedAt;
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
  name,
  config,
  rootDirectory,
  user,
) {
  const path = configPath;

  log.info("SaveConfig", name, config);

  if (!fs.existsSync(path)) fs.mkdirSync(path);
  if (!fs.existsSync(`${path}/${rootDirectory}`))
    fs.mkdirSync(`${path}/${rootDirectory}`);
  if (!fs.existsSync(`${path}/${rootDirectory}/${user}`))
    fs.mkdirSync(`${path}/${rootDirectory}/${user}`);

  if (!fs.existsSync(`${path}/${rootDirectory}/${user}/${name}`))
    fs.mkdirSync(`${path}/${rootDirectory}/${user}/${name}`);

  // Creating and Writing to the sample.txt file
  await fs.promises
    .writeFile(
      `${path}/${rootDirectory}/${user}/${name}/${name}.json`,
      JSON.stringify(config, null, 4),
    )
    .then((data) => {
      console.log("Saved!");
    })
    .catch((err) => {
      console.log("Error:", err);
      throw err;
    });
}

export async function deleteConfig(
  configPath,
  name,
  rootDirectory,
  profileFolder,
) {
  const path = configPath;
  log.info("deleteConfig");

  await fs.promises
    .rmdir(`${path}/${rootDirectory}/${profileFolder}/${name}`, {
      recursive: true,
    })
    .catch((err) => {
      throw err;
    });
}

export async function updateLocal(
  configPath,
  id,
  config,
  rootDirectory,
  profileFolder,
) {
  await saveConfig(configPath, id, config, rootDirectory, profileFolder);
}

export async function updateConfig(
  configPath,
  name,
  config,
  rootDirectory,
  oldName,
  profileFolder,
) {
  if (oldName === name) {
    // just save and overwrite existing profile
    await saveConfig(configPath, name, config, rootDirectory, profileFolder);
    log.info("Profile overwritten!");
  } else {
    log.info("Update name");
    await saveConfig(configPath, name, config, rootDirectory, profileFolder);
    await deleteConfig(configPath, oldName, rootDirectory, profileFolder);
  }
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