<script>

  import { onMount } from 'svelte';

  import { get } from 'svelte/store'

  import { writeBuffer } from '../../../runtime/engine.store.js';
  import { fade, blur, fly, slide, scale } from "svelte/transition";

  const electron = require('electron'); 
  const fs = require('fs'); 

  const { ipcRenderer } = require('electron');


  import { engine, logger, runtime, user_input } from '../../../runtime/runtime.store.js';
  import { isJson } from '../../../runtime/_utils.js';
  import { appSettings } from '../../_stores/app-helper.store.js';

  import TooltipSetter from '../../user-interface/tooltip/TooltipSetter.svelte';

  let selected = {
    name: '',
    description: '',
    type: ''
  };

  let newProfile = {
    name: '',
    description: '',
    type: ''
  };

  let selectedIndex = undefined;
  
  let selectedShowMore = false;

  let PROFILE_PATH = '';

  let PROFILES = [];

  user_input.subscribe(val => {
    if(val.id){
      newProfile.type = val.id.substr(0,4);
    }
  })

  async function checkIfWritableDirectory(path){

    const stats = fs.promises.stat(path).then(res => {return {isFile: res.isFile(), isDirectory: res.isDirectory()}});

    return await Promise.all([stats])

  }

  appSettings.subscribe(store => {

    let new_folder = store.persistant.profileFolder;

    if (new_folder !== PROFILE_PATH){
      PROFILE_PATH = new_folder;
      loadFilesFromDirectory(PROFILE_PATH)
    }

  })


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
        logger.set({type: 'success', mode: 0, classname: 'profilesave', message: `Profile saved!`});
        loadFilesFromDirectory(PROFILE_PATH);
    }); 
  }

  function prepareSave() { 

    let callback = function(){           
      logger.set({type: 'progress', mode: 0, classname: 'profilesave', message: `Ready to save profile!`});

      const li = get(user_input);
  
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
  
        if(d.dx == li.brc.dx && d.dy == li.brc.dy){
  
          const page = d.pages.find(x => x.pageNumber == li.event.pagenumber);
  
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

      engine.set('ENABLED');
    };

    runtime.fetch_page_configuration_from_grid(callback);

  }

  function loadProfile(){

    if(selected !== undefined){

      const profile = selected;

      const rt = get(runtime);
      const ui = get(user_input);
      const currentModule = rt.find(device => device.dx == ui.brc.dx && device.dy == ui.brc.dy);

      if(currentModule.id.substr(0,4) == profile.type){


        runtime.whole_page_overwrite(profile.configs);



      } else {

        logger.set({type: 'alert', mode: 0, classname: 'profileload', message: `Profile is not made for ${currentModule.id.substr(0,4)}!`})

      }
    }
  }


  onMount(async ()=> {
    PROFILE_PATH = await ipcRenderer.invoke('getStoreValue', 'profiles_folder'); 
    if(PROFILE_PATH) loadFilesFromDirectory(PROFILE_PATH);
  })

  function checkIfOk(profile){

    let ok = true;

    if(profile.name == ''){
      ok = false;
    }

    if(profile.type == ''){
      ok = false;
    }

    return ok;
  }

</script>

<profiles class="w-full h-full p-4 flex flex-col justify-start bg-primary { $engine == 'ENABLED' ? '' : 'pointer-events-none'}">



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

      <button 
      on:click={prepareSave} 
      disabled={!checkIfOk(newProfile)} 
      class="{!checkIfOk(newProfile) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100  hover:bg-commit-saturate-10'} transition w-full px-2 py-2 my-2 block rounded text-white bg-commit relative  border-none focus:outline-none">
        <div>Save</div>
        <TooltipSetter mode={1} key={"profile_save"}/>
      </button>

    </div>



    <div class="pt-2 text-white flex items-center relative">
      <div class="">Load Profile</div>
      <TooltipSetter mode={2} key={"profile_load_profile"}/>
    </div>
    <div id="browse-profiles" class="overflow-hidden w-full h-full flex flex-col">

      <div id="zero-level" class="w-full h-full flex overflow-y-scroll text-white mt-4">
        <ul class="w-full">
          {#each PROFILES as profile, i}
            <li
              on:click={()=>{if (selected !== profile){selectedShowMore = false} selected = profile; selectedIndex = i;}} 
              class="{selectedIndex == i ? 'border-pick bg-secondary' : 'bg-secondary bg-opacity-40 border-primary hover:bg-opacity-70 hover:border-pick-desaturate-10'} border-l-4 profile p-2 my-2 mr-2 cursor-pointer ">
              <div class="w-full">{profile.name}</div> 
             
             
              {#if (selectedIndex === i)}
                  <textarea 
                    
                    in:slide out:slide
                    bind:value={profile.description}
                    type="text" 
                    placeholder="No description available"
                    class="w-full bg-primary p-1 rounded-none h-36 resize-none "/>
            

              {/if}
             
              <div class="flex text-xs opacity-80 font-semibold">
                <div class="m-1 text-center rounded-full w-12 {newProfile.type==profile.type?"bg-green-500":"bg-gray-600"} ">{profile.type}</div>
                <div class="m-1 text-center rounded-full w-12 bg-gray-900"> v{profile.version.major}.{profile.version.minor}.{profile.version.patch}</div>
              
              </div>



            </li>
          {/each}
        </ul>
      </div>

    </div>

    <button 
      on:click={loadProfile} 
      disabled={selectedIndex === undefined} 
      class="relative bg-commit block {selectedIndex !== undefined ? 'hover:bg-commit-saturate-20' : 'opacity-50 cursor-not-allowed'} w-full text-white mt-3 mb-1 py-2 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none">
      <div>Load Profile To Module</div>
      <TooltipSetter mode={1} key={"profile_load_to_module"}/>
    </button>




</profiles>

<style>

  .profile:first-child{
    margin-top: 0;
  }

  .profile:last-child{
    margin-bottom: 0;
  }

</style>

