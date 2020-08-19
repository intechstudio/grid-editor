<script>

  const electron = require('electron'); 
  const path = require('path'); 
  const fs = require('fs'); 

  // Importing dialog module using remote 
  const dialog = electron.remote.dialog; 
    
  function saveFile() { 
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

  function openFile(){
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
          console.log(file.canceled, file.filePaths); 
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
</script>

<div>

<button on:click={saveFile} class="text-white p-2 m-2 bg-highlight border-0">Save file</button>
<button on:click={openFile} class="text-white p-2 m-2 bg-highlight border-0">Open file</button>

</div>