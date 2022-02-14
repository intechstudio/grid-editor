<script>
  import { onDestroy, onMount } from "svelte";
  import { appSettings, openInBrowser} from "../../runtime/app-helper.store";

  import {clickOutside} from '../_actions/click-outside.action'

  import { writable, get, readable } from 'svelte/store';


  let version = `${get(appSettings).version.major}.${get(appSettings).version.minor}.${get(appSettings).version.patch}`

  //import '../../../node_modules/monaco-editor/min/vs/loader.js'
  //import * as monaco from 'monaco-editor'
  //import '../../../node_modules/monaco-editor/min/vs/loader.js'
  import * as monaco from '../../../../node_modules/monaco-editor/esm/vs/editor/editor.api'

  let monaco_block;

  let monaco_disposables = []

  let editor;

  let commitState = 0;

  let error_messsage = ""

  import * as luamin from "../../main/user-interface/code-editor/luamin.js";
  import stringManipulation from '../../main/user-interface/_string-operations';


  let luaminOptions = {
    RenameVariables: false, // Should it change the variable names? (L_1_, L_2_, ...)
    RenameGlobals: false, // Not safe, rename global variables? (G_1_, G_2_, ...) (only works if RenameVariables is set to true)
    SolveMath: false, // Solve math? (local a = 1 + 1 => local a = 2, etc.)
  }

  function commit(){

    const editor_code = editor.getValue() 
    const short_code = stringManipulation.shortify(editor_code);

    try {
      const minified_code = luamin.Minify(short_code, luaminOptions)
      $appSettings.monaco_code_committed = minified_code
      commitState = 0;
      error_messsage = ''

    } catch (error) {
      error_messsage = 'Syntax Error: ' + error;
    }
    
    


  }

  onDestroy(()=>{

    monaco_disposables.forEach(element => {
      element.dispose();
    });


  })


  let toColorize;

  onMount(()=>{

    let human = stringManipulation.humanize($appSettings.monaco_code_committed)
    let beautified = luamin.Beautify(human, {RenameVariables: false,RenameGlobals: false, SolveMath: false});
  
    if( beautified.charAt( 0 ) === '\n' )
        beautified = beautified.slice( 1 );


    editor = monaco.editor.create(monaco_block, {
      value: beautified,
      language: 'intech_lua',
      theme: "my-theme"
    });

    editor.getModel().onDidChangeContent((event) => {

      if (editor.getValue() !== $appSettings.monaco_code_committed){
        commitState = 1;
      }
      else{
        commitState = 0;
      }
      
    });

  })


</script>


<div id="modal-copy-placeholder"></div>

<modal class=" z-40 flex absolute items-center justify-center w-full h-screen bg-primary bg-opacity-50">

  <div use:clickOutside={{useCapture:true}} on:click-outside={()=>{$appSettings.modal = ''}}  id="clickbox" 
    class=" z-50 w-1/2 h-1/2 text-white relative flex flex-col shadow bg-primary bg-opacity-100 items-start opacity-100">

      <div class=" bg-black bg-opacity-10  p-8 flex-col w-full flex justify-between items-center">

        <div class="flex w-full text-4xl opacity-90">Grid Editor {version}</div>
        <div class="flex w-full text-2xl opacity-70 ">Intech Studio</div>        

        <div on:click={()=>{$appSettings.modal = ''}} id="close-btn" 
          class="p-1  absolute top-6 right-6 cursor-pointer rounded not-draggable hover:bg-secondary">
          <svg class="w-5 h-5 p-1 fill-current text-gray-300" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
            <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
          </svg>
        </div>

      </div>

      <div class="flex-col w-full h-full min-w-max flex justify-between">  

        <div bind:this={monaco_block} class="flex-col w-full h-full min-w-max flex justify-between"></div>

      </div>

 
      <div class="flex flex-row w-full h-content bg-black bg-opacity-10 flex justify-between items-center"> 
       
        <div class="flex flex-col h-full p-6">
            <div class="flex w-full opacity-70 ">Grid Editor is Open-Source Software</div>
            <div class="flex w-full opacity-40 ">Developed by Intech Studio</div>
        </div>

        <div class="flex flex-row items-center h-full p-6">

          {#key commitState + error_messsage}
          <div class="flex flex-col">

            <div class="text-right text-sm {commitState ? 'text-yellow-600' : 'text-green-500'} ">{commitState ? 'Unsaved changes!' : 'Synced with Grid!' }</div>
            <div class="text-right text-sm text-red-600">{error_messsage}</div> 

          </div>
          {/key}
          
          <button on:click={commit} disabled={!commitState} class="mx-2 p-2 { commitState ? 'opacity-100' : 'opacity-50 pointer-events-none'} bg-commit hover:bg-commit-saturate-20 text-white rounded text-sm focus:outline-none">Commit</button>


          <button on:click={()=>{$appSettings.modal = ''}} id="close-btn" 
            class="p-1  cursor-pointer rounded not-draggable hover:bg-secondary bg-primary">
            Close
          </button>

        </div>

        

      </div>

    </div>



</modal>
