const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;


export let config_components;

async function init_config_block_library(){

  console.log("Init config block library!");

  let files;

  // scanCofigBlockDirectory()
  try {
    let _files = fsPromises.readdir(path.join(__dirname, '/build/config-blocks'));
    _files = (await _files).filter(f => f.slice(-6) == 'svelte');
    files = _files;
  } 
  catch (err) {
    console.error('Error occured while reading directory!', err);
  }

  console.log("List of files: ", files);
  
  // importComponents()

  let components = undefined;

  try {  
    let _components = Promise.all(
      files.map(async file => {
        const name = file.slice(0,-7)
        return await import(`../config-blocks/${name}.svelte`)
      })
    );
    _components.then(value => {
      config_components = value
    });
  } 
  catch (err) {
    console.error('Failed to import!', err)
  }

}

init_config_block_library();


export function getComponentInformation({short}){

  if (config_components === undefined){
    //console.log("config_components status is undefined")
    return undefined;
  }

  return config_components.map(c => c = {component: c.default, information: c.information}).find(c => c.information.short == short)
  
}

export function getAllComponents(){
  
  if (config_components === undefined){
    //console.log("config_components status is undefined")
    return undefined;
  }

  return config_components.map(c => c = {component: c.default, information: c.information});
}