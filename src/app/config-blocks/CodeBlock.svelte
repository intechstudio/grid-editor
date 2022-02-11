<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'cb',
    name: 'CodeBlock',
    rendering: 'standard',
    category: 'code',
    desc: 'Code Block',
    color: '#887880',
    defaultLua: 'print("hello")',
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 333 265" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M329.594 123.925L252.587 42.2591C247.854 37.2344 239.954 37.0052 234.934 41.7467C229.922 46.4843 229.689 54.3964 234.426 59.4172L303.345 132.5L234.426 205.591C229.689 210.612 229.922 218.52 234.934 223.262C237.349 225.541 240.433 226.67 243.505 226.67C246.823 226.67 250.136 225.354 252.588 222.757L329.595 141.087C334.135 136.267 334.135 128.742 329.594 123.925Z" fill="black"/>
      <path d="M98.5775 205.588L29.6629 132.5L98.5775 59.4133C103.31 54.3925 103.082 46.4798 98.0657 41.7428C93.0537 37.0052 85.1449 37.2344 80.4126 42.2552L3.4058 123.921C-1.13527 128.738 -1.13527 136.267 3.4058 141.084L80.4165 222.754C82.8724 225.358 86.1816 226.671 89.4993 226.671C92.5711 226.671 95.656 225.537 98.0657 223.258C103.086 218.52 103.31 210.608 98.5775 205.588Z" fill="black"/>
      <path d="M186.703 0.142824C179.889 -0.890373 173.512 3.79254 172.471 10.6135L135.841 250.612C134.8 257.437 139.483 263.816 146.301 264.858C146.942 264.954 147.574 265 148.203 265C154.268 265 159.588 260.571 160.533 254.387L197.163 14.3888C198.204 7.56336 193.521 1.18448 186.703 0.142824Z" fill="black"/>
    </svg>
    `
  }

</script>

<script>

  import CodeEditor from '../main/user-interface/code-editor/CodeEditor.svelte';

  import * as luamin from "../main/user-interface/code-editor/luamin.js";

  import {createEventDispatcher, onMount} from 'svelte';

  import {fly} from 'svelte/transition';

  import { parenthesis } from './_validators';
  import stringManipulation from '../main/user-interface/_string-operations';
  import { engine, logger } from '../runtime/runtime.store';
  import { clickOutside } from '../main/_actions/click-outside.action';

  import {appSettings} from "../runtime/app-helper.store"

  import * as monaco from '../../../node_modules/monaco-editor/esm/vs/editor/editor.api'

  const dispatch = createEventDispatcher();

  export let config;
  export let index;
  export let advanced;
  export let advancedClickAddon;
  export let access_tree

  let codeEditorContent = '';
  let committedCode = '';

  let doc = '';
  let codePreview;

  $: prepareDoc(config.script);

  let luaminOptions = {
    RenameVariables: false, // Should it change the variable names? (L_1_, L_2_, ...)
    RenameGlobals: false, // Not safe, rename global variables? (G_1_, G_2_, ...) (only works if RenameVariables is set to true)
    SolveMath: false, // Solve math? (local a = 1 + 1 => local a = 2, etc.)
  }

  function prepareDoc(script){

    let code = '';
    code = luamin.Beautify(script, luaminOptions);
    code = stringManipulation.humanize(code);
    code = luamin.Beautify(code, luaminOptions);
    doc = code.trim();
  }

  function stringFromCodeEditor(code){
    codeEditorContent = code;
    if(parenthesis(codeEditorContent)){
      parenthesisError = 0;
    } else {
      parenthesisError = 1;
    }
  }

  let f = 0;
  function prepareSendData(){
    f++;
  }

  function sendData(){
    let outputCode = codeEditorContent;
    if(parenthesis(outputCode)){
      try {
        committedCode = outputCode;
        outputCode = stringManipulation.shortify(outputCode);
        outputCode = luamin.Minify(outputCode, luaminOptions)
        dispatch('output', {short: 'cb', script: outputCode});
      } catch (error) {
        console.error('CodeBlock data dispatch unsuccessful.', JSON.stringify(error));
      }
      
    }
  }


  const creation_timestamp = Date.now();

  onMount(()=>{
    let human = stringManipulation.humanize(config.script)

    let beautified = luamin.Beautify(human, {RenameVariables: false,RenameGlobals: false, SolveMath: false});
       
    if( beautified.charAt( 0 ) === '\n' )
        beautified = beautified.slice( 1 );

    committedCode = beautified
    codePreview.innerHTML  = beautified

    monaco.editor.defineTheme('my-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { 
          token: 'customClass', 
          foreground: 'ffa500',
          fontStyle: 'italic underline' 
        }
      ],
      colors: {
        'editor.background': '#2a343900',
      }
    });


    monaco.editor.colorizeElement(codePreview, {theme: "my-theme"});

  })

  $: if(committedCode != $appSettings.monaco_code_committed && $appSettings.monaco_code_committed !== undefined){

    if ($appSettings.monaco_timestamp == creation_timestamp){

      codeEditorContent = $appSettings.monaco_code_committed;

      let beautified = luamin.Beautify(codeEditorContent, {RenameVariables: false,RenameGlobals: false, SolveMath: false});
   
      if( beautified.charAt( 0 ) === '\n' )
        beautified = beautified.slice( 1 );

      codePreview.innerHTML = beautified
      monaco.editor.colorizeElement(codePreview, {theme: "my-theme"});
      sendData()
      console.log("initbug")

    }
  }

  function open_monaco(){

    $appSettings.monaco_element = "encoder";  

    $appSettings.monaco_code_committed = committedCode
    $appSettings.monaco_timestamp = creation_timestamp

    $appSettings.modal = "code";

  }


</script>


<code-block   
  class="w-full flex flex-col p-4">

    <div class="w-full flex flex-col">

      <div class="text-gray-500 text-sm font-bold">Code preview:</div>
      
    </div>
   
    <pre on:dblclick={open_monaco} class="bg-secondary opacity-80 my-4 p-2" bind:this={codePreview}  data-lang="lua" ></pre>
   
    <button on:click={open_monaco} class="bg-commit hover:bg-commit-saturate-20 text-white rounded px-2 py-0.5 text-sm focus:outline-none">Edit Code</button>
   
</code-block>

