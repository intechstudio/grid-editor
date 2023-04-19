import fs from "fs";
import log from "electron-log";

import { googleAnalytics, influxAnalytics } from "./analytics";

async function checkIfWritableDirectory(path) {
  const stats = fs.promises.stat(path).then((res) => ({
    isFile: res.isFile(),
    isDirectory: res.isDirectory(),
  }));

  return await Promise.all([stats]);
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
                        `${path}/${rootDirectory}/${author}/${basename}`
                      )
                    ) {
                      fs.mkdirSync(
                        `${path}/${rootDirectory}/${author}/${basename}`
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
  let path = configPath;
  // Create the folder if it does not exist
  if (!fs.existsSync(path)) fs.mkdirSync(path);
  if (!fs.existsSync(`${path}/${rootDirectory}`))
    fs.mkdirSync(`${path}/${rootDirectory}`);

  // either presets or profiles (pages)
  // make sure to figure out naming conventions!,
  let configs = [];

  const [stats] = await checkIfWritableDirectory(`${path}/${rootDirectory}`);

  if (stats.isDirectory) {
    // get list of directories
    let dirs = fs
      .readdirSync(`${path}/${rootDirectory}`, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // for all directories...

    for (const dir of dirs) {
      const directories = await fs.promises.readdir(
        `${path}/${rootDirectory}/${dir}`
      );
      for (const directory of directories) {
        let directorypath =
          path + "/" + rootDirectory + "/" + dir + "/" + directory;
        const [stats] = await checkIfWritableDirectory(directorypath);
        if (stats.isDirectory) {
          const files = await fs.promises.readdir(
            `${path}/${rootDirectory}/${dir}/${directory}`
          );
          for (const file of files) {
            let filepath =
              path +
              "/" +
              rootDirectory +
              "/" +
              dir +
              "/" +
              directory +
              "/" +
              file;
            const [stats] = await checkIfWritableDirectory(directorypath);

            await fs.promises.readFile(filepath, "utf-8").then(async (data) => {
              if (isJson(data)) {
                let obj = JSON.parse(data);
                if (obj.isGridProfile || obj.isGridPreset) {
                  obj.folder = dir;
                  obj.showMore = false;
                  obj.color = stringToColor(dir);
                  const dateObject = await getDateOfModify(filepath);
                  obj.fsCreatedAt = dateObject.createdAt;
                  obj.fsModifiedAt = dateObject.modifiedAt;
                  configs.push(obj);
                } else {
                  log.info("JSON is not a grid profile!");
                }
              } else {
                log.info("Not a file!");
              }
            });
          }
        } else {
          log.info("Not a directory!");
        }
      }
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
  user
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
      JSON.stringify(config, null, 4)
    )
    .then((data) => {
      googleAnalytics("profile-library", { value: "save success" });
      influxAnalytics("application", "profiles", "profile", "save success");
      console.log("Saved!");
    })
    .catch((err) => {
      googleAnalytics("profile-library", { value: "save fail" });
      influxAnalytics("application", "profiles", "profile", "save fail");
      console.log("Error:", err);
      throw err;
    });
}

export async function deleteConfig(
  configPath,
  name,
  rootDirectory,
  profileFolder
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

export async function updateConfig(
  configPath,
  name,
  config,
  rootDirectory,
  oldName,
  profileFolder
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

function stringToColor(string) {
  // Generte Hash

  var hash = 0;
  if (string.length == 0) return hash;
  for (let i = 0; i < string.length; i++) {
    var charCode = string.charCodeAt(i);
    hash = (hash << 7) - hash + charCode;
    hash = hash & hash;
  }

  // define the color params

  var hue = Math.abs(hash) % 360; // degrees
  var sat = 65; // percentage
  var lum = 50; // percentage

  // convert from HSL to RGB

  lum /= 100;
  const a = (sat * Math.min(lum, 1 - lum)) / 100;
  const f = (n) => {
    const k = (n + hue / 30) % 12;
    const col = lum - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * col)
      .toString(16)
      .padStart(2, "0"); // convert to Hex and prefix "0" if needed
  };

  var color = `#${f(0)}${f(8)}${f(4)}`;

  return color;
}
