<script context="module">
  export const information = {
    short: 'glut',
    name: 'Lookup',
    groupType: 'standard',
    desc: 'Lookup',
    icon: 
     `<svg width="100%" height="100%" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M189.754 0L239.996 28.5774L190.241 58.0011L190.04 34.0236L120.042 34.6159L119.958 24.5698L189.955 23.9775L189.754 0Z" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M189.754 120.557L239.996 149.135L190.241 178.558L190.04 154.581L120.042 155.173L119.958 145.127L189.955 144.535L189.754 120.557Z" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M50.2414 119.443L0 90.8653L49.7551 61.4417L49.9561 85.4192L119.954 84.8269L120.038 94.8729L50.0403 95.4653L50.2414 119.443Z" fill="white"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M50.2414 240L0 211.423L49.7551 181.999L49.9561 205.976L119.954 205.384L120.038 215.43L50.0403 216.023L50.2414 240Z" fill="white"/>
      </svg>
    `,
  }
</script>

<script>

  import { createEventDispatcher, onDestroy } from 'svelte';
  import AtomicInput from '../main/user-interface/AtomicInput.svelte';
  import CodeEditor from '../main/user-interface/code-editor/CodeEditor.svelte';
  import stringManipulation, { debounce } from '../main/user-interface/_string-operations';
  import { localDefinitions } from '../runtime/runtime.store';  
  import _utils from '../runtime/_utils';

  import { parenthesis } from './_validators';

  export let config = '';
  export let index;

  const dispatch = createEventDispatcher();

  let loaded = false;

  let scriptSegments = []; 
  let lookupTable = {};

  // Using onDestroy() and loaded flag may help ever changing reactivity

  $: if(config.script && ! loaded){
    scriptSegments = _utils.scriptToSegments({short: config.short, script: config.script});
    console.log('lookup init 1', scriptSegments)
    lookupTable = createLookupTable(scriptSegments);
    console.log('lookup init 2', lookupTable)
    loaded = true;
  }

  $: if(lookupTable.source || lookupTable.pairs.length){
    sendData();
  }

  function sendData(){

    let array = [];

    lookupTable.pairs.forEach(pair => {
      array.push(pair.input);
      array.push(pair.output);
    });
    
    array = [lookupTable.source, ...array];

    const script = _utils.segmentsToScript({human: config.human, short: config.short, array: array});  // important to set the function name
    dispatch('output', {short: config.short, script: script})
  }

  function createLookupTable(array){
    const source = array[0];
    const pairs = array.slice(1,);

    let pairObjects = [];
    for (let i = 0; i < pairs.length; i+=2) {
      pairObjects.push({input: pairs[i], output: pairs[i+1]})
    }

    return {source: source, pairs: pairObjects};
  }

  function addNewLine(){
    lookupTable.pairs = [...lookupTable.pairs, ['','']];
  }

  function removeLine(i){
    lookupTable.pairs.splice(i,1);
    lookupTable.pairs = [...lookupTable.pairs];
    sendData();
  }

  

</script>


<config-lookup class="flex flex-col w-full p-2">

  <div class="flex flex-col">
    <div class="text-gray-500 text-sm pb-1">Source</div>
    <AtomicInput bind:inputValue={lookupTable.source} suggestions={$localDefinitions} />
  </div>

  <div class="w-full flex flex-col">
    {#each lookupTable.pairs as pair, i (i)}
      <div class="w-full flex local-defs py-2">
        <div class="w-1/2 pr-1">
          <input 
          class="py-0.5 pl-1 w-full bg-secondary text-white" 
          placeholder="variable name" 
          bind:value={pair.input}
          > 
        </div>
        <div class="w-1/2 pl-1">
          <input 
          class="py-0.5 pl-1 w-full bg-secondary text-white" 
          placeholder="variable name" 
          bind:value={pair.output}
          > 
        </div>
        {#if i !== 0}
          <div on:click={()=>{removeLine(i)}} class="flex items-center group cursor-pointer pl-1">
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
    <div on:click={()=>{addNewLine()}} class="group-hover:border-pick cursor-pointer group-hover:bg-select-saturate-10 border-secondary transition-colors duration-300 w-full border-l-4 text-white pl-4 py-0.5">
      Add new pair...
    </div>
  </div>

</config-lookup>



<style>

  .local-defs:first-child{
    padding-top: 0;
  }

</style>