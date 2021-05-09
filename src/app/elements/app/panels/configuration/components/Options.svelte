<script>

  import { get } from 'svelte/store';
  import { appMultiSelect, runtime } from '../../../../runtime/runtime.store.js';
  import { actionPrefStore, configNodeBinding } from '../../../stores/app-helper.store.js';

  export let index;
  export let groupType;
  export let componentName;

  let showSelectBox = true;
  let ifBlockSize = 0;

  $: if($runtime){
    showSelectBox = ifBlockCheck($runtime);
  }

  function ifBlockCheck(configs){
    let notInBlock = true;
    // lookbefore
    const lookbefore  = configs.slice(0,index).reverse();

    const if_index  = lookbefore.findIndex(a => a.component.name == 'If');
    const end_index = lookbefore.findIndex(a => a.component.name == 'End');

    if(if_index !== -1 && end_index !== -1){
      if(if_index < end_index){
        //console.log(index, " - ",  component, '<- this is in IF block')
        notInBlock = false;
      }
    }

    if(if_index !== -1 && end_index == -1){
      //console.log(index, " - ",  component, '<- this is in IF block')
      notInBlock = false;
    }

    return notInBlock;

  }

  function handleMultiSelect(){

    // called only on IF component

    const lookafter = $runtime.slice(index);

    const end_index = lookafter.findIndex(a => a.component.name == 'End');
    
    ifBlockSize = end_index;

    for (let i = index; i < index + end_index + 1; i++) {
      $appMultiSelect.selection[i] = !$appMultiSelect.selection[i]
    }

    let height = 0;
    const nodes = get(configNodeBinding);
    let nodeArray = [];
    for (const n in nodes) {
      nodeArray.push({id: nodes[n].id, height: nodes[n].clientHeight});
    }
    nodeArray = nodeArray.sort((a, b) => Number(a.id.substr(4,)) - Number(b.id.substr(4,)))

    $appMultiSelect.selection.forEach((selection, i) => {
      if(selection){
        height += nodeArray[i].height;
      }
    });
    
  }



</script>

{#if (componentName == 'Locals' || componentName == 'CodeBlock') && !$appMultiSelect.enabled}
  <show-advanced id="show-advanced" on:click={()=>{  actionPrefStore.showAdvanced(index) }} class="flex pl-2 group justify-center  items-center bg-transparent">
    <svg style="padding:0.125rem" class="{$actionPrefStore.advanced.visible && $actionPrefStore.advanced.index == index ? 'bg-select-desaturate-10' : ''} h-6 w-6 pointer-events-none group-hover:bg-select-desaturate-10 group-hover:cursor-pointer rounded-full" viewBox="0 0 8 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4C8 6.20914 6.20914 8 4 8C1.79086 8 0 6.20914 0 4C0 1.79086 1.79086 0 4 0C6.20914 0 8 1.79086 8 4Z" fill="#ffffff"/>
      <path d="M8 16C8 18.2091 6.20914 20 4 20C1.79086 20 0 18.2091 0 16C0 13.7909 1.79086 12 4 12C6.20914 12 8 13.7909 8 16Z" fill="#ffffff"/>
      <path d="M8 28C8 30.2091 6.20914 32 4 32C1.79086 32 0 30.2091 0 28C0 25.7909 1.79086 24 4 24C6.20914 24 8 25.7909 8 28Z" fill="#ffffff"/>
    </svg>
  </show-advanced>
{:else if (groupType == "standard" && $appMultiSelect.enabled) && showSelectBox}
  <select-box class="flex pl-2 group justify-center items-center bg-transparent">
    <div 
      on:click={()=>{$appMultiSelect.selection[index] = !$appMultiSelect.selection[index]}} 
      class="{$appMultiSelect.selection[index]  ? 'bg-pick' : ''}  flex items-center justify-center p-2 w-6 h-6 border-2  border-pick rounded-full text-white text-xs">
        {$appMultiSelect.selection[index] ? '✔' : ''}
    </div>
  </select-box>
{:else if (componentName == 'If' && $appMultiSelect.enabled) && showSelectBox}
<select-box class="flex pl-2 group justify-center items-center bg-transparent">
  <div 
    on:click={()=>{handleMultiSelect()}} 
    class="{$appMultiSelect.selection[index]  ? 'bg-pink-500' : ''}  flex items-center justify-center p-2 w-6 h-6 border-2 border-pink-500 rounded-full text-white text-xs">
    {$appMultiSelect.selection[index] ? '✔' : ''}
    {#if $appMultiSelect.selection[index]}
      <div style="height:{ifBlockSize * 40 + 'px'}" class="absolute w-1 bg-pink-500 top-0 mt-7 flex justify-center">
        <div class="absolute bottom-0 rounded-full bg-pink-500 w-4 h-4"></div>
      </div>
    {/if}
  </div>
</select-box>
{:else}
<select-box-palceholder>
  <select-box class="flex pl-2 group justify-center items-center bg-transparent">
    <div class="flex items-center justify-center p-2 w-6 h-6 text-xs">
        {''}
    </div>
  </select-box>
</select-box-palceholder>
{/if}