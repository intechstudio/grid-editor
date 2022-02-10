<script>
  import { onDestroy, onMount } from "svelte";
  import { appSettings, openInBrowser} from "../../runtime/app-helper.store";

  import {clickOutside} from '../_actions/click-outside.action'

  import { writable, get, readable } from 'svelte/store';

  import * as grid_protocol from '../../../external/grid-protocol/grid_protocol_bot.json'

  let version = `${get(appSettings).version.major}.${get(appSettings).version.minor}.${get(appSettings).version.patch}`

  //import '../../../node_modules/monaco-editor/min/vs/loader.js'
  //import * as monaco from 'monaco-editor'
  //import '../../../node_modules/monaco-editor/min/vs/loader.js'
  import * as monaco from '../../../../node_modules/monaco-editor/esm/vs/editor/editor.api'

  let monaco_block;

  let monaco_disposables = []

  let editor;

  let commitState = 0;


  function commit(){

    for(let i=0; i<monaco_disposables.length; i++){
      monaco_disposables[i].dispose()
    }
    $appSettings.monaco_code_committed = editor.getValue() 

    commitState = 0;

  }

  onDestroy(()=>{

    commit();

  })


  let hoverTips = {};
  let hoverDisposable = undefined;

  let toColorize;

  onMount(()=>{

    (function init_autocomplete(){


      function createDependencyProposals(range) {

        let proposalList = []

        for (const key in grid_protocol) {
          if(typeof grid_protocol[key] !== 'object'){

            let proposalItem = {
              label: '',
              kind: monaco.languages.CompletionItemKind.Function,
              documentation: 'Documentation',
              insertText: '',
              range: range
            }
      
            // AUTOCOMPLETE FUNCTIONS
            if(key.startsWith('GRID_LUA_FNC_G') && key.endsWith("_human")){
              proposalItem.label = grid_protocol[key]
              proposalItem.insertText = grid_protocol[key] + "()"

              hoverTips[grid_protocol[key]] = "Global function named " + grid_protocol[key]
              
            }        
            
            
            if(key.startsWith('GRID_LUA_FNC_E') && key.endsWith("_human")){


              hoverTips[grid_protocol[key]] = "Encoder function named " + grid_protocol[key]

              if ($appSettings.monaco_element === 'encoder'){
                proposalItem.label = "self:" + grid_protocol[key]
                proposalItem.insertText = "self:" + grid_protocol[key] + "()"
              }
              else if ($appSettings.monaco_element === 'system'){
                proposalItem.label = "element[0]:" + grid_protocol[key]
                proposalItem.insertText = "element[0]:" + grid_protocol[key] + "()"
              }
            }            

            if(key.startsWith('GRID_LUA_FNC_B') && key.endsWith("_human")){

              hoverTips[grid_protocol[key]] = "Button function named " + grid_protocol[key]

              if ($appSettings.monaco_element === 'button'){
                proposalItem.label = "self:" + grid_protocol[key]
                proposalItem.insertText = "self:" + grid_protocol[key] + "()"
              }
              else if ($appSettings.monaco_element === 'system'){
                proposalItem.label = "element[0]:" + grid_protocol[key]
                proposalItem.insertText = "element[0]:" + grid_protocol[key] + "()"
              }
            }

            if(key.startsWith('GRID_LUA_FNC_P') && key.endsWith("_human")){

              hoverTips[grid_protocol[key]] = "Potmeter function named " + grid_protocol[key]

              if ($appSettings.monaco_element === 'potentiometer'){
                proposalItem.label = "self:" + grid_protocol[key]
                proposalItem.insertText = "self:" + grid_protocol[key] + "()"
              }
              else if ($appSettings.monaco_element === 'system'){
                proposalItem.label = "element[0]:" + grid_protocol[key]
                proposalItem.insertText = "element[0]:" + grid_protocol[key] + "()"
              }
            }

            proposalList.push(proposalItem)
          }
        }

        // returning a static list of proposals, not even looking at the prefix (filtering is done by the Monaco editor),
        // here you could do a server side lookup
        return [... proposalList];
      }

      let disposable = monaco.languages.registerCompletionItemProvider('lua', {
        provideCompletionItems: function (model, position) {
          // find out if we are completing a property in the 'dependencies' object.
          var textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          });

          var word = model.getWordUntilPosition(position);
          var range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };
          return {
            suggestions: createDependencyProposals(range)
          };
        }
      });

      monaco_disposables.push(disposable);


    })()  

    monaco_disposables.push(
      monaco.languages.registerHoverProvider('lua', {
        provideHover: function(model, position) { 

          if (model.getWordAtPosition(position) !== null){

            const word = model.getWordAtPosition(position).word;

            if (hoverTips[word] !== undefined)
            return {				
              contents: [
                { value: '**SOURCE**' },
                { value: '```html\n' + hoverTips[word] + '\n```' }
              ]
            }

          }

        }
      })
    );

    editor = monaco.editor.create(monaco_block, {
      value: $appSettings.monaco_code_committed,
      language: 'lua',
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

          {#key commitState}
            <div class="{commitState ? 'text-yellow-600' : 'text-green-500'} text-sm">{commitState ? 'Unsaved changes!' : 'Synced with Grid!' }</div>
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
