<script>

  import { onMount } from 'svelte';

  import { get } from 'svelte/store'

  import { fade } from 'svelte/transition'
  import { writeBuffer } from '../../../runtime/engine.store.js';
  
  const electron = require('electron'); 
  const fs = require('fs'); 

  const { ipcRenderer } = require('electron');

  // Importing dialog module using remote 
  const dialog = electron.remote.dialog; 

  import { engine, logger, runtime, user_input } from '../../../runtime/runtime.store.js';
  import { isJson } from '../../../runtime/_utils.js';
  import { appSettings } from '../../_stores/app-helper.store.js';

  let selected = {
    name: '',
    description: '',
    type: 'Select a profile...'
  };

  let newProfile = {
    name: '',
    description: '',
    type: 'Select control element...'
  };

  let selectedIndex = undefined;
  
  let PROFILE_PATH = '';

  let PROFILES = [];

  user_input.active_input(val => {
    if(val.selected.id){
      newProfile.type = val.selected.id.substr(0,4);
    }
  })

  function openDirectory(){
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }).then(dir => {
      if(!dir.canceled){
        PROFILE_PATH = dir.filePaths.toString();
        ipcRenderer.send('setStoreValue-message', { profiles_folder: PROFILE_PATH } );
        loadFilesFromDirectory(PROFILE_PATH);
      }
    }).catch(err => {
        console.log(err)
    });
  }

  async function checkIfWritableDirectory(path){

    const stats = fs.promises.stat(path).then(res => {return {isFile: res.isFile(), isDirectory: res.isDirectory()}});

    return await Promise.all([stats])

  }


  async function loadFilesFromDirectory(path){

    try {

      PROFILES = [];

      const [stats] = await checkIfWritableDirectory(path);

      if(stats.isDirectory){

        fs.readdir(path, (err, files) => {

          files.forEach(async file => {

            try {
              
              const [stats] = await checkIfWritableDirectory(`${path + "/" + file}`);

              if(stats.isFile){

                fs.readFile(`${path + "/" + file}`,'utf-8', function (err, data) { 

                    if (err) {
                      throw err
                    }; 

                    if(isJson(data)){                
                      let obj = JSON.parse(data);
                      if(obj.isGridProfile){
                        PROFILES = [...PROFILES, obj];
                      } else {
                        console.info('JSON is not a grid profile!') ;
                      }
                    }

                });

              } else {

                //console.info('Not a file!');

              }

            } catch (error) {

              console.error('readFile error...',error)

            }
            
          })
        });

      }

    } catch (error) {

      console.error(error);

    }
   
  }

  function saveProfile(path, name, profile){                  
    // Creating and Writing to the sample.txt file 
    fs.writeFile(`${path}/${name}.json`, JSON.stringify(profile, null, 4), function (err) { 
        if (err) throw err; 
        console.log('Saved!'); 
        loadFilesFromDirectory(PROFILE_PATH);
    }); 
  }

  function saveProfileDialog(profileName, profile) {
    // Resolves to a Promise<Object> 
    dialog.showSaveDialog({ 
          title: 'Select the File Path to save', 
          defaultPath: path.join(__dirname, `../assets/${profileName}.json`), 
          // defaultPath: path.join(__dirname, '../assets/'), 
          buttonLabel: 'Save', 
          // Restricting the user to only JSON Files. 
          filters: [ 
              { 
                  name: 'JSON Files', 
                  extensions: ['json'] 
              }, ], 
          properties: [] 
        }).then(file => { 
            // Stating whether dialog operation was cancelled or not. 
            if (!file.canceled) { 
                const path = file.filePath.toString(); 
                  
                // Creating and Writing to the sample.txt file 
                fs.writeFile(path, JSON.stringify(profile, null, 4), function (err) { 
                    if (err) throw err; 
                    console.log('Saved!'); 
                    profile.
                    loadFilesFromDirectory(PROFILE_PATH);
                }); 
            } 

            

        }).catch(err => { 
            console.log(err) 
        }); 
  }

  function prepareSave() { 

    let _user_input = undefined;
    const _active_user_input = user_input.active_input(value => _user_input = value.selected);
    _active_user_input();
    
    try {

      runtime.fetch.Many();
      
      writeBuffer.messages.subscribe((value) => {

        if(value == 'ready to save'){

          const configs = get(runtime);

          let profile = {
            ...newProfile, 
            isGridProfile: true,  // differentiator from different JSON files!
            version: {
              major: $appSettings.version.major, 
              minor: $appSettings.version.minor, 
              patch: $appSettings.version.patch
            }
          }


          configs.forEach(d => {

            if(d.dx == _user_input.brc.dx && d.dy == _user_input.brc.dy){

              const page = d.pages.find(x => x.pageNumber == _user_input.event.pagenumber);

              profile.configs = page.control_elements.map(cfg => {
                  return {
                    controlElementNumber: cfg.controlElementNumber,
                    events: cfg.events.map(ev => {
                      return {
                        event: ev.event.value,
                        config: ev.config
                      }
                    })
                  }
              });

            }

          })    

          saveProfile(PROFILE_PATH, newProfile.name, profile);
          
        }
      });


    } catch (error) {
      console.error('Error while saving a profile!', error); 
    }

  }

  function loadProfile(){

    if(selected !== undefined){

      const profile = selected;

      const rt = get(runtime);
      const ui = get(user_input);
      const currentModule = rt.find(device => device.dx == ui.brc.dx && device.dy == ui.brc.dy);

      if(currentModule.id.substr(0,4) == profile.type){

        writeBuffer.add_first({
          commandCb: function(){
            engine.set('DISABLED');
            logger.set({type: 'progress', mode: 0, classname: 'profileload', message: `Profile load started...`})
          }
        });

        runtime.update.batch(profile.configs);

        writeBuffer.add_last({
          commandCb: function(){
            engine.set('ENABLED');
            logger.set({type: 'success', mode: 0, classname: 'profileload', message: `Profile load complete!`});
            runtime.update.one().trigger();
          }
        });

      } else {

        logger.set({type: 'alert', mode: 0, classname: 'profileload', message: `Profile is not made for ${currentModule.id.substr(0,4)}!`})

      }
    }
  }


  onMount(async ()=> {
    PROFILE_PATH = await ipcRenderer.invoke('getStoreValue', 'profiles_folder'); 
    if(PROFILE_PATH) loadFilesFromDirectory(PROFILE_PATH);
  })

</script>

<profiles class="w-full h-full p-4 flex flex-col justify-start bg-primary { $engine == 'ENABLED' ? '' : 'pointer-events-none'}">

    <div class="w-full flex flex-col justify-between pb-2 px-2">
      <button on:click={openDirectory} class="px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none">Select Local Folder</button>
      <div class="text-gray-400 py-1 mt-1 text-sm break-all">Selected folder: {PROFILE_PATH}</div>
    </div>

    <div in:fade={{delay:0}} class="bg-secondary bg-opacity-25 rounded-lg p-4 flex flex-col justify-start items-start">

      <div class="text-white pb-2">Save Profile To Local Folder</div>

      <div class="flex flex-col w-full py-2">
        <div class="text-sm text-gray-500 pb-1">Profile Name</div>
        <input 
          bind:value={newProfile.name}
          type="text" 
          placeholder="Name of this profile..."
          class="w-full bg-secondary text-white py-1 pl-2 rounded-none">
      </div>

      <div class="flex flex-col w-full py-2">
        <div class="text-sm text-gray-500 pb-1">Description</div>
        <textarea 
          bind:value={newProfile.description}
          type="text" 
          placeholder="What does this profile do?"
          class="w-full bg-secondary text-white py-1 pl-2 rounded-none"/>
      </div>

      <div class="flex flex-col w-full py-2">
        <div class="text-sm text-gray-500 pb-1">Module Type</div>
        <input 
          bind:value={newProfile.type}
          type="text" 
          class="w-full bg-secondary text-gray-200 py-1 pl-2 rounded-none pointer-events-none"/>
      </div>

      <button on:click={prepareSave} disabled={newProfile.name.length == 0 ? true : false} class="{newProfile.name.length <= 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100  hover:bg-commit-saturate-10'} transition w-full px-2 py-2 my-2 block rounded text-white bg-commit  border-none focus:outline-none">Save</button>

    </div>


    <div in:fade={{delay:200}} class="primary rounded-lg bg-opacity-25 bg-secondary px-4 py-2 h-full mt-4 flex flex-col justify-start items-start overflow-hidden">

      <div id="browse-profiles" class="overflow-hidden w-full h-full flex flex-col">
  
        <div id="zero-level" class="w-full h-full flex overflow-y-scroll text-white mt-4">
          <ul class="w-full">
            {#each PROFILES as profile, i}
              <li 
                on:click={()=>{selected = profile; selectedIndex = i}} 
              class="{(i % 2) && (selectedIndex !== i) ? 'bg-opacity-50' : ''} {selectedIndex == i ? 'bg-pick' : 'bg-secondary hover:bg-pick-desaturate-10'} profile p-1 my-1 cursor-pointer ">{profile.name}</li>
            {/each}
          </ul>
        </div>

      </div>
  
      <div class="py-2 text-white">Selected Profile</div>

      <div class="text-gray-200 flex flex-col pointer-events-none w-full">

        <div class="flex flex-col w-full py-2">
          <input 
            bind:value={selected.name}
            type="text" 
            placeholder="Name of this profile"
            class="w-full bg-secondary py-1 pl-2 rounded-none">
        </div>

        <div class="flex flex-col w-full py-2">
          <textarea 
            bind:value={selected.description}
            type="text" 
            placeholder="What this profile does"
            class="w-full bg-secondary py-1 pl-2 rounded-none"/>
        </div>

        <div class="flex flex-col w-full py-2">
          <input 
            bind:value={selected.type}
            type="text" 
            class="w-full bg-secondary text-gray-200 py-1 pl-2 rounded-none pointer-events-none"/>
        </div>

      </div>

      <button on:click={loadProfile} class="bg-commit block {selectedIndex !== undefined ? 'hover:bg-commit-saturate-20' : 'opacity-50'} w-full text-white mt-3 mb-1 py-2 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none">Load Profile To Module</button>

    </div>


</profiles>

<style>

  .profile:first-child{
    margin-top: 0;
  }

  .profile:last-child{
    margin-bottom: 0;
  }

</style>

