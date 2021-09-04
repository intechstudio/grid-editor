<script>

  import { appMultiSelect, runtime } from '../../../../runtime/runtime.store.js';
  import { actionPrefStore, configNodeBinding } from '../../../_stores/app-helper.store.js';

  export let index;
  export let rendering;
  export let configs;
  export let componentName;

  export let toggle;

  let showSelectBox = true;
  let ifHeight = 0;

  $: if(configs.length){
    showSelectBox = ifBlockCheck(configs);
  }


  function ifBlockCheck(configs){
    let notInBlock = true;
    // lookbefore
    const lookbefore  = configs.slice(0,index).reverse();

    const if_index  = lookbefore.findIndex(a => a.information.name == 'If');
    const end_index = lookbefore.findIndex(a => a.information.name == 'End');

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

    const _configs = configs.slice(index);
    const _configs_length = _configs.length;

    let arr = [];
    let stack = [];
    let current;

    let skipSelection = false;

    const matchLookup = {
      "If": "End", 
    };

    for (let i = 0; i < _configs_length; i++) {
      if(!skipSelection){
        current = _configs[i].information.name; //easier than writing it over and over      
        if (current === 'If') {
          stack.push(current);
        } else if (current === 'End') {
          const lastBracket = stack.pop();
          if (matchLookup[lastBracket] !== current) { //if the stack is empty, .pop() returns undefined, so this expression is still correct
            return false; //terminate immediately - no need to continue scanning the string
          }
        }

        arr.push(_configs[i]);        

        if(stack.length == 0 && current == 'End'){
          skipSelection = true;
        }
      }
    }
    
    const selection_length = arr.length + index;

    for (let i = index; i < selection_length; i++) {
      $appMultiSelect.selection[i] = ! $appMultiSelect.selection[i]
    }

  }



</script>

{#if (rendering == "standard" || rendering == 'fixed')  && true}
  <select-box class="flex pl-2 justify-center items-center bg-transparent">
    <div 
      on:click={()=>{$appMultiSelect.selection[index] = !$appMultiSelect.selection[index] }}
      class="{$appMultiSelect.selection[index]  ? 'bg-pick' : ''} flex items-center justify-center p-2 w-6 h-6 border-2 transition-opacity { !$appMultiSelect.selection[index] ? 'opacity-50 hover:opacity-100' : ''} border-pick rounded-full text-white text-xs cursor-pointer">
        {$appMultiSelect.selection[index] ? '✔' : ''}
    </div>
  </select-box>
{:else if (componentName == 'If' && true) && showSelectBox}
  <select-box class="flex pl-2 justify-center items-center bg-transparent">
    <div 
      on:click={()=>{handleMultiSelect()}} 
      class="{$appMultiSelect.selection[index]  ? 'bg-pink-500' : ''}  flex items-center justify-center p-2 w-6 h-6 border-2 transition-opacity { !$appMultiSelect.selection[index] ? 'opacity-50 hover:opacity-100' : ''} border-pink-500 rounded-full text-white text-xs cursor-pointer">
      {$appMultiSelect.selection[index] ? '✔' : ''}
    </div>
  </select-box>
{:else }
  <select-box class="flex pl-2 justify-center items-center bg-transparent">
    {#if true}
      <div class="{$appMultiSelect.selection[index]  ? 'bg-select border-2 border-select' : ''} transition-opacity flex items-center justify-center p-2 w-6 h-6 rounded-full text-white text-xs cursor-pointer">
        {$appMultiSelect.selection[index] ? '✔' : ''}
      </div>
    {:else}
      <div class=" flex items-center justify-center p-2 w-6 h-6 rounded-full text-white text-xs">
        {''}
      </div>
    {/if}
  </select-box>
{/if}
