const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;

async function scanConfigBlockDirectory(){

  try {
    let files = fsPromises.readdir(path.join(__dirname, '/build/config-blocks'));
    files = (await files).filter(f => f.slice(-2) !== 'js');
    return files;
  } catch (err) {
    console.error('Error occured while reading directory!', err);
  }
}

async function importComponents(files){
  try {  
    const components = Promise.all(
      files.map(async file => {
        const name = file.slice(0,-7)
        return await import(`../config-blocks/${name}.svelte`)
      })
    );
    return components;
  } catch (err) {
    console.error('Failed to import!', err)
  }
}

export async function getComponentInformation({short}){

  const files = await scanConfigBlockDirectory();
  const component = await importComponents(files)
    .then(components => components.map(c => c = {component: c.default, information: c.information}))
    .then(components => components.find(c => c.information.short == short))

  return component;
}