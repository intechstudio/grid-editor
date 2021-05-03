<script>

  import { fade } from 'svelte/transition';

  import { createEventDispatcher } from 'svelte';

  import { clickOutside } from '../../settings/ui/helpers/clickOutside';

  import { menuBoundaries } from '../boundaries.action';

  import { GRID_ACTIONS } from '../__action.js';

  import { appActionClipboard, appActionManagement } from '../action-preferences.store.js';

  export let animation = false;
  export let actions;
  export let index;
  export let userHelper = false;

  const dispatch = createEventDispatcher();

  let arrayOfActions = [
    {
      key: 'Locals',
      presets: [
        {desc: 'Default', type: 'standard', components: [GRID_ACTIONS.find(a => a.component == 'LOCALS')]}
      ]
    },
    { 
      key: 'MIDI', 
      presets: [
        { desc: 'Default',  type: 'standard', components: [GRID_ACTIONS.find(a => a.component == 'MIDI')]}, 
        { desc: 'Expression',  type: 'standard', components: [GRID_ACTIONS.find(a => a.component == 'MIDI')]}, 
        { desc: 'Volume',  type: 'standard', components: [GRID_ACTIONS.find(a => a.component == 'MIDI')]}, 
      ]
    },
    {
      key: 'Code Block',
      presets: [
        {desc: 'Print', type: 'standard', components: [GRID_ACTIONS.find(a => a.component == 'CODEBLOCK')]}
      ]
    },
    {
      key: 'Macro', 
      presets: [
        { desc: 'Default',  type: 'standard', components: [{component: 'MACRO', desc: 'Macro',parameters: []}]}, 
        { desc: 'git',  type: 'standard', components: [{component: 'MACRO', desc: 'Macro', parameters: []}]}, 
      ]
    },
    {
      key: 'Modifier',
      presets: [
        { desc: 'If Block', type: 'modifier', components: [GRID_ACTIONS.find(a => a.component == 'IF'), GRID_ACTIONS.find(a => a.component == 'END')]},
        { desc: 'Else', type: 'modifier', components: [GRID_ACTIONS.find(a => a.component == 'ELSE')]},
        { desc: 'Else If', type: 'modifier', components: [GRID_ACTIONS.find(a => a.component == 'ELSEIF')]},
      ]
    },
    {
      key: 'LED Phase',
      presets: [
        { desc: 'Default',  type: 'standard', components: [{component: 'LEDPHASE', desc: 'LED Phase', parameters: []}]}, 
      ]
    },
    {
      key: 'LED Color',
      presets: [
        { desc: 'Default',  type: 'standard', components: [{component: 'LEDCOLOR', desc: 'LED Color', parameters: []}]}, 
      ]
    },
    {
      key: 'RAW',
      presets: [
        { desc: 'Default',  type: 'standard', components: [{component: 'RAW', desc: 'RAW', parameters: []}]}, 
      ]
    },
    {
      key: 'Lightroom',
      presets: [
        { desc: 'Contrast',  type: 'standard', components: [{component: 'LEDCOLOR', desc: 'LED Color', parameters: []}]}, 
        { desc: 'Highlight',  type: 'standard', components: [{component: 'LEDCOLOR', desc: 'LED Color', parameters: []}]}, 
      ]
    }
  ];

  let favourites = [];

  let actionSelection;
  let visible;

  let selectedAction = arrayOfActions[0];
  let presetsOfSelectedAction = arrayOfActions[0].presets;
  let selectedActionPreset = presetsOfSelectedAction[0];

  function changeFavourite(preset){
    preset.isFav = ! preset.isFav;
    selectedAction.presets =  selectedAction.presets
  }

  function initAction(){
    dispatch('new-action', {
      action: selectedActionPreset
    });

    actionSelection = false;
    visible = false;
  }

  let topOffset = 0;

  function checkIfPlacementPossible(desc, type){

    console.log(actions, desc, index);

    // lookbefore
    const lookbefore = actions.slice(0,index).reverse();
    // lookafter
    const lookafter = actions.slice(index);

    let validPlacement = true;

    if(type == 'modifier'){
      const fmlb = lookbefore.find(a => a.type == 'modifier'); //firstModifierLookBefore
      const fmla = lookafter.find(a => a.type == 'modifier'); //firstModifierLookAfter
      if(desc == 'Else'){
        try {     
          if((fmlb.component == 'THEN' || fmlb.component == 'ELSEIF') && fmla.component == 'END'){
            validPlacement = true;
          }else{
            validPlacement = false;
          }
        } catch (error) {
          validPlacement = false;
        }
      } else if(desc == 'Else If'){
        try {     
          if(fmlb.component == 'IF' || fmlb.component == 'ELSEIF'){
            validPlacement = true;
          }else{
            validPlacement = false;
          }
        } catch (error) {
          validPlacement = false;
        }
      } else if(desc == 'If Block'){
        try {     
          if(fmlb.component == 'END' || fmla.component == 'IF'){
            validPlacement = true;
          }else{
            validPlacement = false;
          }
        } catch (error) {
          validPlacement = true; // no match found (no if block), then it's a valid placement
        }
      }
    }

    const returnHtml = `<span class="${validPlacement ? '' : 'text-red-500'}">${desc}</span>`

    return returnHtml;
  }

</script>

{#if !userHelper}

  <action-placeholder 
    on:click={()=>{actionSelection = ! actionSelection}}  
    on:mouseenter={()=>{visible = true;}} 
    on:mouseleave={()=>{visible = false;}} 
    class="{((visible || actionSelection) && !animation) ? 'opacity-100' : 'opacity-0'} transition-opacity delay-100 duration-300 cursor-pointer flex items-center relative -ml-8">

    <div class="h-5 w-5 rounded-full text-center flex items-center justify-center bg-pick z-10">
      <svg class="w-5 h-5 p-1" viewBox="0 0 7 7" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 0.5C3.77614 0.5 4 0.723858 4 1V3H6C6.27614 3 6.5 3.22386 6.5 3.5C6.5 3.77614 6.27614 4 6 4H4V6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6V4H1C0.723858 4 0.5 3.77614 0.5 3.5C0.5 3.22386 0.723858 3 1 3H3V1C3 0.723858 3.22386 0.5 3.5 0.5Z" fill="white"/>
      </svg>
    </div>

    <div class="h-2 w-full rounded-full bg-pick -ml-1"></div>
  </action-placeholder>

{:else}
  
  <action-placeholder 
    on:click={()=>{actionSelection = ! actionSelection}}  
    on:mouseenter={()=>{visible = true;}} 
    on:mouseleave={()=>{visible = false;}} 
    class="cursor-pointer flex items-center relative mb-3">

    <div class="{((visible || actionSelection) && !animation) ? 'border-pick bg-select-saturate-10' : 'border-secondary'} transition-colors duration-300 w-full border-l-4 text-white pl-4 p-2">
      Add action...
    </div>
    
  </action-placeholder>

{/if}

{#if actionSelection}
  <pick-action class="relative w-full flex ">

    <menu 
      id="action-menu"
      use:menuBoundaries={'init'} 
      on:offset-top={(e)=>{topOffset = e.detail;}} 
      style="right: calc(100% + 2rem);top:{-250 + topOffset}px;width:300px;height:500px;" 
      class="absolute shadow-md rounded-md bg-primary p-4  z-50">
      
      <wrapper 
        use:clickOutside
        on:click-outside={()=>{actionSelection = false; visible = false;}} 
        class="flex flex-col flex-grow h-full">
        
        <div class="py-1 text-gray-700 text-sm mb-1">Quick Access</div>
        <quick-access class="flex flex-row items-start">
          <div class="w-1/2 flex">
            {#each ['MIDI', 'Macro'] as qu,index}
              <div class="rounded-full p-2 mr-2 bg-secondary text-white" on:click={()=>{}}>{qu}</div>
            {/each}
          </div>
          <div class="w-1/2 flex">
            {#if $appActionClipboard}
              <div class="rounded-full p-2 mr-2 cursor-pointer hover:bg-commit-saturate-20 bg-commit text-white" on:click={()=>{appActionManagement.paste(index)}}>Paste</div>
            {/if}
          </div>
        </quick-access>

        <action-menu class="flex flex-row w-full mt-4 flex-grow">
          <list-of-actions class="w-1/2 flex flex-col">
            <div class=" py-1 text-gray-700 text-sm mb-1">Actions</div>
            <ul class="bg-secondary mr-1 p-1 text-white  h-full flex flex-col items-start">
              {#each arrayOfActions as action, index}
                <li 
                  on:click={()=>{selectedAction = action}} 
                  class="{selectedAction == action ? 'bg-select text-white' : 'hover:bg-select-saturate-10 text-gray-50'} py-1 px-2 my-1 flex items-center rounded-lg cursor-pointer w-full">
                    <svg class="{selectedAction == action ? null : 'invisible'}" width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M4.30351 6L1.03864e-07 1.80265L1.84825 0L8 6L1.84825 12L0 10.1973L4.30351 6Z" fill="#C9C8C8"/>
                    </svg>
                    <div class="pl-2">
                      {action.key}
                    </div>
                </li>
              {/each}
            </ul>
          </list-of-actions>
          <list-of-presets class="w-1/2 flex flex-col">
            <div class="py-1 text-gray-700 text-sm mb-1">Presets</div>
            <ul class=" bg-secondary ml-1 p-1 text-white h-full flex flex-col">
              {#each selectedAction.presets as preset,index}
                <li on:click={()=>{selectedActionPreset = preset}} class="flex items-center my-1 cursor-pointer justify-between rounded-lg w-full {selectedActionPreset == preset ? 'bg-select text-white' : 'hover:bg-select-saturate-10 text-gray-50'}">
                    <div class="flex items-center  py-1 px-2 " >
                      <svg class="{selectedActionPreset == preset ? null : 'invisible'}" width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 4C8 6.20914 6.20914 8 4 8C1.79086 8 0 6.20914 0 4C0 1.79086 1.79086 0 4 0C6.20914 0 8 1.79086 8 4Z" fill="#C9C8C8"/>
                      </svg>
                      <div class="pl-2">
                        {@html checkIfPlacementPossible(preset.desc, preset.type)}
                      </div>
                    </div>
                    <div on:click|stopPropagation={()=>{changeFavourite(preset)}} class="rounded-full hover:bg-select-desaturate-20 mx-1">
                      <svg class="fill-current {preset.isFav ? 'text-yellow-300' : 'text-black'} w-6 h-6 p-1 " viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.892 0.25813C8.82614 0.101837 8.67149 0 8.5 0C8.32851 0 8.17386 0.101837 8.108 0.25813L5.96169 5.3518L0.390642 5.79266C0.219701 5.80619 0.0737906 5.9199 0.0207975 6.08089C-0.0321956 6.24187 0.0181361 6.41852 0.148375 6.52864L4.39292 10.1176L3.09615 15.4837C3.05635 15.6484 3.12083 15.8205 3.25956 15.92C3.3983 16.0195 3.58406 16.0268 3.73041 15.9386L8.5 13.063L13.2696 15.9386C13.4159 16.0268 13.6017 16.0195 13.7404 15.92C13.8792 15.8205 13.9436 15.6484 13.9039 15.4837L12.6071 10.1176L16.8516 6.52864C16.9819 6.41852 17.0322 6.24187 16.9792 6.08089C16.9262 5.9199 16.7803 5.80619 16.6094 5.79266L11.0383 5.3518L8.892 0.25813Z"/>
                      </svg>
                    </div>
                </li>
              {/each}
            </ul>
          </list-of-presets>
        </action-menu>

        <div class="w-full mt-2 flex items-end">
        <button 
          disabled={selectedAction === undefined} 
          class:disabled={selectedAction === undefined} 
          on:click={()=>{initAction()}} 
          class="bg-commit hover:bg-commit-saturate-20 text-white py-1 px-2 mr-1 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
          >
          Add Action
        </button>
      </div>

      </wrapper>

    </menu>



    
  </pick-action>
{/if}
