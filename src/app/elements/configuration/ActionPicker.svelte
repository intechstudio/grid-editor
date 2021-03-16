<script>

  import { createEventDispatcher } from 'svelte';

  import { clickOutside } from '../../settings/ui/helpers/clickOutside';

  const dispatch = createEventDispatcher();

  let actionSelection;
  let visible;
  let selectedAction;
  let arrayOfSelectableActions = [
    { desc: 'MIDI',  type: 'standard', components: [{component: 'MIDI', desc: 'MIDI'}]}, 
    { desc: 'Macro',  type: 'standard', components: [{component: 'Macro', desc: 'Macro'}]}, 
    { desc: 'Modifier', type: 'modifier', components: [{component:'If', desc: 'If'}, {component:'Then', desc: 'Then'}, {component:'EndIf', desc: 'End If'}]}
  ];

  function initAction(){
    dispatch('new-action', {
      action: selectedAction
    });

    actionSelection = false;
    visible = false;
  }

</script>

{#if !actionSelection}
<action-placeholder on:click={()=>{}} on:mouseenter={()=>{visible = true;}} on:mouseleave={()=>{visible = false;}} class="{visible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300  flex items-center relative -ml-8 -my-2">

  <div class="h-5 w-5 rounded-full text-center flex items-center justify-center bg-highlight cursor-pointer z-10">
    <svg class="w-5 h-5 p-1" viewBox="0 0 7 7" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 0.5C3.77614 0.5 4 0.723858 4 1V3H6C6.27614 3 6.5 3.22386 6.5 3.5C6.5 3.77614 6.27614 4 6 4H4V6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6V4H1C0.723858 4 0.5 3.77614 0.5 3.5C0.5 3.22386 0.723858 3 1 3H3V1C3 0.723858 3.22386 0.5 3.5 0.5Z" fill="white"/>
    </svg>
  </div>

  <div on:click={()=>{actionSelection = ! actionSelection}} class="h-2 w-full rounded-full bg-highlight cursor-pointer -ml-1"></div>

</action-placeholder>
{/if}
{#if actionSelection}
<pick-action use:clickOutside on:click-outside={()=>{actionSelection = false; visible = false;}} class="w-full flex">
  <select bind:value={selectedAction} class="bg-secondary flex-grow text-white p-1 mr-2 rounded-none focus:outline-none">
    {#each arrayOfSelectableActions as action}
      <option value={action} class="bg-secondary  text-white">{action.desc}</option>
    {/each}
  </select>
  <button 
    disabled={selectedAction === undefined} 
    class:disabled={selectedAction === undefined} 
    on:click={()=>{initAction()}} 
    class="bg-highlight text-white py-1 px-2 mr-1 rounded border border-highlight hover:bg-highlight-400 focus:outline-none"
    >
    Add Action
  </button>
  <button
    on:click={()=>{actionSelection = false; visible = false;}}
    class="text-white py-1 px-2 ml-1 rounded border border-purple-400 hover:border-highlight-400 focus:outline-none">
    Cancel
  </button>
</pick-action>
{/if}
