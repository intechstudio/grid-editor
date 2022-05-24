<script>

  import { createEventDispatcher, onMount } from 'svelte';

  import { get } from 'svelte/store'

  import { writeBuffer } from '../../../runtime/engine.store.js';
  import { fade, blur, fly, slide, scale } from "svelte/transition";

  const electron = require('electron'); 
  const fs = require('fs'); 

  const { ipcRenderer } = require('electron');

  const { getGlobal } = require('@electron/remote');
  const trackEvent = getGlobal('trackEvent');

  import { engine, logger, runtime, user_input } from '../../../runtime/runtime.store.js';
  import { isJson } from '../../../runtime/_utils.js';
  import { appSettings, profileListRefresh } from '../../../runtime/app-helper.store.js';
  import { analytics } from '../../../runtime/analytics_influx';

  import { clickOutside } from '../../_actions/click-outside.action';
  import { addOnDoubleClick } from '../../_actions/add-on-double-click';

  import TooltipSetter from '../../user-interface/tooltip/TooltipSetter.svelte';
  import TooltipQuestion from '../../user-interface/tooltip/TooltipQuestion.svelte';

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
  

  let PROFILE_PATH = get(appSettings).persistant.profileFolder;

  let PROFILES = [];

  user_input.subscribe(ui => {

    const rt = get(runtime)

    let device = rt.find(device => device.dx == ui.brc.dx && device.dy == ui.brc.dy)

    if (device === undefined){
      
      return;
    }

    newProfile.type = device.id.substr(0,4);

  })

  async function checkIfWritableDirectory(path){

    const stats = fs.promises.stat(path).then(res => {return {isFile: res.isFile(), isDirectory: res.isDirectory()}});

    return await Promise.all([stats])

  }

  const moveOldProfiles = async function(){

    let path = PROFILE_PATH;

    console.log("Checking for profiles", path)

    if(!fs.existsSync(path)) fs.mkdirSync(path);
    if(!fs.existsSync(path+"/profiles")) fs.mkdirSync(path+"/profiles");
    if(!fs.existsSync(path+"/profiles/user")) fs.mkdirSync(path+"/profiles/user");

    fs.readdir(path, (err, files) => {

      files.forEach(async file => {

        try {

          let filepath = path + "/" + file;
          
          const [stats] = await checkIfWritableDirectory(filepath);

          if(stats.isFile){
            let filenameparts = file.split(".");
            let extension = filenameparts[filenameparts.length-1];
            if (extension === "json"){
              fs.renameSync(path + "/" + file, path + "/profiles/user/" + file);
              console.log("moving: ", file);
            }


          } else {

            //console.info('Not a file!');

          }

        } catch (error) {

          console.error('readFile error...',error)

        }
        
      })

      loadFilesFromDirectory()

    });

  }

  appSettings.subscribe(store => {

    let new_folder = store.persistant.profileFolder;

    if (new_folder !== PROFILE_PATH){

      PROFILE_PATH = new_folder;
      moveOldProfiles();
    }

  })

  profileListRefresh.subscribe(store => {
    if (PROFILE_PATH !== undefined && PROFILE_PATH !== ""){
      loadFilesFromDirectory();
    }
  })

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



  async function loadFilesFromDirectory(){

    let path = PROFILE_PATH;
    // Create the folder if it does not exist
    if(!fs.existsSync(path)) fs.mkdirSync(path);
    if(!fs.existsSync(path+"/profiles")) fs.mkdirSync(path+"/profiles");

    try {

      PROFILES = [];

      const [stats] = await checkIfWritableDirectory(path+"/profiles");

      if(stats.isDirectory){

        // get list of directories
        let dirs = fs.readdirSync(path+"/profiles", { withFileTypes: true })
                    .filter(dirent => dirent.isDirectory())
                    .map(dirent => dirent.name)

        console.log("dirs", dirs)

        // for all directories...
        dirs.forEach(dir => {

          // read all files from dir
          fs.readdir(path + "/profiles/" + dir, (err, files) => {

            files.forEach(async file => {

              try {

                let filepath = path + "/profiles/" + dir + "/" + file;
                
                const [stats] = await checkIfWritableDirectory(filepath);

                if(stats.isFile){

                  fs.readFile(filepath,'utf-8', function (err, data) { 

                      if (err) {
                        throw err
                      }; 

                      if(isJson(data)){                
                        let obj = JSON.parse(data);
                        if(obj.isGridProfile){
                          obj.folder = dir;
                          obj.showMore = false;
                          obj.color = stringToColor(dir)
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


        })



      }

    } catch (error) {
      
      console.error(error);

    }
   
  }

  function saveProfile(path, name, profile){         
    
    if(!fs.existsSync(path)) fs.mkdirSync(path);
    if(!fs.existsSync(path+"/profiles")) fs.mkdirSync(path+"/profiles");
    if(!fs.existsSync(path+"/profiles/user")) fs.mkdirSync(path+"/profiles/user");

    // Creating and Writing to the sample.txt file 
    fs.writeFile(`${path}/profiles/user/${name}.json`, JSON.stringify(profile, null, 4), function (err) { 
        if (err) throw err; 
        console.log('Saved!'); 
        logger.set({type: 'success', mode: 0, classname: 'profilesave', message: `Profile saved!`});

        loadFilesFromDirectory();

        trackEvent('profile-library', 'profile-library: save success')
        analytics.track_event("application", "profiles", "profile", "save success")

    }); 
  }

  function prepareSave() { 

    trackEvent('profile-library', 'profile-library: save start')
    analytics.track_event("application", "profiles", "profile", "save start")

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

    
    trackEvent('profile-library', 'profile-library: load start')
    analytics.track_event("application", "profiles", "profile", "load start")

    if(selected !== undefined){

      const profile = selected;

      const rt = get(runtime);
      const ui = get(user_input);
      const currentModule = rt.find(device => device.dx == ui.brc.dx && device.dy == ui.brc.dy);

      if(currentModule.id.substr(0,4) == profile.type){


        runtime.whole_page_overwrite(profile.configs);

        trackEvent('profile-library', 'profile-library: load success')
        analytics.track_event("application", "profiles", "profile", "load success")


      } else {


        trackEvent('profile-library', 'profile-library: load mismatch')
        analytics.track_event("application", "profiles", "profile", "load mismatch")
        logger.set({type: 'alert', mode: 0, classname: 'profileload', message: `Profile is not made for ${currentModule.id.substr(0,4)}!`})

      }
    }
  }

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


  function compare( a, b ) {
    if ( a.name < b.name ){
      return -1;
    }
    if ( a.name > b.name ){
      return 1;
    }
    return 0;
  }


  // use:clickOutside={{useCapture: true}}
  // on:click-outside={()=>{selected = undefined; selectedIndex = undefined;}} 
</script>

<profiles

  class="w-full h-full p-4 flex flex-col justify-start bg-primary { $engine == 'ENABLED' ? '' : 'pointer-events-none'}">

    <div in:fade={{delay:0}} class="bg-secondary bg-opacity-25 rounded-lg p-4 flex flex-col justify-start items-start">

      <div class="text-white pb-2">Save module profile to local folder</div>

      <div class="flex flex-col w-full py-2">
        <div class="text-sm text-gray-500 pb-1">Profile name</div>
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
        <TooltipSetter key={"profile_save"}/>
      </button>

    </div>



    <div class="pt-2 text-white flex items-center relative">
      <div class="">Profile Library</div>
      <TooltipQuestion key={"profile_load_profile"}/>
      <button 
        on:click={loadFilesFromDirectory} 
        class="relative inline-block bg-secondary ml-auto p-1 text-white rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none">
        <div>Refresh List</div>
      </button>    
    </div>
    <div id="browse-profiles" class="overflow-hidden w-full h-full flex flex-col">

      <div id="zero-level" class="w-full h-full flex overflow-y-auto text-white mt-2">
        <ul class="w-full">

          {#if PROFILES.length === 0}

            <div in:fade={{delay:500}} class="text-yellow-500"><b>Profiles not found!</b></div>           
            <div in:fade={{delay:1000}} class="text-yellow-500">Setup profile folder and download the default profile library in the Preferences menu...</div>
            
          {/if}
          

          {#each PROFILES.sort( compare ) as profile, i}
            <li
              on:click={()=>{selected = profile; selectedIndex = i;}}                   
              use:addOnDoubleClick 
              on:double-click={()=>{profile.showMore = !profile.showMore;}} 
              class="{selectedIndex == i ? 'border-pick bg-secondary' : 'bg-secondary bg-opacity-40 border-primary hover:bg-opacity-70 hover:border-pick-desaturate-10'} border-l-4 profile p-2 my-2 cursor-pointer relative">
              <div class="w-full">{profile.name}</div> 
              

            
              {#if (profile.showMore === true)}
                <textarea                   
                  in:slide out:slide
                  bind:value={profile.description}
                  type="text" 
                  placeholder="No description available"
                  class="w-full bg-primary p-1 rounded-none h-36 resize-none "/>
              {/if}
             
              <div class="flex text-xs opacity-80 font-semibold">
                <div class="m-1 flex justify-center text-center rounded-full px-2 inline-block {newProfile.type==profile.type?"bg-green-500":"bg-gray-600"} ">{profile.type}</div>
                <div class="m-1 flex justify-center text-center rounded-full px-2 inline-block bg-gray-900"> v{profile.version.major}.{profile.version.minor}.{profile.version.patch}</div>
                <div class="m-1 flex justify-center text-center rounded-full px-2 inline-block" style="background-color: {profile.color}"> by {profile.folder}</div>
              
              </div>

              <div
                in:fade
                class="opacity-10  w-6 h-6 bg-primary absolute  hover:opacity-70 text-center right-0 bottom-0" on:click={()=>{profile.showMore = !profile.showMore;}}>
                {profile.showMore?"▲":"▼"}
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
      <TooltipSetter key={"profile_load_to_module"}/>
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

