<script>
  import { onMount } from 'svelte';

  import { get } from 'svelte/store'

  import { fade } from 'svelte/transition'
  
  const electron = require('electron'); 
  const path = require('path'); 
  const fs = require('fs'); 

  const { ipcRenderer } = require('electron');

  // Importing dialog module using remote 
  const dialog = electron.remote.dialog; 

  import { commands} from '../settings/shared/handshake.store.js';

  import { runtime } from '../stores/runtime.store';

  import { profileStore } from '../stores/profiles.store';

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


  function saveProfile() { 

    const configs = get(runtime)

    const profile = {name: profileName, data: configs}

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
            }); 
        } 

        loadFilesFromDirectory(PROFILE_PATH);

    }).catch(err => { 
        console.log(err) 
    }); 


  }

  function openProfile(){
  // Resolves to a Promise<Object> 
    dialog.showOpenDialog({ 
        title: 'Open Grid configuration file...', 
        defaultPath: path.join(__dirname, '../assets/sample.txt'), 
        // defaultPath: path.join(__dirname, '../assets/'), 
        buttonLabel: 'Open', 
        // Restricting the user to only Text Files. 
        filters: [ 
            { 
                name: 'Text Files', 
                extensions: ['txt', 'docx'] 
            }, ], 
        properties: ['openFile'] 
    }).then(file => { 
        // Stating whether dialog operation was cancelled or not. 
        if (!file.canceled) { 
            const path = file.filePaths[0].toString(); 
              
            // Creating and Writing to the sample.txt file 
            fs.readFile(path,'utf-8', function (err, data) { 
                if (err) throw err; 
                console.log('Data read: ',data)
            }); 
        } 
    }).catch(err => { 
        console.log(err) 
    }); 
  }

  function loadProfile(){
    console.log(selected);
    if(selected !== undefined){
      const profile = PROFILES[selected].data;
      profileStore.set(profile);
    }
  }

  let toggle = false;

  onMount(async ()=> {
    PROFILE_PATH = await ipcRenderer.invoke('getStoreValue', 'profiles_folder'); 
    if(PROFILE_PATH) loadFilesFromDirectory(PROFILE_PATH);
  })

  function width(node, { duration = 250, delay = 0 }) {
    const w = +getComputedStyle(node)['width'].match(/(\d+)px/)[1];
    console.log(w);
		return {
      duration,
      delay,
			css: t => {
        console.log(t*w);
				return `width: ${t * w}px`			
			}
		};
	}

</script>

  <div  class="w-full flex flex-col justify-start items-start">
    <div  class="primary p-4 m-4 rounded-lg z-20"> 
      <div id="profiles" on:click={()=>{toggle = ! toggle}} class="flex cursor-pointer items-center justify-between">
        <div class="text-white">Profiles</div>
        <div class="ml-4 cursor-pointer focus:outline-none focus:bg-primary border-none w-4 h-4">
          <svg class:rotate={toggle} version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            style="fill:white;enable-background:new 0 0 451.846 451.847;" viewBox="0 0 451.846 451.847"
            xml:space="preserve">
            <g>
              <path d="M345.441,248.292L151.154,442.573c-12.359,12.365-32.397,12.365-44.75,0c-12.354-12.354-12.354-32.391,0-44.744
                L278.318,225.92L106.409,54.017c-12.354-12.359-12.354-32.394,0-44.748c12.354-12.359,32.391-12.359,44.75,0l194.287,194.284
                c6.177,6.18,9.262,14.271,9.262,22.366C354.708,234.018,351.617,242.115,345.441,248.292z"/>
            </g>
          </svg>
        </div>
      </div>
      {#if toggle}

        <div class="flex flex-col text-white text-sm">

            <div in:fade={{delay:250}} class="primary rounded-lg py-2 flex justify-between items-center">
              <input 
                bind:value={profileName} 
                type="text" 
                placeholder="Name this profile"
                class="w-full secondary text-white p-1 pl-2 mr-2 rounded-none focus:outline-none">
              <button on:click={saveProfile} class="px-2 py-1 my-2 mr-2 w-20 bg-highlight hover:bg-highlight-400 border-none rounded-none focus:outline-none">Save</button>
            </div>

            <div in:fade={{delay:500}} id="browse-profiles" class="py-2 text-sm border border-primary rounded-lg">
              <div class="flex justify-between border-b-2 border-gray-700 pb-2 items-center">
                <div class="flex flex-col">
                  <div class="">Browse Profiles</div>
                  <div class="text-gray-700 pr-4 pt-1 text-xs">{PROFILE_PATH}</div>
                </div>
                <button on:click={openDirectory} class="px-2 py-1 border border-highlight hover:border-highlight-400 rounded-none focus:outline-none">Select Folder</button>
              </div>

              <div class="flex w-full"> 

                <div id="zero-level" class="flex flex-grow mr-2 p-2">
                  <ul class="w-full">
                    {#each PROFILES as profile, i}
                      <li class:bg-highlight="{selected === i}" on:click={()=>{selected = i}} class="p-1 my-1 cursor-pointer hover:bg-highlight-400">{profile.name}</li>
                    {/each}
                  </ul>
                </div>

              </div>
              
      
              <button on:click={loadProfile} class:bg-highlight-400="{selected !== undefined}" class="ml-2 px-2 py-1 hover:bg-highlight-500 border-highlight rounded-none focus:outline-none">Load Profile</button>

            </div>

        </div>

      {/if}
    </div>  
  </div>



<style>
  .rotate{
    animation: rotationAnim 1s;
    animation-fill-mode: forwards;
  }

  @keyframes rotationAnim {
    from{ transform: rotate(0deg);}
    to{ transform: rotate(90deg);}
  }

</style>