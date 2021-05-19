<script>

  import { createEventDispatcher } from 'svelte';

  import { clickOutside } from '../../../_actions/click-outside.action';

  import { menuBoundaries } from '../../../_actions/boundaries.action.js';

  import { config_collection } from '../../config-library/built-in-configs.js'

  import _utils from '../../../../runtime/_utils';

  import Folder from './Folder.svelte';
  
  import { createNestedObject, returnDeepestObjects } from '../../../../protocol/_utils.js';
  
  import { presetManagement } from '../../../_stores/app-helper.store';

  import { get } from 'svelte/store';

  export let animation = false;
  export let actions;
  export let index;
  export let userHelper = false;

  const dispatch = createEventDispatcher();

  let favourites = [];

  let configSelection;
  let visible;
      
  let selectedConfig = [];

  function initConfig(){

    const cfg = get(presetManagement.selected_preset).configs;

    dispatch('new-config', {
      config: cfg
    });

    presetManagement.quick_access.update();

    configSelection = false;
    visible = false;
  }

  let topOffset = 0;

  let configs = {};
  let lastCategory = '';

  Object.byString = function(o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
  }

  config_collection.forEach(cfg => {
    if(JSON.stringify(cfg.category) !== lastCategory){
      createNestedObject(configs, cfg.category, [{name: cfg.name, configs: cfg.configs}]);
      lastCategory = JSON.stringify(cfg.category);
    } else {
      let obj = Object.byString(configs, cfg.category.join('.'));
      obj.push({name: cfg.name, configs: cfg.configs})
    }
  })

  function quickAdd(qa){
    dispatch('new-config', {
      config: qa.configs
    });
  }


  let quickAccess = [];
  presetManagement.quick_access.subscribe(val => {
    quickAccess = val;
    configSelection = false;
    visible = false;
  })

</script>

{#if !userHelper}

  <action-placeholder 
    on:click={()=>{configSelection = ! configSelection}}  
    on:mouseenter={()=>{visible = true;}} 
    on:mouseleave={()=>{visible = false;}} 
    class="{((visible || configSelection) && !animation) ? 'opacity-100' : 'opacity-0'} transition-opacity delay-100 duration-300 cursor-pointer flex items-center relative -ml-8">

    <div class="h-5 w-5 rounded-full text-center flex items-center justify-center bg-pick z-10">
      <svg class="w-5 h-5 p-1" viewBox="0 0 7 7" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 0.5C3.77614 0.5 4 0.723858 4 1V3H6C6.27614 3 6.5 3.22386 6.5 3.5C6.5 3.77614 6.27614 4 6 4H4V6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6V4H1C0.723858 4 0.5 3.77614 0.5 3.5C0.5 3.22386 0.723858 3 1 3H3V1C3 0.723858 3.22386 0.5 3.5 0.5Z" fill="white"/>
      </svg>
    </div>

    <div class="h-2 w-full rounded-full bg-pick -ml-1"></div>
  </action-placeholder>

{:else}
  
  <action-placeholder 
    on:click={()=>{configSelection = ! configSelection}}  
    on:mouseenter={()=>{visible = true;}} 
    on:mouseleave={()=>{visible = false;}} 
    class="cursor-pointer flex items-center relative mb-3">

    <div class="{((visible || configSelection) && !animation) ? 'border-pick bg-select-saturate-10' : 'border-secondary'} transition-colors duration-300 w-full border-l-4 text-white pl-4 p-2">
      Add action...
    </div>
    
  </action-placeholder>

{/if}

{#if configSelection}
  <pick-action class="relative w-full flex ">

    <menu 
      id="action-menu"
      use:menuBoundaries={'init'} 
      on:offset-top={(e)=>{topOffset = e.detail;}} 
      style="right: calc(100% + 2rem);top:{-250 + topOffset}px;width:300px;height:500px;" 
      class="absolute shadow-md rounded-md bg-primary p-4  z-50">
      
      <wrapper 
        use:clickOutside
        on:click-outside={()=>{configSelection = false; visible = false;}} 
        class="flex flex-col flex-grow h-full">

        <div on:click={()=>{configSelection = false; visible = false;}} id="close-btn" style="top:8px; right:8px;" class="absolute right-0 p-1 cursor-pointer not-draggable hover:bg-secondary">
          <svg class="w-5 h-5 p-1 fill-current text-gray-500" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z" />
            <path d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z" />
          </svg>
        </div>    


        {#if quickAccess.length}
          <div class="py-1 text-gray-500 text-sm mb-1">Quick Access</div>
          <quick-access class="flex flex-wrap items-start">
            {#each quickAccess as qa,index}
              <div class="rounded-full flex items-center mr-2 mb-2 text-sm cursor-pointer hover:shadow-md text-white border hover:border-pick border-select transition" on:click={()=>{quickAdd(qa)}}>
                <div class="rounded-l-full px-2 py-0.5 bg-select">{qa.sub}</div>
                <div class="rounded-r-full px-2 py-0.5 bg-pick">{qa.name}</div>
              </div>
            {/each}
          </quick-access>
        {/if}

        <div class="py-1 w-full text-gray-500 text-sm mb-1">Presets</div> 

        <div class="w-full pr-2 h-full overflow-y-auto">
          <Folder name={"Presets"} on:double-click={initConfig} {index} counter={0} configs={Object.entries(configs)} expanded/>
        </div>

        <div class="w-full mt-2 flex items-end">
          <button 
            disabled={selectedConfig === undefined} 
            class:disabled={selectedConfig === undefined} 
            on:click={initConfig} 
            class="bg-commit hover:bg-commit-saturate-20 w-full text-white py-2 px-2 mr-1 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
            >
            Add Action
          </button>
        </div>

      </wrapper>

    </menu>



    
  </pick-action>
{/if}

<style>

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