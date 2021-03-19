<script>

  import { createEventDispatcher } from 'svelte';

  import { clickOutside } from '../../settings/ui/helpers/clickOutside';

  import { menuBoundaries } from '../boundaries.action';

  export let animation = false;

  const dispatch = createEventDispatcher();

  let arrayOfActions = [
    { 
      key: 'MIDI', 
      presets: [
        { desc: 'Default',  type: 'standard', components: [{component: 'MIDI', desc: 'MIDI'}]}, 
        { desc: 'Expression',  type: 'standard', components: [{component: 'MIDI', desc: 'MIDI'}]}, 
        { desc: 'Volume',  type: 'standard', components: [{component: 'MIDI', desc: 'MIDI'}]}, 
      ]
    },
    {
      key: 'Macro', 
      presets: [
        { desc: 'Default',  type: 'standard', components: [{component: 'Macro', desc: 'Macro'}]}, 
        { desc: 'git',  type: 'standard', components: [{component: 'Macro', desc: 'Macro'}]}, 
      ]
    },
    {
      key: 'Modifier',
      presets: [
        { desc: 'Default', type: 'modifier', components: [{component:'If', desc: 'If'}, {component:'Then', desc: 'Then'}, {component:'EndIf', desc: 'End If'}]},
        { desc: 'If', type: 'modifier', components: [{component:'If', desc: 'If'}]},
        { desc: 'Then', type: 'modifier', components: [{component:'Then', desc: 'Then'}]},
        { desc: 'Else', type: 'modifier', components: [{component:'Else', desc: 'Else'}]},
        { desc: 'ElseIf', type: 'modifier', components: [{component:'EndIf', desc: 'End If'}]},
      ]
    },
    {
      key: 'LED Phase',
      presets: [
        { desc: 'Default',  type: 'standard', components: [{component: 'LEDPhase', desc: 'LED Phase'}]}, 
      ]
    },
    {
      key: 'LED Color',
      presets: [
        { desc: 'Default',  type: 'standard', components: [{component: 'LEDColor', desc: 'LED Color'}]}, 
      ]
    },
    {
      key: 'RAW',
      presets: [
        { desc: 'Default',  type: 'standard', components: [{component: 'RAW', desc: 'RAW'}]}, 
      ]
    }
  ];

  let actionSelection;
  let visible;

  let selectedAction = arrayOfActions[0];
  let presetsOfSelectedAction = arrayOfActions[0].presets;
  let selectedActionPreset = presetsOfSelectedAction[0];

  function initAction(){
    dispatch('new-action', {
      action: selectedActionPreset
    });

    actionSelection = false;
    visible = false;
  }

  let topOffset = 0;

</script>


<action-placeholder 
  on:click={()=>{actionSelection = ! actionSelection}}  
  on:mouseenter={()=>{visible = true;}} 
  on:mouseleave={()=>{visible = false;}} 
  class="{((visible || actionSelection) && !animation) ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 cursor-pointer flex items-center relative -ml-8">

  <div class="h-5 w-5 rounded-full text-center flex items-center justify-center bg-highlight z-10">
    <svg class="w-5 h-5 p-1" viewBox="0 0 7 7" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 0.5C3.77614 0.5 4 0.723858 4 1V3H6C6.27614 3 6.5 3.22386 6.5 3.5C6.5 3.77614 6.27614 4 6 4H4V6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6V4H1C0.723858 4 0.5 3.77614 0.5 3.5C0.5 3.22386 0.723858 3 1 3H3V1C3 0.723858 3.22386 0.5 3.5 0.5Z" fill="white"/>
    </svg>
  </div>

  <div class="h-2 w-full rounded-full bg-highlight  -ml-1"></div>

</action-placeholder>


{#if actionSelection}

<pick-action class="relative w-full flex ">

  <menu 
    id="action-menu"
    use:menuBoundaries={'init'} 
    on:offset-top={(e)=>{topOffset = e.detail; console.log('top offset', e.detail)}} 
    style="right: calc(100% + 2rem);top:{-250 + topOffset}px;width:250px;height:500px;" 
    class="absolute shadow-md rounded-md bg-primary p-4  z-50">
     
    <wrapper 
      use:clickOutside
      on:click-outside={()=>{actionSelection = false; visible = false;}} 
      class="flex flex-col flex-grow h-full">
      <div class="py-1 text-gray-700 text-sm mb-1">Quick Access</div>
      <quick-access class="flex flex-row items-start">
        {#each ['MIDI', 'Macro'] as qu,index}
          <div class="rounded-full p-2 mr-2 bg-secondary text-white" on:click={()=>{}}>{qu}</div>
        {/each}
      </quick-access>

      <action-menu class="flex flex-row w-full mt-4 flex-grow">
        <list-of-actions class="w-1/2 flex flex-col">
          <div class=" py-1 text-gray-700 text-sm mb-1">Actions</div>
          <ul class="bg-secondary mr-1 p-1 text-white  h-full flex flex-col">
            {#each arrayOfActions as action, index}
              <li 
                on:click={()=>{selectedAction = action}} 
                class="{selectedAction == action ? 'bg-green-700' : null} py-1 px-2 my-1 rounded-lg text-white cursor-pointer hover:bg-green-600 bg-opacity-50 font-bold w-full">
                  {action.key}
              </li>
            {/each}
          </ul>
        </list-of-actions>
        <list-of-presets class="w-1/2 flex flex-col">
          <div class="py-1 text-gray-700 text-sm mb-1">Presets</div>
          <ul class=" bg-secondary ml-1 p-1 text-white h-full flex flex-col">
            {#each selectedAction.presets as preset,index}
              <li 
                on:click={()=>{selectedActionPreset = preset}} 
                class="{selectedActionPreset == preset ? 'bg-green-700' : null} py-1 px-2 my-1 rounded-lg text-white cursor-pointer hover:bg-green-600 bg-opacity-50 w-full">
                  {preset.desc}
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
        class="bg-highlight text-white py-1 px-2 mr-1 rounded border border-highlight hover:bg-highlight-400 focus:outline-none"
        >
        Add Action
      </button>
    </div>

    </wrapper>

  </menu>



  
</pick-action>
{/if}
