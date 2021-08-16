<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'cb',
    name: 'CodeBlock',
    groupType: 'standard',
    desc: 'Code Block',
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

  import {createEventDispatcher, onMount} from 'svelte';

  import {fly} from 'svelte/transition';

  import { parenthesis } from './_validators';
  import stringManipulation from '../main/user-interface/_string-operations';
  import { engine, logger } from '../runtime/runtime.store';
  import { clickOutside } from '../main/_actions/click-outside.action';

  export let config;
  export let index;
  export let humanScript;
  export let advanced;
  export let advancedClickAddon;

  let codeEditorContent = '';
  let committedCode = '';
  let parenthesisError = 0;

  export let commitState = 1;

  const dispatch = createEventDispatcher();

  function stringFromCodeEditor(code){
    codeEditorContent = code;
    if(parenthesis(codeEditorContent)){
      parenthesisError = 0;
    } else {
      parenthesisError = 1;
    }
  }

  function sendData(){
    let outputCode = codeEditorContent;
    if(parenthesis(outputCode)){
      committedCode = outputCode;
      outputCode = stringManipulation.shortify(outputCode);
      dispatch('output', {short: 'cb', script: outputCode});
      commitState = 0;
    }
  }

  $: {
    if(codeEditorContent.trim() == committedCode.trim()){
      commitState = 0;
    } else {
      commitState = 1;
    }
  }


  $: if(commitState == 1){
    engine.set('DISABLED');
  } else {
    engine.set('ENABLED');
  }

  function showAlert(){
    if(commitState == 1){
      logger.set({type: 'alert', classname: 'code_editor_commit', mode: 0, message: 'Commit your changes first!'})
    }
  }

  onMount(()=>{
    committedCode = stringManipulation.humanize(config.script)
    codeEditorContent = committedCode;
  })

</script>


{#if !advanced}
<code-block 
  use:clickOutside={{useCapture: false}}
  on:click-outside={()=>{showAlert()}}  
  class="w-full flex flex-col p-4 {commitState ? 'pointer-events-auto' : ''}">
    <CodeEditor doc={`${stringManipulation.humanize(config.script)}`} {index} showCharCount={false} on:output={(e)=>{stringFromCodeEditor(e.detail.script)}}/>
    <div class="flex justify-between items-center mt-2">
      {#key commitState}
        <div in:fly={{x:-5, duration: 200}} class="{commitState ? 'text-yellow-600' : 'text-green-500'} text-sm">{commitState ? 'Unsaved changes!' : 'Synced with Grid!' }</div>
      {/key}
      {#if parenthesisError} <div class="text-sm text-red-500">Parenthesis must be closed!</div> {/if}
      <button on:click={()=>{sendData()}} disabled={!commitState && parenthesisError} class="{ commitState && !parenthesisError ? 'opacity-100' : 'opacity-50 pointer-events-none'} bg-commit hover:bg-commit-saturate-20 text-white rounded px-2 py-0.5 text-sm focus:outline-none">Commit</button>
    </div>
</code-block>
{:else}
<div class="flex justify-between items-center mb-2 font-roboto">
  {#key commitState}
    <div in:fly={{x:-5, duration: 200}} class="{commitState ? 'text-yellow-600' : 'text-green-500'} text-sm">{commitState ? 'Unsaved changes!' : 'Synced with Grid!' }</div>
  {/key}
  {#if parenthesisError} <div class="text-sm text-red-500">Parenthesis must be closed!</div> {/if}
  <button on:click={()=>{sendData()}} disabled={!commitState && parenthesisError} class="{ commitState && !parenthesisError ? 'opacity-100' : 'opacity-50 pointer-events-none'} bg-commit hover:bg-commit-saturate-20 text-white rounded px-2 py-0.5 text-sm focus:outline-none">Commit</button>
  </div>
  <CodeEditor doc={`${stringManipulation.humanize(config.script)}`} showLineNumbers={true} showCharCount={false} {advancedClickAddon} on:output={(e)=>{stringFromCodeEditor(e.detail.script)}}/>
{/if}