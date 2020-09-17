<script>
import { onMount } from 'svelte';


  const electron = require('electron'); 
  const path = require('path'); 
  const fs = require('fs'); 

  const { ipcRenderer } = require('electron');

  // Importing dialog module using remote 
  const dialog = electron.remote.dialog; 

  let selected;

  let PROFILE_PATH = '';

  let PROFILES = [];

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
            PROFILES = [...PROFILES, data]
        });
      })
    });
  }


  function saveProfile() { 
    // Resolves to a Promise<Object> 
    dialog.showSaveDialog({ 
        title: 'Select the File Path to save', 
        defaultPath: path.join(__dirname, '../assets/sample.txt'), 
        // defaultPath: path.join(__dirname, '../assets/'), 
        buttonLabel: 'Save', 
        // Restricting the user to only Text Files. 
        filters: [ 
            { 
                name: 'Text Files', 
                extensions: ['txt', 'docx'] 
            }, ], 
        properties: [] 
    }).then(file => { 
        // Stating whether dialog operation was cancelled or not. 
        console.log(file.canceled); 
        if (!file.canceled) { 
            const path = file.filePath.toString(); 
              
            // Creating and Writing to the sample.txt file 
            fs.writeFile(path, 'This is a Sample File', function (err) { 
                if (err) throw err; 
                console.log('Saved!'); 
            }); 
        } 
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
    console.log('Load profile...')
  }

  onMount(async ()=> {
    PROFILE_PATH = await ipcRenderer.invoke('getStoreValue', 'profiles_folder'); 
    if(PROFILE_PATH) loadFilesFromDirectory(PROFILE_PATH);
  })

</script>

  <div id="profiles" class="text-white absolute w-full" style="z-index:9999;">

    <div class=" flex flex-col w-1/3 p-4 rounded-lg ">

        <div class="primary rounded-lg flex justify-between items-center p-2 m-2">
          <div class="p-2">Save this profile you made on the control surface...</div>
          <button on:click={saveProfile} class="px-2 py-1 bg-highlight hover:bg-highlight-400 border-none rounded-none focus:outline-none">Save Profile</button>
        </div>

        <div id="browse-profiles" class=" p-2 m-2 text-sm border border-primary rounded-lg">
          <div class="flex justify-between border-b-2 border-gray-700 pb-2 pl-1 items-center">
            <div class="">Browse Profiles</div>
            <div class="text-gray-700 text-xs">{PROFILE_PATH}</div>
            <button on:click={openDirectory} class="px-2 py-1 border border-highlight hover:border-highlight-400 rounded-none focus:outline-none">Select Folder</button>
          </div>

          <div class="flex w-full"> 

            <div id="zero-level" class="flex flex-grow mr-2 p-2">
              <ul class="w-full">
                {#each PROFILES as profile, i}
                  <li class:bg-highlight="{selected === i}" on:click={()=>{selected = i}} class="p-1 my-1 cursor-pointer hover:bg-highlight-400">{profile}</li>
                {/each}
              </ul>
            </div>

            <!--
            <div id="first-level" class="flex w-1/3 flex-col mr-2 p-2">
              <div id="browse-global-settings">
                <div class="border-b-2 border-gray-700 pb-1 pl-1">Global Settings</div>
                <div class="rounded-lg my-4">
                  <ul>
                    {#each ['bank-1', 'bank-2', 'bank-3', 'bank-4'] as file, i}
                      <li class:bg-highlight="{selected === i}" on:click={()=>{selected = i}} class="p-1 cursor-pointer hover:bg-highlight-400">{file}</li>
                    {/each}
                  </ul>
                </div>
              </div>
    
              <div id="browse-module-settings">
                <div class="border-b-2 border-gray-700 pb-1 pl-1">Module Settings</div>
                <div class="rounded-lg my-4">
                  <ul>
                    {#each ['PBF4 [0;0]', 'EN16 [0;-1]', 'BU16 [1;0]'] as file, i}
                      <li class:bg-highlight="{selected === i}" on:click={()=>{selected = i}} class="p-1 cursor-pointer hover:bg-highlight-400">{file}</li>
                    {/each}
                  </ul>
                </div>
              </div>
            </div>
  
            <div id="second-level" class="flex w-1/3 mr-2 p-2">
              <div id="browse-bank-settings">
                <div class="border-b-2 border-gray-700 pb-1 pl-1">Bank Settings</div>
                <div class="rounded-lg my-4">
                  <ul>
                    {#each ['Ableton', 'Orchestral Stuff', 'Macros'] as file, i}
                      <li class:bg-highlight="{selected === i}" on:click={()=>{selected = i}} class="p-1 cursor-pointer hover:bg-highlight-400">{file}</li>
                    {/each}
                  </ul>
                </div>
              </div>
            </div>
            -->
          </div>
          
  
          <button on:click={loadProfile} class:bg-highlight-400="{selected !== undefined}" class="ml-2 px-2 py-1 hover:bg-highlight-500 border-highlight rounded-none focus:outline-none">Load Profile</button>

        </div>

    </div>

  </div>