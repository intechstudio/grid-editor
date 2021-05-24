<script context="module">
  export const information = {
    short: 'l',
    groupType: 'standard',
    desc: 'Local Definitions',
    icon: null
  }
</script>

<script>

  import { onMount, createEventDispatcher } from 'svelte';
  import CodeEditor from '../main/user-interface/code-editor/CodeEditor.svelte';

  export let config = '';
  export let index;
  export let advanced = false;
  export let advancedClickAddon;

  const dispatch = createEventDispatcher();

  const regex = new RegExp(/\blocal\b\s*[a-zA-Z]\s*[=].*[a-zA-Z0-9\-\+\(\)].*/, 'g');

  /**
   * Locals specific variables
   * @locals []
  */

  let scriptSegments = [{variable: '', value: ''}]; 

  // config.script cannot be undefined
  $: if(config.script){
    // this works differently from normal _utils...
    // localsToConfig
    scriptSegments = localsToConfig({script: config.script, human: config.human})
  }

  // DON'T USE $ BINDING! 
  // It will trigger dom reactivity and will add everything 2 times, as its referenced on top incoming config reactivity.
  function saveChangesOnInput(e, i, k){
    scriptSegments[i][k] = e;
    sendData();
  }

  function sendData(){
    dispatch('output', {short: 'l', script: localArrayToScript(scriptSegments)})
  }

  function localArrayToScript(arr){
    let script = arr.map(segment =>
      `local ${segment.variable}=${segment.value} ` // important to keep space before cat upper thingy
    );
    return script.join('');
  }

  function localsToConfig({script}){
    // this had to be moved out of locals function, as array refresh was killed by $ with scriptSegments..
    const text = script.split('local');
    let config = [];
    text.forEach(element => {
      if(element !== ''){
        const _split = element.split('=');
        config.push({variable: _split[0].trim(), value: _split[1].trim()});
      }
    });
    return config;
  }

  function addLocalVariable(){
    scriptSegments = [...scriptSegments, {variable: '', value: ''}];
  }

  function removeLocalVariable(i){
    scriptSegments.splice(i,1);
    scriptSegments = [...scriptSegments];

    sendData();
  }

</script>

{#if !advanced}
<config-local-definitions class="flex flex-col w-full p-2">
  <div class="w-full flex flex-col">
    {#each scriptSegments as script, i (i)}
      <div class="w-full flex local-defs py-2">
        <div class="w-1/2 pr-1">
          <input 
          class="py-0.5 pl-1 w-full bg-secondary text-white" 
          placeholder="variable name" 
          value={script.variable}
          on:input={(e)=>{saveChangesOnInput(e.target.value, i, 'variable')}}
          > 
        </div>
        <div class="w-1/2 pl-1">
          <input 
          class="py-0.5 pl-1 w-full bg-secondary text-white" 
          placeholder="value" 
          value={script.value} 
          on:input={(e)=>{saveChangesOnInput(e.target.value, i ,'value')}}
         >
        </div>
        {#if i !== 0}
          <div on:click={()=>{removeLocalVariable(i)}} class="flex items-center group cursor-pointer pl-1">
            <svg class="w-5 h-5 p-1 fill-current group-hover:text-white text-gray-500" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
              <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
            </svg>
          </div>
        {:else}
        <div class=" flex invisible items-center group cursor-pointer pl-1">
          <div class="w-5 h-5 p-1">
            x
          </div>
        </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="w-full flex group py-2">
    <div on:click={()=>{addLocalVariable()}} class="group-hover:border-pick cursor-pointer group-hover:bg-select-saturate-10 border-secondary transition-colors duration-300 w-full border-l-4 text-white pl-4 py-0.5">
      Add local variable...
    </div>
  </div>

</config-local-definitions>
{:else}
<advanced-local-definitions>
  {#each scriptSegments as script, i}
    <segment class="w-full block local-defs py-2">
      <div class="flex items-start">
        <div class="flex items-baseline">
          <div class="pointer-events-none py-0.5 text-gray-500 px-1 bg-thirdery">local </div>
          <input on:input={(e)=>{saveChangesOnInput(e.target.value, i, 'variable')}} style="backround" class="py-0.5 mb-1 pl-1 w-20 bg-secondary text-white" value={script.variable}>
        </div>
        <span class="text-sm text-gray-500 px-1 py-0.5">=</span>
        <CodeEditor doc={`${script.value}`} showLineNumbers={false} showCharCount={false} index={i} {advancedClickAddon} on:output={(e)=>{saveChangesOnInput(e.detail.script, i ,'value')}}/>
      </div>
    </segment>
  {/each}

  <div class="w-full flex group py-2">
    <div on:click={()=>{addLocalVariable()}} class="group-hover:border-pick cursor-pointer group-hover:bg-select-saturate-10 border-secondary transition-colors duration-300 w-full border-l-4 text-white pl-4 py-0.5">
      Add local variable...
    </div>
  </div>

  <div class="text-gray-300 flex flex-col py-2">
    <div class="font-bold">Output:</div>
    {#each scriptSegments as script}
      <div>{`local ${script.variable} = ${script.value}`}</div>
    {/each}
  </div>

</advanced-local-definitions>
{/if}


<style>

  .local-defs:first-child{
    padding-top: 0;
  }

</style>