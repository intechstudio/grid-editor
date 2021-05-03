<script>

  import { onMount, createEventDispatcher } from 'svelte';
  import CodeEditor from '../user-interface/code-editor/CodeEditor.svelte';
  import * as GLUA from '../__action.js';

  const dispatch = createEventDispatcher();

  export let action = '';
  export let index;
  export let advanced = false;

  const regex = new RegExp(/\blocal\b\s*[a-zA-Z]\s*[=].*[a-zA-Z0-9\-\+\(\)].*/, 'g');

  /**
   * Locals specific variables
   * @locals []
  */

  let scriptSegments = [{variable: '', value: ''}]; 


  // incoming data
  $: if(action.script){
    scriptSegments = GLUA.localsToAction({script: action.script})
  }

  // DON'T USE $ BINDING! 
  // It will trigger dom reactivity and will add everything 2 times, as its referenced on top incoming action reactivity.
  function saveChangesOnInput(e, i, k){
    scriptSegments[i][k] = e;
    sendData();
  }

  function sendData(){
    dispatch('output', localArrayToScript())
  }

  function localArrayToScript(){
    let script = scriptSegments.map(segment =>
      `local ${segment.variable}=${segment.value} ` // important to keep space before cat upper thingy
    );
    return script.join('');
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
<action-local-definitions class="flex flex-col w-full p-2">
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

</action-local-definitions>
{:else}
<advanced-local-definitions>
  {#each scriptSegments as script, i}
    <segment class="w-full block h-20 my-10">
      <div class="text-gray-500 text-sm pb-1">{`Local ${i}`}</div>
      <CodeEditor doc={`${script.variable} = ${script.value}`} showCharCount={false} on:output={(e)=>{sendData()}}/>
    </segment>
  {/each}
</advanced-local-definitions>
{/if}


<style>

  .local-defs:first-child{
    padding-top: 0;
  }

</style>