<script>

  import { createEventDispatcher } from 'svelte';

  import { clickOutside } from '../../../_actions/click-outside.action';

  import { menuBoundaries } from '../../../_actions/boundaries.action.js';

  import { config_collection } from '../../config-library/built-in-configs.js'

  import _utils from '../../../../runtime/_utils';

  import Folder from './Folder.svelte';
  
  import { createNestedObject, returnDeepestObjects } from '../../../../protocol/_utils.js';
  
  import { selectedConfigPreset } from '../../../_stores/app-helper.store';

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

    console.log($selectedConfigPreset.configs);

    dispatch('new-config', {
      config: $selectedConfigPreset.configs
    });

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


       
        <!--
        <div class="py-1 text-gray-700 text-sm mb-1">Quick Access</div>
        <quick-access class="flex flex-row items-start">
          <div class="w-1/2 flex">
            {#each ['MIDI', 'Macro'] as qu,index}
              <div class="rounded-full p-2 mr-2 bg-secondary text-white" on:click={()=>{}}>{qu}</div>
            {/each}
          </div>
          <div class="w-1/2 flex">
            {#if false}
              <div class="rounded-full p-2 mr-2 cursor-pointer hover:bg-commit-saturate-20 bg-commit text-white" on:click={()=>{/* paste.. */}}>Paste</div>
            {/if}
          </div>
        </quick-access>
        -->


        <Folder name={"Presets"} {index} counter={0} configs={Object.entries(configs)} expanded/>

        

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
