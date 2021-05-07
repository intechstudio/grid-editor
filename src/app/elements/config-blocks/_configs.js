const fs = require('fs');
const fsPromises = fs.promises;

const folder = './src/app/elements/config-blocks'

async function scanConfigBlockDirectory(){

  try {
    let files = fsPromises.readdir(folder);
    files = (await files).filter(f => f !== '_configs.js');
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

async function getImports(short){

  const files = await scanConfigBlockDirectory();
  const component = await importComponents(files)
    .then(components => components.map(c => c = {component: c.default, information: c.information}))
    .then(components => components.find(c => c.information.short == short))

  console.log('component imported...', component)
  return component;
}


export async function getComponentInformation({short}){
  return await getImports(short);
};