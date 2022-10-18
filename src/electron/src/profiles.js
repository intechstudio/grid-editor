const fs = require('fs');
const log = require('electron-log');

async function checkIfWritableDirectory(path){

  const stats = fs.promises.stat(path).then(res => ({
    isFile: res.isFile(), 
    isDirectory: res.isDirectory()
  }));

  return await Promise.all([stats])
}

async function moveOldProfiles(profilePath){

  let path = profilePath;

  if(!fs.existsSync(path)) fs.mkdirSync(path);
  if(!fs.existsSync(path+"/profiles")) fs.mkdirSync(path+"/profiles");
  if(!fs.existsSync(path+"/profiles/user")) fs.mkdirSync(path+"/profiles/user");

  log.info('Profile move start...');

  await fs.promises.readdir(path).then(files => {

    files.forEach(async file => {

        let filepath = path + "/" + file;
        
        const [stats] = await checkIfWritableDirectory(filepath);

        if(stats.isFile){
          let filenameparts = file.split(".");
          let extension = filenameparts[filenameparts.length-1];
          if (extension === "json"){
            fs.renameSync(path + "/" + file, path + "/profiles/user/" + file);
            log.info("moving: ", file);
          }


        } else {

          log.info('Not a file!');

        }
      
    })

  }).catch(err => { 

    log.error(err)

  });

  log.info('Profile move end.');

}

async function loadProfilesFromDirectory(profilePath){

  let path = profilePath;

  // Create the folder if it does not exist
  if(!fs.existsSync(path)) fs.mkdirSync(path);
  if(!fs.existsSync(path+"/profiles")) fs.mkdirSync(path+"/profiles");

  let profiles = [];

  let promises = [];

  const [stats] = await checkIfWritableDirectory(path+"/profiles");

  if(stats.isDirectory){

    // get list of directories
    let dirs = fs.readdirSync(path+"/profiles", { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name)

    // for all directories...

    for (const dir of dirs) {
      const files = await fs.promises.readdir(path + "/profiles/" + dir);
      for (const file of files) {
        let filepath = path + "/profiles/" + dir + "/" + file;          
        const [stats] = await checkIfWritableDirectory(filepath);
        if(stats.isFile){
          await fs.promises.readFile(filepath,'utf-8').then(data => { 
            if(isJson(data)){                
              let obj = JSON.parse(data);
              if(obj.isGridProfile){
                obj.folder = dir;
                obj.showMore = false;
                obj.color = stringToColor(dir)
                profiles.push(obj);
              } else {
                log.info('JSON is not a grid profile!') ;
              }
            }
          })
        } else {
          log.info('Not a file!');
        }
      }
    }
  } else {
    log.info('Not a directory!');
  }

  return profiles;


}

async function saveProfile(profilePath, name, profile){     
  
  const path = profilePath;
  
  if(!fs.existsSync(path)) fs.mkdirSync(path);
  if(!fs.existsSync(path+"/profiles")) fs.mkdirSync(path+"/profiles");
  if(!fs.existsSync(path+"/profiles/user")) fs.mkdirSync(path+"/profiles/user");

  // Creating and Writing to the sample.txt file 
  fs.writeFile(`${path}/profiles/user/${name}.json`, JSON.stringify(profile, null, 4), function (err) { 
      if (err) throw err; 
      console.log('Saved!'); 
      logger.set({type: 'success', mode: 0, classname: 'profilesave', message: `Profile saved!`});

      // we should call this function in renderer, after the profile is saved
      // loadProfilesFromDirectory(path); 

      //trackEvent('profile-library', 'profile-library: save success')
      //analytics.track_event("application", "profiles", "profile", "save success")

  }); 
}

function isJson (str){
  try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
}

function stringToColor(string) {

  // Generte Hash

  var hash = 0;
  if (string.length == 0)
      return hash;
  for (let i = 0; i < string.length; i++) {
      var charCode = string.charCodeAt(i);
      hash = ((hash << 7) - hash) + charCode;
      hash = hash & hash;
  }

  // define the color params

  var hue = Math.abs(hash)%360; // degrees
  var sat = 65; // percentage
  var lum = 50; // percentage

  // convert from HSL to RGB

  lum /= 100;
  const a = sat * Math.min(lum, 1 - lum) / 100;
  const f = n => {
    const k = (n + hue / 30) % 12;
    const col = lum - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * col).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
  };

  var color = `#${f(0)}${f(8)}${f(4)}`;

  return color;
}

module.exports = {moveOldProfiles, loadProfilesFromDirectory, saveProfile}
