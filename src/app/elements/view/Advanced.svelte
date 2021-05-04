<script>
  import { actionNodeBinding, actionPrefStore, selectedControlElement } from '../action-preferences.store';
  import { clickOutside } from '../../settings/ui/helpers/clickOutside';
  import { menuBoundaries } from '../boundaries.action';
  import { onMount, createEventDispatcher } from 'svelte';

  import CodeEditor from '../user-interface/code-editor/CodeEditor.svelte';

  import { _V } from '../user-interface/advanced-input/string-manipulation.js';

  import * as GLUA from '../__action';

	const dispatch = createEventDispatcher();

  import Locals from '../_actions/Locals.svelte'; 
  import CodeBlock from '../_actions/CodeBlock.svelte';
  
  let advancedClickAddon;

  const components = {
    CODEBLOCK: CodeBlock,
    LOCALS: Locals
  }
  
  export let index = undefined;
  export let action = undefined;

  const _v = _V;
  _v.initialize(GLUA.FUNCTIONS());

  let topOffset = 0;

  function filterDuplicateTypes() {
    let arr = GLUA.FUNCTIONS();
    console.log(arr);
    // v, i, a = value, index, array
    return arr.filter((v,i,a)=>a.findIndex(t=>(t.type === v.type))===i).map(e => e.type);
  }

  function addThisManually(elem){
    advancedClickAddon = elem;
  }

  function colorByDesc(desc){
    let color = '';
    switch (desc.split('_')[0]) {
      case 'led':
        color = 'text-yellow-400'
        break;
      case 'midi':
        color = 'text-indigo-400'
        break;
      case 'keyboard':
        color = 'text-green-400'
        break;
      case 'page':
        color = 'text-pink-400'
        break;
      default:
        color = 'text-white'
        break;
    }
    return color;
  }

  let sg = "all"; // show suggestion

  // managing lifecycle as child components dont receive data otherwise
  let ready = false;
  onMount(()=>{
    ready = true;
  });

</script>

{#if ready}

  {#if index == $actionPrefStore.advanced.index && $actionPrefStore.advanced.visible}

  <advanced-config class="relative w-full flex ">
    <container 
      id="action-menu"
      use:menuBoundaries
      on:offset-top={(e)=>{topOffset = e.detail;}} 
      style="right: calc(100% + 2rem);top:{-150 + topOffset}px;width:600px;height:600px;position:absolute;" 
      class=" shadow-md rounded-md bg-primary p-2 z-50">
      <wrapper 
        use:clickOutside
        on:click-outside={()=>{actionPrefStore.showAdvanced(index, 'outside')}} 
        class="flex flex-col h-full font-mono">

        <div class="flex items-center justify-between">
          <div class="font-bold w-auto py-2 mx-2 border-b border-gray-700 text-white">Advanced</div>
          <div on:click={()=>{actionPrefStore.showAdvanced(index, false)}} id="close-btn" class="p-1 mx-1 cursor-pointer not-draggable hover:bg-secondary">
            <svg class="w-5 h-5 p-1 fill-current text-gray-500" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
              <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
            </svg>
          </div>
        </div>

        <div class="flex flex-grow overflow-y-scroll">

          <advanced-menu class="w-3/12 flex flex-col ">
            
              <select-config-suggestions class="w-full text-white flex flex-col text-sm">
                <div class=" flex flex-row py-2 flex-wrap">
                  {#each ['all',...filterDuplicateTypes()] as key}
                    <div on:click={()=>{sg = key}} class="{sg == key ? 'bg-select' : 'hover:bg-select-desaturate-10'} m-1 px-2 py-1 rounded-lg cursor-pointer">{key}</div>
                  {/each}
                </div>
              </select-config-suggestions>

              <config-pool class="w-full flex flex-col overflow-y-scroll">
                {#if sg == "all" || sg == "arithmetic_operator"}
                  <basic-functions class="w-full flex flex-col p-2">
                    
                    {#if sg == "all"}<span class="text-gray-500 text-sm">Arithmetic Operators</span>{/if}
                    <div class="flex -ml-1 items-start flex-wrap">
                      {#each GLUA.FUNCTIONS().filter(m => m.type === 'arithmetic_operator' && m.allowed.find(a => a === $selectedControlElement)) as syntax}
                        <div on:click={()=>{addThisManually(syntax)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{syntax.human}</div>
                      {/each}
                    </div>
                  </basic-functions>
                {/if}

                {#if sg == "all" || sg == "relational_operator"}
                  <oparators class="w-full flex flex-col p-2">
                    {#if sg == "all"}<span class="text-gray-500 text-sm">Relational Operators</span>{/if}
                    <div class="flex -ml-1 items-start flex-wrap">
                      {#each GLUA.FUNCTIONS().filter(m => m.type === 'relational_operator' && m.allowed.find(a => a === $selectedControlElement)) as syntax}
                        <div on:click={()=>{addThisManually(syntax)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{syntax.human}</div>
                      {/each}
                    </div>
                  </oparators>
                {/if}

                {#if sg == "all" || sg == "logical_operator"}
                  <oparators class="w-full flex flex-col p-2">
                    {#if sg == "all"}<span class="text-gray-500 text-sm">Logical Operators</span>{/if}
                    <div class="flex -ml-1 items-start flex-wrap">
                      {#each GLUA.FUNCTIONS().filter(m => m.type === 'logical_operator' && m.allowed.find(a => a === $selectedControlElement)) as syntax}
                        <div on:click={()=>{addThisManually(syntax)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{syntax.human}</div>
                      {/each}
                    </div>
                  </oparators>
                {/if}

                {#if sg == "all" || sg == "grid_function"}
                  <action-functions class="w-full flex flex-col p-2">
                    {#if sg == "all"}<span class="text-gray-500 text-sm">Grid Functions</span>{/if}
                    <div class="flex -ml-1 items-start flex-wrap">
                      {#each GLUA.FUNCTIONS().filter(m => m.type === 'global') as syntax}
                        <div  on:click={()=>{addThisManually(syntax)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black {colorByDesc(syntax.human)}">{syntax.human}</div>
                      {/each}
                    </div>
                  </action-functions>
                {/if}

                {#if sg == "all" || sg == "encoder"}
                  <variables class="w-full flex flex-col p-2">
                    {#if sg == "all"}<span class="text-gray-500 text-sm">Encoder</span>{/if}
                    <div class="flex -ml-1 items-start flex-wrap">
                      {#each GLUA.FUNCTIONS().filter(m => m.type === 'encoder') as syntax}
                        <div on:click={()=>{addThisManually(syntax)}} class="rounded-lg text-sm px-3 py-1 cursor-pointer hover:shadow-md border border-pick-saturate-20 hover:border-pick m-1 bg-gray-900 hover:bg-black text-white">{syntax.human}</div>
                      {/each}
                    </div>
                  </variables>
                {/if}
              </config-pool>
      
          </advanced-menu>

          <advanced-code class="w-9/12 px-4 overflow-y-scroll">
            <svelte:component slot="action" this={components[action.component]} {action} advanced={true} {advancedClickAddon} {index} on:output/>  
          </advanced-code>

        </div>

      </wrapper>

    </container>
      
  </advanced-config>

  {/if}
{/if}

<style>

  segment:first-child{
    margin-top: 0px;
  }

  segment:last-child{
    margin-bottom: 0px;
  }

  ::-webkit-scrollbar {
      height: 6px;
      width: 6px;
      background: #1e2628;
  }
  
  ::-webkit-scrollbar-thumb {
      background: #286787;
      box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
  }
  
  ::-webkit-scrollbar-corner {
      background: #1e2628
  }

</style>