<script>
  import { onMount } from 'svelte';

  import { get } from 'svelte/store'

  import { fade } from 'svelte/transition'
  import { writeBuffer } from '../../../runtime/engine.store.js';
  
  const electron = require('electron'); 
  const path = require('path'); 
  const fs = require('fs'); 

  const { ipcRenderer } = require('electron');

  // Importing dialog module using remote 
  const dialog = electron.remote.dialog; 

  import { engine, logger, runtime, user_input } from '../../../runtime/runtime.store.js';
  import { appSettings } from '../../_stores/app-helper.store.js';

  let selected;

  let PROFILE_PATH = '';

  let PROFILES = [];

  let profileName = '';

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


  function loadFilesFromDirectory(path){
    PROFILES = [];
    fs.readdir(path, (err, files) => {
      files.forEach(file => {
        fs.readFile(`${path + "/" + file}`,'utf-8', function (err, data) { 
            if (err) throw err; 
            let obj = JSON.parse(data);
            PROFILES = [...PROFILES, obj]
        });
      })
    });
  }


  function saveProfile(profileName, profile) {
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
            name: profileName, 
            meta: {
              type: '', 
              version: {
                major: $appSettings.version.major, 
                minor: $appSettings.version.minor, 
                patch: $appSettings.version.patch
              }
            }
          }

          configs.forEach(d => {
            if(d.dx == _user_input.brc.dx && d.dy == _user_input.brc.dy){

              profile.configs = d.pages[_user_input.event.pagenumber].control_elements.map(cfg => {
                return cfg.events.map(ev => {
                  return {
                    event: ev.event.value,
                    config: ev.config
                  }
                })
              });

              profile.meta.type = d.id;

            }
          })    

          saveProfile(profileName, profile);
          
        }
      });


    } catch (error) {
      console.error('Error while saving a profile!', error); 
    }

  }

  function loadProfile(){

    if(selected !== undefined){

      const profile = PROFILES[selected];

      const rt = get(runtime);
      const ui = get(user_input);
      const currentModule = rt.find(device => device.dx == ui.brc.dx && device.dy == ui.brc.dy);

      if(currentModule.id.substr(0,4) == profile.meta.type.substr(0,4)){

        console.log('Its a match!');

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
            logger.set({type: 'success', mode: 0, classname: 'profileload', message: `Profile load complete!`})
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


    <div class="text-white my-2 px-1">Profiles</div>

    <div in:fade={{delay:0}} class="primary rounded-lg py-2 flex justify-between items-center">
      <input 
        bind:value={profileName} 
        type="text" 
        placeholder="Name of this profile"
        class="w-full bg-secondary text-white py-1 pl-2 rounded-none">
        
    </div>

    <button on:click={prepareSave} disabled={profileName.length == 0 ? true : false} class="{profileName.length <= 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100 hover:bg-pick-saturate-10'} transition px-2 py-1 my-2 block rounded w-20 text-white bg-pick  border-none focus:outline-none">Save</button>

    <div in:fade={{delay:250}} id="browse-profiles" class="w-full flex flex-col py-2 border  border-primary rounded-lg">
      
      <div class="w-full flex flex-col justify-between border-b-2 border-gray-700 pb-2">
        <div class="text-white my-2 px-1">Browse Profiles</div>
        <button on:click={openDirectory} class="px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-10 focus:outline-none">Select Folder</button>
        <div class="text-gray-400 py-1 mt-1 text-sm break-all">{PROFILE_PATH}</div>
      </div>


      <div id="zero-level" class="w-full my-2 flex flex-grow text-white">
        <ul class="w-full">
          {#each PROFILES as profile, i}
            <li 
              on:click={()=>{selected = i}} 
            class="{(i % 2) && (selected !== i) ? 'bg-opacity-50' : ''} {selected == i ? 'bg-pick' : 'bg-secondary hover:bg-pick-desaturate-10'} p-1 my-1 cursor-pointer ">{profile.name}</li>
          {/each}
        </ul>
      </div>

      

      <button on:click={loadProfile} class="bg-commit  {selected !== undefined ? 'hover:bg-commit-saturate-20' : 'opacity-50'} w-full text-white py-2 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none">Load Profile To Module</button>

    </div>

  </profiles>


